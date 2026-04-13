import { NextRequest, NextResponse } from "next/server";
import { appendEvent, syntheticEventId } from "@/lib/lark-events";

/**
 * GET /api/accounts/callback/[platform]
 * Intercepts OAuth redirects from social platforms before forwarding to Post For Me.
 *
 * Flow: Social Platform → /api/accounts/callback/tiktok?code=...&state=...
 *       → log + store event
 *       → 302 redirect to https://app.postforme.dev/callback/tiktok/account?code=...&state=...
 *
 * Env: POST_FOR_ME_REDIRECT_URI must be set (e.g. https://app.postforme.dev/callback)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  try {
    const { platform } = await params;
    const pfmCallbackBase = process.env.POST_FOR_ME_REDIRECT_URI;

    if (!pfmCallbackBase) {
      console.error("[Callback] POST_FOR_ME_REDIRECT_URI not configured");
      return NextResponse.redirect(
        new URL("/accounts/connect?error=callback_not_configured", request.url),
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const hasError = searchParams.has("error");

    // Log the interception (redact sensitive OAuth params)
    const SENSITIVE_PARAMS = new Set([
      "code",
      "access_token",
      "refresh_token",
      "token",
    ]);
    const redactedParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      redactedParams[key] = SENSITIVE_PARAMS.has(key)
        ? `[REDACTED ${value.length}chars]`
        : value;
    });
    // Persist callback interception to the EVENTS table so it shows up in
    // Streaming replay alongside webhook-driven events. Best-effort — failure here
    // must NOT block the OAuth redirect.
    const state = searchParams.get("state") || "unknown";
    try {
      await appendEvent({
        event_id: syntheticEventId([
          "social.account.callback_intercepted",
          platform,
          state,
        ]),
        source: "callback",
        event_type: "social.account.callback_intercepted",
        resource_id: state,
        post_id: null,
        social_account_id: null,
        user_id: null,
        payload: { platform, params: redactedParams, hasError },
      });
    } catch (err) {
      console.error("[Callback] EVENTS persist failed (non-fatal):", err);
    }

    // Forward ALL query params to PFM's platform-specific callback
    const forwardUrl = new URL(`${pfmCallbackBase}/${platform}/account`);
    searchParams.forEach((value, key) => {
      forwardUrl.searchParams.set(key, value);
    });

    return NextResponse.redirect(forwardUrl.toString(), 302);
  } catch (error) {
    console.error("[Callback] OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/accounts/connect?error=callback_failed", request.url),
    );
  }
}
