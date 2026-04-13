"use client";

import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PostCard } from "./PostCard";
import { cn } from "@/lib/utils";
import type { SocialPost, SocialPostResult } from "@/types/post-for-me-types";

interface PostsListProps {
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

export function PostsList({
  posts,
  accounts,
  resultsMap,
  onDelete,
  onRetry,
  onEdit,
  onPrefetch,
}: PostsListProps) {
  return (
    <div className="h-full overflow-hidden">
      <ScrollArea className="h-full pr-2">
        <div className={cn(
          "space-y-1 pb-2",
          "bg-slate-50/30 dark:bg-slate-900/30 rounded-xl p-2"
        )}>
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02, ...SPRING_TRANSITION }}
            >
              <PostCard
                post={post}
                accounts={accounts}
                results={resultsMap.get(post.id)}
                onDelete={onDelete}
                onRetry={onRetry}
                onEdit={onEdit}
                onPrefetch={onPrefetch}
                viewMode="list"
              />
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
