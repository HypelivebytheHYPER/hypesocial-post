"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Plus,
  RefreshCw,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  MoreHorizontal,
  ExternalLink,
  Trash2,
  LayoutGrid,
  List,
} from "lucide-react";
import { platformIconsMap } from "@/lib/social-platforms";
import { cn, proxyMediaUrl } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LazyVideo } from "@/components/ui/lazy-video";

import {
  usePosts,
  useDeletePost,
  useRetryPost,
  useAccounts,
  usePostResultsList,
  pfmKeys,
} from "@/lib/hooks/usePostForMe";
import type { SocialPost, SocialPostResult } from "@/types/post-for-me";

type ViewMode = "board" | "list";
type StatusFilter =
  | "all"
  | "draft"
  | "scheduled"
  | "processing"
  | "processed"
  | "failed";

const statusConfig = {
  draft: {
    label: "Draft",
    icon: FileEdit,
    color: "bg-slate-100 text-slate-600 border-slate-200",
    accent: "border-slate-300",
    bg: "bg-slate-50/50",
  },
  scheduled: {
    label: "Scheduled",
    icon: Clock,
    color: "bg-blue-50 text-blue-600 border-blue-200",
    accent: "border-blue-300",
    bg: "bg-blue-50/30",
  },
  processing: {
    label: "Processing",
    icon: RefreshCw,
    color: "bg-amber-50 text-amber-600 border-amber-200",
    accent: "border-amber-300",
    bg: "bg-amber-50/30",
  },
  processed: {
    label: "Published",
    icon: CheckCircle2,
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    accent: "border-emerald-300",
    bg: "bg-emerald-50/30",
  },
  failed: {
    label: "Failed",
    icon: AlertCircle,
    color: "bg-red-50 text-red-600 border-red-200",
    accent: "border-red-300",
    bg: "bg-red-50/30",
  },
};

// Platform icons are now imported from centralized config
// Using platformIconsMap from @/lib/social-platforms

// --- Animation variants ---
const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

