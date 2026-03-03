/**
 * Shared metrics utilities for normalizing engagement data across platforms.
 * Extracted from feed/page.tsx for reuse in analytics and other pages.
 */

import type {
  SocialAccountFeedItemMetrics,
  SocialAccountFeedItem,
  XMetrics,
  TikTokMetrics,
  TikTokBusinessMetrics,
  InstagramMetrics,
  YouTubeMetrics,
  FacebookMetrics,
  LinkedInMetrics,
  BlueskyMetrics,
  PinterestMetrics,
  ThreadsMetrics,
  VideoViewRetentionPoint,
  ImpressionSource,
  AudienceGender,
  AudienceCountry,
} from "@/types/post-for-me";

export interface NormalizedMetrics {
  likes: number;
  comments: number;
  shares: number;
  views: number;
}

export interface MetricAvailability {
  likes: boolean;
  comments: boolean;
  shares: boolean;
  views: boolean;
}

const METRIC_AVAILABILITY: Record<string, MetricAvailability> = {
  instagram:       { likes: true,  comments: true,  shares: true,  views: true },
  facebook:        { likes: true,  comments: true,  shares: true,  views: true },
  tiktok:          { likes: true,  comments: true,  shares: true,  views: true },
  tiktok_business: { likes: true,  comments: true,  shares: true,  views: true },
  youtube:         { likes: true,  comments: true,  shares: false, views: true },
  x:               { likes: true,  comments: true,  shares: true,  views: true },
  linkedin:        { likes: true,  comments: true,  shares: true,  views: true },
  bluesky:         { likes: true,  comments: true,  shares: true,  views: false },
  threads:         { likes: true,  comments: true,  shares: true,  views: true },
  pinterest:       { likes: true,  comments: true,  shares: true,  views: true },
};

const DEFAULT_AVAILABILITY: MetricAvailability = {
  likes: true, comments: true, shares: true, views: true,
};

export function getMetricAvailability(platform: string): MetricAvailability {
  return METRIC_AVAILABILITY[platform.toLowerCase()] || DEFAULT_AVAILABILITY;
}

export const PLATFORM_NOTES: Record<string, string[]> = {
  instagram: [
    "Metrics may take up to 48 hours to become accurate",
    "Only organic interactions — ad metrics excluded",
    "Views metric is in-development and may change",
    "Data retained for 2 years only",
  ],
  facebook: [
    "Views split into autoplayed, clicked-to-play, and unique segments",
    "Demographics hidden below privacy thresholds",
    "Only organic metrics — ad interactions excluded",
    "Data retained for 2 years only",
  ],
  youtube: [
    "Shares not available via API",
    "Views include estimated/verified counts that may lag real-time",
    "Premium (Red) views tracked separately",
  ],
  x: [
    "Impressions include both organic and paid traffic",
    "Organic metrics shown separately from promoted",
  ],
  linkedin: [
    "Metrics only available for Company Pages",
    "Personal profile analytics not supported",
  ],
  bluesky: [
    "Views/impressions not available via API",
  ],
  tiktok: [],
  tiktok_business: [
    "Extended metrics: watch time, retention, demographics",
  ],
  threads: [],
  pinterest: [
    "90-day and lifetime metrics provided separately",
  ],
};

export interface MetricsWithAvailability {
  metrics: NormalizedMetrics;
  availability: MetricAvailability;
  platform: string;
}

export function extractMetricsWithAvailability(
  rawMetrics: SocialAccountFeedItemMetrics | undefined,
  platform: string,
): MetricsWithAvailability {
  return {
    metrics: extractMetrics(rawMetrics),
    availability: getMetricAvailability(platform),
    platform: platform.toLowerCase(),
  };
}

export interface ExtendedTikTokMetrics {
  totalTimeWatched: number;
  averageTimeWatched: number;
  fullVideoWatchedRate: number;
  newFollowers: number;
  profileViews: number;
  websiteClicks: number;
  reach: number;
  videoViewRetention: VideoViewRetentionPoint[];
  impressionSources: ImpressionSource[];
  audienceGenders: AudienceGender[];
  audienceCountries: AudienceCountry[];
}

// Generic metrics fallback interface
interface GenericMetrics {
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
  [key: string]: unknown;
}

/**
 * Extract and normalize metrics from different platform formats into a unified shape.
 * Handles 10 platform formats: X, TikTok, Facebook, YouTube, Instagram, LinkedIn,
 * Pinterest, Bluesky, Threads, and a generic fallback.
 */
