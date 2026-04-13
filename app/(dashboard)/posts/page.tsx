"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence, type Transition } from "framer-motion";
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
} from "lucide-react";
import { Surface, VStack, HStack } from "@/components/design-system";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow, format, isToday, isTomorrow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Skeleton, ListSkeleton } from "@/components/ui/skeleton";
import { EmptyPostsState, EmptySearchState } from "@/components/ui/empty-state";
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
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

// Dynamic import for CalendarView to reduce initial bundle size
const CalendarView = dynamic(() => import("./_components/CalendarView").then(mod => ({ default: mod.CalendarView })), {
  loading: () => <div className="h-full flex items-center justify-center"><Skeleton className="w-full h-full bg-slate-200 dark:bg-slate-800" /></div>,
});

// Types
type ViewMode = "grid" | "list" | "calendar";

// Constants - defined outside component to avoid recreation
const SPRING_TRANSITION: Transition = { type: "spring", stiffness: 400, damping: 30 };
const STATUS_DOT_COLORS: Record<string, string> = {
  draft: "bg-amber-500",
  scheduled: "bg-blue-500",
  processing: "bg-violet-500",
  processed: "bg-emerald-500",
  failed: "bg-red-500",
};

// ==================== SIDEBAR COMPONENT ====================
interface SidebarProps {
  stats: Record<string, number>;
  currentFilter: StatusFilter;
  onFilterChange: (f: StatusFilter) => void;
  viewMode: ViewMode;
  onViewChange: (v: ViewMode) => void;
}

const FILTER_ITEMS = [
  { id: "all" as StatusFilter, label: "All Posts", icon: Layers },
  { id: "draft" as StatusFilter, label: "Drafts", icon: FileEdit },
  { id: "scheduled" as StatusFilter, label: "Scheduled", icon: Calendar },
  { id: "processed" as StatusFilter, label: "Published", icon: CheckCircle2 },
  { id: "failed" as StatusFilter, label: "Failed", icon: XCircle },
];

const VIEW_MODES = [
  { id: "grid", icon: LayoutGrid, label: "Grid" },
  { id: "list", icon: ListIcon, label: "List" },
  { id: "calendar", icon: CalendarDays, label: "Cal" },
] as const;

