import { NextResponse } from "next/server";
import { rateLimit, getTier } from "@/lib/rate-limit";

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
 * Simple middleware - NO AUTHENTICATION
 * Allows all access for UI testing
 */
export async function proxy(req: Request) {
  const url = new URL(req.url);
  const pathname = url.pathname;

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

  // --- Allow all access ---
  const res = NextResponse.next();
  addRateLimitHeaders(res, rl.limit, rl.remaining, rl.resetMs);
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
