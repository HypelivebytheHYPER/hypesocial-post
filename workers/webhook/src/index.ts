/**
 * Cloudflare Worker - Post For Me Webhook Relay
 *
 * Flow: Post For Me → this Worker (edge) → Next.js app (Vercel)
 *
 * - Verifies Post-For-Me-Webhook-Secret header
 * - Returns 200 immediately (Post For Me requires response within 1 second)
 * - Forwards payload to Next.js app asynchronously via ctx.waitUntil
 *
 * Deploy: cd workers/webhook && npx wrangler deploy
 * Secrets: npx wrangler secret put POST_FOR_ME_WEBHOOK_SECRET
 *          npx wrangler secret put NEXTJS_WEBHOOK_SECRET
 */

export interface Env {
  POST_FOR_ME_WEBHOOK_SECRET: string; // Verify incoming from Post For Me
  NEXTJS_WEBHOOK_SECRET: string; // Authenticate forwarding to Vercel
  NEXTJS_APP_URL: string; // https://hypesocial-post.vercel.app
}

const VALID_EVENTS = new Set([
  "social.post.created",
  "social.post.updated",
  "social.post.deleted",
  "social.post.result.created",
  "social.account.created",
  "social.account.updated",
]);

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    // Only handle /webhooks/post-for-me
    if (url.pathname !== "/webhooks/post-for-me") {
      return json({ error: "Not found" }, 404);
    }

    // Only POST
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, { Allow: "POST" });
    }

    // Verify webhook secret
    const incomingSecret =
      request.headers.get("Post-For-Me-Webhook-Secret") ||
      request.headers.get("post-for-me-webhook-secret");

    if (
      !incomingSecret ||
      !(await timingSafeEqual(incomingSecret, env.POST_FOR_ME_WEBHOOK_SECRET))
    ) {
      return json({ error: "Unauthorized" }, 401);
    }

    // Parse JSON
    let payload: { event_type: string; data: unknown };
    try {
      payload = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    // Validate envelope
    if (
      !payload.event_type ||
      !payload.data ||
      !VALID_EVENTS.has(payload.event_type)
    ) {
      return json({ error: "Invalid payload" }, 400);
    }

    // Return 200 immediately, forward async
    ctx.waitUntil(forwardToNextJs(payload, env));

    return json({ success: true }, 200);
  },
};

// --- Helpers ---

function json(
  body: Record<string, unknown>,
  status: number,
  extraHeaders?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

/**
 * Timing-safe string comparison that does not leak string length.
 * Uses HMAC to normalize both inputs to fixed-length digests before comparing.
 */
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode("webhook-compare-key");
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const [hmacA, hmacB] = await Promise.all([
    crypto.subtle.sign("HMAC", key, encoder.encode(a)),
    crypto.subtle.sign("HMAC", key, encoder.encode(b)),
  ]);
  const bufA = new Uint8Array(hmacA);
  const bufB = new Uint8Array(hmacB);
  let result = 0;
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i] ^ bufB[i];
  }
  return result === 0;
}

async function forwardToNextJs(
  payload: { event_type: string; data: unknown },
  env: Env,
): Promise<void> {
  const target = `${env.NEXTJS_APP_URL}/api/webhooks/post-for-me`;
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(target, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Post-For-Me-Webhook-Secret": env.NEXTJS_WEBHOOK_SECRET,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        console.log(
          `[Webhook Relay] ${payload.event_type} → Vercel ${res.status}`,
        );
        return;
      }

      const body = await res.text().catch(() => "");
      console.error(
        `[Webhook Relay] Forward failed (attempt ${attempt}/${maxAttempts}): ${res.status} ${res.statusText}`,
        body,
      );

      // Retry on 5xx (server error / cold start), not on 4xx (client error)
      if (res.status < 500 || attempt === maxAttempts) return;
    } catch (error) {
      console.error(
        `[Webhook Relay] Forward error (attempt ${attempt}/${maxAttempts}):`,
        error,
      );
      if (attempt === maxAttempts) return;
    }

    // Wait 2s before retry (handles Vercel cold starts)
    await new Promise((r) => setTimeout(r, 2000));
  }
}
