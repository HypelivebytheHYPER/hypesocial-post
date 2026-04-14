import { NextRequest, NextResponse } from "next/server";
import { pfm } from "@/lib/post-for-me-client";

// Webhook processing can take time (external API calls)
export const maxDuration = 30;
import {
  WebhookDtoSchema,
  UpdateWebhookRequestSchema,
  WebhookEventPayloadSchema,
} from "@/lib/validations/webhook-api-schemas";
import {
  createRequestContext,
  formatRequestLog,
  buildTraceHeaders,
  TRACE_HEADERS,
  runWithContext,
} from "@/lib/request-context";
import { verifyWebhookSecret } from "@/lib/webhook-secrets";
import {
  extractErrorDetails,
  formatApiError,
} from "@/lib/pfm-errors";

// ============================================
// GET /api/webhooks/[id] - GET SINGLE WEBHOOK
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = createRequestContext(request.headers, { 
    webhook_id: id, 
    operation: "get_webhook" 
  });

  return runWithContext(ctx, async () => {
    try {
      const data = await pfm.get(`/v1/webhooks/${id}`);
      const validated = WebhookDtoSchema.parse(data);

      // Cache the secret for future verification
      if (validated.secret) {
        const { cacheSecret } = await import("@/lib/webhook-secrets");
        cacheSecret(id, validated.secret);
      }

      console.log(JSON.stringify(formatRequestLog(ctx, "GET", `/api/webhooks/${id}`, 200)));

      return NextResponse.json(validated, {
        headers: {
          [TRACE_HEADERS.REQUEST_ID]: ctx.requestId,
          [TRACE_HEADERS.TRACE_ID]: ctx.traceId,
        },
      });
    } catch (error) {
      const errorDetails = extractErrorDetails(error);
      const status = errorDetails.isNotFound ? 404 : errorDetails.status || 500;
      const message = errorDetails.isNotFound ? "Webhook not found" : "Failed to fetch webhook";

      console.error(JSON.stringify(formatRequestLog(ctx, "GET", `/api/webhooks/${id}`, status, { 
        error: errorDetails.message,
        error_status: errorDetails.status,
        error_body: errorDetails.body,
        is_not_found: errorDetails.isNotFound,
      })));

      return NextResponse.json(
        { 
          error: message,
          webhook_id: id,
          request_id: ctx.requestId,
          trace_id: ctx.traceId,
        },
        { 
          status,
          headers: {
            [TRACE_HEADERS.REQUEST_ID]: ctx.requestId,
            [TRACE_HEADERS.TRACE_ID]: ctx.traceId,
          },
        }
      );
    }
  });
}

