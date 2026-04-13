/**
 * Platform Media Compatibility
 *
 * Builds per-platform media overrides and compatibility warnings
 * based on each platform's native constraints.
 *
 * When posting to multiple platforms simultaneously, each platform
 * has different limits (TikTok: video only, Pinterest: 1 image,
 * X: 4 images, etc.). This utility auto-generates
 * platform_configurations with adapted media arrays.
 */

import type { PlatformConfigBuilder, MediaItem } from "@/types/post-for-me-types";

interface PlatformMediaLimits {
  maxImages: number;
  maxVideos: number;
  label: string;
  /** "either" = images OR video, not both (TikTok). Default: "both" */
  mixedMedia?: "both" | "either";
}

/**
 * Per-platform media limits based on native API restrictions.
 * Source: Post For Me API docs + platform docs.
 */
const PLATFORM_MEDIA_LIMITS: Record<string, PlatformMediaLimits> = {
  instagram: { maxImages: 10, maxVideos: 10, label: "Instagram" },
  facebook: { maxImages: 10, maxVideos: 10, label: "Facebook" },
  tiktok: {
    maxImages: 35,
    maxVideos: 1,
    label: "TikTok",
    mixedMedia: "either",
  },
  tiktok_business: {
    maxImages: 35,
    maxVideos: 1,
    label: "TikTok Business",
    mixedMedia: "either",
  },
  youtube: { maxImages: 0, maxVideos: 1, label: "YouTube" },
  x: { maxImages: 4, maxVideos: 1, label: "X (Twitter)" },
  twitter: { maxImages: 4, maxVideos: 1, label: "X (Twitter)" },
  linkedin: { maxImages: 9, maxVideos: 1, label: "LinkedIn" },
  pinterest: { maxImages: 1, maxVideos: 0, label: "Pinterest" },
  bluesky: { maxImages: 4, maxVideos: 1, label: "Bluesky" },
  threads: { maxImages: 10, maxVideos: 1, label: "Threads" },
};

export interface MediaCompatWarning {
  platform: string;
  message: string;
  severity: "error" | "warning" | "info";
}

// ==================== ASPECT RATIO SPECS ====================

interface AspectRatioSpec {
  label: string;
  ratios: string[];
  recommended: string;
}

/**
 * Recommended aspect ratios per platform + placement.
 * Key format: "platform" or "platform:placement"
 */
const PLATFORM_ASPECT_RATIOS: Record<string, AspectRatioSpec> = {
  // Instagram
  instagram: {
    label: "Instagram Feed",
    ratios: ["1:1", "4:5", "1.91:1"],
    recommended: "4:5",
  },
  "instagram:reels": {
    label: "Instagram Reels",
    ratios: ["9:16"],
    recommended: "9:16",
  },
  "instagram:stories": {
    label: "Instagram Stories",
    ratios: ["9:16"],
    recommended: "9:16",
  },
  "instagram:timeline": {
    label: "Instagram Feed",
    ratios: ["1:1", "4:5", "1.91:1"],
    recommended: "4:5",
  },
  // Facebook
  facebook: {
    label: "Facebook Feed",
    ratios: ["1:1", "4:5", "1.91:1", "16:9"],
    recommended: "1:1",
  },
  "facebook:reels": {
    label: "Facebook Reels",
    ratios: ["9:16"],
    recommended: "9:16",
  },
  "facebook:timeline": {
    label: "Facebook Feed",
    ratios: ["1:1", "4:5", "1.91:1", "16:9"],
    recommended: "1:1",
  },
  // TikTok
  tiktok: { label: "TikTok", ratios: ["9:16"], recommended: "9:16" },
  tiktok_business: {
    label: "TikTok Business",
    ratios: ["9:16"],
    recommended: "9:16",
  },
  // YouTube
  youtube: { label: "YouTube", ratios: ["16:9", "9:16"], recommended: "16:9" },
  // X / Twitter
  x: {
    label: "X (Twitter)",
    ratios: ["16:9", "1:1", "3:4"],
    recommended: "16:9",
  },
  twitter: {
    label: "X (Twitter)",
    ratios: ["16:9", "1:1", "3:4"],
    recommended: "16:9",
  },
  // Pinterest
  pinterest: {
    label: "Pinterest",
    ratios: ["2:3", "9:16"],
    recommended: "2:3",
  },
  // LinkedIn
  linkedin: {
    label: "LinkedIn",
    ratios: ["1:1", "1.91:1", "16:9"],
    recommended: "1:1",
  },
  // Bluesky
  bluesky: { label: "Bluesky", ratios: ["16:9", "1:1"], recommended: "16:9" },
  // Threads
  threads: {
    label: "Threads",
    ratios: ["4:5", "1:1", "9:16"],
    recommended: "4:5",
  },
};

