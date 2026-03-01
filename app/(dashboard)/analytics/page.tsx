"use client";

import Link from "next/link";
import { useMemo, useState, useCallback } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Loader2,
  RefreshCw,
  Info,
  ExternalLink,
  AlertCircle,
  Users,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAccounts,
  useAllAccountFeeds,
  pfmKeys,
} from "@/lib/hooks/usePostForMe";
import {
  extractMetrics,
  formatNumber,
  totalEngagement,
  type NormalizedMetrics,
} from "@/lib/metrics";
import { platformIconsMap } from "@/lib/social-platforms";
import { proxyMediaUrl } from "@/lib/utils";
import type { SocialAccountFeedItem } from "@/types/post-for-me";

// Platform colors for charts (same as dashboard)
const PLATFORM_COLORS: Record<string, string> = {
  x: "bg-slate-800",
  twitter: "bg-slate-800",
  facebook: "bg-blue-600",
  instagram: "bg-gradient-to-br from-purple-500 to-pink-500",
  linkedin: "bg-blue-700",
  tiktok: "bg-slate-900",
  tiktok_business: "bg-gradient-to-r from-cyan-500 to-pink-500",
  youtube: "bg-red-600",
  pinterest: "bg-red-700",
  bluesky: "bg-blue-500",
  threads: "bg-slate-900",
};

function getPlatformColor(platform: string) {
  return PLATFORM_COLORS[platform.toLowerCase()] || "bg-slate-400";
}