// ============================================
// POST /api/webhooks/[id] - RECEIVE WEBHOOK EVENT
// ============================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // Create context with webhook-specific metadata
  const ctx = createRequestContext(request.headers, {
    webhook_id: id,
    operation: "receive_webhook_event",
    source: "post-for-me",
  });

  return runWithContext(ctx, async () => {
    // Verify webhook secret (per-webhook secret from Post For Me)
    const webhookSecret =
      request.headers.get("Post-For-Me-Webhook-Secret") ||
      request.headers.get("post-for-me-webhook-secret");

    if (!webhookSecret) {
      console.warn(JSON.stringify(formatRequestLog(ctx, "POST", `/api/webhooks/${id}`, 401, {
        error: "Missing webhook secret header",
      })));

      return NextResponse.json(
        { 
          error: "Missing webhook secret",
          request_id: ctx.requestId,
          trace_id: ctx.traceId,
        },
        { 
          status: 401,
          headers: {
            [TRACE_HEADERS.REQUEST_ID]: ctx.requestId,
            [TRACE_HEADERS.TRACE_ID]: ctx.traceId,
          },
        }
      );
    }

    const isValid = await verifyWebhookSecret(id, webhookSecret);
    if (!isValid) {
      console.warn(JSON.stringify(formatRequestLog(ctx, "POST", `/api/webhooks/${id}`, 401, {
        error: "Invalid webhook secret",
        webhook_id: id,
      })));

      return NextResponse.json(
        { 
          error: "Invalid webhook secret",
          request_id: ctx.requestId,
          trace_id: ctx.traceId,
        },
        { 
          status: 401,
          headers: {
            [TRACE_HEADERS.REQUEST_ID]: ctx.requestId,
            [TRACE_HEADERS.TRACE_ID]: ctx.traceId,
          },
        }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      // JSON parse error (invalid JSON)
      console.error(JSON.stringify(formatRequestLog(ctx, "POST", `/api/webhooks/${id}`, 400, {
        error: "Invalid JSON in request body",
        error_type: "parse",
      })));
      
      return NextResponse.json(
        { 
          error: "Invalid JSON",
          request_id: ctx.requestId,
          trace_id: ctx.traceId,
        },
        { 
          status: 400,
          headers: {
            [TRACE_HEADERS.REQUEST_ID]: ctx.requestId,
            [TRACE_HEADERS.TRACE_ID]: ctx.traceId,
          },
        }
      );
    }
    
    try {
      // Validate payload with Zod discriminated union
      const validated = WebhookEventPayloadSchema.parse(body);
      
      // Update context with event metadata
      ctx.metadata.event_type = validated.event_type;
      ctx.metadata.resource_id = validated.data.id;
      if ("post_id" in validated.data) {
        ctx.metadata.post_id = validated.data.post_id;
      }

      // Process event based on type
      const result = await processWebhookEvent(validated, id, ctx);
      
      console.log(JSON.stringify(formatRequestLog(ctx, "POST", `/api/webhooks/${id}`, 200, {
        event_type: validated.event_type,
        event_id: result.eventId,
        is_retry: result.isRetry,
      })));

      return NextResponse.json({
        success: true,
        event_id: result.eventId,
        event_type: validated.event_type,
        processed: true,
        is_retry: result.isRetry,
        request_id: ctx.requestId,
        trace_id: ctx.traceId,
      }, {
        headers: {
          [TRACE_HEADERS.REQUEST_ID]: ctx.requestId,
          [TRACE_HEADERS.TRACE_ID]: ctx.traceId,
          [TRACE_HEADERS.EVENT_TYPE]: validated.event_type,
        },
      });
    } catch (error) {
      const isValidationError = error instanceof Error && error.name === "ZodError";
      const status = isValidationError ? 400 : 500;
      
      console.error(JSON.stringify(formatRequestLog(ctx, "POST", `/api/webhooks/${id}`, status, {
        error: error instanceof Error ? error.message : "Unknown error",
        error_type: isValidationError ? "validation" : "processing",
      })));

      return NextResponse.json(
        { 
          error: isValidationError ? "Invalid webhook payload" : "Failed to process event",
          request_id: ctx.requestId,
          trace_id: ctx.traceId,
        },
        { 
          status,
          headers: {
            [TRACE_HEADERS.REQUEST_ID]: ctx.requestId,
            [TRACE_HEADERS.TRACE_ID]: ctx.traceId,
          },
        }
      );
    }
  });
}

// ============================================
// PATCH /api/webhooks/[id] - UPDATE WEBHOOK
// ============================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = createRequestContext(request.headers, {
    webhook_id: id,
    operation: "update_webhook",
  });

  return runWithContext(ctx, async () => {
    try {
      const body = await request.json();
      const validated = UpdateWebhookRequestSchema.parse(body);

      const data = await pfm.patch(`/v1/webhooks/${id}`, { body: validated });
      const validatedResponse = WebhookDtoSchema.parse(data);

      console.log(JSON.stringify(formatRequestLog(ctx, "PATCH", `/api/webhooks/${id}`, 200)));

      return NextResponse.json(validatedResponse, {
        headers: {
          [TRACE_HEADERS.REQUEST_ID]: ctx.requestId,
          [TRACE_HEADERS.TRACE_ID]: ctx.traceId,
        },
      });
    } catch (error) {
      const errorDetails = extractErrorDetails(error);
      const { message, status } = formatApiError(error, "Failed to update webhook");

      console.error(JSON.stringify(formatRequestLog(ctx, "PATCH", `/api/webhooks/${id}`, status, {
        error: errorDetails.message,
        is_validation: errorDetails.isValidationError,
        is_not_found: errorDetails.isNotFound,
      })));

      return NextResponse.json(
        { 
          error: message,
          webhook_id: id,
          request_id: ctx.requestId,
          trace_id: ctx.traceId,
        },
        { 
          status,
          headers: {
            [TRACE_HEADERS.REQUEST_ID]: ctx.requestId,
            [TRACE_HEADERS.TRACE_ID]: ctx.traceId,
          },
        }
      );
    }
  });
}

