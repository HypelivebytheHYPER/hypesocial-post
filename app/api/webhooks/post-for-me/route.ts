import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { PostForMeWebhookPayloadSchema } from "@/lib/validations/webhook-schemas";
import { appendEvent, syntheticEventId } from "@/lib/lark-events";

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
 *
 * Receive webhook events forwarded by the Cloudflare Worker (api.hypelive.app).
 *
 * Flow: Post For Me API → Cloudflare Worker → this endpoint → Lark EVENTS table → SSE
 *
 * Per Post For Me docs: Must respond 2XX within ~10 seconds. Per Lark docs:
 * webhook receivers must respond within 3s. We err on the side of Lark and
 * persist asynchronously after returning 200.
 *
 * Authentication:
 * - Verifies Post-For-Me-Webhook-Secret header (set by the Cloudflare Worker
 *   as NEXTJS_WEBHOOK_SECRET, matched against POST_FOR_ME_WEBHOOK_SECRET here).
 *
 * Idempotency:
 * - The provider does NOT send a stable event_id. We synthesize one from
 *   (event_type, resource_id, post_id) so retries collapse to one row in the
 *   EVENTS table.
 */
export async function POST(request: NextRequest) {
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
  const resourceId = data.id;
  const postId =
    "post_id" in data
      ? (data as { post_id?: string }).post_id
      : event_type.startsWith("social.post.")
        ? data.id
        : undefined;
  const socialAccountId =
    "social_account_id" in data
      ? (data as { social_account_id?: string }).social_account_id
      : undefined;

  // Idempotency-Key support: prefer header if present (forward-compat for when
  // Post For Me starts sending one), fall back to synthetic.
  const headerEventId = request.headers.get("idempotency-key");
  const event_id =
    headerEventId ??
    syntheticEventId([event_type, resourceId, postId, socialAccountId]);

  // Persist to Lark EVENTS table. Awaited inside the request budget so the
  // upstream (CF Worker → PFM) sees the success only after the row exists.
  // Lark's 3s window is plenty for one search + one create against an
  // already-warm worker (~200-400ms total).
  try {
    const { inserted } = await appendEvent({
      event_id,
      source: "post-for-me",
      event_type,
      resource_id: resourceId,
      post_id: postId ?? null,
      social_account_id: socialAccountId ?? null,
      // user_id null for now; multi-tenant filtering happens in a follow-up
      // when POSTS table tracks owner. See lib/lark-events.ts header.
      user_id: null,
      payload: data,
    });

    // Structured logging — keep terse so logs stay scannable
    console.log(
      `[Webhook] ${inserted ? "OK" : "DUP"} ${event_type} id=${resourceId}` +
        (postId ? ` post=${postId}` : ""),
    );

    return NextResponse.json({
      success: true,
      event_id,
      event_type,
      inserted,
    });
  } catch (error) {
    // Persistence failed — return 5xx so Post For Me retries.
    console.error("[Webhook] EVENTS persistence failed:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to persist event",
        statusCode: 500,
      },
      { status: 500 },
    );
  }
}
