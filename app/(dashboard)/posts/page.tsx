"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
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
  Clock,
  Sparkles,
  Filter,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

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
  useSocialAccounts,
  usePostResultsMap,
  pfmKeys,
} from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { usePostsLayout } from "./layout";
import { usePostFilters } from "./hooks/usePostFilters";
import type { StatusFilter } from "./config";
import { platformIconsMap } from "@/lib/social-platforms";
import { proxyMediaUrl } from "@/lib/utils";
import type { SocialPost, SocialPostResult } from "@/types/post-for-me-types";
import dynamic from "next/dynamic";

const CalendarView = dynamic(() => import("./_components/CalendarView").then(mod => ({ default: mod.CalendarView })), {
  loading: () => <div className="h-96 flex items-center justify-center"><Skeleton className="w-full h-full" /></div>,
});

type ViewMode = "grid" | "list" | "calendar";

const STATUS_CONFIG: Record<string, { 
  label: string; 
  color: string;
  bg: string;
  icon: React.ElementType;
}> = {
  draft: { 
    label: "Draft", 
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    icon: FileEdit,
  },
  scheduled: { 
    label: "Scheduled", 
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    icon: Clock,
  },
  processing: { 
    label: "Processing", 
    color: "text-violet-700 dark:text-violet-300",
    bg: "bg-violet-100 dark:bg-violet-900/30",
    icon: Sparkles,
  },
  processed: { 
    label: "Published", 
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    icon: CheckCircle2,
  },
  failed: { 
    label: "Failed", 
    color: "text-red-700 dark:text-red-300",
    bg: "bg-red-100 dark:bg-red-900/30",
    icon: XCircle,
  },
};

