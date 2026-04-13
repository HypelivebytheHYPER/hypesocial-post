"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Loader2,
  RefreshCw,
  Users,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const TikTokInsightsCharts = dynamic(() => import("./analytics-charts"), {
  ssr: false,
  loading: () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
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
});

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  useSocialAccounts,
  pfmKeys,
} from "@/lib/hooks";
import { getMetricAvailability } from "@/lib/metrics";
import { useAnalyticsData } from "./hooks/useAnalyticsData";
import {
  OverviewCard,
  AccountBreakdown,
  TopPosts,
  PlatformComparison,
  MetricInfo,
} from "./components";

export default function AnalyticsPage() {
  const queryClient = useQueryClient();
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Get connected accounts
  const { data: accountsData, isLoading: accountsLoading } = useSocialAccounts();
  const accounts = accountsData?.data || [];
  const connectedAccounts = accounts.filter((a) => a.status === "connected");

  // Get all analytics data
  const {
    totals,
    perAccount,
    topPosts,
    platformBreakdown,
    tiktokInsights,
    isLoading: feedsLoading,
    isAllLoaded,
    loadingAccountIds,
  } = useAnalyticsData(connectedAccounts);

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

  // Compute metric availability caveats
  const unavailShares = connectedAccounts
    .filter((a) => !getMetricAvailability(a.platform).shares)
    .map((a) => a.platform);
  const unavailViews = connectedAccounts
    .filter((a) => !getMetricAvailability(a.platform).views)
    .map((a) => a.platform);

  return (
    <div className="space-y-6">
      {/* Section 1: Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <OverviewCard
          label="Total Likes"
          value={totals.likes}
          icon={Heart}
          color="text-pink-500"
          bg="bg-pink-50"
          isLoading={feedsLoading && topPosts.length === 0}
          isPartial={!isAllLoaded}
        />
        <OverviewCard
          label="Total Comments"
          value={totals.comments}
          icon={MessageCircle}
          color="text-blue-500"
          bg="bg-blue-50"
          isLoading={feedsLoading && topPosts.length === 0}
          isPartial={!isAllLoaded}
        />
        <OverviewCard
          label="Total Shares"
          value={totals.shares}
          icon={Share2}
          color="text-emerald-500"
          bg="bg-emerald-50"
          isLoading={feedsLoading && topPosts.length === 0}
          isPartial={!isAllLoaded}
          caveatNote={
            unavailShares.length > 0
              ? `Shares not available for ${unavailShares.join(", ")}`
              : undefined
          }
        />
        <OverviewCard
          label="Total Views"
          value={totals.views}
          icon={Eye}
          color="text-purple-500"
          bg="bg-purple-50"
          isLoading={feedsLoading && topPosts.length === 0}
          isPartial={!isAllLoaded}
          caveatNote={
            unavailViews.length > 0
              ? `Views not available for ${unavailViews.join(", ")}`
              : undefined
          }
        />
      </div>

      <Separator className="divider-soft" />

      {/* Section 3: Per-Account Breakdown */}
      <div>
        <h2 className="section-title mb-4">Per-Account Breakdown</h2>
        <AccountBreakdown accounts={perAccount} />
      </div>

      <Separator className="divider-soft" />

      {/* Section 4: Top Performing Posts */}
      <div>
        <h2 className="section-title mb-4">Top Performing Posts</h2>
        <TopPosts 
          posts={topPosts} 
          isLoading={feedsLoading} 
          accounts={connectedAccounts}
        />
      </div>

      <Separator className="divider-soft" />

      {/* Section 5: Platform Comparison */}
      {platformBreakdown.length > 0 && (
        <div>
          <h2 className="section-title mb-4">Platform Comparison</h2>
          <PlatformComparison breakdown={platformBreakdown} />
        </div>
      )}

      {/* Section 6: TikTok Business Insights */}
      {tiktokInsights && (
        <>
          <Separator className="divider-soft" />
          <TikTokInsightsCharts data={tiktokInsights} />
        </>
      )}

      <Separator className="divider-soft" />

      {/* Section 7: Metric Variance Info */}
      <MetricInfo />
    </div>
  );
}

// Import icons for OverviewCard
import { Heart, MessageCircle, Share2, Eye } from "lucide-react";
