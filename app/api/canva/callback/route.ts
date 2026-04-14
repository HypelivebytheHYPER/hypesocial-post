import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCanvaCode, setCanvaCookie } from "@/lib/canva-client";
import { STATE_COOKIE, parseState } from "@/app/api/canva/auth/route";

/**
 * GET /api/canva/callback
 *
 * Handle Canva OAuth callback.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(`/canva?error=${encodeURIComponent(error)}`, request.url),
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/canva?error=missing_code_or_state", request.url),
      );
    }

    const cookieStore = await cookies();
    const storedState = cookieStore.get(STATE_COOKIE)?.value;

    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        new URL("/canva?error=invalid_state", request.url),
      );
    }

    // Clear state cookie
    cookieStore.delete(STATE_COOKIE);

    // Exchange code for tokens
    const tokenResponse = await exchangeCanvaCode(code);

    // Build session
    const session = {
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      scope: tokenResponse.scope,
      expires_at: tokenResponse.expires_in
        ? Date.now() + tokenResponse.expires_in * 1000
        : undefined,
    };

    await setCanvaCookie(session);

    const { redirectPath } = parseState(state);
    const redirectUrl = redirectPath || "/canva";

    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "oauth_failed";
    return NextResponse.redirect(
      new URL(`/canva?error=${encodeURIComponent(message)}`, request.url),
    );
  }
}
