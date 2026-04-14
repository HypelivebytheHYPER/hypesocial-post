"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  addWeeks,
  addDays,
  startOfDay,
  isPast,
} from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SocialPost } from "@/types/post-for-me-types";
import { getPlatformIcon } from "@/lib/social-platforms";

// Constants - defined outside component to avoid recreation
const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

interface CalendarViewProps {
  posts: SocialPost[];
  onSelectDate: (date: Date) => void;
  onSelectPost: (post: SocialPost) => void;
  onCreatePost: (date?: Date) => void;
  selectedDate?: Date;
}

type ViewMode = "month" | "week" | "day";

const platformColors: Record<string, string> = {
  instagram: "bg-gradient-to-br from-purple-500 to-pink-500",
  facebook: "bg-blue-600",
  twitter: "bg-slate-900",
  linkedin: "bg-blue-700",
  tiktok: "bg-black",
  youtube: "bg-red-600",
};

const statusColors: Record<string, string> = {
  draft: "bg-amber-400",
  scheduled: "bg-blue-400",
  processing: "bg-violet-400",
  processed: "bg-emerald-400",
};

export function CalendarView({
  posts,
  onSelectDate,
  onSelectPost,
  onCreatePost,
  selectedDate,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);

  // Get posts grouped by date
  const postsByDate = useMemo(() => {
    const grouped = new Map<string, SocialPost[]>();
    posts.forEach((post) => {
      if (post.scheduled_at) {
        const dateKey = format(new Date(post.scheduled_at), "yyyy-MM-dd");
        if (!grouped.has(dateKey)) {
          grouped.set(dateKey, []);
        }
        grouped.get(dateKey)!.push(post);
      }
    });
    return grouped;
  }, [posts]);

  // Calendar grid calculation
  const calendarDays = useMemo(() => {
    let start: Date, end: Date;

    if (viewMode === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      start = startOfWeek(monthStart);
      end = endOfWeek(monthEnd);
    } else if (viewMode === "week") {
      start = startOfWeek(currentDate);
      end = endOfWeek(currentDate);
    } else {
      start = startOfDay(currentDate);
      end = startOfDay(currentDate);
    }

    return eachDayOfInterval({ start, end });
  }, [currentDate, viewMode]);

  const navigate = (direction: "prev" | "next" | "today") => {
    if (direction === "today") {
      setCurrentDate(new Date());
      return;
    }

    setCurrentDate((prev) => {
      const multiplier = direction === "prev" ? -1 : 1;
      if (viewMode === "month") {
        return addMonths(prev, multiplier);
      } else if (viewMode === "week") {
        return addWeeks(prev, multiplier);
      } else {
        return addDays(prev, multiplier);
      }
    });
  };

  const getPostsForDay = useCallback((day: Date) => {
    const dateKey = format(day, "yyyy-MM-dd");
    return postsByDate.get(dateKey) || [];
  }, [postsByDate]);

  // Use constant defined outside component

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {viewMode === "month" && format(currentDate, "MMMM yyyy")}
            {viewMode === "week" && `Week of ${format(startOfWeek(currentDate), "MMM d")}`}
            {viewMode === "day" && format(currentDate, "EEEE, MMMM d, yyyy")}
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => navigate("prev")}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("today")}>
              Today
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("next")}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            {(["month", "week", "day"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize",
                  viewMode === mode
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          <Button onClick={() => onCreatePost(selectedDate)}>
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        {WEEK_DAYS.map((day) => (
          <div
            key={day}
            className="px-4 py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div
            className={cn(
              "grid",
              viewMode === "month" ? "grid-cols-7 auto-rows-fr" : "grid-cols-7"
            )}
            style={{
              minHeight: viewMode === "month" ? "600px" : "auto",
            }}
          >
            {calendarDays.map((day, index) => {
              const dayPosts = getPostsForDay(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);
              const isCurrentMonth = isSameMonth(day, currentDate);


              return (
                <motion.div
                  key={day.toISOString()}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.005 }}
                  onClick={() => onSelectDate(day)}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={cn(
                    "relative border-b border-r border-slate-200 dark:border-slate-800 min-h-[120px] p-2 cursor-pointer transition-all",
                    !isCurrentMonth && "bg-slate-50/30 dark:bg-slate-900/30",
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-500/10 ring-2 ring-inset ring-blue-400"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                    isTodayDate && !isSelected && "bg-blue-50/30 dark:bg-blue-500/5"
                  )}
                >
                  {/* Date Number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                        isTodayDate
                          ? "bg-blue-500 text-white"
                          : isSelected
                          ? "text-blue-600 bg-blue-100"
                          : "text-slate-700 dark:text-slate-300",
                        !isCurrentMonth && "text-slate-400"
                      )}
                    >
                      {format(day, "d")}
                    </span>

                    {/* Add button on hover */}
                    <AnimatePresence>
                      {hoveredDay && isSameDay(hoveredDay, day) && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onCreatePost(day);
                          }}
                          className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Posts for this day */}
                  <div className="space-y-1">
                    {dayPosts.slice(0, 4).map((post, i) => {
                      const platform = post.social_accounts?.[0]?.platform;
                      const status = post.status;
                      const Icon = platform ? getPlatformIcon(platform) : null;

                      return (
                        <motion.div
                          key={post.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPost(post);
                          }}
                          className={cn(
                            "flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs cursor-pointer border-l-2",
                            "bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all",
                            status === "scheduled" && "border-l-blue-400",
                            status === "draft" && "border-l-amber-400",
                            status === "processing" && "border-l-violet-400",
                            status === "processed" && "border-l-emerald-400"
                          )}
                        >
                          {Icon && platform && (
                            <div
                              className={cn(
                                "w-4 h-4 rounded-full flex items-center justify-center",
                                platformColors[platform] || "bg-slate-400"
                              )}
                            >
                              <Icon className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                          <span className="flex-1 truncate text-slate-700 dark:text-slate-300">
                            {post.caption?.slice(0, 30) || "No caption"}
                            {post.caption && post.caption.length > 30 && "..."}
                          </span>
                          {post.scheduled_at && (
                            <span className="text-[10px] text-slate-400">
                              {format(new Date(post.scheduled_at), "h:mm a")}
                            </span>
                          )}
                        </motion.div>
                      );
                    })}

                    {/* Show more indicator */}
                    {dayPosts.length > 4 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDate(day);
                        }}
                        className="w-full text-center text-[10px] text-slate-400 py-1 hover:text-slate-600"
                      >
                        +{dayPosts.length - 4} more
                      </button>
                    )}
                  </div>

                  {/* Dot indicators for many posts */}
                  {dayPosts.length > 0 && dayPosts.length <= 4 && (
                    <div className="absolute bottom-2 left-2 right-2 flex justify-center gap-1">
                      {dayPosts.slice(0, 5).map((post, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            statusColors[post.status] || "bg-slate-300"
                          )}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Legend & Stats */}
      <div className="px-6 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-xs font-medium text-slate-500">Status:</span>
            {[
              { label: "Draft", color: "bg-amber-400" },
              { label: "Scheduled", color: "bg-blue-400" },
              { label: "Processing", color: "bg-violet-400" },
              { label: "Published", color: "bg-emerald-400" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", item.color)} />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          <div className="text-xs text-slate-500">
            {posts.filter((p) => p.scheduled_at).length} scheduled posts
          </div>
        </div>
      </div>
    </div>
  );
}
