"use client";

import { Info } from "lucide-react";
import { platformIconsMap, getPlatformColor } from "@/lib/social-platforms";
import { formatNumber, PLATFORM_NOTES } from "@/lib/metrics";
import type { PlatformBreakdown } from "../hooks/useAnalyticsData";

interface PlatformComparisonProps {
  breakdown: PlatformBreakdown[];
}

export function PlatformComparison({ breakdown }: PlatformComparisonProps) {
  if (breakdown.length === 0) return null;

  const maxEngagement = breakdown[0]?.totalEngagement || 1;

  return (
    <div className="card-premium p-4 space-y-4">
      {breakdown.map(({ platform, metrics, postCount, totalEngagement: eng }) => {
        const PlatformIcon = platformIconsMap[platform];
        const barWidth = Math.max((eng / maxEngagement) * 100, 2);
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
                <span className="text-xs text-slate-400">{postCount} posts</span>
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
                <Info className="w-3 h-3 flex-shrink-0" />{" "}
                {PLATFORM_NOTES[platform]![0]}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