/** Parse ratio string "W:H" to decimal */
function ratioToDecimal(ratio: string): number {
  const [w, h] = ratio.split(":").map(Number);
  return w! / h!;
}

/** Get aspect ratio label closest to a given decimal ratio */
function getClosestRatioLabel(decimal: number): string {
  const known: [string, number][] = [
    ["1:1", 1],
    ["4:5", 0.8],
    ["9:16", 0.5625],
    ["16:9", 1.778],
    ["2:3", 0.667],
    ["3:4", 0.75],
    ["1.91:1", 1.91],
  ];
  let closest = known[0]!;
  let minDiff = Infinity;
  for (const [label, val] of known) {
    const diff = Math.abs(decimal - val);
    if (diff < minDiff) {
      minDiff = diff;
      closest = [label, val];
    }
  }
  return closest[0];
}

/** Check if a media's aspect ratio is within tolerance of any accepted ratio */
function isRatioAccepted(
  mediaRatio: number,
  acceptedRatios: string[],
  tolerance = 0.08,
): boolean {
  return acceptedRatios.some(
    (r) => Math.abs(mediaRatio - ratioToDecimal(r)) < tolerance,
  );
}

export interface MediaDimensions {
  width: number;
  height: number;
}

/**
 * Get aspect ratio warnings for media dimensions across platforms.
 * Placement-aware: uses "platform:placement" key when placement is set.
 */
export function getDimensionWarnings(
  mediaDimensions: MediaDimensions[],
  selectedPlatforms: string[],
  placements?: Record<string, string>,
): MediaCompatWarning[] {
  if (mediaDimensions.length === 0) return [];

  const warnings: MediaCompatWarning[] = [];

  for (const platform of selectedPlatforms) {
    const placement = placements?.[platform];
    const specKey = placement ? `${platform}:${placement}` : platform;
    const spec =
      PLATFORM_ASPECT_RATIOS[specKey] || PLATFORM_ASPECT_RATIOS[platform];
    if (!spec) continue;

    for (const dims of mediaDimensions) {
      if (dims.width === 0 || dims.height === 0) continue;
      const mediaRatio = dims.width / dims.height;
      const ratioLabel = getClosestRatioLabel(mediaRatio);

      if (!isRatioAccepted(mediaRatio, spec.ratios)) {
        warnings.push({
          platform,
          message: `${spec.label}: media is ${ratioLabel} (${dims.width}×${dims.height}) — recommended ${spec.recommended}. Platform may auto-crop.`,
          severity: "info",
        });
        break; // One warning per platform is enough
      }
    }
  }

  return warnings;
}

/**
 * Get recommended aspect ratio guidance for selected platforms.
 * Returns a concise string like "9:16 for TikTok/Reels, 4:5 for Instagram Feed"
 */
export function getRecommendedRatios(
  selectedPlatforms: string[],
  placements?: Record<string, string>,
): string[] {
  const seen = new Set<string>();
  const tips: string[] = [];

  for (const platform of selectedPlatforms) {
    const placement = placements?.[platform];
    const specKey = placement ? `${platform}:${placement}` : platform;
    const spec =
      PLATFORM_ASPECT_RATIOS[specKey] || PLATFORM_ASPECT_RATIOS[platform];
    if (!spec) continue;

    const tip = `${spec.recommended} for ${spec.label}`;
    if (!seen.has(tip)) {
      seen.add(tip);
      tips.push(tip);
    }
  }

  return tips;
}

function classifyMedia(mediaFiles: MediaItem[]): {
  images: MediaItem[];
  videos: MediaItem[];
} {
  const images: MediaItem[] = [];
  const videos: MediaItem[] = [];

  for (const m of mediaFiles) {
    // Detect video by URL extension or content_type if available
    const isVideo =
      /\.(mp4|mov|webm|avi|3gp)($|\?)/i.test(m.url) ||
      (m as unknown as Record<string, unknown>).content_type
        ?.toString()
        .startsWith("video/");
    if (isVideo) {
      videos.push(m);
    } else {
      images.push(m);
    }
  }

  return { images, videos };
}

/**
 * Get compatibility warnings for media across platforms.
 */