export function extractMetrics(
  metrics: SocialAccountFeedItemMetrics | undefined,
): NormalizedMetrics {
  if (!metrics) return { likes: 0, comments: 0, shares: 0, views: 0 };

  // X (Twitter) format - check for public_metrics
  if ("public_metrics" in metrics) {
    const xMetrics = metrics as XMetrics;
    return {
      likes: xMetrics.public_metrics?.like_count || 0,
      comments: xMetrics.public_metrics?.reply_count || 0,
      shares: xMetrics.public_metrics?.retweet_count || 0,
      views: xMetrics.public_metrics?.impression_count || 0,
    };
  }

  // TikTok Business format - detect via video_view_retention (unique to TikTok Business)
  if ("video_view_retention" in metrics) {
    const tbMetrics = metrics as TikTokBusinessMetrics;
    return {
      likes: tbMetrics.likes || 0,
      comments: tbMetrics.comments || 0,
      shares: tbMetrics.shares || 0,
      views: tbMetrics.video_views || 0,
    };
  }

  // TikTok format - check for like_count
  if ("like_count" in metrics) {
    const tiktokMetrics = metrics as TikTokMetrics;
    return {
      likes: tiktokMetrics.like_count || 0,
      comments: tiktokMetrics.comment_count || 0,
      shares: tiktokMetrics.share_count || 0,
      views: tiktokMetrics.view_count || 0,
    };
  }

  // Facebook format
  if ("reactions_like" in metrics || "reactions_total" in metrics) {
    const fbMetrics = metrics as FacebookMetrics;
    return {
      likes: fbMetrics.reactions_like || fbMetrics.reactions_total || 0,
      comments: fbMetrics.comments || 0,
      shares: fbMetrics.shares || 0,
      views: fbMetrics.video_views || fbMetrics.media_views || 0,
    };
  }

  // YouTube format
  if ("dislikes" in metrics) {
    const ytMetrics = metrics as YouTubeMetrics;
    return {
      likes: ytMetrics.likes || 0,
      comments: ytMetrics.comments || 0,
      shares: 0, // YouTube doesn't provide shares in API
      views: ytMetrics.views || 0,
    };
  }

  // Instagram format
  if ("saved" in metrics) {
    const igMetrics = metrics as InstagramMetrics;
    return {
      likes: igMetrics.likes || 0,
      comments: igMetrics.comments || 0,
      shares: igMetrics.shares || 0,
      views: igMetrics.views || 0,
    };
  }

  // LinkedIn format (verified via MCP - has likeCount, impressionCount, etc.)
  if ("likeCount" in metrics && "impressionCount" in metrics) {
    const liMetrics = metrics as LinkedInMetrics;
    return {
      likes: liMetrics.likeCount || 0,
      comments: liMetrics.commentCount || 0,
      shares: liMetrics.shareCount || 0,
      views: liMetrics.videoView || 0,
    };
  }

  // Pinterest format
  if ("90d" in metrics || "lifetime_metrics" in metrics) {
    const pinMetrics = metrics as PinterestMetrics;
    const lifetime = pinMetrics.lifetime_metrics;
    return {
      likes: lifetime?.reaction || 0,
      comments: lifetime?.comment || 0,
      shares: lifetime?.save || 0,
      views: lifetime?.impression || 0,
    };
  }

  // Bluesky format (has replyCount/likeCount/repostCount/quoteCount)
  if ("repostCount" in metrics && "replyCount" in metrics) {
    const blueskyMetrics = metrics as BlueskyMetrics;
    return {
      likes: blueskyMetrics.likeCount || 0,
      comments: blueskyMetrics.replyCount || 0,
      shares: blueskyMetrics.repostCount || 0,
      views: 0,
    };
  }

  // Threads format (has likes/replies/shares/views/quotes/reposts)
  if ("reposts" in metrics && "likes" in metrics) {
    const threadsMetrics = metrics as ThreadsMetrics;
    return {
      likes: threadsMetrics.likes || 0,
      comments: threadsMetrics.replies || 0,
      shares: threadsMetrics.reposts || 0,
      views: threadsMetrics.views || 0,
    };
  }

  // Generic fallback - direct property access
  const genericMetrics = metrics as unknown as GenericMetrics;
  return {
    likes: genericMetrics.likes || 0,
    comments: genericMetrics.comments || 0,
    shares: genericMetrics.shares || 0,
    views: genericMetrics.views || 0,
  };
}

/** Format large numbers compactly: 1000 → "1k", 1000000 → "1M" */
export function formatNumber(num?: number): string {
  if (!num) return "0";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
}

/** Sum likes + comments + shares for a single post's normalized metrics */
export function totalEngagement(m: NormalizedMetrics): number {
  return m.likes + m.comments + m.shares;
}

/** Extract TikTok Business extended metrics from a feed item. Returns null for non-TikTok Business items. */
export function extractExtendedMetrics(
  item: SocialAccountFeedItem,
): ExtendedTikTokMetrics | null {
  if (!item.metrics || !("video_view_retention" in item.metrics)) return null;
  const m = item.metrics as TikTokBusinessMetrics;
  return {
    totalTimeWatched: m.total_time_watched || 0,
    averageTimeWatched: m.average_time_watched || 0,
    fullVideoWatchedRate: m.full_video_watched_rate || 0,
    newFollowers: m.new_followers || 0,
    profileViews: m.profile_views || 0,
    websiteClicks: m.website_clicks || 0,
    reach: m.reach || 0,
    videoViewRetention: m.video_view_retention || [],
    impressionSources: m.impression_sources || [],
    audienceGenders: m.audience_genders || [],
    audienceCountries: m.audience_countries || [],
  };
}

/** Format seconds to human-readable duration: 65 → "1m 5s" */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}
