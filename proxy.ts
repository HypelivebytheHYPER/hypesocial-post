import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit, getTier } from "@/lib/rate-limit";

/** Paths that do NOT require authentication. */
const PUBLIC_PATHS = [
  "/login",
  "/api/auth",
  "/api/health",
  "/api/webhooks/post-for-me",
  "/api/accounts/callback",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function addRateLimitHeaders(
  res: NextResponse,
  limit: number,
  remaining: number,
  resetMs: number,
) {
  res.headers.set("X-RateLimit-Limit", String(limit));
  res.headers.set("X-RateLimit-Remaining", String(remaining));
  res.headers.set("X-RateLimit-Reset", String(Math.ceil(resetMs / 1000)));
}

/**
 * Auth.js v5 official pattern: wrap proxy with auth() so req.auth
 * contains the session automatically.
 * @see https://authjs.dev/getting-started/migrating-to-v5#authenticating-server-side
 */
export const proxy = auth(async function proxy(req) {
  const { pathname } = req.nextUrl;

  // --- Rate limiting ---
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const tier = getTier(pathname);
  const rl = rateLimit(ip, tier);

  if (!rl.success) {
    const res = NextResponse.json(
      {
        error: "Too Many Requests",
        message: "Rate limit exceeded. Please try again later.",
        statusCode: 429,
      },
      { status: 429 },
    );
    addRateLimitHeaders(res, rl.limit, rl.remaining, rl.resetMs);
    res.headers.set("Retry-After", String(Math.ceil(rl.resetMs / 1000)));
    return res;
  }

  // --- DEV BYPASS — skip auth in development ---
  if (
    process.env.NODE_ENV === "development" ||
    process.env.AUTH_BYPASS === "true"
  ) {
    const res = NextResponse.next();
    addRateLimitHeaders(res, rl.limit, rl.remaining, rl.resetMs);
    return res;
  }

  // --- Public paths — allow through ---
  if (isPublic(pathname)) {
    const res = NextResponse.next();
    addRateLimitHeaders(res, rl.limit, rl.remaining, rl.resetMs);
    return res;
  }

  // --- Auth check (req.auth provided by auth() wrapper) ---
  if (!req.auth) {
    if (pathname.startsWith("/api/")) {
      // API routes → 401 JSON
      const res = NextResponse.json(
        {
          error: "Unauthorized",
          message: "Authentication required",
          statusCode: 401,
        },
        { status: 401 },
      );
      addRateLimitHeaders(res, rl.limit, rl.remaining, rl.resetMs);
      return res;
    }

    // Page routes → redirect to login
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // --- Logged-in user at /login → redirect home ---
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // --- Authenticated — pass through ---
  const res = NextResponse.next();
  addRateLimitHeaders(res, rl.limit, rl.remaining, rl.resetMs);
  return res;
});

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap, robots
     * - Public assets
     */
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