// ============================================
// DELETE /api/webhooks/[id] - DELETE WEBHOOK
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = createRequestContext(request.headers, {
    webhook_id: id,
    operation: "delete_webhook",
  });

  return runWithContext(ctx, async () => {
    try {
      await pfm.delete(`/v1/webhooks/${id}`);

      // Clear cached secret since webhook is deleted
      const { clearCachedSecret } = await import("@/lib/webhook-secrets");
      clearCachedSecret(id);

      console.log(JSON.stringify(formatRequestLog(ctx, "DELETE", `/api/webhooks/${id}`, 200)));

      return NextResponse.json({ 
        success: true,
        request_id: ctx.requestId,
        trace_id: ctx.traceId,
      }, {
        headers: {
          [TRACE_HEADERS.REQUEST_ID]: ctx.requestId,
          [TRACE_HEADERS.TRACE_ID]: ctx.traceId,
        },
      });
    } catch (error) {
      const errorDetails = extractErrorDetails(error);
      const status = errorDetails.isNotFound ? 404 : errorDetails.status || 500;
      const message = errorDetails.isNotFound ? "Webhook not found" : "Failed to delete webhook";

      console.error(JSON.stringify(formatRequestLog(ctx, "DELETE", `/api/webhooks/${id}`, status, {
        error: errorDetails.message,
        is_not_found: errorDetails.isNotFound,
      })));

      return NextResponse.json(
        { 
          error: message,
          webhook_id: id,
          request_id: ctx.requestId,
          trace_id: ctx.traceId,
        },
        { 
          status,
          headers: {
            [TRACE_HEADERS.REQUEST_ID]: ctx.requestId,
            [TRACE_HEADERS.TRACE_ID]: ctx.traceId,
          },
        }
      );
    }
  });
}

// ============================================
// EVENT PROCESSOR
// ============================================
import { appendEvent, syntheticEventId, getEventById } from "@/lib/lark-events";
import type { WebhookEventPayload } from "@/lib/validations/webhook-api-schemas";
import type { RequestContext } from "@/lib/request-context";

async function processWebhookEvent(
  payload: WebhookEventPayload,
  webhookId: string,
  ctx: RequestContext
): Promise<{ eventId: string; isRetry: boolean }> {
  const { event_type, data } = payload;
  
  // Generate deterministic event ID (same input = same ID)
  // This ensures retries from Post For Me collapse to the same event_id
  const postId = "post_id" in data ? data.post_id : undefined;
  const eventId = syntheticEventId([event_type, data.id, postId]);

  // Check if this is a retry (event already exists)
  const existing = await getEventById(eventId);
  const isRetry = existing !== null;

  // Build trace headers for downstream requests
  const traceHeaders = buildTraceHeaders(ctx.traceId, ctx.spanId, ctx.parentSpanId);
  
  // Event-specific logging details
  let eventDetails: Record<string, unknown> = {};
  
  switch (event_type) {
    case "social.post.created":
      eventDetails = {
        post_id: data.id,
        status: (data as { status?: string }).status,
        platform_count: (data as { social_accounts?: unknown[] }).social_accounts?.length ?? 0,
        has_media: !!(data as { media?: unknown[] }).media?.length,
      };
      break;
      
    case "social.post.updated":
      eventDetails = {
        post_id: data.id,
        status: (data as { status?: string }).status,
        updated_fields: Object.keys(data).filter(k => k !== "id" && k !== "created_at"),
      };
      break;
      
    case "social.post.deleted":
      eventDetails = { post_id: data.id };
      break;
      
    case "social.post.result.created":
      eventDetails = {
        post_id: (data as { post_id: string }).post_id,
        result_id: data.id,
        social_account_id: (data as { social_account_id: string }).social_account_id,
        success: (data as { success: boolean }).success,
        has_error: !!(data as { error?: unknown }).error,
      };
      break;
      
    case "social.account.created":
      eventDetails = {
        account_id: data.id,
        platform: (data as { platform: string }).platform,
        username: (data as { username: string | null }).username,
        status: (data as { status: string }).status,
      };
      break;
      
    case "social.account.updated":
      eventDetails = {
        account_id: data.id,
        platform: (data as { platform: string }).platform,
        status: (data as { status: string }).status,
        updated_fields: Object.keys(data).filter(k => k !== "id" && k !== "created_at"),
      };
      break;
  }
  
  // Store in EVENTS table with trace context
  const { inserted } = await appendEvent({
    event_id: eventId,
    source: "post-for-me",
    event_type,
    resource_id: data.id,
    post_id: postId || null,
    social_account_id: event_type.includes("account") ? data.id : null,
    user_id: null,
    payload: data,
    // Trace context for debugging
    trace_id: ctx.traceId,
    request_id: ctx.requestId,
  }, traceHeaders);
  
  // Structured logging for each event type
  const logPrefix = isRetry ? "[RETRY]" : "[NEW]";
  console.log(JSON.stringify({
    level: "info",
    prefix: logPrefix,
    webhook_id: webhookId.slice(0, 8),
    event_type,
    event_id: eventId,
    trace_id: ctx.traceId,
    request_id: ctx.requestId,
    inserted,
    is_retry: isRetry,
    ...eventDetails,
    timestamp: new Date().toISOString(),
  }));
  
  return { eventId, isRetry };
}
