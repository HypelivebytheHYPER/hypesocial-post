/**
 * Shared metrics utilities for normalizing engagement data across platforms.
 * Extracted from feed/page.tsx for reuse in analytics and other pages.
 */

import type {
  SocialAccountFeedItemMetrics,
  XMetrics,
  TikTokMetrics,
  InstagramMetrics,
  YouTubeMetrics,
  FacebookMetrics,
  LinkedInMetrics,
  BlueskyMetrics,
  PinterestMetrics,
  ThreadsMetrics,
} from "@/types/post-for-me";

export interface NormalizedMetrics {
  likes: number;
  comments: number;
  shares: number;
  views: number;
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
