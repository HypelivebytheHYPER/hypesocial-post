import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pfm } from "@/lib/post-for-me-client";
import { handleApiError } from "@/lib/api-errors";
import { appendEvent, syntheticEventId } from "@/lib/lark-events";

const OAuthCallbackSchema = z.object({
  platform: z.string(),
  code: z.string(),
  state: z.string().optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

/**
 * GET /api/webhooks/oauth-callback?platform=tiktok&code=...&state=...
 * 
 * Server-side OAuth callback handler (no browser redirect).
 * Receives OAuth callback from social platforms and completes
 * account creation without redirecting the user.
 * 
 * Use case: Headless OAuth flows, mobile apps, programmatic connections
 * 
 * Headers:
 *   Authorization: Bearer {WEBHOOK_SECRET} (optional but recommended)
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Verify webhook secret
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.OAUTH_WEBHOOK_SECRET;
    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Invalid or missing webhook secret" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    const parseResult = OAuthCallbackSchema.safeParse({
      platform: searchParams.get("platform"),
      code: searchParams.get("code"),
      state: searchParams.get("state"),
      error: searchParams.get("error"),
      error_description: searchParams.get("error_description"),
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Bad Request", message: "Missing required parameters" },
        { status: 400 }
      );
    }

    const { platform, code, state, error, error_description } = parseResult.data;

    // Handle OAuth error from platform
    if (error) {
      await logOAuthEvent(platform, state, "oauth_error", { error, error_description });
      return NextResponse.json(
        { 
          success: false, 
          error, 
          message: error_description || "OAuth authorization failed" 
        },
        { status: 400 }
      );
    }

    // Log the callback (redact sensitive data)
    await logOAuthEvent(platform, state, "oauth_callback_received", { 
      code_length: code.length 
    });

    // Complete OAuth by creating account with the code
    // This calls PFM's social-accounts endpoint which exchanges code for tokens
    const account = await pfm.post("/v1/social-accounts", {
      body: {
        platform,
        code,
        // Include state if it contains user context
        ...(state && { state }),
      },
    }) as { id: string; platform: string; username?: string; status?: string };

    // Log success
    await logOAuthEvent(platform, state, "account_created", { 
      account_id: account.id,
      username: account.username 
    });

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        platform: account.platform,
        username: account.username,
        status: account.status,
      },
    });

  } catch (error) {
    console.error("[OAuth Webhook] Error:", error);
    
    // Log the error
    const url = new URL(request.url);
    await logOAuthEvent(
      url.searchParams.get("platform") || "unknown",
      url.searchParams.get("state") || undefined,
      "error",
      { message: error instanceof Error ? error.message : "Unknown error" }
    );

    return handleApiError(error, { context: "OAuth webhook callback" });
  }
}

/**
 * POST /api/webhooks/oauth-callback
 * 
 * Alternative: Receive OAuth callback via POST body instead of query params.
 * Useful for platforms that POST the authorization response.
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Verify webhook secret
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.OAUTH_WEBHOOK_SECRET;
    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Invalid or missing webhook secret" },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parseResult = OAuthCallbackSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Bad Request", message: "Missing required fields" },
        { status: 400 }
      );
    }

    const { platform, code, state, error, error_description } = parseResult.data;

    if (error) {
      await logOAuthEvent(platform, state, "oauth_error", { error, error_description });
      return NextResponse.json(
        { 
          success: false, 
          error, 
          message: error_description || "OAuth authorization failed" 
        },
        { status: 400 }
      );
    }

    await logOAuthEvent(platform, state, "oauth_callback_received", { 
      code_length: code.length 
    });

    const account = await pfm.post("/v1/social-accounts", {
      body: {
        platform,
        code,
        ...(state && { state }),
      },
    }) as { id: string; platform: string; username?: string; status?: string };

    await logOAuthEvent(platform, state, "account_created", { 
      account_id: account.id,
      username: account.username 
    });

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        platform: account.platform,
        username: account.username,
        status: account.status,
      },
    });

  } catch (error) {
    console.error("[OAuth Webhook] POST Error:", error);
    return handleApiError(error, { context: "OAuth webhook callback" });
  }
}

// Helper to log OAuth events
async function logOAuthEvent(
  platform: string, 
  state: string | undefined, 
  eventType: string, 
  payload: Record<string, unknown>
) {
  try {
    await appendEvent({
      event_id: syntheticEventId([
        "oauth.webhook",
        platform,
        eventType,
        state || "no-state",
        Date.now().toString(),
      ]),
      source: "callback",
      event_type: `oauth.webhook.${eventType}`,
      resource_id: state || "unknown",
      post_id: null,
      social_account_id: (payload.account_id as string) || null,
      user_id: null,
      payload: { platform, ...payload },
    });
  } catch (err) {
    console.error("[OAuth Webhook] Failed to log event:", err);
  }
}
