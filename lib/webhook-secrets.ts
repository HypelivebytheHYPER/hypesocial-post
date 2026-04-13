/**
 * Webhook Secret Management
 * 
 * Post For Me returns a unique secret per webhook. We cache secrets in memory
 * with TTL for fast lookup during event verification. Falls back to fetching
 * from Post For Me API if not cached.
 * 
 * For serverless environments (Vercel), secrets persist across warm invocations
 * but are lost on cold starts. The cache minimizes API calls.
 */

import { pfm } from "@/lib/post-for-me-client";

interface CachedSecret {
  secret: string;
  expiresAt: number;
}

// In-memory cache with TTL (5 minutes)
const secretCache = new Map<string, CachedSecret>();
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Get webhook secret by ID
 * Checks cache first, then fetches from Post For Me API
 */
export async function getWebhookSecret(webhookId: string): Promise<string | null> {
  // Check cache first
  const cached = secretCache.get(webhookId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.secret;
  }

  // Cache miss or expired - fetch from API
  try {
    const data = (await pfm.get(`/v1/webhooks/${webhookId}`)) as {
      id: string;
      secret: string;
      url: string;
      event_types: string[];
    };

    if (data.secret) {
      cacheSecret(webhookId, data.secret);
      return data.secret;
    }
  } catch (error) {
    console.error(`[WebhookSecrets] Failed to fetch secret for ${webhookId}:`, error);
  }

  return null;
}

/**
 * Cache a webhook secret
 */
export function cacheSecret(webhookId: string, secret: string): void {
  secretCache.set(webhookId, {
    secret,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

/**
 * Clear cached secret (useful on webhook deletion)
 */
export function clearCachedSecret(webhookId: string): void {
  secretCache.delete(webhookId);
}

/**
 * Securely compare two secrets (timing-safe)
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Verify webhook request signature
 * 
 * @param webhookId - Webhook ID from URL
 * @param providedSecret - Secret from request header
 * @returns true if valid, false otherwise
 */
export async function verifyWebhookSecret(
  webhookId: string,
  providedSecret: string
): Promise<boolean> {
  // Get expected secret (from cache or API)
  const expectedSecret = await getWebhookSecret(webhookId);
  
  if (!expectedSecret) {
    console.warn(`[WebhookSecrets] No secret found for webhook ${webhookId}`);
    return false;
  }

  return secureCompare(providedSecret, expectedSecret);
}

/**
 * Get cache stats for monitoring
 */
export function getCacheStats(): {
  size: number;
  keys: string[];
} {
  return {
    size: secretCache.size,
    keys: Array.from(secretCache.keys()),
  };
}
