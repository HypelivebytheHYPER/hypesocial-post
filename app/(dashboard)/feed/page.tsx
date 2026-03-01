"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import {
  MoreHorizontal,
  Heart,
  MessageCircle,
  Bookmark,
  Send,
  Check,
  ChevronDown,
  Eye,
  Loader2,
  RefreshCw,
  Info,
  AlertTriangle,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAccounts, useAccountFeed, pfmKeys } from "@/lib/hooks/usePostForMe";
import { platformIconsMap } from "@/lib/social-platforms";
import type {
  SocialAccountFeedItem,
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

// Generic metrics fallback interface
interface GenericMetrics {
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
  [key: string]: unknown;
}

// Extract metrics from different platform formats - defined at module level for reuse
function extractMetrics(metrics: SocialAccountFeedItemMetrics | undefined) {
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

// Format number helper
function formatNumber(num?: number) {
  if (!num) return "0";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
}

// Format time helper
function formatTime(dateString?: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

// Feed Item Component
interface FeedItemProps {
  item: SocialAccountFeedItem;
  accountPlatform: string;
}

function FeedItem({ item, accountPlatform }: FeedItemProps) {
  const PlatformIcon = platformIconsMap[accountPlatform.toLowerCase()];
  const metrics = extractMetrics(item.metrics);

  return (
    <article className="card-premium overflow-hidden">
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm">
              {item.platform?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-slate-800 font-semibold text-sm">
                {accountPlatform}
              </h3>
              <span className="text-slate-400 text-xs">
                {formatTime(item.posted_at)}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 flex items-center gap-1">
                {PlatformIcon && <PlatformIcon className="w-3 h-3" />}
                {accountPlatform}
              </span>
            </div>
          </div>
        </div>
        <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="text-slate-700 text-sm whitespace-pre-wrap">
          {item.caption}
        </p>
      </div>

      {/* Post Media */}
      {(() => {
        // Debug: Log media structure
        if (item.media && item.media.length > 0) {
          console.log("[FeedItem] Media structure:", {
            platform: item.platform,
            mediaType: typeof item.media,
            isArray: Array.isArray(item.media),
            firstItem: item.media[0],
            firstItemType: typeof item.media[0],
            fullMedia: item.media,
          });
        }

        // Try to extract media URL from various possible structures
        let mediaUrl: string | null = null;
        let mediaType: "image" | "video" | "unknown" = "unknown";

        if (item.media && Array.isArray(item.media) && item.media.length > 0) {
          // Structure 1: [[{ url: string, type: string }]] - nested array with objects
          if (Array.isArray(item.media[0]) && item.media[0].length > 0) {
            const firstMedia = item.media[0][0];
            if (
              typeof firstMedia === "object" &&
              firstMedia !== null &&
              "url" in firstMedia
            ) {
              mediaUrl = (firstMedia as { url: string }).url;
              mediaType = (firstMedia as { type?: string }).type?.startsWith(
                "video",
              )
                ? "video"
                : "image";
            }
          }
          // Structure 2: [{ url: string }] - flat array with objects
          else if (
            typeof item.media[0] === "object" &&
            item.media[0] !== null &&
            "url" in item.media[0]
          ) {
            mediaUrl = (item.media[0] as { url: string }).url;
            mediaType = (item.media[0] as { type?: string }).type?.startsWith(
              "video",
            )
              ? "video"
              : "image";
          }
          // Structure 3: ["url1", "url2"] - array of strings
          else if (typeof item.media[0] === "string") {
            mediaUrl = item.media[0] as string;
            mediaType = "image";
          }
        }

        if (!mediaUrl) return null;

        return (
          <div className="px-4">
            <div className="rounded-2xl overflow-hidden">
              {mediaType === "video" ? (
                <video
                  src={mediaUrl}
                  controls
                  className="w-full h-auto max-h-96"
                  poster={`${mediaUrl}#t=0.1`}
                />
              ) : (
                <img
                  src={mediaUrl}
                  alt="Post content"
                  className="w-full h-auto object-cover max-h-96"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
            </div>
          </div>
        );
      })()}

      {/* Post Stats */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1.5 text-slate-500 hover:text-red-500 transition-colors">
            <Heart className="w-4 h-4" />
            <span className="text-sm font-medium">
              {formatNumber(metrics.likes)}
            </span>
          </button>
          <button className="flex items-center gap-1.5 text-slate-500 hover:text-blue-500 transition-colors">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              {formatNumber(metrics.comments)}
            </span>
          </button>
          <button className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 transition-colors">
            <Bookmark className="w-4 h-4" />
            <span className="text-sm font-medium">
              {formatNumber(metrics.shares)}
            </span>
          </button>
        </div>
        <a
          href={item.platform_url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-slate-400 hover:text-slate-600"
        >
          <Send className="w-4 h-4" />
        </a>
      </div>
    </article>
  );
}

export default function FeedPage() {
  const queryClient = useQueryClient();
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [cursors, setCursors] = useState<string[]>([]);

  // Get accounts
  const { data: accountsData, isLoading: accountsLoading } = useAccounts();
  const accounts = accountsData?.data || [];
  const connectedAccounts = accounts.filter((a) => a.status === "connected");

  // Get feed for selected account
  const currentCursor =
    cursors.length > 0 ? cursors[cursors.length - 1] : undefined;
  const {
    data: feedData,
    isLoading: feedLoading,
    error: feedError,
  } = useAccountFeed(selectedAccountId, {
    limit: 20,
    cursor: currentCursor,
    expand: "metrics",
  });

  // Set default account when accounts load
  useState(() => {
    if (connectedAccounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(connectedAccounts[0].id);
    }
  });

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (feedData?.meta?.cursor) {
      setCursors((prev) => [...prev, feedData.meta.cursor]);
    }
  }, [feedData?.meta?.cursor]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setCursors([]);
    queryClient.invalidateQueries({ queryKey: pfmKeys.feeds() });
  }, [queryClient]);

  // Get all feed items from loaded pages
  const allFeedItems = feedData?.data || [];
  const hasMore = feedData?.meta?.has_more ?? false;

  // Get selected account details
  const selectedAccount = connectedAccounts.find(
    (a) => a.id === selectedAccountId,
  );

  return (
    <div className="grid lg:grid-cols-12 gap-6">
      {/* Left Sidebar - Profile & Account Selector */}
      <aside className="hidden lg:block lg:col-span-3 space-y-4">
        {/* Account Selector */}
        <div className="card-premium p-4">
          <h3 className="text-slate-700 font-semibold text-sm mb-3">
            Select Account
          </h3>
          <div className="space-y-2">
            {accountsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : connectedAccounts.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-slate-400 mb-2">
                  No connected accounts
                </p>
                <Link href="/accounts/connect">
                  <Button variant="soft" size="sm">
                    Connect Account
                  </Button>
                </Link>
              </div>
            ) : (
              connectedAccounts.map((account) => {
                const PlatformIcon =
                  platformIconsMap[account.platform.toLowerCase()];
                const isSelected = selectedAccountId === account.id;

                return (
                  <button
                    key={account.id}
                    onClick={() => {
                      setSelectedAccountId(account.id);
                      setCursors([]);
                    }}
                    className={`w-full flex items-center gap-3 p-2 rounded-xl transition-colors text-left ${
                      isSelected
                        ? "bg-slate-100 border border-slate-200"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-white">
                      {PlatformIcon ? (
                        <PlatformIcon className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-semibold">
                          {account.platform[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-700 text-sm font-medium truncate">
                        {account.username || account.platform}
                      </p>
                      <p className="text-slate-400 text-xs capitalize">
                        {account.platform}
                      </p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-slate-600" />}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Profile Card */}
        <div className="card-premium overflow-hidden">
          <div className="h-24 bg-gradient-to-br from-amber-200 via-rose-200 to-purple-200 relative">
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
              <Avatar className="w-16 h-16 border-4 border-white shadow-lg">
                <AvatarFallback className="bg-slate-800 text-white font-semibold">
                  HS
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          <div className="pt-10 pb-4 px-4 text-center">
            <h2 className="text-slate-800 font-semibold">HypePostSocial</h2>
            <p className="text-slate-400 text-xs">
              @{connectedAccounts[0]?.username || "user"}
            </p>
            <div className="flex justify-center gap-6 mt-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-slate-800">
                  {connectedAccounts.length}
                </div>
                <div className="text-xs text-slate-400">Accounts</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-slate-800">
                  {allFeedItems.length}
                </div>
                <div className="text-xs text-slate-400">Posts</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Feed */}
      <main className="lg:col-span-6 space-y-4">
        {/* Feed Controls */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={feedLoading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-1.5 ${feedLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
          <button className="flex items-center gap-1 text-sm text-slate-600 font-medium">
            Recent
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* Instagram Feed Warning */}
        {selectedAccount?.platform === "instagram" && (
          <div className="card-premium p-4 bg-gradient-to-br from-amber-50 to-white border-amber-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h3 className="text-slate-800 font-semibold text-sm mb-1">
                  Instagram Feed Limitations
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed mb-2">
                  Instagram&apos;s API has limited feed access compared to other
                  platforms:
                </p>
                <ul className="text-[10px] text-slate-400 space-y-1">
                  <li>
                    • Only your own posts are accessible (not full feed streams)
                  </li>
                  <li>
                    • Personal accounts don&apos;t support feed API features
                  </li>
                  <li>
                    • Professional/Creator account required for feed access
                  </li>
                  <li>• Metrics delayed up to 48 hours</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Feed Items */}
        <div className="space-y-4">
          {feedLoading && allFeedItems.length === 0 ? (
            <div className="card-premium p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400">Loading feed...</p>
            </div>
          ) : feedError ? (
            <div className="card-premium p-12 text-center border-red-200">
              <p className="text-red-500 mb-2">Failed to load feed</p>
              <Button variant="soft" size="sm" onClick={handleRefresh}>
                Try Again
              </Button>
            </div>
          ) : allFeedItems.length === 0 ? (
            <div className="card-premium p-12 text-center">
              <p className="text-slate-400 mb-2">No posts found</p>
              <p className="text-xs text-slate-400">
                Select an account to view their feed
              </p>
            </div>
          ) : (
            <>
              {allFeedItems.map((item, index) => (
                <FeedItem
                  key={`${item.platform_post_id}-${index}`}
                  item={item}
                  accountPlatform={
                    connectedAccounts.find((a) => a.id === selectedAccountId)
                      ?.platform || "Unknown"
                  }
                />
              ))}

              {/* Load More */}
              {hasMore && (
                <div className="flex justify-center py-4">
                  <Button
                    variant="soft"
                    size="lg"
                    onClick={handleLoadMore}
                    disabled={feedLoading}
                  >
                    {feedLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Load More
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Right Sidebar - Activity */}
      <aside className="hidden lg:block lg:col-span-3 space-y-4">
        {/* Stats Overview */}
        <div className="card-premium p-4">
          <h3 className="text-slate-800 font-semibold mb-4">Feed Stats</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Total Posts</span>
              <span className="text-sm font-semibold text-slate-800">
                {allFeedItems.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Total Likes</span>
              <span className="text-sm font-semibold text-slate-800">
                {allFeedItems
                  .reduce(
                    (sum, item) => sum + extractMetrics(item.metrics).likes,
                    0,
                  )
                  .toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Total Comments</span>
              <span className="text-sm font-semibold text-slate-800">
                {allFeedItems
                  .reduce(
                    (sum, item) => sum + extractMetrics(item.metrics).comments,
                    0,
                  )
                  .toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Analytics Info Card */}
        <div className="card-premium p-4 bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Info className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-slate-800 font-semibold text-sm mb-1">
                About Analytics
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-2">
                Metrics are lifetime values fetched directly from each
                platform&apos;s API.
              </p>
              <ul className="text-[10px] text-slate-400 space-y-1">
                <li>• Instagram: Up to 48h delay for accurate metrics</li>
                <li>• LinkedIn: Only Company Pages show metrics</li>
                <li>• Bluesky: No view counts available via API</li>
                <li>• Metrics exclude paid/AD interactions</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="card-premium p-4 bg-gradient-to-br from-slate-50 to-white">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Eye className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <h3 className="text-slate-800 font-semibold text-sm mb-1">
                Cursor Pagination
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Feeds use cursor-based pagination. Click &quot;Load More&quot;
                to fetch additional posts.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
