/**
 * Cloudflare Worker - Post For Me Webhook Handler
 * Receives webhooks at edge and forwards to Next.js app
 *
 * Deploy: wrangler deploy
 */

export interface Env {
  POST_FOR_ME_WEBHOOK_SECRET: string;
  NEXTJS_APP_URL: string; // e.g., https://hypesocial-post.vercel.app
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Validate path - must be /webhooks/post-for-me
    if (url.pathname !== "/webhooks/post-for-me") {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Only accept POST requests
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json",
            Allow: "POST",
          },
        },
      );
    }

    // Verify webhook secret using timing-safe comparison
    const webhookSecret =
      request.headers.get("Post-For-Me-Webhook-Secret") ||
      request.headers.get("post-for-me-webhook-secret");

    if (
      !webhookSecret ||
      !timingSafeEqual(webhookSecret, env.POST_FOR_ME_WEBHOOK_SECRET)
    ) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse payload
    let payload;
    try {
      payload = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate required fields
    if (!payload.event_id || !payload.event_type || !payload.data) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return 200 OK immediately (Post For Me requires response within 1 second)
    // Forward to Next.js asynchronously via ctx.waitUntil
    ctx.waitUntil(processWebhook(payload, env));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};

/**
 * Timing-safe string comparison to prevent timing attacks.
 * Uses Web Crypto API available in Cloudflare Workers.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);

  let result = 0;
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i] ^ bufB[i];
  }
  return result === 0;
}

async function processWebhook(payload: any, env: Env): Promise<void> {
  try {
    // Forward to Next.js app with the real webhook secret
    // so the Next.js route can verify authenticity
    await fetch(`${env.NEXTJS_APP_URL}/api/webhooks/post-for-me`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Post-For-Me-Webhook-Secret": env.POST_FOR_ME_WEBHOOK_SECRET,
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Failed to forward webhook to Next.js:", error);
  }

  // Additional edge processing
  switch (payload.event_type) {
    case "social.post.result.created":
      await handlePostResult(payload.data);
      break;
    case "social.account.updated":
      await handleAccountUpdate(payload.data);
      break;
  }
}

async function handlePostResult(data: any): Promise<void> {
  if (data.status === "success") {
    console.log(`Post ${data.post_id} published: ${data.platform_post_url}`);
  } else {
    console.log(`Post ${data.post_id} failed: ${data.error?.message}`);
  }
}

async function handleAccountUpdate(data: any): Promise<void> {
  if (data.status === "disconnected") {
    console.log(`Account ${data.id} disconnected`);
  }
}
