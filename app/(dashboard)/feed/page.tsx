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

// Stats Card Component - Arco Style
function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  color,
  bgColor 
}: { 
  label: string; 
  value: string | number; 
  icon: React.ElementType; 
  color: string;
  bgColor: string;
}) {
  return (
    <div className="arco-stat">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", bgColor)}>
          <Icon className={cn("w-5 h-5", color)} />
        </div>
        <div>
          <p className="arco-stat-value">{value}</p>
          <p className="arco-stat-label">{label}</p>
        </div>
      </div>
    </div>
  );
}

// Feed Item Component - Arco Style
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
      className="arco-card overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between border-b border-[var(--color-border-light)]">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border-2 border-[var(--color-bg-secondary)]">
            <AvatarFallback className="bg-gradient-to-br from-[var(--arco-blue-6)] to-[var(--arco-blue-4)] text-white text-sm font-medium">
              {(accountUsername || accountPlatform)[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-[var(--color-text)] font-semibold text-sm">
              {accountUsername || accountPlatform}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-[var(--color-text-tertiary)]">{formatTime(item.posted_at)}</span>
              {PlatformIcon && (
                <span className="arco-tag arco-tag-blue">
                  <PlatformIcon className="w-3 h-3 mr-1" />
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
            className="p-2 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
          >
            <Send className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Post Content */}
      <div className="p-4">
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed whitespace-pre-wrap">
          {item.caption}
        </p>
      </div>

      {/* Post Media */}
      {media && (
        <div className="px-4 pb-4">
          <div className="rounded-lg overflow-hidden bg-[var(--color-bg-secondary)]">
            {media.type === "video" ? (
              <video
                src={proxyMediaUrl(media.url)}
                controls
                className="w-full h-auto max-h-[400px] object-cover"
              />
            ) : (
              <img
                src={proxyMediaUrl(media.url)}
                alt=""
                className="w-full h-auto object-cover max-h-[400px]"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Post Stats */}
      <div className="px-4 py-3 border-t border-[var(--color-border-light)] flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className={cn(
            "flex items-center gap-2",
            available.likes ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-tertiary)]"
          )}>
            <Heart className={cn("w-4 h-4", available.likes && "fill-[var(--arco-red-6)] text-[var(--arco-red-6)]")} />
            <span className="text-sm font-medium">
              {available.likes ? formatNumber(metrics.likes) : "—"}
            </span>
          </span>
          <span className={cn(
            "flex items-center gap-2",
            available.comments ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-tertiary)]"
          )}>
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              {available.comments ? formatNumber(metrics.comments) : "—"}
            </span>
          </span>
          <span className={cn(
            "flex items-center gap-2",
            available.shares ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-tertiary)]"
          )}>
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-medium">
              {available.shares ? formatNumber(metrics.shares) : "—"}
            </span>
          </span>
          <span className={cn(
            "flex items-center gap-2",
            available.views ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-tertiary)]"
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
          <p className="text-xs text-[var(--arco-orange-6)] bg-[#fff7e8] px-3 py-2 rounded border border-[#ffe4ba]">
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
    <div className="arco-card border-l-4 border-l-[var(--arco-orange-6)] p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-[var(--arco-orange-6)] flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-[var(--color-text)] font-medium text-sm mb-1">
            {warning.title}
          </h3>
          <ul className="text-xs text-[var(--color-text-secondary)] space-y-0.5">
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
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Header Section */}
      <div className="arco-header">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-[var(--color-text)]">Social Feed</h1>
              <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                Monitor your content performance across platforms
              </p>
            </div>
            <Link href="/analytics">
              <Button variant="outline" size="sm" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Account Selector Pills */}
        {accountsLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--color-text-tertiary)]" />
          </div>
        ) : connectedAccounts.length === 0 ? (
          <div className="arco-card p-8 text-center">
            <div className="w-16 h-16 rounded-xl bg-[var(--color-bg-secondary)] flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-[var(--color-text-tertiary)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">No connected accounts</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">Connect your social accounts to view your feed</p>
            <Link href="/accounts/connect">
              <Button className="arco-btn-primary">
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
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all flex-shrink-0 border",
                    isSelected
                      ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                      : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
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
            className="grid grid-cols-3 gap-4"
          >
            <StatCard 
              label="Total Likes" 
              value={formatNumber(totalLikes)} 
              icon={Heart} 
              color="text-[var(--arco-red-6)]"
              bgColor="bg-[#fff0ed]"
            />
            <StatCard 
              label="Comments" 
              value={formatNumber(totalComments)} 
              icon={MessageCircle} 
              color="text-[var(--arco-blue-6)]"
              bgColor="bg-[var(--arco-blue-1)]"
            />
            <StatCard 
              label="Total Views" 
              value={formatNumber(totalViews)} 
              icon={Eye} 
              color="text-[var(--arco-green-6)]"
              bgColor="bg-[#e8ffea]"
            />
          </motion.div>
        )}

        {/* Controls */}
        {allFeedItems.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[var(--color-text-tertiary)]" />
              <span className="text-sm text-[var(--color-text-secondary)]">
                {allFeedItems.length} posts
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={feedLoading}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
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
                className="arco-card p-12 text-center"
              >
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-text-tertiary)] mx-auto mb-4" />
                <p className="text-[var(--color-text-secondary)]">Loading your feed...</p>
              </motion.div>
            ) : feedError ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="arco-card border-l-4 border-l-[var(--arco-red-6)] p-8 text-center"
              >
                <p className="text-[var(--arco-red-6)] mb-3">{feedError?.message || "Failed to load feed"}</p>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  Try Again
                </Button>
              </motion.div>
            ) : allFeedItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="arco-card p-12 text-center"
              >
                <div className="w-16 h-16 rounded-xl bg-[var(--color-bg-secondary)] flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-[var(--color-text-tertiary)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">No posts found</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">Select an account to view their feed</p>
                {connectedAccounts.length > 0 && (
                  <div className="arco-card border-l-4 border-l-[var(--arco-orange-6)] p-4 max-w-sm mx-auto">
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      <strong>Don&apos;t see your posts?</strong> Try{" "}
                      <Link href="/accounts/connect" className="text-[var(--color-primary)] hover:underline">
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
      </div>
    </div>
  );
}
