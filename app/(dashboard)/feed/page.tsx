"use client";

import Link from "next/link";
import { useState, useCallback, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Send,
  Eye,
  Loader2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAccounts, useAccountFeed, pfmKeys } from "@/lib/hooks/usePostForMe";
import { extractMetrics, formatNumber, getMetricAvailability } from "@/lib/metrics";
import { platformIconsMap } from "@/lib/social-platforms";
import { cn, proxyMediaUrl } from "@/lib/utils";
import type { SocialAccountFeedItem } from "@/types/post-for-me";

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

// Simplified media extraction — API only returns SocialPostMediaDto[] (objects with url)
function getFirstMedia(media: SocialAccountFeedItem["media"]) {
  if (!media?.length) return null;
  const first = media[0];
  const url = first?.url;
  if (!url) return null;
  const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(url);
  return { url, type: isVideo ? ("video" as const) : ("image" as const) };
}

// Feed Item Component
interface FeedItemProps {
  item: SocialAccountFeedItem;
  accountPlatform: string;
  accountUsername: string;
}

function FeedItem({ item, accountPlatform, accountUsername }: FeedItemProps) {
  const PlatformIcon = platformIconsMap[accountPlatform.toLowerCase()];
  const metrics = extractMetrics(item.metrics);
  const available = getMetricAvailability(accountPlatform);
  const media = getFirstMedia(item.media);

  return (
    <article className="card-premium overflow-hidden">
      {/* Post Header */}
      <div className="p-4 flex items-center gap-3">
        <Avatar className="w-10 h-10">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm">
            {(accountUsername || accountPlatform)[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-slate-800 font-semibold text-sm">
              {accountUsername || accountPlatform}
            </h3>
            <span className="text-slate-400 text-xs">
              {formatTime(item.posted_at)}
            </span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 inline-flex items-center gap-1 mt-0.5">
            {PlatformIcon && <PlatformIcon className="w-3 h-3" />}
            {accountPlatform}
          </span>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="text-slate-700 text-sm whitespace-pre-wrap">
          {item.caption}
        </p>
      </div>

      {/* Post Media */}
      {media && (
        <div className="px-4">
          <div className="rounded-2xl overflow-hidden">
            {media.type === "video" ? (
              <video
                src={proxyMediaUrl(media.url)}
                controls
                className="w-full h-auto max-h-96"
              />
            ) : (
              <img
                src={proxyMediaUrl(media.url)}
                alt=""
                className="w-full h-auto object-cover max-h-96"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Post Stats */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className={`flex items-center gap-1.5 ${available.likes ? "text-slate-500" : "text-slate-300"}`}>
            <Heart className="w-4 h-4" />
            <span className="text-sm font-medium">
              {available.likes ? formatNumber(metrics.likes) : "N/A"}
            </span>
          </span>
          <span className={`flex items-center gap-1.5 ${available.comments ? "text-slate-500" : "text-slate-300"}`}>
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              {available.comments ? formatNumber(metrics.comments) : "N/A"}
            </span>
          </span>
          <span className={`flex items-center gap-1.5 ${available.shares ? "text-slate-500" : "text-slate-300"}`}>
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-medium">
              {available.shares ? formatNumber(metrics.shares) : "N/A"}
            </span>
          </span>
          <span className={`flex items-center gap-1.5 ${available.views ? "text-slate-500" : "text-slate-300"}`}>
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">
              {available.views ? formatNumber(metrics.views) : "N/A"}
            </span>
          </span>
        </div>
        {item.platform_url && (
          <a
            href={item.platform_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-slate-400 hover:text-slate-600"
          >
            <Send className="w-4 h-4" />
          </a>
        )}
      </div>
    </article>
  );
}

export default function FeedPage() {
  const queryClient = useQueryClient();
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [cursors, setCursors] = useState<string[]>([]);
  const [accumulatedItems, setAccumulatedItems] = useState<SocialAccountFeedItem[]>([]);

  // Get accounts
  const { data: accountsData, isLoading: accountsLoading } = useAccounts();
  const accounts = accountsData?.data || [];
  const connectedAccounts = accounts.filter((a) => a.status === "connected");

  // Derived effective account — no useEffect needed, no flash of empty state
  const effectiveAccountId = selectedAccountId || connectedAccounts[0]?.id || "";

  // Get feed for selected account
  const currentCursor =
    cursors.length > 0 ? cursors[cursors.length - 1] : undefined;
  const {
    data: feedData,
    isLoading: feedLoading,
    error: feedError,
  } = useAccountFeed(effectiveAccountId, {
    limit: 20,
    cursor: currentCursor,
    expand: "metrics",
  });

  // Accumulate items across pages
  useEffect(() => {
    if (feedData?.data) {
      if (cursors.length === 0) {
        // First page or refresh — replace
        setAccumulatedItems(feedData.data);
      } else {
        // Subsequent pages — append (deduplicate by platform_post_id)
        setAccumulatedItems((prev) => {
          const ids = new Set(prev.map((i) => i.platform_post_id));
          return [...prev, ...feedData.data.filter((i) => !ids.has(i.platform_post_id))];
        });
      }
    }
  }, [feedData?.data, cursors.length]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (feedData?.meta?.cursor) {
      setCursors((prev) => [...prev, feedData.meta.cursor]);
    }
  }, [feedData?.meta?.cursor]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setCursors([]);
    setAccumulatedItems([]);
    queryClient.invalidateQueries({ queryKey: pfmKeys.feeds() });
  }, [queryClient]);

  // Get all feed items (accumulated across pages)
  const allFeedItems = accumulatedItems;
  const hasMore = feedData?.meta?.has_more ?? false;

  // Get selected account details
  const selectedAccount = connectedAccounts.find(
    (a) => a.id === effectiveAccountId,
  );

  // Compute aggregate stats
  const totalLikes = allFeedItems.reduce(
    (sum, item) => sum + extractMetrics(item.metrics).likes,
    0,
  );
  const totalComments = allFeedItems.reduce(
    (sum, item) => sum + extractMetrics(item.metrics).comments,
    0,
  );

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Account selector strip — visible on all screen sizes */}
      {accountsLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      ) : connectedAccounts.length === 0 ? (
        <div className="card-premium p-4 text-center">
          <p className="text-sm text-slate-400 mb-2">No connected accounts</p>
          <Link href="/accounts/connect">
            <Button variant="soft" size="sm">
              Connect Account
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {connectedAccounts.map((account) => {
            const PlatformIcon =
              platformIconsMap[account.platform.toLowerCase()];
            const isSelected = effectiveAccountId === account.id;
            return (
              <button
                key={account.id}
                onClick={() => {
                  setSelectedAccountId(account.id);
                  setCursors([]);
                  setAccumulatedItems([]);
                }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-full text-sm whitespace-nowrap transition-colors flex-shrink-0",
                  isSelected
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                )}
              >
                {PlatformIcon && <PlatformIcon className="w-3.5 h-3.5" />}
                {account.username || account.platform}
              </button>
            );
          })}
        </div>
      )}

      {/* Feed Controls + Inline Stats */}
      <div className="flex items-center justify-between px-2">
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
        {allFeedItems.length > 0 && (
          <span className="text-xs text-slate-400">
            {allFeedItems.length} posts &middot;{" "}
            {formatNumber(totalLikes)} likes &middot;{" "}
            {formatNumber(totalComments)} comments
          </span>
        )}
      </div>

      {/* Platform-Specific Warnings */}
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
                  &bull; Only your own posts are accessible (not full feed
                  streams)
                </li>
                <li>
                  &bull; Personal accounts don&apos;t support feed API features
                </li>
                <li>
                  &bull; Professional/Creator account required for feed access
                </li>
                <li>&bull; Metrics delayed up to 48 hours</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      {selectedAccount?.platform === "linkedin" && (
        <div className="card-premium p-3 bg-gradient-to-br from-amber-50 to-white border-amber-200">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-slate-500">
              <strong className="text-slate-600">LinkedIn:</strong> Metrics only available for Company Pages — personal profile analytics not supported.
            </p>
          </div>
        </div>
      )}
      {selectedAccount?.platform === "bluesky" && (
        <div className="card-premium p-3 bg-gradient-to-br from-amber-50 to-white border-amber-200">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-slate-500">
              <strong className="text-slate-600">Bluesky:</strong> View counts are not available via the Bluesky API and will show as N/A.
            </p>
          </div>
        </div>
      )}
      {selectedAccount?.platform === "youtube" && (
        <div className="card-premium p-3 bg-gradient-to-br from-amber-50 to-white border-amber-200">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-slate-500">
              <strong className="text-slate-600">YouTube:</strong> Share counts not available via API; views may lag real-time due to estimation.
            </p>
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
            <p className="text-red-500 mb-2">{feedError?.message || "Failed to load feed"}</p>
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
                accountPlatform={selectedAccount?.platform || "Unknown"}
                accountUsername={selectedAccount?.username || ""}
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

      {/* Analytics link */}
      {allFeedItems.length > 0 && (
        <div className="text-center pb-4">
          <Link
            href="/analytics"
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            View detailed analytics &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