export default function AnalyticsPage() {
  const queryClient = useQueryClient();
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // 1. Get connected accounts
  const { data: accountsData, isLoading: accountsLoading } = useAccounts();
  const accounts = accountsData?.data || [];
  const connectedAccounts = accounts.filter((a) => a.status === "connected");
  const connectedIds = connectedAccounts.map((a) => a.id);

  // 2. Fetch all feeds in parallel
  const {
    data: feedsByAccount,
    allItems,
    isLoading: feedsLoading,
    isAllLoaded,
    loadingAccountIds,
    errors,
  } = useAllAccountFeeds(connectedIds);

  // 3. Aggregate totals
  const totals = useMemo(() => {
    const result: NormalizedMetrics = { likes: 0, comments: 0, shares: 0, views: 0 };
    allItems.forEach((item) => {
      const m = extractMetrics(item.metrics);
      result.likes += m.likes;
      result.comments += m.comments;
      result.shares += m.shares;
      result.views += m.views;
    });
    return result;
  }, [allItems]);

  // 4. Per-account breakdown
  const perAccount = useMemo(() => {
    return connectedAccounts.map((account) => {
      const items = feedsByAccount.get(account.id) || [];
      const agg: NormalizedMetrics = { likes: 0, comments: 0, shares: 0, views: 0 };
      items.forEach((item) => {
        const m = extractMetrics(item.metrics);
        agg.likes += m.likes;
        agg.comments += m.comments;
        agg.shares += m.shares;
        agg.views += m.views;
      });
      return {
        account,
        metrics: agg,
        postCount: items.length,
        error: errors.get(account.id),
        isLoading: loadingAccountIds.includes(account.id),
      };
    });
  }, [connectedAccounts, feedsByAccount, errors, loadingAccountIds]);

  // 5. Top performing posts
  const topPosts = useMemo(() => {
    return [...allItems]
      .map((item) => ({
        item,
        engagement: totalEngagement(extractMetrics(item.metrics)),
        metrics: extractMetrics(item.metrics),
      }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 10);
  }, [allItems]);

  // 6. Platform comparison
  const platformBreakdown = useMemo(() => {
    const byPlatform = new Map<
      string,
      { metrics: NormalizedMetrics; postCount: number }
    >();
    allItems.forEach((item) => {
      const platform = item.platform?.toLowerCase() || "unknown";
      const m = extractMetrics(item.metrics);
      const existing = byPlatform.get(platform) || {
        metrics: { likes: 0, comments: 0, shares: 0, views: 0 },
        postCount: 0,
      };
      existing.metrics.likes += m.likes;
      existing.metrics.comments += m.comments;
      existing.metrics.shares += m.shares;
      existing.metrics.views += m.views;
      existing.postCount += 1;
      byPlatform.set(platform, existing);
    });

    return [...byPlatform.entries()]
      .map(([platform, data]) => ({
        platform,
        ...data,
        totalEngagement: totalEngagement(data.metrics),
      }))
      .sort((a, b) => b.totalEngagement - a.totalEngagement);
  }, [allItems]);

  const maxPlatformEngagement = platformBreakdown[0]?.totalEngagement || 1;

  // Refresh handler
  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: pfmKeys.feeds() });
    setLastRefreshed(new Date());
  }, [queryClient]);

  // Loading state: accounts haven't loaded yet
  if (accountsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
          <p className="text-slate-400 mt-3">Loading accounts...</p>
        </div>
      </div>
    );
  }

  // Empty state: no connected accounts
  if (connectedAccounts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            No Connected Accounts
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            Connect your social accounts to see engagement analytics across all
            your platforms.
          </p>
          <Link href="/accounts/connect">
            <Button>Connect Account</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="greeting-title">Engagement Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">
            {connectedAccounts.length} connected account
            {connectedAccounts.length !== 1 ? "s" : ""}
            {!isAllLoaded && (
              <span className="inline-flex items-center gap-1 ml-2 text-amber-600">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading {loadingAccountIds.length} account
                {loadingAccountIds.length !== 1 ? "s" : ""}...
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-xs text-slate-400">
              Updated {lastRefreshed.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={feedsLoading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-1.5 ${feedsLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Section 2: Engagement Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <OverviewCard
          label="Total Likes"
          value={totals.likes}
          icon={Heart}
          color="text-pink-500"
          bg="bg-pink-50"
          isLoading={feedsLoading && allItems.length === 0}
          isPartial={!isAllLoaded}
        />
        <OverviewCard
          label="Total Comments"
          value={totals.comments}
          icon={MessageCircle}
          color="text-blue-500"
          bg="bg-blue-50"
          isLoading={feedsLoading && allItems.length === 0}
          isPartial={!isAllLoaded}
        />
        <OverviewCard
          label="Total Shares"
          value={totals.shares}
          icon={Share2}
          color="text-emerald-500"
          bg="bg-emerald-50"
          isLoading={feedsLoading && allItems.length === 0}
          isPartial={!isAllLoaded}
        />
        <OverviewCard
          label="Total Views"
          value={totals.views}
          icon={Eye}
          color="text-purple-500"
          bg="bg-purple-50"
          isLoading={feedsLoading && allItems.length === 0}
          isPartial={!isAllLoaded}
        />
      </div>

      <Separator className="divider-soft" />

      {/* Section 3: Per-Account Breakdown */}
      <div>
        <h2 className="section-title mb-4">Per-Account Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {perAccount.map(({ account, metrics, postCount, error, isLoading }) => {
            const PlatformIcon =
              platformIconsMap[account.platform.toLowerCase()];

            if (isLoading) {
              return (
                <div key={account.id} className="card-premium p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="w-24 h-4" />
                      <Skeleton className="w-16 h-3" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Skeleton className="h-12 rounded-lg" />
                    <Skeleton className="h-12 rounded-lg" />
                    <Skeleton className="h-12 rounded-lg" />
                    <Skeleton className="h-12 rounded-lg" />
                  </div>
                </div>
              );
            }

            if (error) {
              return (
                <div
                  key={account.id}
                  className="card-premium p-4 border-red-200"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {account.username || account.platform}
                      </p>
                      <p className="text-xs text-red-500">
                        Failed to load feed
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={account.id} className="card-premium p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-10 h-10">
                    {account.profile_photo_url && (
                      <AvatarImage
                        src={proxyMediaUrl(account.profile_photo_url)}
                      />
                    )}
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm">
                      {(account.username || account.platform)[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {account.username || account.platform}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {PlatformIcon && (
                        <PlatformIcon className="w-3 h-3 text-slate-400" />
                      )}
                      <span className="text-xs text-slate-400 capitalize">
                        {account.platform}
                      </span>
                      <span className="text-xs text-slate-300">
                        &middot; {postCount} posts
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <MiniStat
                    icon={Heart}
                    label="Likes"
                    value={metrics.likes}
                    color="text-pink-500"
                  />
                  <MiniStat
                    icon={MessageCircle}
                    label="Comments"
                    value={metrics.comments}
                    color="text-blue-500"
                  />
                  <MiniStat
                    icon={Share2}
                    label="Shares"
                    value={metrics.shares}
                    color="text-emerald-500"
                  />
                  <MiniStat
                    icon={Eye}
                    label="Views"
                    value={metrics.views}
                    color="text-purple-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Separator className="divider-soft" />

      {/* Section 4: Top Performing Posts */}
      <div>
        <h2 className="section-title mb-4">Top Performing Posts</h2>
        <div className="card-premium divide-y divide-slate-100">
          {feedsLoading && topPosts.length === 0 ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-slate-400">Loading posts...</p>
            </div>
          ) : topPosts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-400">
                No posts with engagement data yet
              </p>
            </div>
          ) : (
            topPosts.map(({ item, engagement, metrics }, index) => {
              const PlatformIcon =
                platformIconsMap[item.platform?.toLowerCase()];
              const account = connectedAccounts.find(
                (a) => a.id === item.social_account_id,
              );
              return (
                <div
                  key={`${item.platform_post_id}-${index}`}
                  className="flex items-center gap-3 p-4 hover:bg-slate-50/50 transition-colors"
                >
                  {/* Rank */}
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-slate-600">
                      {index + 1}
                    </span>
                  </div>

                  {/* Platform icon */}
                  <div className="flex-shrink-0">
                    {PlatformIcon ? (
                      <PlatformIcon className="w-4 h-4 text-slate-500" />
                    ) : (
                      <div className="w-4 h-4 rounded bg-slate-200" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-medium text-slate-500">
                        {account?.username || item.platform}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-2">
                      {item.caption || "(No caption)"}
                    </p>
                  </div>

                  {/* Metric pills */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="badge-soft text-pink-600 bg-pink-50 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {formatNumber(metrics.likes)}
                    </span>
                    <span className="badge-soft text-blue-600 bg-blue-50 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {formatNumber(metrics.comments)}
                    </span>
                    <span className="badge-soft text-emerald-600 bg-emerald-50 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Share2 className="w-3 h-3" />
                      {formatNumber(metrics.shares)}
                    </span>
                  </div>

                  {/* External link */}
                  {item.platform_url && (
                    <a
                      href={item.platform_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-slate-600 flex-shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <Separator className="divider-soft" />

      {/* Section 5: Platform Comparison */}
      {platformBreakdown.length > 0 && (
        <div>
          <h2 className="section-title mb-4">Platform Comparison</h2>
          <div className="card-premium p-4 space-y-4">
            {platformBreakdown.map(
              ({ platform, metrics, postCount, totalEngagement: eng }) => {
                const PlatformIcon = platformIconsMap[platform];
                const barWidth = Math.max(
                  (eng / maxPlatformEngagement) * 100,
                  2,
                );
                return (
                  <div key={platform}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        {PlatformIcon && (
                          <PlatformIcon className="w-4 h-4 text-slate-600" />
                        )}
                        <span className="text-sm font-medium text-slate-700 capitalize">
                          {platform}
                        </span>
                        <span className="text-xs text-slate-400">
                          {postCount} posts
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-slate-800">
                        {formatNumber(eng)}
                      </span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getPlatformColor(platform)}`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-pink-500">
                        {formatNumber(metrics.likes)} likes
                      </span>
                      <span className="text-[10px] text-blue-500">
                        {formatNumber(metrics.comments)} comments
                      </span>
                      <span className="text-[10px] text-emerald-500">
                        {formatNumber(metrics.shares)} shares
                      </span>
                      <span className="text-[10px] text-purple-500">
                        {formatNumber(metrics.views)} views
                      </span>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>
      )}

      <Separator className="divider-soft" />

      {/* Section 6: Metric Variance Info */}
      <div className="card-premium p-4 bg-gradient-to-br from-blue-50 to-white border-blue-100">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Info className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-slate-800 font-semibold text-sm mb-1">
              About These Metrics
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed mb-2">
              All metrics shown are lifetime cumulative values fetched directly
              from each platform&apos;s API. They may vary from what you see on
              each platform due to the following:
            </p>
            <ul className="text-[10px] text-slate-400 space-y-1">
              <li>
                <strong className="text-slate-500">Lifetime values</strong> -
                Metrics are total lifetime counts, not periodic snapshots
              </li>
              <li>
                <strong className="text-slate-500">Instagram</strong> - Up to
                48-hour processing delay for accurate metrics
              </li>
              <li>
                <strong className="text-slate-500">Bluesky</strong> - No view
                counts available via API
              </li>
              <li>
                <strong className="text-slate-500">LinkedIn</strong> - Metrics
                only available for Company Pages
              </li>
              <li>
                <strong className="text-slate-500">Meta platforms</strong> -
                Content retained for 2 years; older data may be unavailable
              </li>
              <li>
                <strong className="text-slate-500">Exclusions</strong> - Metrics
                exclude paid/AD interactions
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Sub-components ====================

function OverviewCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  isLoading,
  isPartial,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  isLoading: boolean;
  isPartial: boolean;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
          <Icon className={`w-4.5 h-4.5 ${color}`} />
        </div>
        {isPartial && !isLoading && (
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Still loading some accounts" />
        )}
      </div>
      {isLoading ? (
        <Skeleton className="w-20 h-7 mb-1" />
      ) : (
        <p className="stat-value">{formatNumber(value)}</p>
      )}
      <p className="stat-label">{label}</p>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-slate-50 rounded-lg p-2 text-center">
      <Icon className={`w-3.5 h-3.5 mx-auto mb-0.5 ${color}`} />
      <p className="text-sm font-semibold text-slate-800">
        {formatNumber(value)}
      </p>
      <p className="text-[10px] text-slate-400">{label}</p>
    </div>
  );
}