// Header with Stats
function PageHeader({ 
  stats, 
  isLoading 
}: { 
  stats: { total: number; draft: number; scheduled: number; processed: number; failed: number };
  isLoading: boolean;
}) {
  const statItems = [
    { key: "total", label: "All Posts", value: stats.total },
    { key: "draft", label: "Drafts", value: stats.draft },
    { key: "scheduled", label: "Scheduled", value: stats.scheduled },
    { key: "processed", label: "Published", value: stats.processed },
    { key: "failed", label: "Failed", value: stats.failed },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Posts</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage and schedule your content</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex flex-wrap gap-2">
        {statItems.map((item) => (
          <div 
            key={item.key}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800/50"
          >
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              {isLoading ? <Skeleton className="w-4 h-4" /> : item.value}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Filter Bar
function FilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  viewMode,
  onViewChange,
  onRefresh,
  isRefreshing,
  onNewPost,
  resultCount,
}: {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusChange: (s: StatusFilter) => void;
  viewMode: ViewMode;
  onViewChange: (v: ViewMode) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onNewPost: () => void;
  resultCount: number;
}) {
  const filters = [
    { id: "all", label: "All" },
    { id: "draft", label: "Drafts" },
    { id: "scheduled", label: "Scheduled" },
    { id: "processed", label: "Published" },
    { id: "failed", label: "Failed" },
  ];

  return (
    <div className="sticky top-0 z-30 bg-[var(--color-bg)]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 py-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                {filters.find(f => f.id === statusFilter)?.label || "Filter"}
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {filters.map((f) => (
                <DropdownMenuItem key={f.id} onClick={() => onStatusChange(f.id as StatusFilter)}>
                  {f.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Toggle */}
          <div className="flex items-center border rounded-md overflow-hidden">
            {[
              { id: "grid" as ViewMode, icon: LayoutGrid },
              { id: "list" as ViewMode, icon: ListIcon },
              { id: "calendar" as ViewMode, icon: Calendar },
            ].map(({ id, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onViewChange(id)}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === id
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400"
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
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-9 w-9"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          </Button>

          {/* New Post */}
          <Button size="sm" onClick={onNewPost} className="gap-2">
            <Plus className="w-4 h-4" />
            New Post
          </Button>
        </div>
      </div>

      {/* Results count */}
      {resultCount > 0 && (
        <div className="mt-3 text-sm text-slate-500">
          Showing {resultCount} post{resultCount !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

// Post Card
function PostCard({ 
  post, 
  accounts, 
  onEdit, 
  onDelete,
  viewMode,
}: { 
  post: SocialPost; 
  accounts: Map<string, { platform: string; username: string | null }>;
  onEdit: () => void;
  onDelete: () => void;
  viewMode: ViewMode;
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

  if (viewMode === "list") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="group flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
        onClick={onEdit}
      >
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
          {hasMedia && !imageError ? (
            <Image
              src={proxyMediaUrl(firstMedia.url)}
              alt=""
              width={64}
              height={64}
              className="object-cover w-full h-full"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileEdit className="w-6 h-6 text-slate-400" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
            {post.caption || <span className="text-slate-400 italic">No caption</span>}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("text-xs px-2 py-0.5 rounded-full flex items-center gap-1", config?.bg, config?.color)}>
              <StatusIcon className="w-3 h-3" />
              {config?.label || status}
            </span>
            <span className="text-xs text-slate-400">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Platforms */}
        <div className="hidden sm:flex items-center gap-1">
          {platforms.slice(0, 3).map((p) => {
            const Icon = platformIconsMap[p];
            return Icon ? <Icon key={p} className="w-4 h-4 text-slate-400" /> : null;
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            <Edit3 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-red-600">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  }

  // Grid view
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group cursor-pointer"
      onClick={onEdit}
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-shadow">
        {/* Media */}
        <div className="aspect-video relative bg-slate-100 dark:bg-slate-800">
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
              <FileEdit className="w-12 h-12 text-slate-400" />
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <span className={cn("text-xs px-2 py-1 rounded-full flex items-center gap-1", config?.bg, config?.color)}>
              <StatusIcon className="w-3 h-3" />
              {config?.label || status}
            </span>
          </div>

          {/* Hover Actions */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              <Edit3 className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-2 mb-2">
            {post.caption || <span className="text-slate-400 italic">No caption</span>}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
            <div className="flex items-center gap-1">
              {platforms.slice(0, 3).map((p) => {
                const Icon = platformIconsMap[p];
                return Icon ? <Icon key={p} className="w-4 h-4 text-slate-400" /> : null;
              })}
            </div>
          </div>
        </div>
      </div>
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

  // URL params
  useEffect(() => {
    const compose = searchParams.get("compose");
    const edit = searchParams.get("edit");
    if (compose === "new") openCompose();
    else if (edit) { setEditingPostId(edit); openCompose(edit); }
  }, [searchParams, openCompose, setEditingPostId]);

  // Data
  const { data: postsData, isLoading, isFetching, error } = usePosts(
    { limit: 100 },
    { placeholderData: (previous) => previous }
  );
  const { data: accountsData } = useSocialAccounts();
  const posts = postsData?.data ?? [];
  const accounts = accountsData?.data ?? [];

  const accountsMap = useMemo(() => {
    const map = new Map();
    accounts.forEach((acc) => map.set(acc.id, acc));
    return map;
  }, [accounts]);

  const { data: resultsMap } = usePostResultsMap();
  const { statusFilter, setStatusFilter, searchQuery, setSearchQuery, filteredPosts } = usePostFilters(posts);

  // Stats - properly calculated
  const stats = useMemo(() => {
    const failedCount = resultsMap ? Array.from(resultsMap.entries()).filter(([_, results]) => 
      results.some((r: SocialPostResult) => !r.success)
    ).length : 0;
    
    return {
      total: posts.length,
      draft: posts.filter((p) => p.status === "draft").length,
      scheduled: posts.filter((p) => p.status === "scheduled").length,
      processed: posts.filter((p) => p.status === "processed").length,
      failed: failedCount,
    };
  }, [posts, resultsMap]);

  const deletePost = useDeletePost();

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <PageHeader stats={stats} isLoading={isLoading} />

        {/* Filter Bar */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          viewMode={viewMode}
          onViewChange={setViewMode}
          onRefresh={handleRefresh}
          isRefreshing={isFetching}
          onNewPost={() => openCompose()}
          resultCount={filteredPosts.length}
        />

        {/* Content */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className={cn(
              "grid gap-6",
              viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
            )}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : viewMode === "calendar" ? (
            <CalendarView
              posts={filteredPosts}
              onSelectDate={(date) => console.log(date)}
              onSelectPost={(post) => router.push(`/posts/${post.id}/edit`)}
              onCreatePost={() => openCompose()}
            />
          ) : (
            <div className={cn(
              viewMode === "grid" 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "divide-y divide-slate-200 dark:divide-slate-800"
            )}>
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  accounts={accountsMap}
                  onEdit={() => router.push(`/posts/${post.id}/edit`)}
                  onDelete={() => handleDelete(post.id)}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!isLoading && filteredPosts.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <FileEdit className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              {searchQuery ? "No posts found" : "No posts yet"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              {searchQuery ? "Try adjusting your search" : "Create your first post to get started"}
            </p>
            {!searchQuery && (
              <Button onClick={() => openCompose()}>
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
