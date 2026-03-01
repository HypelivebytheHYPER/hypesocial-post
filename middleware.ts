import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Bypass cookie name
const BYPASS_COOKIE = "hypesocial-session";
const BYPASS_VALUE = "bypass-mode";

/**
 * Check if dev bypass mode is enabled
 */
function isBypassEnabled(request: NextRequest): boolean {
  const bypassCookie = request.cookies.get(BYPASS_COOKIE)?.value;
  return bypassCookie === BYPASS_VALUE;
}

/**
 * Next.js Middleware
 * Excludes webhook routes from authentication checks
 * DEV MODE: Automatically bypasses auth in development
 */
export function middleware(request: NextRequest) {
  // Allow webhook endpoints without authentication
  // These use HMAC signature verification instead
  if (request.nextUrl.pathname.startsWith("/api/webhooks/post-for-me")) {
    return NextResponse.next();
  }

  // DEV BYPASS MODE - Automatically authenticate in development
  if (
    process.env.NODE_ENV === "development" ||
    process.env.AUTH_BYPASS === "true"
  ) {
    const response = NextResponse.next();

    // Set bypass cookie if not present
    if (!isBypassEnabled(request)) {
      response.cookies.set(BYPASS_COOKIE, BYPASS_VALUE, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

      // Also set a visible dev indicator cookie
      response.cookies.set("dev-mode", "active", {
        httpOnly: false,
        secure: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }

    // Add custom header for server components to detect bypass
    response.headers.set("x-auth-bypass", "true");
    response.headers.set(
      "x-dev-user-id",
      "00000000-0000-0000-0000-000000000001",
    );

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files, api routes (except webhooks), and _next
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
