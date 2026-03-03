/**
 * In-memory sliding window rate limiter.
 * Per-instance (best option for Vercel serverless without external deps).
 */

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
}

type Tier = "auth" | "webhook" | "media" | "api";

const TIER_LIMITS: Record<Tier, { max: number; windowMs: number }> = {
  auth: { max: 10, windowMs: 60_000 },
  webhook: { max: 100, windowMs: 60_000 },
  media: { max: 20, windowMs: 60_000 },
  api: { max: 60, windowMs: 60_000 },
};

const store = new Map<string, RateLimitEntry>();

// Auto-cleanup expired entries every 60s
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      entry.timestamps = entry.timestamps.filter((t) => now - t < 120_000);
      if (entry.timestamps.length === 0) store.delete(key);
    }
  }, 60_000);
  // Don't prevent process exit
  if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

export function getTier(pathname: string): Tier {
  if (pathname.startsWith("/api/auth") || pathname === "/login") return "auth";
  if (pathname.startsWith("/api/webhooks/post-for-me")) return "webhook";
  if (pathname.startsWith("/api/media") || pathname === "/api/moodboard/upload")
    return "media";
  return "api";
}

export function rateLimit(key: string, tier: Tier): RateLimitResult {
  ensureCleanup();

  const { max, windowMs } = TIER_LIMITS[tier];
  const now = Date.now();
  const id = `${tier}:${key}`;

  let entry = store.get(id);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(id, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= max) {
    const oldest = entry.timestamps[0]!;
    const resetMs = oldest + windowMs - now;
    return { success: false, limit: max, remaining: 0, resetMs };
  }

  entry.timestamps.push(now);
  return {
    success: true,
    limit: max,
    remaining: max - entry.timestamps.length,
    resetMs: windowMs,
  };
}