function Sidebar({
  stats,
  currentFilter,
  onFilterChange,
  viewMode,
  onViewChange,
}: SidebarProps) {
  return (
    <div className="w-56 lg:w-64 shrink-0 h-full flex flex-col p-4 gap-6">
      {/* Header - Clean */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white dark:text-slate-900" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Posts</h2>
          <p className="text-xs text-slate-500">Manage content</p>
        </div>
      </div>

      {/* Filters - Clean, minimal */}
      <div className="flex-1 min-h-0">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2 px-2">
          Filters
        </p>
        <div className="space-y-0.5">
          {FILTER_ITEMS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={cn(
                "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors duration-150",
                currentFilter === filter.id
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              )}
            >
              <div className="flex items-center gap-2">
                <filter.icon className="w-4 h-4 text-slate-400" />
                <span className="font-medium">{filter.label}</span>
              </div>
              <span className={cn(
                "text-xs tabular-nums",
                currentFilter === filter.id 
                  ? "text-slate-900 dark:text-white font-medium" 
                  : "text-slate-400"
              )}>
                {stats[filter.id] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* View Mode - Clean */}
      <div>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2 px-2">
          View
        </p>
        <div className="flex gap-1 p-1 bg-slate-100/80 dark:bg-slate-800/50 rounded-lg">
          {VIEW_MODES.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => onViewChange(id as ViewMode)}
              className={cn(
                "flex-1 flex items-center justify-center py-1.5 rounded-md text-xs transition-colors duration-150",
                viewMode === id
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
              title={label}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== POST CARD - CLEAN DESIGN ====================
interface PostCardProps {
  post: SocialPost;
  accounts: Map<string, { platform: string; username: string | null; profile_photo_url?: string | null }>;
  results?: SocialPostResult[];
  onEdit: (post: SocialPost) => void;
  onDelete: (id: string) => void;
  onRetry?: (post: SocialPost) => void;
  viewMode: ViewMode;
  priority?: boolean;
}

function PostCard({
  post,
  accounts,
  results,
  onEdit,
  onDelete,
  onRetry,
  viewMode,
  priority = false,
}: PostCardProps) {
  const [imageError, setImageError] = useState(false);
  
  const status = post.status;
  const hasError = results?.some((r) => !r.success);
  const firstMedia = post.media?.[0];
  const hasMedia = !!firstMedia;

  // Memoize date formatting
  const dateLabel = useMemo(() => {
    if (!post.scheduled_at) return formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
    const date = new Date(post.scheduled_at);
    if (isToday(date)) return `Today, ${format(date, "h:mm a")}`;
    if (isTomorrow(date)) return `Tomorrow, ${format(date, "h:mm a")}`;
    return format(date, "MMM d");
  }, [post.scheduled_at, post.created_at]);

  // Memoize platform list
  const platformList = useMemo(() => {
    return post.social_accounts?.slice(0, 3).map((sa) => {
      const acc = accounts.get(sa.id);
      return acc?.platform;
    }).filter(Boolean) as string[] || [];
  }, [post.social_accounts, accounts]);

  // Memoize handlers
  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(post);
  }, [onEdit, post]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(post.id);
  }, [onDelete, post.id]);

  if (viewMode === "list") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING_TRANSITION}
        className="group flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800/80 shadow-sm hover:shadow-md border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer"
        onClick={() => onEdit(post)}
      >
        {/* Status Dot */}
        <div className={cn("w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white dark:ring-slate-700", STATUS_DOT_COLORS[status])} />

        {/* Thumbnail */}
        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 shrink-0 shadow-inner">
          {hasMedia && !imageError ? (
            <Image
              src={proxyMediaUrl(firstMedia.url)}
              alt=""
              fill
              sizes="56px"
              priority={priority}
              loading={priority ? "eager" : "lazy"}
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {post.media?.[0]?.url?.match(/video|mp4|mov/i) ? (
                <Film className="w-6 h-6 text-slate-400" />
              ) : (
                <ImageIcon className="w-6 h-6 text-slate-400" />
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-700 dark:text-slate-200 font-medium truncate">
            {post.caption || <span className="text-slate-400 italic">No caption</span>}
          </p>
          <p className="text-xs text-slate-400 mt-1">{dateLabel}</p>
        </div>

        {/* Platforms */}
        <div className="flex -space-x-2 shrink-0">
          {platformList.map((platform, i) => {
            const Icon = platform ? platformIconsMap[platform.toLowerCase()] : null;
            return Icon ? (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center ring-2 ring-white dark:ring-slate-800 shadow-sm"
              >
                <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              </div>
            ) : null;
          })}
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button 
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Post actions"
            >
              <MoreHorizontal className="w-4 h-4 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl">
            {status === "draft" && (
              <DropdownMenuItem onClick={handleEdit} className="text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-700 rounded-xl">
                <Edit3 className="w-4 h-4 mr-2" /> Edit
              </DropdownMenuItem>
            )}
            {hasError && onRetry && (
              <DropdownMenuItem onClick={() => onRetry(post)} className="text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-700 rounded-xl">
                <RefreshCw className="w-4 h-4 mr-2" /> Retry
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleDelete} className="text-rose-500 focus:bg-rose-50 dark:focus:bg-rose-500/10 rounded-xl">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    );
  }

  // Grid View - Modern Cards (Not Square!)
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={SPRING_TRANSITION}
      className="group cursor-pointer"
      onClick={() => onEdit(post)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 mb-3 shadow-sm group-hover:shadow-lg transition-shadow">
        {hasMedia && !imageError ? (
          <Image
            src={proxyMediaUrl(firstMedia.url)}
            alt=""
            fill
            sizes="(max-width: 768px) 50vw, 20vw"
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
            {post.media?.[0]?.url?.match(/video|mp4|mov/i) ? (
              <Film className="w-12 h-12 mb-2" />
            ) : (
              <ImageIcon className="w-12 h-12 mb-2" />
            )}
          </div>
        )}
        
        {/* Status Dot - Top Left */}
        <div className="absolute top-3 left-3">
          <div className={cn("w-2.5 h-2.5 rounded-full ring-2 ring-slate-950", STATUS_DOT_COLORS[status])} />
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-white text-sm line-clamp-2 font-medium">
              {post.caption || "No caption"}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="absolute top-3 right-3 flex gap-2">
            {status === "draft" && (
              <button
                onClick={handleEdit}
                className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Edit post"
              >
                <Edit3 className="w-4 h-4 text-white" />
              </button>
            )}
            <button
              onClick={handleDelete}
              className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-red-500/80 transition-colors"
              aria-label="Delete post"
            >
              <Trash2 className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Platform Icons - Bottom Right */}
        <div className="absolute bottom-3 right-3 flex -space-x-1.5">
          {platformList.slice(0, 3).map((platform, i) => {
            const Icon = platform ? platformIconsMap[platform.toLowerCase()] : null;
            return Icon ? (
              <div
                key={i}
                className="w-6 h-6 rounded-full bg-slate-900/80 backdrop-blur-sm flex items-center justify-center ring-2 ring-slate-950"
              >
                <Icon className="w-3 h-3 text-slate-300" />
              </div>
            ) : null;
          })}
        </div>
      </div>

      {/* Caption - Below Image */}
      <div className="px-1">
        <p className="text-sm text-slate-300 line-clamp-1 mb-1">
          {post.caption || <span className="text-slate-500 italic">No caption</span>}
        </p>
        <p className="text-xs text-slate-500">{dateLabel}</p>
      </div>
    </motion.div>
  );
}

// ==================== VIRTUALIZED POSTS GRID ====================
interface VirtualizedPostsGridProps {
  posts: SocialPost[];
  accountsMap: Map<string, { platform: string; username: string | null; profile_photo_url?: string | null }>;
  resultsMap: Map<string, SocialPostResult[]>;
  viewMode: ViewMode;
  onEdit: (post: SocialPost) => void;
  onDelete: (id: string) => void;
  onRetry?: (post: SocialPost) => void;
}

function VirtualizedPostsGrid({
  posts,
  accountsMap,
  resultsMap,
  viewMode,
  onEdit,
  onDelete,
  onRetry,
}: VirtualizedPostsGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Grid configuration
  const isListView = viewMode === "list";
  const columnCount = isListView ? 1 : 5; // 1 for list, 5 for grid
  const rowCount = Math.ceil(posts.length / columnCount);
  const itemHeight = isListView ? 80 : 320; // px
  const itemWidth = isListView ? '100%' : `${100 / columnCount}%`;

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 3,
  });

  const virtualRows = virtualizer.getVirtualItems();

  return (
    <div 
      ref={parentRef}
      className="h-full overflow-auto"
      style={{ height: 'calc(100vh - 140px)' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualRows.map((virtualRow) => {
          const rowIndex = virtualRow.index;
          const startIndex = rowIndex * columnCount;
          const rowPosts = posts.slice(startIndex, startIndex + columnCount);

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className={isListView ? "px-4 md:px-6" : "px-4 md:px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"}
            >
              {rowPosts.map((post, index) => (
                <PostCard
                  key={post.id}
                  post={post}
                  accounts={accountsMap}
                  results={resultsMap.get(post.id)}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onRetry={onRetry}
                  viewMode={viewMode}
                  priority={rowIndex === 0 && index === 0}  // First visible post gets priority
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== MAIN PAGE ====================
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
    if (compose === "open") {
      if (edit) setEditingPostId(edit);
      openCompose(edit || undefined);
      const url = new URL(window.location.href);
      url.searchParams.delete("compose");
      url.searchParams.delete("edit");
      window.history.replaceState({}, "", url);
    }
  }, [searchParams, openCompose, setEditingPostId]);

  // Data fetching with placeholderData for instant UI (no loading spinners on refresh)
  const { data: posts = [], isLoading, error, isFetching } = usePosts(
    { limit: 100 },
    { 
      select: (r) => r?.data ?? [],
      placeholderData: (previous) => previous, // Show cached data immediately
    }
  );
  
  const { data: accounts = [] } = useSocialAccounts(
    100, 0, undefined, undefined,
    { 
      select: (r) => r?.data ?? [],
      placeholderData: (previous) => previous, // Show cached data immediately
    }
  );
  
  const { data: resultsMap = new Map() } = usePostResultsMap(100);
  const deletePost = useDeletePost();
  const retryPost = useRetryPost();

  const { statusFilter, setStatusFilter, searchQuery, setSearchQuery, filteredPosts } = usePostFilters(posts);

  // Memoize accounts map
  const accountsMap = useMemo(() => 
    new Map(accounts.map(a => [a.id, { 
      platform: a.platform, 
      username: a.username, 
      profile_photo_url: a.profile_photo_url 
    }])),
    [accounts]
  );

  // Memoize stats calculation
  const stats = useMemo(() => {
    let failed = 0;
    resultsMap.forEach((results: SocialPostResult[]) => {
      if (results.some((r: SocialPostResult) => !r.success)) failed++;
    });
    
    return {
      total: posts.length,
      draft: posts.filter(p => p.status === "draft").length,
      scheduled: posts.filter(p => p.status === "scheduled").length,
      processed: posts.filter(p => p.status === "processed").length,
      failed,
    };
  }, [posts, resultsMap]);

  // Memoize handlers
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

  // Only show loading skeleton on initial load (no cached data)
  // On refresh, placeholderData shows previous data instantly
  if (isLoading && !posts.length) {
    return (
      <div className="h-full flex bg-bg-base">
        <div className="w-64 border-r border-border-subtle bg-bg-elevated" />
        <div className="flex-1 p-8">
          <ListSkeleton count={8} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-400">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex bg-[#fafafa] dark:bg-[#0a0a0a]">
      {/* Sidebar */}
      <Sidebar
        stats={stats}
        currentFilter={statusFilter}
        onFilterChange={setStatusFilter}
        viewMode={viewMode}
        onViewChange={setViewMode}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header - Clean, minimal */}
        <header className="sticky top-0 z-20 h-14 px-6 flex items-center justify-between shrink-0 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-[#111111]/70 backdrop-blur-md">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 rounded-lg bg-slate-100/80 dark:bg-slate-800/50 border-0 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-600"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isFetching}
              className="h-8 px-3 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
            </Button>
            <Button 
              size="sm" 
              onClick={() => openCompose()} 
              className="h-8 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 text-sm font-medium rounded-lg"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Post
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
            {filteredPosts.length === 0 ? (
              searchQuery ? (
                <EmptySearchState query={searchQuery} />
              ) : (
                <EmptyPostsState onCreate={() => openCompose()} />
              )
            ) : viewMode === "calendar" ? (
              <div className="h-[calc(100vh-8rem)]">
                <CalendarView
                  posts={filteredPosts}
                  onSelectDate={(date) => console.log(date)}
                  onSelectPost={(post) => router.push(`/posts/${post.id}/edit`)}
                  onCreatePost={(_date) => openCompose()}
                />
              </div>
            ) : (
              <VirtualizedPostsGrid
                posts={filteredPosts}
                accountsMap={accountsMap}
                resultsMap={resultsMap}
                viewMode={viewMode}
                onEdit={(post) => router.push(`/posts/${post.id}/edit`)}
                onDelete={handleDelete}
                onRetry={(p) => retryPost.mutate(p)}
              />
            )}
        </div>
      </div>
    </div>
  );
}
