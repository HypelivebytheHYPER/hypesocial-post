"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  RefreshCw, 
  AlertCircle, 
  Search, 
  Plus,
  Calendar,
  CheckCircle2,
  XCircle,
  FileEdit,
  LayoutGrid,
  List as ListIcon,
  MoreHorizontal,
  Trash2,
  Edit3,
  Layers,
  CalendarDays,
  ImageIcon,
  Film,
  Sparkles,
  ArrowUpRight,
  Filter,
  Clock,
  BarChart3,
  ChevronDown,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow, format, isToday, isTomorrow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  usePosts,
  useDeletePost,
  useRetryPost,
  useSocialAccounts,
  usePostResultsMap,
  pfmKeys,
} from "@/lib/hooks";
import { usePostsLayout } from "./layout";
import { usePostFilters } from "./hooks/usePostFilters";
import type { StatusFilter } from "./config";
import { platformIconsMap } from "@/lib/social-platforms";
import { proxyMediaUrl } from "@/lib/utils";
import type { SocialPost, SocialPostResult } from "@/types/post-for-me-types";
import dynamic from "next/dynamic";
import { Text3DFlip } from "@/components/magicui/text-3d-flip";

// Dynamic import for CalendarView
const CalendarView = dynamic(() => import("./_components/CalendarView").then(mod => ({ default: mod.CalendarView })), {
  loading: () => <div className="h-full flex items-center justify-center"><Skeleton className="w-full h-full" /></div>,
});

type ViewMode = "list" | "grid" | "calendar";

// TweakCN AI Style - Glassmorphism Status Config
const STATUS_CONFIG: Record<string, { 
  label: string; 
  gradient: string;
  icon: React.ElementType;
  glow: string;
}> = {
  draft: { 
    label: "Draft", 
    gradient: "from-amber-500/20 to-orange-500/20",
    icon: FileEdit,
    glow: "shadow-amber-500/20",
  },
  scheduled: { 
    label: "Scheduled", 
    gradient: "from-blue-500/20 to-cyan-500/20",
    icon: Clock,
    glow: "shadow-blue-500/20",
  },
  processing: { 
    label: "Processing", 
    gradient: "from-violet-500/20 to-purple-500/20",
    icon: Sparkles,
    glow: "shadow-violet-500/20",
  },
  processed: { 
    label: "Published", 
    gradient: "from-emerald-500/20 to-teal-500/20",
    icon: CheckCircle2,
    glow: "shadow-emerald-500/20",
  },
  failed: { 
    label: "Failed", 
    gradient: "from-red-500/20 to-rose-500/20",
    icon: XCircle,
    glow: "shadow-red-500/20",
  },
};

// Glassmorphism Card Component
function GlassCard({ 
  children, 
  className,
  hover = true 
}: { 
  children: React.ReactNode; 
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl",
      "bg-white/40 dark:bg-white/5",
      "backdrop-blur-xl",
      "border border-white/20 dark:border-white/10",
      "shadow-[0_8px_32px_rgba(0,0,0,0.08)]",
      hover && "hover:shadow-[0_8px_32px_rgba(99,102,241,0.15)] hover:border-indigo-500/20",
      "transition-all duration-500",
      className
    )}>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent dark:from-white/10 pointer-events-none" />
      {children}
    </div>
  );
}

// Animated Counter
function AnimatedCounter({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
      >
        {value}
      </motion.div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</div>
    </div>
  );
}

// Hero Section with 3D Text
function PostsHero({ stats }: { stats: Record<string, number> }) {
  return (
    <div className="relative overflow-hidden rounded-3xl mb-8">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-500/20 dark:via-purple-500/20 dark:to-pink-500/20" />
      <div className="absolute inset-0 backdrop-blur-3xl" />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      
      <div className="relative px-8 py-12 md:py-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <div className="mb-4">
              <Text3DFlip
                className="font-bold text-4xl md:text-6xl"
                textClassName="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
                flipTextClassName="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
                rotateDirection="top"
                staggerDuration={0.04}
                staggerFrom="first"
                transition={{ type: "spring", damping: 25, stiffness: 160 }}
              >
                Posts
              </Text3DFlip>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-lg max-w-md">
              Manage and schedule your content across all platforms
            </p>
          </div>
          
          {/* Stats Grid */}
          <div className="flex gap-8">
            <AnimatedCounter value={stats.total || 0} label="Total" />
            <AnimatedCounter value={stats.scheduled || 0} label="Scheduled" />
            <AnimatedCounter value={stats.processed || 0} label="Published" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Floating Action Button
function FloatingActionButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "fixed bottom-8 right-8 z-50",
        "w-14 h-14 rounded-full",
        "bg-gradient-to-r from-indigo-600 to-purple-600",
        "text-white shadow-lg shadow-indigo-500/30",
        "flex items-center justify-center",
        "hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-105",
        "transition-all duration-300"
      )}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <Plus className="w-6 h-6" />
    </motion.button>
  );
}

