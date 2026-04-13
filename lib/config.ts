/**
 * Application Configuration
 * @module lib/config
 * 
 * Production-ready configuration that works on Vercel without .env.local
 */

/**
 * Get the base URL for the current environment
 * Works on Vercel production, preview, and local development
 */
export function getBaseUrl(): string {
  // Priority 1: Custom domain (production)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // Priority 2: Vercel deployment URL (auto-provided)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Priority 3: Fail if no URL configured (prevents accidental localhost in production)
  throw new Error(
    "No base URL configured. Set NEXT_PUBLIC_APP_URL or ensure VERCEL_URL is available."
  );
}

/**
 * Get the webhook URL for Post For Me
 * This is where Post For Me sends events
 */
export function getWebhookUrl(): string {
  // Priority 1: Explicit webhook URL (for Cloudflare Worker relay)
  if (process.env.NEXT_PUBLIC_WEBHOOK_URL) {
    return process.env.NEXT_PUBLIC_WEBHOOK_URL;
  }
  
  // Priority 2: Derived from base URL
  const baseUrl = getBaseUrl();
  return `${baseUrl}/api/webhooks/post-for-me`;
}

/**
 * Get the Post For Me redirect URI for OAuth
 */
export function getPostForMeRedirectUri(): string {
  if (process.env.POST_FOR_ME_REDIRECT_URI) {
    return process.env.POST_FOR_ME_REDIRECT_URI;
  }
  
  const baseUrl = getBaseUrl();
  return `${baseUrl}/api/accounts/callback`;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Check if running on Vercel
 */
export function isVercel(): boolean {
  return !!process.env.VERCEL;
}

/**
 * Get environment display name
 */
export function getEnvironment(): "production" | "preview" | "development" {
  if (isProduction()) return "production";
  if (process.env.VERCEL_ENV === "preview") return "preview";
  return "development";
}
