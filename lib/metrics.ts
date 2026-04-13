/**
 * Shared metrics utilities for normalizing engagement data across platforms.
 * Extracted from feed/page.tsx for reuse in analytics and other pages.
 */

/**
 * METRIC VARIANCE NOTICE
 * 
 * When fetching analytics with Post for Me, you may notice discrepancies between
 * the data returned through the API and the numbers displayed directly on a social
 * platform's native app. These variances are normal and occur because platforms
 * process, verify, and serve third-party API data differently than they serve
 * real-time user counters.
 * 
 * We do not process any of the metrics returned from the platforms — rather the
 * metrics are always the current lifetime value returned directly from the
 * platforms' API. Any variance that occurs is due to differences in how the
 * platform treats their API and Native App.
 * 
 * PLATFORM-SPECIFIC NOTES:
 * 
 * Meta (Facebook/Instagram):
 * - Metrics may take up to 48 hours to become fully available/accurate via API
 * - Data is only stored for 2 years
 * - Views breakdown: API shows video_views_autoplayed, video_views_clicked_to_play,
 *   video_views_unique vs native app's aggregated count
 * - Privacy thresholds: Demographic data not returned if below threshold
 * - Views metric is "in development" — calculation method may differ between API and app
 * - API returns organic metrics only — AD interactions not included
 * 
 * YouTube:
 * - Premium views: API distinguishes standard views from redViews (YouTube Premium)
 * - Estimated metrics (estimatedMinutesWatched) may lag behind real-time counter
 * 
 * X (Twitter):
 * - Data buckets: public_metrics (organic+paid), organic_metrics, non_public_metrics (promoted)
 * - Public impression count includes both organic and paid traffic
 * - API allows separate display which may show lower "Organic" number than native app
 * 
 * LinkedIn:
 * - Metrics exclusively available for Company Pages only
 * - Personal profiles not supported for analytics access
 * 
 * Bluesky:
 * - Does not currently expose view counts or impressions via API
 * - Views will always be unavailable
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
} from "@/types/post-for-me-types";

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
  instagram: { likes: true, comments: true, shares: true, views: true },
  facebook: { likes: true, comments: true, shares: true, views: true },
  tiktok: { likes: true, comments: true, shares: true, views: true },
  tiktok_business: { likes: true, comments: true, shares: true, views: true },
  youtube: { likes: true, comments: true, shares: false, views: true },
  x: { likes: true, comments: true, shares: true, views: true },
  linkedin: { likes: true, comments: true, shares: true, views: true },
  bluesky: { likes: true, comments: true, shares: true, views: false },
  threads: { likes: true, comments: true, shares: true, views: true },
  pinterest: { likes: true, comments: true, shares: true, views: true },
};

/**
 * Check if LinkedIn account is a personal profile (no metrics available)
 * LinkedIn only provides metrics for Company Pages, not personal profiles
 */
export function isLinkedInPersonalProfile(
  platform: string,
  metrics: SocialAccountFeedItemMetrics | undefined,
): boolean {
  if (platform.toLowerCase() !== "linkedin") return false;
  // LinkedIn personal profiles have no metrics or empty metrics object
  if (!metrics) return true;
  // Check if all metric values are 0 or undefined (indicates personal profile)
  const liMetrics = metrics as LinkedInMetrics;
  const hasAnyValue = 
    (liMetrics.likeCount && liMetrics.likeCount > 0) ||
    (liMetrics.commentCount && liMetrics.commentCount > 0) ||
    (liMetrics.shareCount && liMetrics.shareCount > 0) ||
    (liMetrics.impressionCount && liMetrics.impressionCount > 0) ||
    (liMetrics.videoView && liMetrics.videoView > 0);
  return !hasAnyValue;
}

/**
 * Get metric availability for a specific account, considering special cases
 * like LinkedIn personal profiles
 */
export function getMetricAvailabilityForAccount(
  platform: string,
  metrics?: SocialAccountFeedItemMetrics,
): MetricAvailability & { note?: string } {
  const base = METRIC_AVAILABILITY[platform.toLowerCase()] || DEFAULT_AVAILABILITY;
  
  // LinkedIn personal profiles have no metrics
  if (isLinkedInPersonalProfile(platform, metrics)) {
    return {
      ...base,
      likes: false,
      comments: false,
      shares: false,
      views: false,
      note: "LinkedIn metrics only available for Company Pages",
    };
  }
  
  return base;
}

const DEFAULT_AVAILABILITY: MetricAvailability = {
  likes: true,
  comments: true,
  shares: true,
  views: true,
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
  bluesky: ["Views/impressions not available via API"],
  tiktok: [],
  tiktok_business: ["Extended metrics: watch time, retention, demographics"],
  threads: [],
  pinterest: ["90-day and lifetime metrics provided separately"],
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

/**
 * Extended LinkedIn metrics for Company Page posts.
 * LinkedIn personal profiles do not have access to these metrics.
 */
export interface ExtendedLinkedInMetrics {
  /** Engagement rate as a decimal (e.g., 0.05 = 5%) */
  engagement: number;
  /** Number of clicks */
  clicks: number;
  /** Number of impressions */
  impressions: number;
  /** Video views (3+ second plays) */
  videoViews: number;
  /** Time video was watched in milliseconds */
  timeWatched: number;
  /** Time watched for 3+ second play-pause cycles (6-month retention) */
  timeWatchedForVideoViews: number;
  /** Unique viewers who made engaged plays */
  uniqueViewers: number;
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

/**
 * Extract LinkedIn extended metrics from a feed item.
 * Returns null for non-LinkedIn items or personal profiles (no metrics).
 * Note: These metrics are only available for LinkedIn Company Pages,
 * not personal profiles.
 */
export function extractLinkedInMetrics(
  item: SocialAccountFeedItem,
): ExtendedLinkedInMetrics | null {
  if (item.platform?.toLowerCase() !== "linkedin") return null;
  if (!item.metrics) return null;
  
  // Verify this is LinkedIn metrics format
  if (!("likeCount" in item.metrics && "impressionCount" in item.metrics)) {
    return null;
  }
  
  const m = item.metrics as LinkedInMetrics;
  return {
    engagement: m.engagement || 0,
    clicks: m.clickCount || 0,
    impressions: m.impressionCount || 0,
    videoViews: m.videoView || 0,
    timeWatched: m.timeWatched || 0,
    timeWatchedForVideoViews: m.timeWatchedForVideoViews || 0,
    uniqueViewers: m.viewer || 0,
  };
}

/** Format seconds to human-readable duration: 65 → "1m 5s" */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}