function PostCard({
  post,
  onDelete,
  onRetry,
  account,
  results,
}: {
  post: SocialPost;
  onDelete: (id: string) => void;
  onRetry?: (post: SocialPost) => void;
  account?: {
    platform: string;
    username: string | null;
    profile_photo_url?: string | null;
  };
  results?: SocialPostResult[];
}) {
  const PlatformIcon = account?.platform
    ? platformIconsMap[account.platform.toLowerCase()] || ExternalLink
    : ExternalLink;
  const status = post.status as keyof typeof statusConfig;
  const config = statusConfig[status] || statusConfig.draft;
  const StatusIcon = config.icon;

  // Get result for this post's account (if available)
  const postResult = results?.find(
    (r) => r.social_account_id === post.social_accounts?.[0]?.id,
  );
  const hasError = postResult?.success === false;
  const isPending = post.status === "processing";

  return (
    <div className="card-premium p-4 group hover:shadow-lg transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          {account ? (
            <Avatar className="w-6 h-6">
              <AvatarImage src={account.profile_photo_url ? proxyMediaUrl(account.profile_photo_url) : ""} />
              <AvatarFallback className="text-[10px] bg-slate-100">
                {account.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
              <PlatformIcon className="w-3 h-3 text-slate-400" />
            </div>
          )}
          <span className="text-xs text-slate-500 font-medium">
            {account?.username || "Unknown Platform"}
          </span>
        </div>
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 h-5 ${config.color}`}
        >
          <StatusIcon className="w-3 h-3 mr-1" />
          {config.label}
        </Badge>
      </div>

      {/* Content */}
      <p className="text-sm text-slate-700 line-clamp-3 mb-3 leading-relaxed">
        {post.caption}
      </p>

      {/* Media Preview */}
      {post.media && post.media.length > 0 && (
        <div className="relative rounded-xl overflow-hidden mb-3 bg-slate-100">
          {post.media[0]?.url?.match(/\.(mp4|mov|avi|webm)/i) ? (
            <LazyVideo
              src={post.media[0]!.url}
              className="w-full h-32"
              controls
              preload="metadata"
            />
          ) : (
            <img
              src={proxyMediaUrl(post.media[0]!.url)}
              alt="Post media"
              className="w-full h-32 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          {post.media.length > 1 && (
            <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/50 rounded-full text-[10px] text-white">
              +{post.media.length - 1}
            </div>
          )}
        </div>
      )}

      {/* Per-Platform Results */}
      {post.status !== "draft" && post.status !== "scheduled" && (
        <div className="mb-3">
          {postResult ? (
            <div
              className={`flex items-center gap-2 text-xs ${postResult.success ? "text-emerald-600" : "text-red-600"}`}
            >
              {postResult.success ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Posted to {account?.platform || "platform"}</span>
                  {postResult.platform_data?.url && (
                    <a
                      href={postResult.platform_data.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-slate-600 ml-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span
                    className="truncate"
                    title={
                      postResult.error
                        ? String(postResult.error)
                        : "Failed to post"
                    }
                  >
                    {postResult.error
                      ? String(postResult.error)
                      : "Failed to post"}
                  </span>
                </>
              )}
            </div>
          ) : isPending ? (
            <div className="flex items-center gap-2 text-xs text-amber-600">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Processing on {account?.platform || "platform"}...</span>
            </div>
          ) : null}
        </div>
      )}

      {/* Schedule/Date Info */}
      <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
        {post.scheduled_at ? (
          <>
            <Clock className="w-3.5 h-3.5" />
            <span>
              {post.status === "scheduled"
                ? formatDistanceToNow(new Date(post.scheduled_at), { addSuffix: true })
                : format(new Date(post.scheduled_at), "MMM d, h:mm a")}
            </span>
          </>
        ) : (
          <>
            <Calendar className="w-3.5 h-3.5" />
            <span>{format(new Date(post.created_at), "MMM d, h:mm a")}</span>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1">
          {hasError && onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRetry(post)}
              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Retry
            </Button>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {hasError && onRetry && (
              <DropdownMenuItem onClick={() => onRetry(post)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Post
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => onDelete(post.id)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function BoardColumn({
  status,
  posts,
  onDelete,
  onRetry,
  accounts,
  resultsMap,
}: {
  status: StatusFilter;
  posts: SocialPost[];
  onDelete: (id: string) => void;
  onRetry?: (post: SocialPost) => void;
  accounts: Map<
    string,
    {
      platform: string;
      username: string | null;
      profile_photo_url?: string | null;
    }
  >;
  resultsMap: Map<string, SocialPostResult[]>;
}) {
  if (status === "all") return null;

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex flex-col min-w-[200px] flex-1">
      {/* Column Header */}
      <div
        className={`flex items-center justify-between px-3 py-2.5 rounded-xl ${config.bg} border ${config.accent} mb-2`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${config.color}`}
          >
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">{config.label}</span>
        </div>
        <Badge variant="secondary" className="text-[11px] h-5 px-1.5">
          {posts.length}
        </Badge>
      </div>

      {/* Posts */}
      <div className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-320px)] custom-scrollbar">
        {posts.length === 0 ? (
          <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-400">
              ไม่มี{config.label.toLowerCase()}
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={onDelete}
              onRetry={onRetry}
              account={accounts.get(post.social_accounts?.[0]?.id || "")}
              results={resultsMap.get(post.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function PostsPage() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const {
    data: postsResponse,
    isLoading: postsLoading,
    error: postsError,
  } = usePosts({ limit: 100 });
  const { data: accountsResponse, isLoading: accountsLoading } = useAccounts();
  const deletePost = useDeletePost();
  const retryPost = useRetryPost();

  const posts = useMemo(() => postsResponse?.data ?? [], [postsResponse?.data]);
  const accounts = useMemo(() => accountsResponse?.data ?? [], [accountsResponse?.data]);

  // Bulk-fetch all post results in one query (eliminates N+1 per-card fetching)
  const { data: allResultsResponse } = usePostResultsList({
    limit: 500,
  });

  // Build lookup map: post_id → SocialPostResult[]
  const resultsMap = useMemo(() => {
    const map = new Map<string, SocialPostResult[]>();
    if (!allResultsResponse?.data) return map;
    for (const result of allResultsResponse.data) {
      const existing = map.get(result.post_id);
      if (existing) {
        existing.push(result);
      } else {
        map.set(result.post_id, [result]);
      }
    }
    return map;
  }, [allResultsResponse]);

  // Focus refetch is handled by React Query's refetchOnWindowFocus (enabled globally + per-query in usePosts)

  // Create accounts lookup map
  const accountsMap = useMemo(() => {
    const map = new Map<
      string,
      {
        platform: string;
        username: string | null;
        profile_photo_url?: string | null;
      }
    >();
    accounts.forEach((acc) => {
      map.set(acc.id, {
        platform: acc.platform,
        username: acc.username,
        profile_photo_url: acc.profile_photo_url,
      });
    });
    return map;
  }, [accounts]);

  // Group posts by status
  const postsByStatus = useMemo(() => {
    const grouped: Record<string, SocialPost[]> = {
      draft: [],
      scheduled: [],
      processing: [],
      processed: [],
      failed: [],
    };
    posts.forEach((post) => {
      const status = post.status || "draft";
      if (!grouped[status]) grouped[status] = [];
      grouped[status].push(post);
    });
    // "Failed" = posts that have at least one unsuccessful result
    grouped.failed = posts.filter((post) => {
      const results = resultsMap.get(post.id);
      return results?.some((r) => !r.success);
    });
    // Sort each group by date
    Object.keys(grouped).forEach((key) => {
      grouped[key]!.sort((a, b) => {
        const dateA = new Date(a.scheduled_at || a.created_at || 0);
        const dateB = new Date(b.scheduled_at || b.created_at || 0);
        return dateB.getTime() - dateA.getTime();
      });
    });
    return grouped;
  }, [posts, resultsMap]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post?")) return;

    try {
      await deletePost.mutateAsync(id);
      toast.success("Post deleted");
    } catch {
      toast.error("Failed to delete post");
    }
  };

  const handleRetry = async (post: SocialPost) => {
    try {
      await retryPost.mutateAsync(post);
      toast.success("Post retry initiated");
    } catch {
      toast.error("Failed to retry post");
    }
  };

  const isLoading = postsLoading || accountsLoading;

  // Stats
  const stats = useMemo(() => {
    return {
      total: posts.length,
      scheduled: postsByStatus.scheduled?.length || 0,
      processed: postsByStatus.processed?.length || 0,
      failed: postsByStatus.failed?.length || 0,
    };
  }, [posts, postsByStatus]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="w-[320px] h-[400px] rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  if (postsError) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="greeting-title">Posts</h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage your social content
            </p>
          </div>
        </div>
        <div className="card-premium p-12 text-center border-red-200">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-800 mb-2">
            Failed to load posts
          </h3>
          <p className="text-slate-500 mb-6">{postsError.message}</p>
          <Button
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: pfmKeys.posts() })
            }
            variant="premium"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-5 pb-4"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="greeting-title">Posts</h1>
          <p className="text-slate-400 text-sm mt-1">
            จัดการคอนเทนต์ทุกแพลตฟอร์ม
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="soft"
            size="sm"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: pfmKeys.posts() })
            }
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button size="sm" variant="premium" asChild>
            <Link href="/posts/new">
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Stat Ribbon */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center flex-wrap rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-100/80 dark:border-slate-800/80 px-5 py-4 gap-x-5 gap-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">{stats.total}</span>
            <span className="text-xs text-slate-400 font-medium">posts</span>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 flex-shrink-0 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
            <span className="text-lg font-semibold text-slate-700 dark:text-slate-200">{stats.scheduled}</span>
            <span className="text-xs text-slate-400 hidden sm:inline">scheduled</span>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 flex-shrink-0 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
            <span className="text-lg font-semibold text-slate-700 dark:text-slate-200">{stats.processed}</span>
            <span className="text-xs text-slate-400 hidden sm:inline">published</span>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 flex-shrink-0 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
            <span className="text-lg font-semibold text-slate-700 dark:text-slate-200">{stats.failed}</span>
            <span className="text-xs text-slate-400 hidden sm:inline">failed</span>
          </div>
          {stats.total > 0 && (
            <div className="flex-1 min-w-[80px] hidden lg:block">
              <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                {stats.processed > 0 && (
                  <div className="bg-emerald-500 h-full transition-all duration-700" style={{ width: `${(stats.processed / stats.total) * 100}%` }} />
                )}
                {stats.scheduled > 0 && (
                  <div className="bg-blue-500 h-full transition-all duration-700" style={{ width: `${(stats.scheduled / stats.total) * 100}%` }} />
                )}
                {stats.failed > 0 && (
                  <div className="bg-red-400 h-full transition-all duration-700" style={{ width: `${(stats.failed / stats.total) * 100}%` }} />
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div variants={fadeUp} className="flex items-center justify-between gap-3">
        {/* Filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {[
            { value: "all" as StatusFilter, label: "ทั้งหมด", dot: "", count: stats.total },
            { value: "scheduled" as StatusFilter, label: "รอโพสต์", dot: "bg-blue-500", count: stats.scheduled },
            { value: "processed" as StatusFilter, label: "โพสต์แล้ว", dot: "bg-emerald-500", count: stats.processed },
            { value: "draft" as StatusFilter, label: "แบบร่าง", dot: "bg-slate-400", count: postsByStatus.draft?.length || 0 },
            { value: "failed" as StatusFilter, label: "ล้มเหลว", dot: "bg-red-500", count: stats.failed },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0",
                statusFilter === filter.value
                  ? "bg-slate-800 text-white shadow-sm dark:bg-white dark:text-slate-900"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              {filter.dot && <span className={`w-1.5 h-1.5 rounded-full ${filter.dot}`} />}
              {filter.label}
              {filter.count > 0 && (
                <span className={cn(
                  "text-[10px] tabular-nums",
                  statusFilter === filter.value ? "opacity-60" : "opacity-40"
                )}>
                  {filter.count}
                </span>
              )}
            </button>
          ))}
        </div>
        {/* View toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 flex-shrink-0">
          <button
            onClick={() => setViewMode("board")}
            className={cn(
              "p-2 rounded-md transition-all duration-200",
              viewMode === "board"
                ? "bg-white dark:bg-slate-700 shadow-sm text-slate-700 dark:text-slate-200"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2 rounded-md transition-all duration-200",
              viewMode === "list"
                ? "bg-white dark:bg-slate-700 shadow-sm text-slate-700 dark:text-slate-200"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div variants={fadeUp}>
      {posts.length === 0 ? (
        <div className="card-premium p-16 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
            ยังไม่มีโพสต์
          </h3>
          <p className="text-slate-400 max-w-sm mx-auto mb-8">
            สร้างโพสต์แรกเพื่อเริ่มจัดการคอนเทนต์ข้ามแพลตฟอร์ม
          </p>
          <Button variant="premium" size="lg" asChild>
            <Link href="/posts/new">
              <Plus className="w-5 h-5 mr-2" />
              สร้างโพสต์แรก
            </Link>
          </Button>
        </div>
      ) : viewMode === "board" ? (
        <div className="flex gap-3 lg:gap-4 overflow-x-auto pb-4 -mx-4 px-4 lg:mx-0 lg:px-0">
          {statusFilter === "all" ? (
            <>
              <BoardColumn
                status="draft"
                posts={postsByStatus.draft ?? []}
                onDelete={handleDelete}
                onRetry={handleRetry}
                accounts={accountsMap}
                resultsMap={resultsMap}
              />
              <BoardColumn
                status="scheduled"
                posts={postsByStatus.scheduled ?? []}
                onDelete={handleDelete}
                onRetry={handleRetry}
                accounts={accountsMap}
                resultsMap={resultsMap}
              />
              <BoardColumn
                status="processing"
                posts={postsByStatus.processing ?? []}
                onDelete={handleDelete}
                onRetry={handleRetry}
                accounts={accountsMap}
                resultsMap={resultsMap}
              />
              <BoardColumn
                status="processed"
                posts={postsByStatus.processed ?? []}
                onDelete={handleDelete}
                onRetry={handleRetry}
                accounts={accountsMap}
                resultsMap={resultsMap}
              />
              <BoardColumn
                status="failed"
                posts={postsByStatus.failed ?? []}
                onDelete={handleDelete}
                onRetry={handleRetry}
                accounts={accountsMap}
                resultsMap={resultsMap}
              />
            </>
          ) : (
            <BoardColumn
              status={statusFilter}
              posts={postsByStatus[statusFilter] || []}
              onDelete={handleDelete}
              onRetry={handleRetry}
              accounts={accountsMap}
              resultsMap={resultsMap}
            />
          )}
        </div>
      ) : (
        // List View
        <div className="space-y-3">
          {(statusFilter === "all"
            ? posts
            : postsByStatus[statusFilter] || []
          ).map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={handleDelete}
              onRetry={handleRetry}
              account={accountsMap.get(post.social_accounts?.[0]?.id || "")}
              results={resultsMap.get(post.id)}
            />
          ))}
        </div>
      )}
      </motion.div>
    </motion.div>
  );
}
