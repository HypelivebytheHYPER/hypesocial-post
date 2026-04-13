"use client";

import { useQuery, useQueries, UseQueryOptions } from "@tanstack/react-query";
import { pfmKeys } from "./keys";
import { TIME } from "@/lib/constants";
import type { SocialAccount, SocialAccountFeedItem, SocialAccountListResponse } from "@/types/post-for-me-types";
import type { NormalizedMetrics, ExtendedTikTokMetrics } from "@/lib/metrics";

// Types for analytics data
interface AccountMetrics {
  account: SocialAccount;
  metrics: NormalizedMetrics;
  postCount: number;
  error?: Error;
  isLoading: boolean;
}

interface PlatformBreakdown {
  platform: string;
  metrics: NormalizedMetrics;
  postCount: number;
  totalEngagement: number;
}

interface TikTokInsights {
  postCount: number;
  totalWatchTime: number;
  avgWatchTime: number;
  totalNewFollowers: number;
  totalReach: number;
  totalWebsiteClicks: number;
  retentionData: Array<{ second: string; percentage: number }>;
  genderData: Array<{ gender: string; percentage: number }>;
  countryData: Array<{ country: string; percentage: number }>;
  impressionData: Array<{ source: string; percentage: number }>;
}

interface AnalyticsData {
  totals: NormalizedMetrics;
  perAccount: AccountMetrics[];
  platformBreakdown: PlatformBreakdown[];
  tiktokInsights: TikTokInsights | null;
}

// Import these from metrics.ts
import { extractMetrics, extractExtendedMetrics, totalEngagement } from "@/lib/metrics";

/**
 * PROPER TanStack pattern: Parallel queries with select
 * 
 * Instead of:
 * - useAllAccountFeeds hook that manages parallel queries internally
 * - useMemo for data aggregation
 * 
 * We use:
 * - useQueries for parallel fetching
 * - select for data transformation
 * - Everything cached by TanStack
 */
export function useAnalytics(
  connectedAccounts: SocialAccount[],
  options?: {
    enabled?: boolean;
  }
) {
  // Parallel queries for all account feeds
  const feedQueries = useQueries({
    queries: connectedAccounts.map((account) => ({
      queryKey: [...pfmKeys.feeds(), account.id],
      queryFn: async (): Promise<SocialAccountFeedItem[]> => {
        const res = await fetch(`/api/account-feeds/${account.id}`);
        if (!res.ok) throw new Error(`Failed to fetch feed for ${account.id}`);
        return res.json();
      },
      enabled: options?.enabled !== false && connectedAccounts.length > 0,
      staleTime: TIME.MINUTE * 2,
      select: (data: SocialAccountFeedItem[]) => {
        // Transform per-account data
        const metrics: NormalizedMetrics = {
          likes: 0,
          comments: 0,
          shares: 0,
          views: 0,
        };
        
        data.forEach((item) => {
          const m = extractMetrics(item.metrics);
          metrics.likes += m.likes;
          metrics.comments += m.comments;
          metrics.shares += m.shares;
          metrics.views += m.views;
        });

        return {
          account,
          items: data,
          metrics,
          postCount: data.length,
        };
      },
    })),
  });

  // Aggregate all data - this is just combining cached results
  const allItems = feedQueries.flatMap((q) => q.data?.items ?? []);
  const perAccount = feedQueries.map((q, i) => ({
    account: connectedAccounts[i],
    metrics: q.data?.metrics ?? { likes: 0, comments: 0, shares: 0, views: 0 },
    postCount: q.data?.postCount ?? 0,
    error: q.error as Error | undefined,
    isLoading: q.isLoading,
  }));

  // Calculate totals (lightweight - no useMemo needed)
  const totals: NormalizedMetrics = perAccount.reduce(
    (acc, { metrics }) => ({
      likes: acc.likes + metrics.likes,
      comments: acc.comments + metrics.comments,
      shares: acc.shares + metrics.shares,
      views: acc.views + metrics.views,
    }),
    { likes: 0, comments: 0, shares: 0, views: 0 }
  );

  // Platform breakdown (lightweight)
  const platformBreakdown: PlatformBreakdown[] = (() => {
    const byPlatform = new Map<string, { metrics: NormalizedMetrics; postCount: number }>();
    
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
  })();

  // TikTok insights (only if there are TikTok Business items)
  const tiktokInsights: TikTokInsights | null = (() => {
    const tbItems = allItems
      .filter((item) => item.platform?.toLowerCase() === "tiktok_business")
      .map((item) => ({
        item,
        extended: extractExtendedMetrics(item),
        metrics: extractMetrics(item.metrics),
      }))
      .filter((x): x is typeof x & { extended: ExtendedTikTokMetrics } => x.extended !== null);

    if (tbItems.length === 0) return null;

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

    // Best retention curve
    const bestPost = tbItems.sort((a, b) => b.metrics.views - a.metrics.views)[0];
    const retentionData =
      bestPost?.extended.videoViewRetention.map((p) => ({
        second: String(p.second),
        percentage: p.percentage,
      })) || [];

    // Averaged demographics
    const genderMap = new Map<string, number>();
    const countryMap = new Map<string, number>();
    const sourceMap = new Map<string, number>();

    tbItems.forEach(({ extended }) => {
      extended.audienceGenders.forEach((g) => {
        genderMap.set(g.gender, (genderMap.get(g.gender) || 0) + g.percentage);
      });
      extended.audienceCountries.forEach((c) => {
        countryMap.set(c.country, (countryMap.get(c.country) || 0) + c.percentage);
      });
      extended.impressionSources.forEach((s) => {
        sourceMap.set(s.impression_source, (sourceMap.get(s.impression_source) || 0) + s.percentage);
      });
    });

    return {
      postCount: tbItems.length,
      totalWatchTime,
      avgWatchTime,
      totalNewFollowers,
      totalReach,
      totalWebsiteClicks,
      retentionData,
      genderData: [...genderMap.entries()].map(([gender, total]) => ({
        gender,
        percentage: Math.round(total / tbItems.length),
      })).sort((a, b) => b.percentage - a.percentage),
      countryData: [...countryMap.entries()].map(([country, total]) => ({
        country,
        percentage: Math.round(total / tbItems.length),
      })).sort((a, b) => b.percentage - a.percentage).slice(0, 8),
      impressionData: [...sourceMap.entries()].map(([source, total]) => ({
        source,
        percentage: Math.round(total / tbItems.length),
      })).sort((a, b) => b.percentage - a.percentage),
    };
  })();

  const isLoading = feedQueries.some((q) => q.isLoading);
  const isFetching = feedQueries.some((q) => q.isFetching);

  return {
    totals,
    perAccount,
    platformBreakdown,
    tiktokInsights,
    isLoading,
    isFetching,
    allItems,
  };
}
