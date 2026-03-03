"use client";

import Link from "next/link";
import { useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
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

const TikTokInsightsCharts = dynamic(
  () => import("./analytics-charts"),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-premium p-4 animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-slate-100 mb-2" />
              <div className="h-6 w-20 bg-slate-100 rounded mb-1" />
              <div className="h-3 w-24 bg-slate-50 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-premium p-4 animate-pulse">
              <div className="h-4 w-32 bg-slate-100 rounded mb-3" />
              <div className="h-48 bg-slate-50 rounded" />
            </div>
          ))}
        </div>
      </div>
    ),
  },
);

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  extractExtendedMetrics,
  formatNumber,
  totalEngagement,
  getMetricAvailability,
  PLATFORM_NOTES,
  type NormalizedMetrics,
  type MetricAvailability,
  type ExtendedTikTokMetrics,
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

  // 7. TikTok Business extended insights
  const tiktokBusinessInsights = useMemo(() => {
    const tbItems = allItems
      .filter((item) => item.platform?.toLowerCase() === "tiktok_business")
      .map((item) => ({
        item,
        extended: extractExtendedMetrics(item),
        metrics: extractMetrics(item.metrics),
      }))
      .filter((x) => x.extended !== null) as {
      item: SocialAccountFeedItem;
      extended: ExtendedTikTokMetrics;
      metrics: NormalizedMetrics;
    }[];

    if (tbItems.length === 0) return null;

    // Scalar totals
    let totalWatchTime = 0;
    let avgWatchTime = 0;
    let totalNewFollowers = 0;
    let totalReach = 0;
    let totalWebsiteClicks = 0;
    tbItems.forEach(({ extended }) => {
      totalWatchTime += extended.totalTimeWatched;
      avgWatchTime += extended.averageTimeWatched;
      totalNewFollowers += extended.newFollowers;
      totalReach += extended.reach;
      totalWebsiteClicks += extended.websiteClicks;
    });
    avgWatchTime = tbItems.length > 0 ? avgWatchTime / tbItems.length : 0;

    // Best retention curve (from most-viewed post)
    const bestPost = tbItems.sort(
      (a, b) => b.metrics.views - a.metrics.views,
    )[0];
    const retentionData = bestPost?.extended.videoViewRetention.map((p) => ({
      second: p.second,
      percentage: p.percentage,
    })) || [];

    // Averaged demographics
    const genderMap = new Map<string, number>();
    const countryMap = new Map<string, number>();
    tbItems.forEach(({ extended }) => {
      extended.audienceGenders.forEach((g) => {
        genderMap.set(g.gender, (genderMap.get(g.gender) || 0) + g.percentage);
      });
      extended.audienceCountries.forEach((c) => {
        countryMap.set(
          c.country,
          (countryMap.get(c.country) || 0) + c.percentage,
        );
      });
    });
    const genderData = [...genderMap.entries()]
      .map(([gender, total]) => ({
        gender,
        percentage: Math.round(total / tbItems.length),
      }))
      .sort((a, b) => b.percentage - a.percentage);
    const countryData = [...countryMap.entries()]
      .map(([country, total]) => ({
        country,
        percentage: Math.round(total / tbItems.length),
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 8);

    // Averaged impression sources
    const sourceMap = new Map<string, number>();
    tbItems.forEach(({ extended }) => {
      extended.impressionSources.forEach((s) => {
        sourceMap.set(
          s.impression_source,
          (sourceMap.get(s.impression_source) || 0) + s.percentage,
        );
      });
    });
    const impressionData = [...sourceMap.entries()]
      .map(([source, total]) => ({
        source,
        percentage: Math.round(total / tbItems.length),
      }))
      .sort((a, b) => b.percentage - a.percentage);

    return {
      postCount: tbItems.length,
      totalWatchTime,
      avgWatchTime,
      totalNewFollowers,
      totalReach,
      totalWebsiteClicks,
      retentionData,
      genderData,
      countryData,
      impressionData,
    };
  }, [allItems]);

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
        {(() => {
          // Compute which platforms have unavailable metrics
          const unavailShares = connectedAccounts
            .filter((a) => !getMetricAvailability(a.platform).shares)
            .map((a) => a.platform);
          const unavailViews = connectedAccounts
            .filter((a) => !getMetricAvailability(a.platform).views)
            .map((a) => a.platform);
          return (
            <>
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
                caveatNote={unavailShares.length > 0 ? `Shares not available for ${unavailShares.join(", ")}` : undefined}
              />
              <OverviewCard
                label="Total Views"
                value={totals.views}
                icon={Eye}
                color="text-purple-500"
                bg="bg-purple-50"
                isLoading={feedsLoading && allItems.length === 0}
                isPartial={!isAllLoaded}
                caveatNote={unavailViews.length > 0 ? `Views not available for ${unavailViews.join(", ")}` : undefined}
              />
            </>
          );
        })()}
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

            const avail = getMetricAvailability(account.platform);
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
                    available={avail.likes}
                  />
                  <MiniStat
                    icon={MessageCircle}
                    label="Comments"
                    value={metrics.comments}
                    color="text-blue-500"
                    available={avail.comments}
                  />
                  <MiniStat
                    icon={Share2}
                    label="Shares"
                    value={metrics.shares}
                    color="text-emerald-500"
                    available={avail.shares}
                  />
                  <MiniStat
                    icon={Eye}
                    label="Views"
                    value={metrics.views}
                    color="text-purple-500"
                    available={avail.views}
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
                    {(PLATFORM_NOTES[platform]?.length ?? 0) > 0 && (
                      <p className="text-[10px] text-amber-500 mt-1 flex items-center gap-1">
                        <Info className="w-3 h-3 flex-shrink-0" /> {PLATFORM_NOTES[platform]![0]}
                      </p>
                    )}
                  </div>
                );
              },
            )}
          </div>
        </div>
      )}

      {/* Section 6: TikTok Business Insights (lazy-loaded with recharts) */}
      {tiktokBusinessInsights && (
        <>
          <Separator className="divider-soft" />
          <TikTokInsightsCharts data={tiktokBusinessInsights} />
        </>
      )}

      <Separator className="divider-soft" />

      {/* Section 7: Metric Variance Info */}
      <div className="card-premium p-4 bg-gradient-to-br from-blue-50 to-white border-blue-100">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Info className="w-4 h-4 text-blue-600" />
          </div>
          <div className="space-y-3 flex-1">
            <div>
              <h3 className="text-slate-800 font-semibold text-sm mb-1">
                About These Metrics
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                All metrics are lifetime cumulative values fetched directly from each
                platform&apos;s API. Numbers may differ from in-app dashboards due to
                processing delays, metric availability, and platform constraints.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Processing & Delays */}
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Processing &amp; Delays
                </p>
                <ul className="text-[10px] text-slate-400 space-y-0.5">
                  <li>&bull; Instagram/Facebook: up to 48-hour delay</li>
                  <li>&bull; YouTube: views may lag real-time (estimated/verified)</li>
                  <li>&bull; All platforms: lifetime counts, not periodic snapshots</li>
                </ul>
              </div>

              {/* Unavailable Metrics */}
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Unavailable Metrics
                </p>
                <ul className="text-[10px] text-slate-400 space-y-0.5">
                  <li>&bull; Bluesky: no view/impression counts via API</li>
                  <li>&bull; YouTube: share counts not available via API</li>
                  <li>&bull; Shown as &quot;N/A&quot; in per-account cards</li>
                </ul>
              </div>

              {/* Platform Constraints */}
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Platform Constraints
                </p>
                <ul className="text-[10px] text-slate-400 space-y-0.5">
                  <li>&bull; LinkedIn: metrics only for Company Pages</li>
                  <li>&bull; Meta (IG/FB): organic only, 2-year data retention</li>
                  <li>&bull; Pinterest: 90-day and lifetime provided separately</li>
                </ul>
              </div>

              {/* Data Sources */}
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Data Sources
                </p>
                <ul className="text-[10px] text-slate-400 space-y-0.5">
                  <li>&bull; X: impressions include organic + paid traffic</li>
                  <li>&bull; TikTok Business: extended watch time &amp; demographics</li>
                  <li>&bull; All platforms: ad/paid interactions excluded</li>
                </ul>
              </div>
            </div>
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
  caveatNote,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  isLoading: boolean;
  isPartial: boolean;
  caveatNote?: string;
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
      <p className="stat-label">
        {label}
        {caveatNote && (
          <span className="inline-flex ml-1 group relative">
            <Info className="w-3 h-3 text-amber-400" />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-800 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-10">
              {caveatNote}
            </span>
          </span>
        )}
      </p>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  color,
  available = true,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  available?: boolean;
}) {
  return (
    <div className="bg-slate-50 rounded-lg p-2 text-center">
      <Icon className={`w-3.5 h-3.5 mx-auto mb-0.5 ${available ? color : "text-slate-300"}`} />
      <p className={`text-sm font-semibold ${available ? "text-slate-800" : "text-slate-300"}`}>
        {available ? formatNumber(value) : "N/A"}
      </p>
      <p className="text-[10px] text-slate-400">{label}</p>
    </div>
  );
}
