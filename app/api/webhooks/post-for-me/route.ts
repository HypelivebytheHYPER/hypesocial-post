import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  PostForMeWebhookPayload,
  PostForMeEventType,
  PostCreatedData,
  PostUpdatedData,
  PostDeletedData,
  PostResultCreatedData,
  AccountCreatedData,
  AccountUpdatedData,
} from "@/types/webhooks";

/**
 * Post For Me Webhook Receiver
 * https://api.postforme.dev/docs/webhooks
 *
 * Handles incoming webhooks from Post For Me API.
 * Verifies webhook secret and processes events with cache invalidation.
 */

// Webhook event handlers
const eventHandlers: Record<
  PostForMeEventType,
  (data: unknown) => Promise<void>
> = {
  "social.post.created": handlePostCreated,
  "social.post.updated": handlePostUpdated,
  "social.post.deleted": handlePostDeleted,
  "social.post.result.created": handlePostResultCreated,
  "social.account.created": handleAccountCreated,
  "social.account.updated": handleAccountUpdated,
};

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret (check both cases as HTTP headers are case-insensitive)
    const webhookSecret =
      request.headers.get("Post-For-Me-Webhook-Secret") ||
      request.headers.get("post-for-me-webhook-secret");
    const expectedSecret = process.env.POST_FOR_ME_WEBHOOK_SECRET;

    console.log("[Webhook] Received request", {
      hasSecret: !!webhookSecret,
      hasExpected: !!expectedSecret,
      secretMatch: webhookSecret === expectedSecret,
      headers: Object.fromEntries(request.headers.entries()),
    });

    if (!webhookSecret || webhookSecret !== expectedSecret) {
      console.error("[Webhook] Invalid or missing webhook secret");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse webhook payload
    const payload = (await request.json()) as PostForMeWebhookPayload;

    if (!payload.event_type || !payload.data) {
      console.error("[Webhook] Invalid payload structure", payload);
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    console.log(`[Webhook] Received: ${payload.event_type}`, {
      timestamp: new Date().toISOString(),
      data: payload.data,
    });

    // Handle the event
    const handler = eventHandlers[payload.event_type];
    if (handler) {
      await handler(payload.data);
    } else {
      console.warn(`[Webhook] No handler for event: ${payload.event_type}`);
    }

    // Return 200 to acknowledge receipt
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Event handlers with cache invalidation
async function handlePostCreated(data: unknown) {
  const post = data as PostCreatedData;
  console.log("[Webhook] Post created:", post.id);

  // Revalidate posts cache
  revalidatePath("/");
  revalidatePath("/posts");

  // TODO: Send real-time notification via WebSocket
  // TODO: Store in database for analytics
}

async function handlePostUpdated(data: unknown) {
  const post = data as PostUpdatedData;
  console.log("[Webhook] Post updated:", post.id, "status:", post.status);

  // Revalidate specific post and lists
  revalidatePath(`/posts/${post.id}`);
  revalidatePath("/");
  revalidatePath("/posts");

  // TODO: Update local cache/database
  // TODO: Notify connected clients
}

async function handlePostDeleted(data: unknown) {
  const { id } = data as PostDeletedData;
  console.log("[Webhook] Post deleted:", id);

  // Revalidate all post-related caches
  revalidatePath("/");
  revalidatePath("/posts");

  // TODO: Remove from database
  // TODO: Clean up associated media
}

async function handlePostResultCreated(data: unknown) {
  const result = data as PostResultCreatedData;
  console.log("[Webhook] Post result created:", {
    post_id: result.post_id,
    status: result.status,
    platform_post_id: result.platform_post_id,
  });

  // Revalidate post results
  revalidatePath(`/posts/${result.post_id}`);
  revalidatePath("/");
  revalidatePath("/posts");
  revalidatePath("/analytics");

  // TODO: Store metrics in database
  // TODO: Update post status in cache
  // TODO: Send notification if failed
}

async function handleAccountCreated(data: unknown) {
  const account = data as AccountCreatedData;
  console.log("[Webhook] Account created:", {
    id: account.id,
    platform: account.platform,
    username: account.username,
  });

  // Revalidate accounts cache
  revalidatePath("/accounts/connect");
  revalidatePath("/");

  // TODO: Store in database
  // TODO: Update connected platforms UI
}

async function handleAccountUpdated(data: unknown) {
  const account = data as AccountUpdatedData;
  console.log("[Webhook] Account updated:", {
    id: account.id,
    status: account.status,
  });

  // Revalidate specific account
  revalidatePath("/accounts/connect");
  revalidatePath("/");

  // TODO: Update cache
  // TODO: Handle status changes (expired, etc.)
}
