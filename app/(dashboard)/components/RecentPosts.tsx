"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Calendar } from "lucide-react";
import { platformIconsMap, getPlatformColor } from "@/lib/social-platforms";
import type { Variants } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface RecentPost {
  id: string;
  caption?: string | null;
  platforms: string[];
  status: string;
  scheduled_at?: string | null;
  created_at: string;
  results?: { success: boolean }[];
}

interface RecentPostsProps {
  posts: RecentPost[];
  fadeUp: Variants;
}

function getPlatformIcon(platform: string) {
  return platformIconsMap[platform.toLowerCase()];
}

export function RecentPosts({ posts, fadeUp }: RecentPostsProps) {
  return (
    <motion.section
      variants={fadeUp}
      className="col-span-2 row-span-2 card-premium p-5 flex flex-col"
      data-testid="recent-posts"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-800">Recent Posts</h2>
        <Link
          href="/posts"
          className="text-[11px] text-slate-400 hover:text-slate-600 font-medium flex items-center gap-0.5 transition-colors"
        >
          View all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <Calendar className="w-10 h-10 mb-2 opacity-40" />
          <p className="text-sm">No posts yet</p>
          <p className="text-xs mt-1">Create your first post to get started</p>
        </div>
      ) : (
        <div className="flex-1 space-y-2 overflow-y-auto" data-testid="posts-list">
          {posts.map((post) => (
            <Link
              key={post.id}
              href="/posts"
              data-testid={`post-item-${post.id}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
            >
              <div className="flex -space-x-1 flex-shrink-0">
                {post.platforms.slice(0, 3).map((platform, idx) => {
                  const Icon = getPlatformIcon(platform);
                  return (
                    <div
                      key={`${platform}-${idx}`}
                      className={`w-6 h-6 rounded-md flex items-center justify-center ring-2 ring-white dark:ring-slate-900 ${getPlatformColor(platform)}`}
                    >
                      {Icon && <Icon className="w-3 h-3 text-white" />}
                    </div>
                  );
                })}
                {post.platforms.length > 3 && (
                  <div className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center ring-2 ring-white dark:ring-slate-900 text-[9px] font-medium text-slate-600">
                    +{post.platforms.length - 3}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                  {post.caption || "(No caption)"}
                </p>
                <p className="text-[11px] text-slate-400">
                  {formatDistanceToNow(new Date(post.scheduled_at || post.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>

              {post.results?.some((r) => !r.success) && (
                <span className="text-[10px] text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">
                  Error
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </motion.section>
  );
}
