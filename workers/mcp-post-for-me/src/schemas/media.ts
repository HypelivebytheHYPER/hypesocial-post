/**
 * Media Constraints by Platform
 * Comprehensive specs for all social media platforms
 */

export const PLATFORM_MEDIA_CONSTRAINTS = {
  // Meta Platforms
  INSTAGRAM: {
    feed: {
      images: { maxSizeMB: 8, formats: ["jpg", "png", "webp"], minWidth: 320, maxWidth: 1440, aspectRatio: "1:1 to 4:5" },
      videos: { maxSizeMB: 100, maxDurationSec: 60, formats: ["mp4", "mov"], minResolution: "720p", maxResolution: "1080p", aspectRatio: "4:5 to 16:9" },
      carousel: { maxItems: 10 },
    },
    reels: {
      videos: { maxSizeMB: 100, maxDurationSec: 90, formats: ["mp4", "mov"], aspectRatio: "9:16", minResolution: "720x1280", maxResolution: "1080x1920" },
      coverImage: { maxSizeMB: 8, formats: ["jpg", "png"], aspectRatio: "9:16" },
    },
    stories: {
      images: { maxSizeMB: 8, formats: ["jpg", "png"], aspectRatio: "9:16" },
      videos: { maxSizeMB: 100, maxDurationSec: 60, formats: ["mp4", "mov"], aspectRatio: "9:16" },
    },
  },
  
  FACEBOOK: {
    feed: {
      images: { maxSizeMB: 10, formats: ["jpg", "png", "webp", "gif"], maxWidth: 2048 },
      videos: { maxSizeMB: 1000, maxDurationSec: 240 * 60, formats: ["mp4", "mov", "avi"], maxResolution: "1080p" },
      carousel: { maxItems: 10 },
    },
    reels: {
      videos: { maxSizeMB: 1000, maxDurationSec: 90, formats: ["mp4"], aspectRatio: "9:16" },
    },
    stories: {
      images: { maxSizeMB: 8, formats: ["jpg", "png"], aspectRatio: "9:16" },
      videos: { maxSizeMB: 100, maxDurationSec: 20, formats: ["mp4"], aspectRatio: "9:16" },
    },
  },
  
  // TikTok (now supports photo carousels/slideshows)
  TIKTOK_PERSONAL: {
    photos: { 
      maxSizeMB: 20, 
      formats: ["jpg", "png"], 
      maxImages: 35, 
      aspectRatio: "9:16 recommended",
      minWidth: 720,
      maxWidth: 4096,
    },
    videos: { maxSizeMB: 287, maxDurationSec: 600, formats: ["mp4", "mov"], aspectRatio: "9:16", minResolution: "540x960", recommendedResolution: "1080x1920" },
    coverImage: { maxSizeMB: 5, formats: ["jpg", "png"], aspectRatio: "9:16" },
  },
  
  TIKTOK_BUSINESS: {
    photos: { 
      maxSizeMB: 20, 
      formats: ["jpg", "png"], 
      maxImages: 35, 
      aspectRatio: "9:16 recommended",
      minWidth: 720,
      maxWidth: 4096,
    },
    videos: { maxSizeMB: 1000, maxDurationSec: 600, formats: ["mp4", "mov"], aspectRatio: "9:16", minResolution: "720x1280" },
    coverImage: { maxSizeMB: 5, formats: ["jpg", "png"], aspectRatio: "9:16" },
  },
  
  // X/Twitter
  TWITTER: {
    images: { maxSizeMB: 5, formats: ["jpg", "png", "webp", "gif"], maxImages: 4 },
    videos: { maxSizeMB: 512, maxDurationSec: 140, formats: ["mp4"], maxResolution: "1080p" },
    gif: { maxSizeMB: 15, maxWidth: 1280, maxHeight: 1080 },
  },
  
  // LinkedIn
  LINKEDIN: {
    images: { maxSizeMB: 8, formats: ["jpg", "png"], maxImages: 9, maxWidth: 7680 },
    videos: { maxSizeMB: 5000, maxDurationSec: 30 * 60, formats: ["mp4", "avi", "mov"], maxResolution: "1080p" },
    documents: { maxSizeMB: 100, formats: ["pdf"], maxPages: 300 },
  },
  
  // YouTube
  YOUTUBE: {
    videos: { maxSizeMB: 256 * 1024, maxDurationSec: 12 * 3600, formats: ["mp4", "mov", "avi", "wmv", "flv"], maxResolution: "8K" },
    shorts: { maxSizeMB: 60 * 1024, maxDurationSec: 60, formats: ["mp4"], aspectRatio: "9:16" },
    thumbnails: { maxSizeMB: 2, formats: ["jpg", "png"], minWidth: 640, aspectRatio: "16:9" },
  },
  
  // Pinterest
  PINTEREST: {
    images: { maxSizeMB: 20, formats: ["jpg", "png"], minWidth: 1000, aspectRatio: "2:3 recommended" },
    videos: { maxSizeMB: 2000, maxDurationSec: 900, formats: ["mp4"], minResolution: "720p" },
    ideaPins: { maxPages: 20, imageMaxMB: 20, videoMaxMB: 100 },
  },
  
  // Bluesky
  BLUESKY: {
    images: { maxSizeMB: 1, formats: ["jpg", "png", "webp"], maxImages: 4, maxWidth: 4096 },
    videos: { maxSizeMB: 100, maxDurationSec: 60, formats: ["mp4"], maxResolution: "1080p" },
  },
  
  // Threads
  THREADS: {
    images: { maxSizeMB: 8, formats: ["jpg", "png", "webp"], maxImages: 20 },
    videos: { maxSizeMB: 100, maxDurationSec: 300, formats: ["mp4", "mov"], maxResolution: "1080p" },
  },
} as const;

