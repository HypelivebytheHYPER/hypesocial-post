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
  TrendingUp,
  Calendar,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSocialAccounts, useAccountFeed, pfmKeys } from "@/lib/hooks";
import {
  extractMetrics,
  formatNumber,
  getMetricAvailabilityForAccount,
  isLinkedInPersonalProfile,
} from "@/lib/metrics";
import { platformIconsMap } from "@/lib/social-platforms";
import { cn, proxyMediaUrl } from "@/lib/utils";
import type { SocialAccountFeedItem } from "@/types/post-for-me-types";

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

// Simplified media extraction
function getFirstMedia(media: SocialAccountFeedItem["media"]) {
  if (!media?.length) return null;
  const first = media[0];
  const url = first?.url;
  if (!url) return null;
  const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(url);
  return { url, type: isVideo ? ("video" as const) : ("image" as const) };
}

// Stats Card Component
function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  color 
}: { 
  label: string; 
  value: string | number; 
  icon: React.ElementType; 
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-[#111111] border border-slate-200/60 dark:border-slate-800/60">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xl font-semibold text-slate-900 dark:text-white">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

// Feed Item Component - Tsuika Style
function FeedItem({ 
  item, 
  accountPlatform, 
  accountUsername,
  index 
}: { 
  item: SocialAccountFeedItem; 
  accountPlatform: string; 
  accountUsername: string;
  index: number;
}) {
  const PlatformIcon = platformIconsMap[accountPlatform.toLowerCase()];
  const metrics = extractMetrics(item.metrics);
  const available = getMetricAvailabilityForAccount(accountPlatform, item.metrics);
  const media = getFirstMedia(item.media);
  const isLinkedInPersonal = isLinkedInPersonalProfile(accountPlatform, item.metrics);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group rounded-2xl bg-white dark:bg-[#111111] border border-slate-200/60 dark:border-slate-800/60 overflow-hidden hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-black/50 transition-all duration-300"
    >
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 ring-2 ring-slate-100 dark:ring-slate-800">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm font-medium">
              {(accountUsername || accountPlatform)[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-slate-900 dark:text-white font-semibold text-sm">
              {accountUsername || accountPlatform}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{formatTime(item.posted_at)}</span>
              {PlatformIcon && (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  <PlatformIcon className="w-3 h-3" />
                  {accountPlatform}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {item.platform_url && (
          <a
            href={item.platform_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Send className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Post Content */}
      <div className="px-4 pb-4">
        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
          {item.caption}
        </p>
      </div>

      {/* Post Media */}
      {media && (
        <div className="px-4 pb-4">
          <div className="rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
            {media.type === "video" ? (
              <video
                src={proxyMediaUrl(media.url)}
                controls
                className="w-full h-auto max-h-[500px] object-cover"
              />
            ) : (
              <img
                src={proxyMediaUrl(media.url)}
                alt=""
                className="w-full h-auto object-cover max-h-[500px]"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Post Stats */}
      <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className={cn(
            "flex items-center gap-2",
            available.likes ? "text-slate-600 dark:text-slate-400" : "text-slate-300 dark:text-slate-600"
          )}>
            <Heart className={cn("w-4 h-4", available.likes && "fill-rose-500 text-rose-500")} />
            <span className="text-sm font-medium">
              {available.likes ? formatNumber(metrics.likes) : "—"}
            </span>
          </span>
          <span className={cn(
            "flex items-center gap-2",
            available.comments ? "text-slate-600 dark:text-slate-400" : "text-slate-300 dark:text-slate-600"
          )}>
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              {available.comments ? formatNumber(metrics.comments) : "—"}
            </span>
          </span>
          <span className={cn(
            "flex items-center gap-2",
            available.shares ? "text-slate-600 dark:text-slate-400" : "text-slate-300 dark:text-slate-600"
          )}>
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-medium">
              {available.shares ? formatNumber(metrics.shares) : "—"}
            </span>
          </span>
          <span className={cn(
            "flex items-center gap-2",
            available.views ? "text-slate-600 dark:text-slate-400" : "text-slate-300 dark:text-slate-600"
          )}>
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">
              {available.views ? formatNumber(metrics.views) : "—"}
            </span>
          </span>
        </div>
      </div>

      {/* LinkedIn Personal Profile Note */}
      {isLinkedInPersonal && (
        <div className="px-4 pb-4">
          <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-100 dark:border-amber-500/20">
            ℹ️ LinkedIn metrics only available for Company Pages. Personal profiles do not have analytics access.
          </p>
        </div>
      )}
    </motion.article>
  );
}

// Platform Warning Component
function PlatformWarning({ platform }: { platform: string }) {
  const warnings: Record<string, { title: string; items: string[] }> = {
    instagram: {
      title: "Instagram Feed Limitations",
      items: [
        "Only your own posts are accessible (not full feed streams)",
        "Personal accounts don't support feed API features",
        "Professional/Creator account required for feed access",
        "Metrics delayed up to 48 hours",
      ],
    },
    linkedin: {
      title: "LinkedIn Metrics Limitation",
      items: ["Metrics only available for Company Pages — personal profile analytics not supported."],
    },
    bluesky: {
      title: "Bluesky API Limitation",
      items: ["View counts are not available via the Bluesky API and will show as N/A."],
    },
    youtube: {
      title: "YouTube API Limitation",
      items: ["Share counts not available via API; views may lag real-time due to estimation."],
    },
  };

  const warning = warnings[platform];
  if (!warning) return null;

  return (
    <div className="rounded-xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20 p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="text-slate-800 dark:text-slate-200 font-medium text-sm mb-1">
            {warning.title}
          </h3>
          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
            {warning.items.map((item, i) => (
              <li key={i}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  const queryClient = useQueryClient();
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [cursors, setCursors] = useState<string[]>([]);
  const [accumulatedItems, setAccumulatedItems] = useState<SocialAccountFeedItem[]>([]);

  // Get accounts
  const { data: accountsData, isLoading: accountsLoading } = useSocialAccounts();
  const accounts = accountsData?.data || [];
  const connectedAccounts = accounts.filter((a) => a.status === "connected");

  // Derived effective account
  const effectiveAccountId = selectedAccountId || connectedAccounts[0]?.id || "";

  // Get feed
  const currentCursor = cursors.length > 0 ? cursors[cursors.length - 1] : undefined;
  const {
    data: feedData,
    isLoading: feedLoading,
    error: feedError,
  } = useAccountFeed(effectiveAccountId, {
    limit: 20,
    cursor: currentCursor,
    expand: ["metrics"],
  });

  // Accumulate items
  useEffect(() => {
    if (feedData?.data) {
      if (cursors.length === 0) {
        setAccumulatedItems(feedData.data);
      } else {
        setAccumulatedItems((prev) => {
          const ids = new Set(prev.map((i) => i.platform_post_id));
          return [...prev, ...feedData.data.filter((i) => !ids.has(i.platform_post_id))];
        });
      }
    }
  }, [feedData?.data, cursors.length]);

  const handleLoadMore = useCallback(() => {
    const cursor = feedData?.meta?.cursor;
    if (cursor) {
      setCursors((prev) => [...prev, cursor]);
    }
  }, [feedData?.meta?.cursor]);

  const handleRefresh = useCallback(() => {
    setCursors([]);
    setAccumulatedItems([]);
    queryClient.invalidateQueries({ queryKey: pfmKeys.feeds() });
  }, [queryClient]);

  const allFeedItems = accumulatedItems;
  const hasMore = feedData?.meta?.has_more ?? false;
  const selectedAccount = connectedAccounts.find((a) => a.id === effectiveAccountId);

  // Compute aggregate stats
  const totalLikes = allFeedItems.reduce((sum, item) => sum + extractMetrics(item.metrics).likes, 0);
  const totalComments = allFeedItems.reduce((sum, item) => sum + extractMetrics(item.metrics).comments, 0);
  const totalViews = allFeedItems.reduce((sum, item) => sum + extractMetrics(item.metrics).views, 0);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-pink-500/10" />
        <div className="relative max-w-3xl mx-auto px-4 py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3">
              Your <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">Social Feed</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
              Track engagement and monitor your content performance across all connected platforms
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-12 space-y-6 -mt-4">
        {/* Account Selector Pills */}
        {accountsLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : connectedAccounts.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-[#111111] border border-slate-200/60 dark:border-slate-800/60 p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No connected accounts</h3>
            <p className="text-sm text-slate-500 mb-4">Connect your social accounts to view your feed</p>
            <Link href="/accounts/connect">
              <Button className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-lg">
                Connect Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {connectedAccounts.map((account) => {
              const PlatformIcon = platformIconsMap[account.platform.toLowerCase()];
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
                    "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm whitespace-nowrap transition-all flex-shrink-0 border",
                    isSelected
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-lg shadow-slate-900/20"
                      : "bg-white dark:bg-[#111111] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  )}
                >
                  {PlatformIcon && <PlatformIcon className="w-4 h-4" />}
                  <span className="font-medium">{account.username || account.platform}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Stats Overview */}
        {allFeedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-3"
          >
            <StatCard 
              label="Total Likes" 
              value={formatNumber(totalLikes)} 
              icon={Heart} 
              color="bg-rose-500" 
            />
            <StatCard 
              label="Comments" 
              value={formatNumber(totalComments)} 
              icon={MessageCircle} 
              color="bg-blue-500" 
            />
            <StatCard 
              label="Total Views" 
              value={formatNumber(totalViews)} 
              icon={Eye} 
              color="bg-violet-500" 
            />
          </motion.div>
        )}

        {/* Controls */}
        {allFeedItems.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">
                {allFeedItems.length} posts
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={feedLoading}
              className="text-slate-500 hover:text-slate-700"
            >
              <RefreshCw className={cn("w-4 h-4 mr-1.5", feedLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        )}

        {/* Platform Warning */}
        {selectedAccount?.platform && (
          <PlatformWarning platform={selectedAccount.platform} />
        )}

        {/* Feed Items */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {feedLoading && allFeedItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl bg-white dark:bg-[#111111] border border-slate-200/60 dark:border-slate-800/60 p-12 text-center"
              >
                <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500">Loading your feed...</p>
              </motion.div>
            ) : feedError ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl bg-white dark:bg-[#111111] border border-red-200 dark:border-red-500/20 p-8 text-center"
              >
                <p className="text-red-500 mb-3">{feedError?.message || "Failed to load feed"}</p>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  Try Again
                </Button>
              </motion.div>
            ) : allFeedItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl bg-white dark:bg-[#111111] border border-slate-200/60 dark:border-slate-800/60 p-12 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No posts found</h3>
                <p className="text-sm text-slate-500 mb-4">Select an account to view their feed</p>
                {connectedAccounts.length > 0 && (
                  <div className="rounded-xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20 p-4 max-w-sm mx-auto">
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      <strong>Don&apos;t see your posts?</strong> Try{" "}
                      <Link href="/accounts/connect" className="underline hover:text-amber-900 dark:hover:text-amber-300">
                        reconnecting your account
                      </Link>{" "}
                      to enable feed access.
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {allFeedItems.map((item, index) => (
                  <FeedItem
                    key={`${item.platform_post_id}-${index}`}
                    item={item}
                    accountPlatform={selectedAccount?.platform || "Unknown"}
                    accountUsername={selectedAccount?.username || ""}
                    index={index}
                  />
                ))}

                {/* Load More */}
                {hasMore && (
                  <div className="flex justify-center py-6">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleLoadMore}
                      disabled={feedLoading}
                      className="rounded-full px-8"
                    >
                      {feedLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          Load More Posts
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Analytics Link */}
        {allFeedItems.length > 0 && (
          <div className="text-center pt-4">
            <Link
              href="/analytics"
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              View detailed analytics
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
