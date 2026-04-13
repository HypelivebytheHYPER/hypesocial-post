"use client";

import {
  Heart,
  MessageCircle,
  Share2,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { platformIconsMap } from "@/lib/social-platforms";
import { formatNumber } from "@/lib/metrics";
import type { TopPost } from "../hooks/useAnalyticsData";
import type { SocialAccount } from "@/types/post-for-me-types";

interface TopPostsProps {
  posts: TopPost[];
  isLoading: boolean;
  accounts: SocialAccount[];
}

export function TopPosts({ posts, isLoading, accounts }: TopPostsProps) {
  if (isLoading && posts.length === 0) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400 mb-2" />
        <p className="text-sm text-slate-400">Loading posts...</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-slate-400">
          No posts with engagement data yet
        </p>
      </div>
    );
  }

  return (
    <div className="card-premium divide-y divide-slate-100">
      {posts.map(({ item, metrics }, index) => {
        const PlatformIcon = platformIconsMap[item.platform?.toLowerCase()];
        const account = accounts.find(
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

            {/* Metric pills — hidden on mobile to prevent overflow */}
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
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
      })}
    </div>
  );
}
