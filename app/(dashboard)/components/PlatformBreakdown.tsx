"use client";

import Link from "next/link";
import type { Variants } from "framer-motion";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { platformIconsMap, getPlatformColor } from "@/lib/social-platforms";
import type { SocialAccount } from "@/types/post-for-me-types";

interface PlatformBreakdownProps {
  accounts: SocialAccount[];
  fadeUp: Variants;
}

function getPlatformIcon(platform: string) {
  return platformIconsMap[platform.toLowerCase()];
}

export function PlatformBreakdown({ accounts, fadeUp }: PlatformBreakdownProps) {
  const platformCounts = accounts.reduce((acc, account) => {
    const platform = account.platform;
    acc[platform] = (acc[platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedPlatforms = Object.entries(platformCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const total = accounts.length;

  return (
    <motion.section
      variants={fadeUp}
      className="col-span-2 card-premium p-5"
      data-testid="platform-breakdown"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-800">Connected Platforms</h2>
        <Link
          href="/accounts/connect"
          className="text-[11px] text-slate-400 hover:text-slate-600 font-medium flex items-center gap-0.5 transition-colors"
        >
          Manage <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-6 text-slate-400">
          <p className="text-sm">No accounts connected</p>
          <p className="text-xs mt-1">Connect your first platform</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedPlatforms.map(([platform, count]) => {
            const Icon = getPlatformIcon(platform);
            const percentage = Math.round((count / total) * 100);
            return (
              <div key={platform} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${getPlatformColor(platform)}`}
                >
                  {Icon && <Icon className="w-4 h-4 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700 capitalize truncate">
                      {platform}
                    </span>
                    <span className="text-xs text-slate-500">{count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getPlatformColor(platform)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.section>
  );
}
