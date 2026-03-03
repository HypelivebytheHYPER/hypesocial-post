import { NextRequest, NextResponse } from "next/server";
import { setLastEvent } from "@/lib/webhook-event-store";

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
    const SENSITIVE_PARAMS = new Set(["code", "access_token", "refresh_token", "token"]);
    const redactedParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      redactedParams[key] = SENSITIVE_PARAMS.has(key) ? `[REDACTED ${value.length}chars]` : value;
    });
    console.log("[Callback] OAuth redirect intercepted", {
      platform,
      params: redactedParams,
      hasError,
      timestamp: new Date().toISOString(),
    });

    // Store event for WebhookStatusMonitor to pick up
    setLastEvent({
      event_type: "social.account.callback_intercepted",
      resource_id: searchParams.get("state") || "unknown",
    });

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
