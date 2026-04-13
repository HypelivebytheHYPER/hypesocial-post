/**
 * Application Constants
 * @module lib/constants
 * 
 * Centralized constants to avoid magic numbers and duplication.
 */

// ==================== Time Constants (milliseconds) ====================

// ==================== Time Constants (milliseconds) ====================

export const TIME = {
  // Base units
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,

  // TanStack Query defaults
  STALE_TIME_DEFAULT: 5 * 60 * 1000, // 5 minutes
  STALE_TIME_ACCOUNTS: 60 * 60 * 1000, // 1 hour (accounts rarely change)
  STALE_TIME_POSTS: 30 * 60 * 1000, // 30 minutes (streaming invalidates proactively)
  GC_TIME_DEFAULT: 30 * 60 * 1000, // 30 minutes
  
  // Polling intervals
  POLL_INTERVAL_POST_RESULTS: 30 * 1000,    // 30 seconds (slow fallback while processing)
  
  // Rate limiting
  RATE_LIMIT_WINDOW: 60 * 1000,             // 1 minute
  
  // Streaming
  STREAM_HEARTBEAT: 25 * 1000,              // 25 seconds
  STREAM_POLL_INTERVAL: 3 * 1000,           // 3 seconds
  STREAM_MAX_DURATION: 300,                 // 5 minutes (Vercel Pro)
} as const;

// ==================== Stable References ====================

/**
 * Stable empty array reference for fallbacks (2026 best practice).
 * Prevents unnecessary re-renders when used as default prop or fallback.
 */
export const EMPTY_ARRAY: readonly never[] = Object.freeze([]);

/**
 * Stable empty object reference for fallbacks.
 */
export const EMPTY_OBJECT: Readonly<Record<string, never>> = Object.freeze({});

// ==================== API Constants ====================

export const API = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_LIMIT: 50,
} as const;

// ==================== File Upload ====================

export const UPLOAD = {
  MAX_FILE_SIZE: 500 * 1024 * 1024,         // 500MB
  MAX_IMAGE_SIZE: 10 * 1024 * 1024,         // 10MB
  MAX_VIDEO_SIZE: 500 * 1024 * 1024,        // 500MB - supports large video files
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  ALLOWED_VIDEO_TYPES: ["video/mp4", "video/quicktime", "video/webm"],
  /** 
   * Threshold for enabling skip_processing flag on videos.
   * Videos larger than this will bypass Post For Me's processing
   * for faster uploads (but higher failure risk if format is invalid).
   */
  SKIP_PROCESSING_THRESHOLD: 50 * 1024 * 1024, // 50MB
} as const;

// ==================== Platform Technical Limits ====================
// These are REAL hard limits from social media APIs.
// Source: Post For Me API docs + platform official docs
// These cannot be changed - they are enforced by Instagram, Facebook, etc.

export const PLATFORM_LIMITS = {
  // Media per post (carousel/album) - enforced by platforms
  // Instagram: 10 images/videos per carousel
  // Facebook: 10 images/videos per post  
  // Twitter/X: 4 images or 1 video
  // TikTok: 1 video only
  MAX_MEDIA_PER_POST: 10,
  
  // Caption/Content length - enforced by platforms
  // Instagram: 2,200 characters (most restrictive)
  MAX_CAPTION_LENGTH: 2200,
  
  // Hashtags - enforced by platforms
  // Instagram: 30 hashtags max
  MAX_HASHTAGS: 30,
  
  // Mentions (@username) - enforced by platforms
  // Instagram: 30 mentions max per caption
  MAX_MENTIONS_PER_POST: 30,
  
  // Tags per media - enforced by platforms
  // Facebook/Instagram: 30 tags per media
  MAX_TAGS_PER_MEDIA: 30,
} as const;

// ==================== Business Limits (DYNAMIC - NOT HARDCODED) ====================
// WARNING: These are NOT constants. They come from your subscription/credit system.
// 
// How many posts can a user make? -> Check their subscription tier/credits
// How many accounts can they connect? -> Check their subscription tier
// 
// TODO: Implement usage service that tracks:
// - Posts made this month
// - Credits remaining
// - Subscription tier limits
//
// Example (from your dashboard):
// const usage = await getUsage(userId);
// if (usage.postsThisMonth >= usage.plan.maxPosts) -> show "Upgrade plan"
//
// DO NOT hardcode business limits here. They belong in your billing/subscription service.

// ==================== Pagination ====================
// Single default to prevent cache inconsistency. Override per-call when needed.

export const PAGINATION = {
  DEFAULT_LIMIT: 50,      // Use this everywhere for consistency
  MAX_PAGE_SIZE: 100,     // Post For Me API max
  MAX_LIMIT: 500,         // Lark Base max
  
  // Legacy aliases (use DEFAULT_LIMIT instead)
  get DEFAULT_PAGE_SIZE() { return this.DEFAULT_LIMIT; },
} as const;

// ==================== UI Display ====================

export const UI = {
  // Dashboard display limits (just UI, not business logic)
  MAX_RECENT_POSTS: 5,
  MAX_TOP_ACCOUNTS: 5,
  MAX_PLATFORM_ICONS: 3,
  
  // Analytics display
  MAX_TOP_HASHTAGS: 10,
  MAX_TOP_MENTIONS: 8,
  MAX_TOP_POSTS: 10,
  
  // Posts list
  MAX_ACCOUNT_AVATARS: 4,
  MAX_MEDIA_PREVIEW: 4,
  
  // Settings
  MAX_PREVIEW_WEBHOOKS: 2,
  
  // Avatars
  AVATAR_FALLBACK_CHARS: 2,
  ID_PREVIEW_CHARS: 8,
} as const;