export function getMediaCompatWarnings(
  mediaFiles: MediaItem[],
  selectedPlatforms: string[],
): MediaCompatWarning[] {
  if (mediaFiles.length === 0) return [];

  const { images, videos } = classifyMedia(mediaFiles);
  const warnings: MediaCompatWarning[] = [];

  for (const platform of selectedPlatforms) {
    const limits = PLATFORM_MEDIA_LIMITS[platform];
    if (!limits) continue;

    // "either" mode: images OR video, not both (TikTok)
    if (
      limits.mixedMedia === "either" &&
      images.length > 0 &&
      videos.length > 0
    ) {
      warnings.push({
        platform,
        message: `${limits.label} supports images or video, not both. Video will be used; ${images.length} image(s) skipped.`,
        severity: "warning",
      });
      continue; // Skip other checks — video takes priority
    }

    // Platform doesn't support images
    if (images.length > 0 && limits.maxImages === 0) {
      if (videos.length === 0) {
        warnings.push({
          platform,
          message: `${limits.label} only supports video — no compatible media to post.`,
          severity: "error",
        });
      } else {
        warnings.push({
          platform,
          message: `${limits.label} only supports video. ${images.length} image(s) will be skipped.`,
          severity: "warning",
        });
      }
    }

    // Platform doesn't support videos
    if (videos.length > 0 && limits.maxVideos === 0) {
      if (images.length === 0) {
        warnings.push({
          platform,
          message: `${limits.label} does not support video — no compatible media to post.`,
          severity: "error",
        });
      } else {
        warnings.push({
          platform,
          message: `${limits.label} does not support video. ${videos.length} video(s) will be skipped.`,
          severity: "warning",
        });
      }
    }

    // Too many images
    if (images.length > limits.maxImages && limits.maxImages > 0) {
      warnings.push({
        platform,
        message: `${limits.label} allows max ${limits.maxImages} image(s). Only the first ${limits.maxImages} will be posted.`,
        severity: "warning",
      });
    }

    // Too many videos
    if (videos.length > limits.maxVideos && limits.maxVideos > 0) {
      warnings.push({
        platform,
        message: `${limits.label} allows max ${limits.maxVideos} video(s). Only the first will be posted.`,
        severity: "warning",
      });
    }
  }

  return warnings;
}

/**
 * Build platform_configurations with per-platform media overrides.
 * Merges into existing configs (preserving TikTok settings, etc.)
 */
export function buildPlatformMediaOverrides(
  mediaFiles: MediaItem[],
  selectedPlatforms: string[],
  existingConfigs: PlatformConfigBuilder = {},
): PlatformConfigBuilder {
  const { images, videos } = classifyMedia(mediaFiles);
  const configs: PlatformConfigBuilder = { ...existingConfigs };

  for (const platform of selectedPlatforms) {
    const limits = PLATFORM_MEDIA_LIMITS[platform];
    if (!limits) continue;

    let platformMedia: MediaItem[];

    if (limits.mixedMedia === "either") {
      // Either images OR video (TikTok) — video takes priority
      platformMedia =
        videos.length > 0
          ? videos.slice(0, limits.maxVideos)
          : images.slice(0, limits.maxImages);
    } else if (limits.maxImages === 0) {
      // Video-only (YouTube)
      platformMedia = videos.slice(0, limits.maxVideos);
    } else if (limits.maxVideos === 0) {
      // Image-only (Pinterest)
      platformMedia = images.slice(0, limits.maxImages);
    } else {
      // Both supported — apply per-type limits
      platformMedia = [
        ...images.slice(0, limits.maxImages),
        ...videos.slice(0, limits.maxVideos),
      ];
    }

    // Only add override if media differs from base
    const needsOverride =
      platformMedia.length !== mediaFiles.length ||
      platformMedia.some((f, i) => f.url !== mediaFiles[i]?.url);

    if (needsOverride && platformMedia.length > 0) {
      const key = platform as keyof PlatformConfigBuilder;
      const existing = configs[key] as Record<string, unknown> | undefined;
      (configs as Record<string, unknown>)[platform] = {
        ...existing,
        media: platformMedia.map((m) => ({
          url: m.url,
          ...(m.skip_processing ? { skip_processing: true } : {}),
          ...(m.tags && (m.tags as unknown[]).length > 0
            ? { tags: m.tags }
            : {}),
          ...(m.thumbnail_url ? { thumbnail_url: m.thumbnail_url } : {}),
        })),
      };
    }
  }

  return configs;
}
