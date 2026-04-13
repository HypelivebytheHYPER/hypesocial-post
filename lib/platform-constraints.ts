/**
 * Platform Media Constraints
 * @module lib/platform-constraints
 * 
 * Media validation rules for all social platforms.
 * Synced from MCP worker (workers/mcp-post-for-me/src/schemas/media.ts)
 * 
 * Use this to validate media BEFORE upload to warn users about platform limits.
 */

export const PLATFORM_MEDIA_CONSTRAINTS = {
  // Meta Platforms
  INSTAGRAM: {
    feed: {
      images: { maxSizeMB: 8, formats: ["jpg", "png", "webp"], minWidth: 320, maxWidth: 1440, aspectRatio: "1:1 to 4:5", maxImages: 10 },
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
      images: { maxSizeMB: 10, formats: ["jpg", "png", "webp", "gif"], maxWidth: 2048, maxImages: 10 },
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

// Platform display names
export const PLATFORM_NAMES: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  tiktok_business: "TikTok Business",
  twitter: "X (Twitter)",
  x: "X (Twitter)",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  pinterest: "Pinterest",
  bluesky: "Bluesky",
  threads: "Threads",
};

/** Video constraints for a platform */
export interface VideoConstraints {
  maxSizeMB: number;
  maxDurationSec: number;
  formats: readonly string[];
  aspectRatio?: string;
  minResolution?: string;
  maxResolution?: string;
}

/** Get video constraints for a platform */
export function getVideoConstraints(platform: string): VideoConstraints | null {
  const p = platform.toLowerCase();
  
  if (p.includes("instagram")) {
    return PLATFORM_MEDIA_CONSTRAINTS.INSTAGRAM.feed.videos;
  }
  if (p.includes("facebook")) {
    return PLATFORM_MEDIA_CONSTRAINTS.FACEBOOK.feed.videos;
  }
  if (p.includes("tiktok_business")) {
    return PLATFORM_MEDIA_CONSTRAINTS.TIKTOK_BUSINESS.videos;
  }
  if (p.includes("tiktok")) {
    return PLATFORM_MEDIA_CONSTRAINTS.TIKTOK_PERSONAL.videos;
  }
  if (p.includes("twitter") || p.includes("x")) {
    return PLATFORM_MEDIA_CONSTRAINTS.TWITTER.videos;
  }
  if (p.includes("linkedin")) {
    return PLATFORM_MEDIA_CONSTRAINTS.LINKEDIN.videos;
  }
  if (p.includes("youtube")) {
    return PLATFORM_MEDIA_CONSTRAINTS.YOUTUBE.videos;
  }
  if (p.includes("pinterest")) {
    return PLATFORM_MEDIA_CONSTRAINTS.PINTEREST.videos;
  }
  if (p.includes("bluesky")) {
    return PLATFORM_MEDIA_CONSTRAINTS.BLUESKY.videos;
  }
  if (p.includes("threads")) {
    return PLATFORM_MEDIA_CONSTRAINTS.THREADS.videos;
  }
  
  return null;
}

/** Validation result */
export interface MediaValidationResult {
  valid: boolean;
  platform: string;
  violations: string[];
  warnings: string[];
  constraints: VideoConstraints | null;
}

/** Validate a video file against platform constraints */
export function validateVideoForPlatform(
  file: File,
  platform: string,
  durationSec?: number
): MediaValidationResult {
  const constraints = getVideoConstraints(platform);
  const violations: string[] = [];
  const warnings: string[] = [];
  
  if (!constraints) {
    return { valid: true, platform, violations: [], warnings: [], constraints: null };
  }
  
  const fileSizeMB = file.size / (1024 * 1024);
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
  
  // Size check
  if (fileSizeMB > constraints.maxSizeMB) {
    violations.push(`File size ${fileSizeMB.toFixed(1)}MB exceeds ${constraints.maxSizeMB}MB limit`);
  }
  
  // Duration check (if provided)
  if (durationSec && durationSec > constraints.maxDurationSec) {
    const maxMin = Math.floor(constraints.maxDurationSec / 60);
    const maxSec = constraints.maxDurationSec % 60;
    const durationStr = maxMin > 0 ? `${maxMin}m ${maxSec}s` : `${maxSec}s`;
    violations.push(`Duration ${Math.floor(durationSec / 60)}m ${durationSec % 60}s exceeds ${durationStr} limit`);
  }
  
  // Format check
  if (!constraints.formats.includes(fileExt)) {
    warnings.push(`Format "${fileExt}" may not be supported. Recommended: ${constraints.formats.join(", ")}`);
  }
  
  return {
    valid: violations.length === 0,
    platform,
    violations,
    warnings,
    constraints,
  };
}

/** Get the most restrictive video constraints for multiple platforms */
export function getMostRestrictiveVideoConstraints(platforms: string[]): {
  maxSizeMB: number;
  maxDurationSec: number;
  formats: string[];
  platform: string;
} | null {
  if (platforms.length === 0) return null;
  
  const allConstraints = platforms
    .map((p) => ({ platform: p, constraints: getVideoConstraints(p) }))
    .filter((c): c is { platform: string; constraints: VideoConstraints } => c.constraints !== null);
  
  if (allConstraints.length === 0) return null;
  
  // Find most restrictive (smallest limits)
  const mostRestrictive = allConstraints.reduce((min, current) => ({
    platform: current.constraints.maxSizeMB < min.constraints.maxSizeMB ? current.platform : min.platform,
    constraints: {
      maxSizeMB: Math.min(min.constraints.maxSizeMB, current.constraints.maxSizeMB),
      maxDurationSec: Math.min(min.constraints.maxDurationSec, current.constraints.maxDurationSec),
      formats: min.constraints.formats.filter((f) => current.constraints.formats.includes(f)),
    },
  }));
  
  return {
    maxSizeMB: mostRestrictive.constraints.maxSizeMB,
    maxDurationSec: mostRestrictive.constraints.maxDurationSec,
    formats: mostRestrictive.constraints.formats.length > 0 ? [...mostRestrictive.constraints.formats] : ["mp4"],
    platform: mostRestrictive.platform,
  };
}

/** Generate a summary of video constraints for selected platforms */
export function getVideoConstraintsSummary(platforms: string[]): string {
  if (platforms.length === 0) return "";
  
  const restrictive = getMostRestrictiveVideoConstraints(platforms);
  if (!restrictive) return "";
  
  const platformNames = platforms.map((p) => PLATFORM_NAMES[p.toLowerCase()] || p);
  const maxMin = Math.floor(restrictive.maxDurationSec / 60);
  const maxSec = restrictive.maxDurationSec % 60;
  const durationStr = maxMin > 0 ? `${maxMin}m ${maxSec}s` : `${maxSec}s`;
  
  return `Video limits for ${platformNames.join(", ")}: Max ${restrictive.maxSizeMB}MB, ${durationStr}`;
}
