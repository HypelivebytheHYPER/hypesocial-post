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
 * Authentication:
 * - Verifies Post-For-Me-Webhook-Secret header using timing-safe comparison
 *
 * Expected Headers:
 * - Post-For-Me-Webhook-Secret: string (required)
 * - Content-Type: application/json
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
      return NextResponse.json(
        { error: "Invalid payload", details: result.error.format() },
        { status: 400 },
      );
    }

    const payload = result.data;

    switch (payload.event_type) {
      case "social.post.created":
        await handlePostCreated(payload.data, payload.event_id);
        break;
      case "social.post.updated":
        await handlePostUpdated(payload.data, payload.event_id);
        break;
      case "social.post.deleted":
        await handlePostDeleted(payload.data, payload.event_id);
        break;
      case "social.post.result.created":
        await handlePostResultCreated(payload.data, payload.event_id);
        break;
      case "social.account.created":
        await handleAccountCreated(payload.data, payload.event_id);
        break;
      case "social.account.updated":
        await handleAccountUpdated(payload.data, payload.event_id);
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function handlePostCreated(data: PostCreatedData, eventId: string) {
  revalidatePath("/");
  revalidatePath("/posts");
}

async function handlePostUpdated(data: PostUpdatedData, eventId: string) {
  revalidatePath(`/posts/${data.id}`);
  revalidatePath("/");
  revalidatePath("/posts");
}

async function handlePostDeleted(data: PostDeletedData, eventId: string) {
  revalidatePath("/");
  revalidatePath("/posts");
}

async function handlePostResultCreated(
  data: PostResultCreatedData,
  eventId: string,
) {
  revalidatePath(`/posts/${data.post_id}`);
  revalidatePath("/");
  revalidatePath("/posts");
  revalidatePath("/analytics");
}

async function handleAccountCreated(
  data: AccountCreatedData,
  eventId: string,
) {
  revalidatePath("/accounts/connect");
  revalidatePath("/");
}

async function handleAccountUpdated(
  data: AccountUpdatedData,
  eventId: string,
) {
  revalidatePath("/accounts/connect");
  revalidatePath("/");
}
