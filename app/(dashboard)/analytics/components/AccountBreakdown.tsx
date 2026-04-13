"use client";

import {
  Heart,
  MessageCircle,
  Share2,
  Eye,
  AlertCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { MiniStat } from "./MiniStat";
import { platformIconsMap } from "@/lib/social-platforms";
import { proxyMediaUrl } from "@/lib/utils";
import { getMetricAvailability } from "@/lib/metrics";
import type { AccountMetrics } from "../hooks/useAnalyticsData";

interface AccountBreakdownProps {
  accounts: AccountMetrics[];
}

export function AccountBreakdown({ accounts }: AccountBreakdownProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {accounts.map(({ account, metrics, postCount, error, isLoading }) => {
        const PlatformIcon = platformIconsMap[account.platform.toLowerCase()];

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
                  <p className="text-xs text-red-500">Failed to load feed</p>
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
  );
}
