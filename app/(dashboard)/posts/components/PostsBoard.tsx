"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BoardColumn } from "./BoardColumn";
import { statusConfig } from "../config";
import type { SocialPost, SocialPostResult } from "@/types/post-for-me-types";
import type { StatusFilter } from "../config";

interface PostsBoardProps {
  postsByStatus: Record<string, SocialPost[]>;
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
  filter?: StatusFilter;
}

const statusOrder: (keyof typeof statusConfig)[] = [
  "draft",
  "scheduled", 
  "processing",
  "processed",
  "failed",
];

export function PostsBoard({
  postsByStatus,
  accounts,
  resultsMap,
  onDelete,
  onRetry,
  onEdit,
  onPrefetch,
  filter = "all",
}: PostsBoardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const visibleStatuses = filter === "all" ? statusOrder : [filter];

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true });
      return () => el.removeEventListener("scroll", checkScroll);
    }
  }, []);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = 320;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative h-full">
      {/* Scroll buttons - minimal */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className={cn(
            "absolute left-0 top-8 z-10",
            "w-7 h-7 rounded-full flex items-center justify-center",
            "bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-700",
            "text-slate-500 hover:text-slate-700 transition-all",
            "hover:scale-105 active:scale-95"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}
      
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className={cn(
            "absolute right-0 top-8 z-10",
            "w-7 h-7 rounded-full flex items-center justify-center",
            "bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-700",
            "text-slate-500 hover:text-slate-700 transition-all",
            "hover:scale-105 active:scale-95"
          )}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className={cn(
          "h-full flex gap-3 overflow-x-auto overflow-y-hidden",
          "snap-x snap-mandatory",
          "scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent",
          "pb-2"
        )}
        style={{
          scrollbarWidth: "thin",
          msOverflowStyle: "none",
        }}
      >
        {visibleStatuses.map((status, index) => (
          <motion.div
            key={status}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className="snap-start shrink-0 h-full"
          >
            <BoardColumn
              status={status}
              posts={postsByStatus[status] || []}
              accounts={accounts}
              resultsMap={resultsMap}
              onDelete={onDelete}
              onRetry={onRetry}
              onEdit={onEdit}
              onPrefetch={onPrefetch}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