// Helper to get constraints for a platform
export function getPlatformConstraints(platform: string, contentType: "image" | "video" | "reel" | "story" = "image") {
  const p = platform.toLowerCase();
  
  if (p.includes("instagram")) {
    if (contentType === "reel") return PLATFORM_MEDIA_CONSTRAINTS.INSTAGRAM.reels;
    if (contentType === "story") return PLATFORM_MEDIA_CONSTRAINTS.INSTAGRAM.stories;
    return PLATFORM_MEDIA_CONSTRAINTS.INSTAGRAM.feed;
  }
  
  if (p.includes("facebook")) {
    if (contentType === "reel") return PLATFORM_MEDIA_CONSTRAINTS.FACEBOOK.reels;
    if (contentType === "story") return PLATFORM_MEDIA_CONSTRAINTS.FACEBOOK.stories;
    return PLATFORM_MEDIA_CONSTRAINTS.FACEBOOK.feed;
  }
  
  if (p.includes("tiktok_business")) return PLATFORM_MEDIA_CONSTRAINTS.TIKTOK_BUSINESS;
  if (p.includes("tiktok")) return PLATFORM_MEDIA_CONSTRAINTS.TIKTOK_PERSONAL;
  
  if (p.includes("twitter") || p.includes("x")) return PLATFORM_MEDIA_CONSTRAINTS.TWITTER;
  if (p.includes("linkedin")) return PLATFORM_MEDIA_CONSTRAINTS.LINKEDIN;
  if (p.includes("youtube")) return PLATFORM_MEDIA_CONSTRAINTS.YOUTUBE;
  if (p.includes("pinterest")) return PLATFORM_MEDIA_CONSTRAINTS.PINTEREST;
  if (p.includes("bluesky")) return PLATFORM_MEDIA_CONSTRAINTS.BLUESKY;
  if (p.includes("threads")) return PLATFORM_MEDIA_CONSTRAINTS.THREADS;
  
  return null;
}

// Generate platform-specific error messages
export function getPlatformErrorMessage(platform: string, mediaType: "image" | "video", violations: string[]): string {
  const constraints = getPlatformConstraints(platform, mediaType);
  if (!constraints) return `${platform} media validation failed: ${violations.join(", ")}`;
  
  // Handle different property names (images vs photos) with type-safe access
  const constraintsAny = constraints as Record<string, { formats: readonly string[]; maxSizeMB: number; maxDurationSec?: number } | undefined>;
  
  const media = mediaType === "image" 
    ? (constraintsAny.images || constraintsAny.photos)
    : constraintsAny.videos;
  
  if (!media) return `${platform} ${mediaType} requirements not met: ${violations.join(", ")}`;
  
  const duration = media.maxDurationSec ? `, max ${media.maxDurationSec}s` : "";
  return `${platform} ${mediaType} requirements not met: ${violations.join(", ")}. ` +
    `Allowed: ${media.formats.join(" / ")}, max ${media.maxSizeMB}MB${duration}`;
}

