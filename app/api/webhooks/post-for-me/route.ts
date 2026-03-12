import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { PostForMeWebhookPayloadSchema } from "@/lib/validations/webhook-schemas";
import { setLastEvent } from "@/lib/webhook-event-store";

/**
 * Timing-safe string comparison to prevent timing attacks.
 * Uses HMAC to normalize both inputs to the same length,
 * avoiding length-leak via early return.
 */
function secureCompare(a: string, b: string): boolean {
  const key = "webhook-compare";
  const hmacA = createHmac("sha256", key).update(a).digest();
  const hmacB = createHmac("sha256", key).update(b).digest();
  return timingSafeEqual(hmacA, hmacB);
}

/**
 * POST /api/webhooks/post-for-me
 * Receive webhook events forwarded by the Cloudflare Worker (api.hypelive.app).
 *
 * Flow: Post For Me API → Cloudflare Worker → this endpoint
 *
 * Per docs: Must respond 2XX within 1 second.
 * We validate and return 200. Client updates via React Query polling +
 * refetchOnWindowFocus.
 *
 * Authentication:
 * - Verifies Post-For-Me-Webhook-Secret header (set by the Cloudflare Worker
 *   as NEXTJS_WEBHOOK_SECRET, matched against POST_FOR_ME_WEBHOOK_SECRET here)
 */
export async function POST(request: NextRequest) {
  try {
    const expectedSecret = process.env.POST_FOR_ME_WEBHOOK_SECRET;

    if (!expectedSecret) {
      console.error("[Webhook] POST_FOR_ME_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "Webhook secret not configured",
          statusCode: 500,
        },
        { status: 500 },
      );
    }

    // Verify webhook secret using timing-safe comparison
    const webhookSecret =
      request.headers.get("Post-For-Me-Webhook-Secret") ||
      request.headers.get("post-for-me-webhook-secret");

    if (!webhookSecret || !secureCompare(webhookSecret, expectedSecret)) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Invalid webhook secret",
          statusCode: 401,
        },
        { status: 401 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Invalid JSON in request body",
          statusCode: 400,
        },
        { status: 400 },
      );
    }

    const result = PostForMeWebhookPayloadSchema.safeParse(body);

    if (!result.success) {
      console.error(
        "[Webhook] Validation failed:",
        JSON.stringify(result.error.format()),
      );
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Invalid webhook payload",
          statusCode: 400,
        },
        { status: 400 },
      );
    }

    const { event_type, data } = result.data;

    // Extract IDs from event data
    // Post events: data.id = post_id
    // Result events: data.post_id = post_id, data.id = result_id
    // Account events: data.id = account_id
    const postId = "post_id" in data ? data.post_id : undefined;
    const resourceId = data.id;

    // Structured logging with platform/channel context
    const logContext: Record<string, unknown> = {
      event: event_type,
      resource_id: resourceId,
    };

    if (postId) logContext.post_id = postId;

    // For result events, log platform + success/failure for multi-channel debugging
    if (event_type === "social.post.result.created") {
      const resultData = data as {
        success?: boolean;
        social_account_id?: string;
        error?: unknown;
        platform_data?: { id?: string; url?: string } | null;
      };
      logContext.success = resultData.success;
      logContext.account_id = resultData.social_account_id;
      if (resultData.platform_data?.url) {
        logContext.platform_url = resultData.platform_data.url;
      }
      if (!resultData.success && resultData.error) {
        logContext.error =
          typeof resultData.error === "string"
            ? resultData.error
            : JSON.stringify(resultData.error);
      }
      console.log(
        `[Webhook] Result ${resultData.success ? "OK" : "FAIL"}`,
        logContext,
      );
    } else if (
      event_type === "social.post.created" ||
      event_type === "social.post.updated"
    ) {
      const postData = data as {
        status?: string;
        social_accounts?: Array<{ id: string; platform: string }>;
        media?: unknown[] | null;
      };
      logContext.status = postData.status;
      logContext.accounts = postData.social_accounts?.length ?? 0;
      logContext.media_count = postData.media?.length ?? 0;
      console.log(`[Webhook] ${event_type}`, logContext);
    } else {
      console.log(`[Webhook] ${event_type}`, logContext);
    }

    // Store event so the lightweight /status endpoint can notify the client
    setLastEvent({
      event_type,
      resource_id: resourceId,
      post_id: typeof postId === "string" ? postId : undefined,
    });

    // Return 200 immediately per docs (must respond within 1 second)
    return NextResponse.json({ success: true, event_type, id: resourceId });
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to process webhook",
        statusCode: 500,
      },
      { status: 500 },
    );
  }
}