// Glass Filter Pill
function FilterPill({ 
  active, 
  onClick, 
  children,
  count
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative px-4 py-2 rounded-full text-sm font-medium",
        "transition-all duration-300",
        active 
          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
          : "bg-white/50 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-white/10 border border-white/20 dark:border-white/10"
      )}
    >
      {children}
      {count !== undefined && (
        <span className={cn(
          "ml-2 px-1.5 py-0.5 rounded-full text-xs",
          active ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700"
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

// Glass Post Card
function GlassPostCard({ 
  post, 
  accounts, 
  onEdit, 
  onDelete 
}: { 
  post: SocialPost; 
  accounts: Map<string, { platform: string; username: string | null }>;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  const status = post.status;
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const StatusIcon = config?.icon || FileEdit;
  
  const firstMedia = post.media?.[0];
  const hasMedia = !!firstMedia;

  const platforms = useMemo(() => {
    return post.social_accounts?.map((sa) => {
      const acc = accounts.get(sa.id);
      return acc?.platform;
    }).filter(Boolean) as string[] || [];
  }, [post.social_accounts, accounts]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <GlassCard className="h-full">
        {/* Media */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl">
          {hasMedia && !imageError ? (
            <Image
              src={proxyMediaUrl(firstMedia.url)}
              alt=""
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
              {post.media?.[0]?.url?.match(/video|mp4|mov/i) ? (
                <Film className="w-12 h-12 text-slate-400" />
              ) : (
                <ImageIcon className="w-12 h-12 text-slate-400" />
              )}
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <div className={cn(
              "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5",
              "bg-gradient-to-r",
              config?.gradient || "from-slate-500/20 to-slate-600/20",
              "backdrop-blur-md border border-white/20",
              config?.glow || "shadow-slate-500/20",
              "shadow-lg"
            )}>
              <StatusIcon className="w-3 h-3" />
              {config?.label || status}
            </div>
          </div>

          {/* Hover Actions */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
            <Button
              size="sm"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white border-0"
            >
              <Edit3 className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="bg-red-500/80 backdrop-blur-md hover:bg-red-500 text-white border-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 relative">
          <h3 className="font-medium text-slate-900 dark:text-white line-clamp-2 mb-2">
            {post.caption || <span className="text-slate-400 italic">No caption</span>}
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {platforms.slice(0, 3).map((platform) => {
                const Icon = platformIconsMap[platform];
                if (!Icon) return null;
                return (
                  <div 
                    key={platform} 
                    className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
                  >
                    <Icon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  </div>
                );
              })}
              {platforms.length > 3 && (
                <span className="text-xs text-slate-400 ml-1">+{platforms.length - 3}</span>
              )}
            </div>
            <span className="text-xs text-slate-400">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// Main Page
export default function PostsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openCompose, setEditingPostId } = usePostsLayout();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // URL params effect
  useEffect(() => {
    const compose = searchParams.get("compose");
    const edit = searchParams.get("edit");
    if (compose === "new") {
      openCompose();
    } else if (edit) {
      setEditingPostId(edit);
      openCompose(edit);
    }
  }, [searchParams, openCompose, setEditingPostId]);

  // Data fetching
  const { data: postsData, isLoading, isFetching, error } = usePosts(
    { limit: 100 },
    { placeholderData: (previous) => previous }
  );
  const { data: accountsData } = useSocialAccounts();
  const posts = postsData?.data ?? [];
  const accounts = accountsData?.data ?? [];

  // Create maps
  const accountsMap = useMemo(() => {
    const map = new Map();
    accounts.forEach((acc) => map.set(acc.id, acc));
    return map;
  }, [accounts]);

  const { data: resultsMap } = usePostResultsMap();

  // Filters
  const { statusFilter, setStatusFilter, searchQuery, setSearchQuery, filteredPosts } = usePostFilters(posts);

  // Stats
  const stats = useMemo(() => {
    // Get failed posts from resultsMap
    const failedCount = resultsMap ? Array.from(resultsMap.entries()).filter(([_, results]) => 
      results.some((r: SocialPostResult) => !r.success)
    ).length : 0;
    
    return {
      total: posts.length,
      draft: posts.filter((p: SocialPost) => p.status === "draft").length,
      scheduled: posts.filter((p: SocialPost) => p.status === "scheduled").length,
      processed: posts.filter((p: SocialPost) => p.status === "processed").length,
      failed: failedCount,
    };
  }, [posts, resultsMap]);

  // Mutations
  const deletePost = useDeletePost();
  const retryPost = useRetryPost();

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Delete this post?")) return;
    try {
      await deletePost.mutateAsync(id);
      toast.success("Post deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }, [deletePost]);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: pfmKeys.posts() });
  }, [queryClient]);

  if (isLoading && !posts.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="h-64 rounded-3xl bg-white/50 dark:bg-white/5 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 rounded-2xl bg-white/50 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero with 3D Text */}
        <PostsHero stats={stats} />

        {/* Filters Bar */}
        <GlassCard className="mb-8 p-4" hover={false}>
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-xl bg-white/50 dark:bg-white/5 border-white/20 dark:border-white/10 focus:bg-white dark:focus:bg-white/10 transition-colors"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <FilterPill active={statusFilter === "all"} onClick={() => setStatusFilter("all")} count={stats.total}>
                All
              </FilterPill>
              <FilterPill active={statusFilter === "draft"} onClick={() => setStatusFilter("draft")} count={stats.draft}>
                Drafts
              </FilterPill>
              <FilterPill active={statusFilter === "scheduled"} onClick={() => setStatusFilter("scheduled")} count={stats.scheduled}>
                Scheduled
              </FilterPill>
              <FilterPill active={statusFilter === "processed"} onClick={() => setStatusFilter("processed")} count={stats.processed}>
                Published
              </FilterPill>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10">
              {[
                { id: "grid", icon: LayoutGrid },
                { id: "list", icon: ListIcon },
                { id: "calendar", icon: CalendarDays },
              ].map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setViewMode(id as ViewMode)}
                  className={cn(
                    "p-2.5 rounded-lg transition-all duration-300",
                    viewMode === id
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>

            {/* Refresh */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isFetching}
              className="h-12 w-12 rounded-xl bg-white/50 dark:bg-white/5 border-white/20 dark:border-white/10"
            >
              <RefreshCw className={cn("w-5 h-5", isFetching && "animate-spin")} />
            </Button>
          </div>
        </GlassCard>

        {/* Content */}
        <AnimatePresence mode="wait">
          {viewMode === "calendar" ? (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-[600px]"
            >
              <GlassCard className="h-full p-6" hover={false}>
                <CalendarView
                  posts={filteredPosts}
                  onSelectDate={(date) => console.log(date)}
                  onSelectPost={(post) => router.push(`/posts/${post.id}/edit`)}
                  onCreatePost={(_date) => openCompose()}
                />
              </GlassCard>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                "grid gap-6",
                viewMode === "grid" 
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                  : "grid-cols-1"
              )}
            >
              {filteredPosts.map((post) => (
                <GlassPostCard
                  key={post.id}
                  post={post}
                  accounts={accountsMap}
                  onEdit={() => router.push(`/posts/${post.id}/edit`)}
                  onDelete={() => handleDelete(post.id)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {filteredPosts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-indigo-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              {searchQuery ? "No posts found" : "No posts yet"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              {searchQuery ? "Try adjusting your search" : "Create your first post to get started"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => openCompose()}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </Button>
            )}
          </motion.div>
        )}
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton onClick={() => openCompose()} />
    </div>
  );
}
