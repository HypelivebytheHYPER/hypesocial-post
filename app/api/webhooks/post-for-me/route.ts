import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { timingSafeEqual } from "crypto";
import {
  PostForMeWebhookPayloadSchema,
  PostCreatedData,
  PostUpdatedData,
  PostDeletedData,
  PostResultCreatedData,
  AccountCreatedData,
  AccountUpdatedData,
} from "@/lib/validations/webhooks";

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * POST /api/webhooks/post-for-me
 * Receive webhook events from Post For Me API
 *
 * Per docs: Must respond 2XX within 1 second.
 * We return 200 immediately — revalidatePath is non-blocking.
 *
 * Authentication:
 * - Verifies Post-For-Me-Webhook-Secret header using timing-safe comparison
 *
 * Expected Headers:
 * - Post-For-Me-Webhook-Secret: string (required)
 * - Content-Type: application/json
 *
 * Payload envelope:
 * - event_type: string (required)
 * - data: object (required)
 */
export async function POST(request: NextRequest) {
  try {
    const expectedSecret = process.env.POST_FOR_ME_WEBHOOK_SECRET;

    if (!expectedSecret) {
      console.error("[Webhook] POST_FOR_ME_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 },
      );
    }

    // Verify webhook secret using timing-safe comparison
    const webhookSecret =
      request.headers.get("Post-For-Me-Webhook-Secret") ||
      request.headers.get("post-for-me-webhook-secret");

    if (!webhookSecret || !secureCompare(webhookSecret, expectedSecret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const result = PostForMeWebhookPayloadSchema.safeParse(body);

    if (!result.success) {
      console.error("[Webhook] Validation failed:", JSON.stringify(result.error.format()));
      return NextResponse.json(
        { error: "Invalid payload", details: result.error.format() },
        { status: 400 },
      );
    }

    const payload = result.data;

    switch (payload.event_type) {
      case "social.post.created":
        handlePostCreated(payload.data);
        break;
      case "social.post.updated":
        handlePostUpdated(payload.data);
        break;
      case "social.post.deleted":
        handlePostDeleted(payload.data);
        break;
      case "social.post.result.created":
        handlePostResultCreated(payload.data);
        break;
      case "social.account.created":
        handleAccountCreated(payload.data);
        break;
      case "social.account.updated":
        handleAccountUpdated(payload.data);
        break;
    }

    // Return 200 immediately per docs (must respond within 1 second)
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

function handlePostCreated(data: PostCreatedData) {
  revalidatePath("/");
  revalidatePath("/posts");
}

function handlePostUpdated(data: PostUpdatedData) {
  revalidatePath(`/posts/${data.id}`);
  revalidatePath("/");
  revalidatePath("/posts");
}

function handlePostDeleted(data: PostDeletedData) {
  revalidatePath("/");
  revalidatePath("/posts");
}

function handlePostResultCreated(data: PostResultCreatedData) {
  revalidatePath(`/posts/${data.post_id}`);
  revalidatePath("/");
  revalidatePath("/posts");
  revalidatePath("/analytics");
}

function handleAccountCreated(data: AccountCreatedData) {
  revalidatePath("/accounts/connect");
  revalidatePath("/");
}

function handleAccountUpdated(data: AccountUpdatedData) {
  revalidatePath("/accounts/connect");
  revalidatePath("/");
}
