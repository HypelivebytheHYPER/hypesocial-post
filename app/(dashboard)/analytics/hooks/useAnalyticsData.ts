"use client";

import { useMemo } from "react";
import {
  extractMetrics,
  extractExtendedMetrics,
  totalEngagement,
  type NormalizedMetrics,
  type ExtendedTikTokMetrics,
} from "@/lib/metrics";
import { useAllAccountFeeds } from "@/lib/hooks";
import type { SocialAccountFeedItem, SocialAccount } from "@/types/post-for-me-types";

export interface AccountMetrics {
  account: SocialAccount;
  metrics: NormalizedMetrics;
  postCount: number;
  error?: Error;
  isLoading: boolean;
}

export interface TopPost {
  item: SocialAccountFeedItem;
  engagement: number;
  metrics: NormalizedMetrics;
}

export interface PlatformBreakdown {
  platform: string;
  metrics: NormalizedMetrics;
  postCount: number;
  totalEngagement: number;
}

export interface TikTokInsights {
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

export interface UseAnalyticsDataResult {
  feedsByAccount: Map<string, SocialAccountFeedItem[]>;
  allItems: SocialAccountFeedItem[];
  totals: NormalizedMetrics;
  perAccount: AccountMetrics[];
  topPosts: TopPost[];
  platformBreakdown: PlatformBreakdown[];
  tiktokInsights: TikTokInsights | null;
  isLoading: boolean;
  isAllLoaded: boolean;
  loadingAccountIds: string[];
  errors: Map<string, Error>;
}

export function useAnalyticsData(
  connectedAccounts: SocialAccount[]
): UseAnalyticsDataResult {
  const connectedIds = connectedAccounts.map((a) => a.id);

  const {
    data: feedsByAccount,
    allItems,
    isLoading,
    isAllLoaded,
    loadingAccountIds,
    errors,
  } = useAllAccountFeeds(connectedIds);

  // 1. Aggregate totals
  const totals = useMemo<NormalizedMetrics>(() => {
    const result: NormalizedMetrics = {
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0,
    };
    allItems.forEach((item) => {
      const m = extractMetrics(item.metrics);
      result.likes += m.likes;
      result.comments += m.comments;
      result.shares += m.shares;
      result.views += m.views;
    });
    return result;
  }, [allItems]);

  // 2. Per-account breakdown
  const perAccount = useMemo<AccountMetrics[]>(() => {
    return connectedAccounts.map((account) => {
      const items = feedsByAccount.get(account.id) || [];
      const agg: NormalizedMetrics = {
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0,
      };
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

  // 3. Top performing posts
  const topPosts = useMemo<TopPost[]>(() => {
    return [...allItems]
      .map((item) => ({
        item,
        engagement: totalEngagement(extractMetrics(item.metrics)),
        metrics: extractMetrics(item.metrics),
      }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 10);
  }, [allItems]);

  // 4. Platform comparison
  const platformBreakdown = useMemo<PlatformBreakdown[]>(() => {
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

  // 5. TikTok Business extended insights
  const tiktokInsights = useMemo<TikTokInsights | null>(() => {
    const tbItems = allItems
      .filter((item) => item.platform?.toLowerCase() === "tiktok_business")
      .map((item) => ({
        item,
        extended: extractExtendedMetrics(item),
        metrics: extractMetrics(item.metrics),
      }))
      .filter((x): x is typeof x & { extended: ExtendedTikTokMetrics } => 
        x.extended !== null
      );

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
    const retentionData =
      bestPost?.extended.videoViewRetention.map((p) => ({
        second: String(p.second),
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

  return {
    feedsByAccount,
    allItems,
    totals,
    perAccount,
    topPosts,
    platformBreakdown,
    tiktokInsights,
    isLoading,
    isAllLoaded,
    loadingAccountIds,
    errors,
  };
}
