import { NextRequest, NextResponse } from "next/server";
import { pfm } from "@/lib/post-for-me-client";
import {
  WebhookListResponseSchema,
  CreateWebhookRequestSchema,
} from "@/lib/validations/webhook-api-schemas";
import {
  createRequestContext,
  formatRequestLog,
  TRACE_HEADERS,
  runWithContext,
} from "@/lib/request-context";
import {
  extractErrorDetails,
  getRetryAfter,
} from "@/lib/pfm-errors";

// ============================================
// WEBHOOK MANAGEMENT API (CRUD for Post For Me)
// ============================================

/**
 * GET /api/webhooks
 * List all registered webhooks from Post For Me
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ctx = createRequestContext(request.headers, {
    operation: "list_webhooks",
    params: Object.fromEntries(searchParams.entries()),
  });

  return runWithContext(ctx, async () => {
    try {
      // Build query string from search params
      const queryParts: string[] = [];
      searchParams.forEach((value, key) => {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      });
      const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

      const data = await pfm.get(`/v1/webhooks${queryString}`);
      const validated = WebhookListResponseSchema.parse(data);

      console.log(JSON.stringify(formatRequestLog(ctx, "GET", "/api/webhooks", 200, {
        total: validated.meta.total,
      })));

      // Return full response matching Post For Me format
      return NextResponse.json(validated, {
        headers: {
          [TRACE_HEADERS.REQUEST_ID]: ctx.requestId,
          [TRACE_HEADERS.TRACE_ID]: ctx.traceId,
        },
      });
    } catch (error) {
      const errorDetails = extractErrorDetails(error);
      const status = errorDetails.isRateLimited ? 429 : errorDetails.status || 500;
      
      console.error(JSON.stringify(formatRequestLog(ctx, "GET", "/api/webhooks", status, {
        error: errorDetails.message,
        is_rate_limited: errorDetails.isRateLimited,
      })));

      const responseBody: Record<string, unknown> = { 
        error: errorDetails.isRateLimited ? "Rate limited" : "Failed to fetch webhooks",
        request_id: ctx.requestId,
        trace_id: ctx.traceId,
      };
      
      if (errorDetails.isRateLimited) {
        responseBody.retry_after = getRetryAfter(error);
      }

      const headers: Record<string, string> = {
        [TRACE_HEADERS.REQUEST_ID]: ctx.requestId,
        [TRACE_HEADERS.TRACE_ID]: ctx.traceId,
      };
      
      if (errorDetails.isRateLimited) {
        headers["Retry-After"] = String(getRetryAfter(error));
      }

      return NextResponse.json(responseBody, { status, headers });
    }
  });
}

/**
 * POST /api/webhooks
 * Create a new webhook in Post For Me
 */
export async function POST(request: NextRequest) {
  const ctx = createRequestContext(request.headers, {
    operation: "create_webhook",
  });

  return runWithContext(ctx, async () => {
    try {
      const body = await request.json();
      
      // Validate request body with Zod
      const validated = CreateWebhookRequestSchema.parse(body);
      
      // Pass as { body: validated } to match SDK signature
      const data = await pfm.post("/v1/webhooks", { body: validated });
      
      const webhookId = (data as { id?: string }).id;
      ctx.metadata.created_webhook_id = webhookId;

      console.log(JSON.stringify(formatRequestLog(ctx, "POST", "/api/webhooks", 201, {
        webhook_id: webhookId,
        url: validated.url,
        event_types: validated.event_types,
      })));

      return NextResponse.json(data, { 
        status: 201,
        headers: {
          [TRACE_HEADERS.REQUEST_ID]: ctx.requestId,
          [TRACE_HEADERS.TRACE_ID]: ctx.traceId,
        },
      });
    } catch (error) {
      const errorDetails = extractErrorDetails(error);
      const status = errorDetails.isValidationError ? 422 : 
                     errorDetails.isRateLimited ? 429 : 
                     errorDetails.status || 500;

      console.error(JSON.stringify(formatRequestLog(ctx, "POST", "/api/webhooks", status, {
        error: errorDetails.message,
        error_type: errorDetails.isValidationError ? "validation" : 
                   errorDetails.isRateLimited ? "rate_limit" : "api",
      })));

      const responseBody: Record<string, unknown> = { 
        error: errorDetails.isValidationError ? "Validation error" : 
               errorDetails.isRateLimited ? "Rate limited" : 
               "Failed to create webhook",
        request_id: ctx.requestId,
        trace_id: ctx.traceId,
      };
      
      if (errorDetails.isRateLimited) {
        responseBody.retry_after = getRetryAfter(error);
      }

      const headers: Record<string, string> = {
        [TRACE_HEADERS.REQUEST_ID]: ctx.requestId,
        [TRACE_HEADERS.TRACE_ID]: ctx.traceId,
      };
      
      if (errorDetails.isRateLimited) {
        headers["Retry-After"] = String(getRetryAfter(error));
      }

      return NextResponse.json(responseBody, { status, headers });
    }
  });
}
