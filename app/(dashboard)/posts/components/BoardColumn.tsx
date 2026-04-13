"use client";

import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PostCard } from "./PostCard";
import { statusConfig } from "../config";
import { cn } from "@/lib/utils";
import type { SocialPost, SocialPostResult } from "@/types/post-for-me-types";

interface BoardColumnProps {
  status: keyof typeof statusConfig;
  posts: SocialPost[];
  accounts: Map<
    string,
    {
      platform: string;
      username: string | null;
      profile_photo_url?: string | null;
    }
  >;
  resultsMap: Map<string, SocialPostResult[]>;
  onDelete: (id: string) => void;
  onRetry?: (post: SocialPost) => void;
  onEdit?: (post: SocialPost) => void;
  onPrefetch?: (id: string) => void;
}

const SPRING_TRANSITION = { type: "spring", stiffness: 400, damping: 30 };

export function BoardColumn({
  status,
  posts,
  accounts,
  resultsMap,
  onDelete,
  onRetry,
  onEdit,
  onPrefetch,
}: BoardColumnProps) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  // Color variations for header
  const headerStyles: Record<string, string> = {
    draft: "bg-amber-50/80 dark:bg-amber-500/10 border-amber-200/60 dark:border-amber-500/20",
    scheduled: "bg-blue-50/80 dark:bg-blue-500/10 border-blue-200/60 dark:border-blue-500/20",
    processing: "bg-violet-50/80 dark:bg-violet-500/10 border-violet-200/60 dark:border-violet-500/20",
    processed: "bg-emerald-50/80 dark:bg-emerald-500/10 border-emerald-200/60 dark:border-emerald-500/20",
    failed: "bg-red-50/80 dark:bg-red-500/10 border-red-200/60 dark:border-red-500/20",
  };

  return (
    <div className="flex flex-col h-full w-[300px] shrink-0">
      {/* Compact Header */}
      <motion.div 
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING_TRANSITION}
        className={cn(
          "flex items-center justify-between px-3 py-2.5 mb-2 rounded-xl",
          "border backdrop-blur-sm",
          headerStyles[status] || headerStyles.draft
        )}
      >
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-lg", config.bg)}>
            <StatusIcon className={cn("w-3.5 h-3.5", config.color)} />
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            {config.label}
          </span>
        </div>
        
        {/* Count badge */}
        <span className={cn(
          "text-[10px] font-medium px-2 py-0.5 rounded-full",
          "bg-white/80 dark:bg-slate-900/80",
          "text-slate-500"
        )}>
          {posts.length}
        </span>
      </motion.div>

      {/* Cards List */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full pr-2">
          <div className="space-y-2 pb-2">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, ...SPRING_TRANSITION }}
              >
                <PostCard
                  post={post}
                  accounts={accounts}
                  results={resultsMap.get(post.id)}
                  onDelete={onDelete}
                  onRetry={onRetry}
                  onEdit={onEdit}
                  onPrefetch={onPrefetch}
                />
              </motion.div>
            ))}
            
            {posts.length === 0 && (
              <div className={cn(
                "flex flex-col items-center justify-center py-6 px-4 rounded-xl",
                "bg-slate-50/50 dark:bg-slate-900/30",
                "border border-dashed border-slate-200 dark:border-slate-800",
                "text-center"
              )}>
                <StatusIcon className="w-6 h-6 text-slate-200 dark:text-slate-700 mb-1.5" />
                <p className="text-[11px] text-slate-400">No {config.label.toLowerCase()}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
