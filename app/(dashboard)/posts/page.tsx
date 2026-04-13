"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
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
  ChevronDown,
  Filter,
  Clock,
  BarChart3,
  ArrowUpRight,
  Play,
  RotateCcw,
  CalendarClock,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow, format, isToday, isTomorrow, isPast } from "date-fns";

import { Button } from "@/components/ui/button";
import { Skeleton, ListSkeleton } from "@/components/ui/skeleton";
import { EmptyPostsState, EmptySearchState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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

// Dynamic import for CalendarView
const CalendarView = dynamic(() => import("./_components/CalendarView").then(mod => ({ default: mod.CalendarView })), {
  loading: () => <div className="h-full flex items-center justify-center"><Skeleton className="w-full h-full bg-slate-200 dark:bg-slate-800" /></div>,
});

type ViewMode = "list" | "grid" | "calendar";
type SortBy = "newest" | "oldest" | "scheduled";

// Status configuration
const STATUS_CONFIG: Record<string, { 
  label: string; 
  color: string; 
  bg: string;
  icon: React.ElementType;
}> = {
  draft: { 
    label: "Draft", 
    color: "text-amber-600 dark:text-amber-400", 
    bg: "bg-amber-50 dark:bg-amber-500/10",
    icon: FileEdit,
  },
  scheduled: { 
    label: "Scheduled", 
    color: "text-blue-600 dark:text-blue-400", 
    bg: "bg-blue-50 dark:bg-blue-500/10",
    icon: CalendarClock,
  },
  processing: { 
    label: "Processing", 
    color: "text-violet-600 dark:text-violet-400", 
    bg: "bg-violet-50 dark:bg-violet-500/10",
    icon: Clock,
  },
  processed: { 
    label: "Published", 
    color: "text-emerald-600 dark:text-emerald-400", 
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    icon: CheckCircle2,
  },
  failed: { 
    label: "Failed", 
    color: "text-red-600 dark:text-red-400", 
    bg: "bg-red-50 dark:bg-red-500/10",
    icon: XCircle,
  },
};

// ==================== SIDEBAR - SYSTEM NAVIGATION ====================
interface SidebarProps {
  stats: Record<string, number>;
  currentFilter: StatusFilter;
  onFilterChange: (f: StatusFilter) => void;
  currentSort: SortBy;
  onSortChange: (s: SortBy) => void;
}

function Sidebar({
  stats,
  currentFilter,
  onFilterChange,
  currentSort,
  onSortChange,
}: SidebarProps) {
  const total = stats.total || 0;
  
  return (
    <div className="w-56 shrink-0 h-full flex flex-col border-r border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-[#111111]/50">
      {/* Header */}
      <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-slate-900 dark:bg-white flex items-center justify-center">
            <Layers className="w-3.5 h-3.5 text-white dark:text-slate-900" />
          </div>
          <div>
            <h2 className="font-medium text-slate-900 dark:text-white text-sm">Posts</h2>
            <p className="text-[11px] text-slate-500">{total.toLocaleString()} total</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Section: Status */}
        <div className="px-3 mb-4">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1 px-2">
            Status
          </p>
          <nav className="space-y-0.5">
            {[
              { id: "all" as StatusFilter, label: "All Posts", count: stats.total },
              { id: "draft" as StatusFilter, label: "Drafts", count: stats.draft },
              { id: "scheduled" as StatusFilter, label: "Scheduled", count: stats.scheduled },
              { id: "processed" as StatusFilter, label: "Published", count: stats.processed },
              { id: "failed" as StatusFilter, label: "Failed", count: stats.failed },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => onFilterChange(item.id)}
                className={cn(
                  "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors",
                  currentFilter === item.id
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                <span className="font-medium">{item.label}</span>
                <span className={cn(
                  "text-xs tabular-nums",
                  currentFilter === item.id 
                    ? "text-slate-900 dark:text-white" 
                    : "text-slate-400"
                )}>
                  {item.count || 0}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Section: Sort */}
        <div className="px-3">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1 px-2">
            Sort By
          </p>
          <div className="space-y-0.5">
            {[
              { id: "newest" as SortBy, label: "Newest First" },
              { id: "oldest" as SortBy, label: "Oldest First" },
              { id: "scheduled" as SortBy, label: "Scheduled Date" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => onSortChange(item.id)}
                className={cn(
                  "w-full flex items-center px-2 py-1.5 rounded-md text-sm transition-colors",
                  currentSort === item.id
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full border mr-2 flex items-center justify-center",
                  currentSort === item.id
                    ? "border-slate-900 dark:border-white bg-slate-900 dark:bg-white"
                    : "border-slate-300 dark:border-slate-600"
                )}>
                  {currentSort === item.id && <Check className="w-2.5 h-2.5 text-white dark:text-slate-900" />}
                </div>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== COMMAND BAR ====================
interface CommandBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: ViewMode;
  onViewChange: (v: ViewMode) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onNewPost: () => void;
  resultCount: number;
  totalCount: number;
}

function CommandBar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewChange,
  onRefresh,
  isRefreshing,
  onNewPost,
  resultCount,
  totalCount,
}: CommandBarProps) {
  return (
    <div className="h-14 px-4 flex items-center gap-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-[#111111]/70 backdrop-blur-md">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-8 rounded-md bg-slate-100/80 dark:bg-slate-800/50 border-0 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-slate-300 dark:focus-visible:ring-slate-600"
        />
      </div>

      {/* Results count */}
      <div className="text-xs text-slate-500">
        {resultCount === totalCount ? (
          `${totalCount.toLocaleString()} posts`
        ) : (
          <span className="text-slate-700 dark:text-slate-300 font-medium">{resultCount}</span>
        )}
      </div>

      <div className="flex-1" />

      {/* View Toggle */}
      <div className="flex items-center gap-1 p-1 bg-slate-100/80 dark:bg-slate-800/50 rounded-md">
        {[
          { id: "list", icon: ListIcon, label: "List" },
          { id: "grid", icon: LayoutGrid, label: "Grid" },
          { id: "calendar", icon: CalendarDays, label: "Calendar" },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onViewChange(id as ViewMode)}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors",
              viewMode === id
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
            title={label}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-8 px-2.5 text-slate-500 hover:text-slate-700"
        >
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
        </Button>
        <Button 
          size="sm" 
          onClick={onNewPost}
          className="h-8 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 text-sm font-medium rounded-md"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          New Post
        </Button>
      </div>
    </div>
  );
}

// ==================== POST ROW - TABLE STYLE ====================
interface PostRowProps {
  post: SocialPost;
  accounts: Map<string, { platform: string; username: string | null; profile_photo_url?: string | null }>;
  results?: SocialPostResult[];
  onEdit: (post: SocialPost) => void;
  onDelete: (id: string) => void;
  onRetry?: (post: SocialPost) => void;
}

function PostRow({ post, accounts, results, onEdit, onDelete, onRetry }: PostRowProps) {
  const [imageError, setImageError] = useState(false);
  const status = post.status;
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  
  const hasError = results?.some((r) => !r.success);
  const firstMedia = post.media?.[0];
  const hasMedia = !!firstMedia;

  const dateLabel = useMemo(() => {
    if (!post.scheduled_at) return formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
    const date = new Date(post.scheduled_at);
    if (isToday(date)) return `Today, ${format(date, "h:mm a")}`;
    if (isTomorrow(date)) return `Tomorrow, ${format(date, "h:mm a")}`;
    return format(date, "MMM d, h:mm a");
  }, [post.scheduled_at, post.created_at]);

  const platforms = useMemo(() => {
    return post.social_accounts?.map((sa) => {
      const acc = accounts.get(sa.id);
      return acc?.platform;
    }).filter(Boolean) as string[] || [];
  }, [post.social_accounts, accounts]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(post.id);
  }, [onDelete, post.id]);

  const handleRetry = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRetry?.(post);
  }, [onRetry, post]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="group flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/50 cursor-pointer transition-colors"
      onClick={() => onEdit(post)}
    >
      {/* Status */}
      <div className={cn("w-2 h-2 rounded-full", config?.bg?.replace('bg-', 'bg-')?.replace('50', '500')?.replace('/10', '') || "bg-slate-500")} />

      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
        {hasMedia && !imageError ? (
          <Image
            src={proxyMediaUrl(firstMedia.url)}
            alt=""
            width={40}
            height={40}
            className="object-cover w-full h-full"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {post.media?.[0]?.url?.match(/video|mp4|mov/i) ? (
              <Film className="w-4 h-4 text-slate-400" />
            ) : (
              <ImageIcon className="w-4 h-4 text-slate-400" />
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-900 dark:text-slate-100 font-medium truncate">
          {post.caption || <span className="text-slate-400 italic">No caption</span>}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={cn("text-[11px] font-medium px-1.5 py-0.5 rounded", config?.bg, config?.color)}>
            {config?.label}
          </span>
          <span className="text-xs text-slate-400">{dateLabel}</span>
        </div>
      </div>

      {/* Platforms */}
      <div className="flex items-center gap-1 shrink-0">
        {platforms.slice(0, 4).map((platform) => {
          const Icon = platformIconsMap[platform];
          if (!Icon) return null;
          return (
            <div 
              key={platform} 
              className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
              title={platform}
            >
              <Icon className="w-3 h-3 text-slate-600 dark:text-slate-400" />
            </div>
          );
        })}
        {platforms.length > 4 && (
          <span className="text-[10px] text-slate-400 px-1">+{platforms.length - 4}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {hasError && onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRetry}
            className="h-7 px-2 text-slate-500 hover:text-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="h-7 px-2 text-slate-400 hover:text-red-600"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-slate-500"
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}

// ==================== POST GRID CARD ====================
interface PostCardProps {
  post: SocialPost;
  accounts: Map<string, { platform: string; username: string | null; profile_photo_url?: string | null }>;
  results?: SocialPostResult[];
  onEdit: (post: SocialPost) => void;
  onDelete: (id: string) => void;
  onRetry?: (post: SocialPost) => void;
}

function PostCard({ post, accounts, results, onEdit, onDelete, onRetry }: PostCardProps) {
  const [imageError, setImageError] = useState(false);
  const status = post.status;
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  
  const firstMedia = post.media?.[0];
  const hasMedia = !!firstMedia;

  const dateLabel = useMemo(() => {
    if (!post.scheduled_at) return formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
    const date = new Date(post.scheduled_at);
    if (isToday(date)) return `Today, ${format(date, "h:mm a")}`;
    if (isTomorrow(date)) return `Tomorrow, ${format(date, "h:mm a")}`;
    return format(date, "MMM d");
  }, [post.scheduled_at, post.created_at]);

  const platforms = useMemo(() => {
    return post.social_accounts?.map((sa) => {
      const acc = accounts.get(sa.id);
      return acc?.platform;
    }).filter(Boolean) as string[] || [];
  }, [post.social_accounts, accounts]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="group relative rounded-lg border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#111111] overflow-hidden cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
      onClick={() => onEdit(post)}
    >
      {/* Media */}
      <div className="aspect-[4/3] relative bg-slate-100 dark:bg-slate-800">
        {hasMedia && !imageError ? (
          <Image
            src={proxyMediaUrl(firstMedia.url)}
            alt=""
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {post.media?.[0]?.url?.match(/video|mp4|mov/i) ? (
              <Film className="w-8 h-8 text-slate-400" />
            ) : (
              <ImageIcon className="w-8 h-8 text-slate-400" />
            )}
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded", config?.bg, config?.color)}>
            {config?.label}
          </span>
        </div>

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 text-xs"
            onClick={(e) => { e.stopPropagation(); onEdit(post); }}
          >
            <Edit3 className="w-3.5 h-3.5 mr-1" />
            Edit
          </Button>
          {onRetry && (
            <Button
              size="sm"
              variant="secondary"
              className="h-8 text-xs"
              onClick={(e) => { e.stopPropagation(); onRetry(post); }}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Retry
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <p className="text-sm text-slate-900 dark:text-slate-100 font-medium line-clamp-2 mb-2">
          {post.caption || <span className="text-slate-400 italic">No caption</span>}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">{dateLabel}</span>
          <div className="flex items-center gap-1">
            {platforms.slice(0, 3).map((platform) => {
              const Icon = platformIconsMap[platform];
              if (!Icon) return null;
              return <Icon key={platform} className="w-3.5 h-3.5 text-slate-400" />;
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ==================== VIRTUALIZED LIST ====================
interface PostsListProps {
  posts: SocialPost[];
  accountsMap: Map<string, { platform: string; username: string | null; profile_photo_url?: string | null }>;
  resultsMap?: Map<string, SocialPostResult[]> | null;
  viewMode: ViewMode;
  onEdit: (post: SocialPost) => void;
  onDelete: (id: string) => void;
  onRetry?: (post: SocialPost) => void;
}

function PostsList({ posts, accountsMap, resultsMap, viewMode, onEdit, onDelete, onRetry }: PostsListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            accounts={accountsMap}
            results={resultsMap?.get(post.id)}
            onEdit={onEdit}
            onDelete={onDelete}
            onRetry={onRetry}
          />
        ))}
      </div>
    );
  }

  // List view
  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
      {posts.map((post) => (
        <PostRow
          key={post.id}
          post={post}
          accounts={accountsMap}
          results={resultsMap?.get(post.id)}
          onEdit={onEdit}
          onDelete={onDelete}
          onRetry={onRetry}
        />
      ))}
    </div>
  );
}

// ==================== MAIN PAGE ====================
export default function PostsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openCompose, setEditingPostId } = usePostsLayout();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sortBy, setSortBy] = useState<SortBy>("newest");

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
    {
      placeholderData: (previous) => previous,
    }
  );
  const { data: accountsData } = useSocialAccounts();
  const posts = postsData?.data ?? [];
  const accounts = accountsData?.data ?? [];

  // Create maps for efficient lookup
  const accountsMap = useMemo(() => {
    const map = new Map();
    accounts.forEach((acc) => map.set(acc.id, acc));
    return map;
  }, [accounts]);

  const { data: resultsMap } = usePostResultsMap();

  // Filters
  const { statusFilter, setStatusFilter, searchQuery, setSearchQuery, filteredPosts } = usePostFilters(posts);

  // Sorting
  const sortedPosts = useMemo(() => {
    const sorted = [...filteredPosts];
    switch (sortBy) {
      case "newest":
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case "oldest":
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case "scheduled":
        return sorted.sort((a, b) => {
          if (!a.scheduled_at && !b.scheduled_at) return 0;
          if (!a.scheduled_at) return 1;
          if (!b.scheduled_at) return -1;
          return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
        });
      default:
        return sorted;
    }
  }, [filteredPosts, sortBy]);

  // Stats
  const stats = useMemo(() => {
    let failed = 0;
    resultsMap?.forEach((results: SocialPostResult[]) => {
      if (results.some((r: SocialPostResult) => !r.success)) failed++;
    });
    return {
      total: posts.length,
      draft: posts.filter((p) => p.status === "draft").length,
      scheduled: posts.filter((p) => p.status === "scheduled").length,
      processed: posts.filter((p) => p.status === "processed").length,
      failed,
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
      <div className="h-full flex bg-[#fafafa] dark:bg-[#0a0a0a]">
        <div className="w-56 shrink-0 h-full border-r border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-[#111111]/50" />
        <div className="flex-1 p-8">
          <ListSkeleton count={8} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0a0a0a]">
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
        currentSort={sortBy}
        onSortChange={setSortBy}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Command Bar */}
        <CommandBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewChange={setViewMode}
          onRefresh={handleRefresh}
          isRefreshing={isFetching}
          onNewPost={() => openCompose()}
          resultCount={filteredPosts.length}
          totalCount={posts.length}
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
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
            <PostsList
              posts={sortedPosts}
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