// MCP Tool Schema for media with platform context
export const MediaPlatformSchema = {
  type: "object" as const,
  description: "Media file with platform-specific requirements",
  properties: {
    url: {
      type: "string",
      format: "uri",
      description: "Publicly accessible URL of the media file",
    },
    type: {
      type: "string",
      enum: ["image", "video"],
      description: "Type of media",
    },
    platform_target: {
      type: "string",
      enum: [
        // Instagram
        "instagram_feed", "instagram_reels", "instagram_stories",
        // Facebook  
        "facebook_feed", "facebook_reels",
        // TikTok (photos + videos)
        "tiktok_photos", "tiktok_videos",
        // YouTube
        "youtube_shorts",
        // Others
        "twitter", "linkedin", "pinterest", "bluesky", "threads"
      ],
      description: "Target platform/format for optimized validation",
    },
    // Technical metadata
    mime_type: {
      type: "string",
      enum: [
        "image/jpeg", "image/png", "image/webp", "image/gif",
        "video/mp4", "video/quicktime", "video/avi", "video/webm"
      ],
      description: "MIME type of the file",
    },
    size_bytes: {
      type: "integer",
      description: "File size in bytes",
      minimum: 1,
    },
    width: {
      type: "integer",
      description: "Width in pixels",
      minimum: 1,
    },
    height: {
      type: "integer",
      description: "Height in pixels", 
      minimum: 1,
    },
    duration_sec: {
      type: "number",
      description: "Duration in seconds (for videos)",
      minimum: 0.1,
    },
  },
  required: ["url", "type"],
};

// Caption/Character Limits by Platform
export const PLATFORM_CAPTION_LIMITS = {
  instagram: {
    feed: { maxChars: 2200, hashtags: 30, mentions: 20 },
    reels: { maxChars: 2200, hashtags: 30, mentions: 20 },
    stories: { maxChars: 0, note: "Caption not supported in Stories API" },
  },
  facebook: {
    feed: { maxChars: 63206, note: "Long posts truncated with 'see more'" },
    reels: { maxChars: 2200 },
    stories: { maxChars: 0, note: "Caption not supported in Stories" },
  },
  tiktok: {
    photos: { maxChars: 2200, hashtags: 0, note: "Hashtags count toward character limit" },
    videos: { maxChars: 2200, hashtags: 0, note: "Hashtags count toward character limit" },
  },
  twitter: {
    feed: { maxChars: 280, note: "Premium: 25,000 characters" },
  },
  linkedin: {
    feed: { maxChars: 3000, note: "Company posts: 700 characters for optimal display" },
  },
  youtube: {
    shorts: { maxChars: 100, note: "Title limit, description separate" },
    videos: { maxChars: 5000, note: "Title: 100 chars, Description: 5000 chars" },
  },
  pinterest: {
    feed: { maxChars: 500, titleMaxChars: 100 },
    ideaPins: { maxChars: 0, note: "Limited caption support in Idea Pins" },
  },
  bluesky: {
    feed: { maxChars: 300, note: "Hard limit" },
  },
  threads: {
    feed: { maxChars: 500, note: "500 characters per thread, unlimited replies" },
  },
} as const;

// Helper to get caption limits for a platform
export function getCaptionLimits(platform: string, contentType?: string) {
  const p = platform.toLowerCase();
  const type = contentType?.toLowerCase() || "feed";
  
  const limits = PLATFORM_CAPTION_LIMITS[p as keyof typeof PLATFORM_CAPTION_LIMITS];
  if (!limits) return null;
  
  // Handle different content types with type-safe access
  const limitsAny = limits as Record<string, { maxChars: number; hashtags?: number; note?: string; titleMaxChars?: number } | undefined>;
  
  if (type.includes("reel")) return limitsAny.reels || limitsAny.feed;
  if (type.includes("story")) return limitsAny.stories || limitsAny.feed;
  if (type.includes("photo")) return limitsAny.photos || limitsAny.videos || limitsAny.feed;
  if (type.includes("video")) return limitsAny.videos || limitsAny.feed;
  if (type.includes("short")) return limitsAny.shorts || limitsAny.videos || limitsAny.feed;
  if (type.includes("idea")) return limitsAny.ideaPins || limitsAny.feed;
  
  return limitsAny.feed;
}

// Summary for tool description
export function getMediaConstraintsSummary(): string {
  const platforms = Object.keys(PLATFORM_MEDIA_CONSTRAINTS);
  return `Supports images, videos, and photo carousels across ${platforms.length} platforms. ` +
    `Max image: 20MB (Instagram: 8MB/10 photos, TikTok: 20MB/35 photos, Pinterest: 20MB). ` +
    `Max video: 256GB YouTube / 100MB Instagram / 512MB Twitter / 1000MB TikTok Biz. ` +
    `Reels/Shorts: 9:16 aspect ratio, max 90s Instagram, 60s YouTube, 10min TikTok.`;
}

// Caption limits summary for tool description
export function getCaptionLimitsSummary(): string {
  return "Caption limits: Instagram/Facebook/TikTok: 2,200 chars | Twitter: 280 chars | " +
    "LinkedIn: 3,000 chars | Threads: 500 chars | Bluesky: 300 chars | YouTube: 5,000 chars";
}
