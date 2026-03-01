"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  RefreshCw,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  ImageIcon,
  MoreHorizontal,
  ExternalLink,
  Trash2,
  Edit2,
  Filter,
  LayoutGrid,
  List,
} from "lucide-react";
import { platformIconsMap } from "@/lib/social-platforms";
import { proxyMediaUrl } from "@/lib/utils";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LazyVideo } from "@/components/ui/lazy-video";

import {
  usePosts,
  useDeletePost,
  useRetryPost,
  useAccounts,
  usePostResults,
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

function PostCard({
  post,
  onDelete,
  onRetry,
  account,
}: {
  post: SocialPost;
  onDelete: (id: string) => void;
  onRetry?: (post: SocialPost) => void;
  account?: {
    platform: string;
    username: string | null;
    profile_photo_url?: string | null;
  };
}) {
  const PlatformIcon = account?.platform
    ? platformIconsMap[account.platform.toLowerCase()] || ExternalLink
    : ExternalLink;
  const status = post.status as keyof typeof statusConfig;
  const config = statusConfig[status] || statusConfig.draft;
  const StatusIcon = config.icon;

  // Determine if we should poll for results (while processing or just completed)
  const shouldPoll =
    post.status === "processing" || post.status === "processed";

  // Fetch post results for this specific post
  // Polls automatically while post is processing to show real-time updates
  const { data: resultsData, isLoading: resultsLoading } = usePostResults(
    post.status !== "draft" && post.status !== "scheduled" ? post.id : "",
    shouldPoll,
  );
  const results = resultsData?.data;

  // Get result for this post's account (if available)
  const postResult = results?.find(
    (r) => r.social_account_id === post.social_accounts?.[0]?.id,
  );
  const hasError = postResult?.success === false;
  const isPending =
    post.status === "processing" ||
    (post.status === "processed" && !postResult);

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
          {post.media[0].url.match(/\.(mp4|mov|avi|webm)/i) ? (
            <LazyVideo
              src={post.media[0].url}
              className="w-full h-32"
              controls
              preload="metadata"
            />
          ) : (
            <img
              src={proxyMediaUrl(post.media[0].url)}
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
          {resultsLoading ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Checking platform status...</span>
            </div>
          ) : postResult ? (
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
            <DropdownMenuItem asChild>
              <Link href={`/posts/${post.id}`}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Link>
            </DropdownMenuItem>
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
}) {
  if (status === "all") return null;

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex flex-col min-w-[300px] w-[320px]">
      {/* Column Header */}
      <div
        className={`flex items-center justify-between p-3 rounded-2xl ${config.bg} border ${config.accent} mb-3`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${config.color}`}
          >
            <Icon className="w-4 h-4" />
          </div>
          <span className="font-semibold text-slate-700">{config.label}</span>
        </div>
        <Badge variant="secondary" className="text-xs">
          {posts.length}
        </Badge>
      </div>

      {/* Posts */}
      <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-300px)] pr-2 custom-scrollbar">
        {posts.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200">
            <p className="text-sm text-slate-400">
              No {config.label.toLowerCase()} posts
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    data: postsResponse,
    isLoading: postsLoading,
    error: postsError,
  } = usePosts({ limit: 100 });
  const { data: accountsResponse, isLoading: accountsLoading } = useAccounts();
  const deletePost = useDeletePost();
  const retryPost = useRetryPost();

  const posts = postsResponse?.data || [];
  const accounts = accountsResponse?.data || [];

  // Refresh data when user returns to the page (for real-time updates from webhooks)
  useEffect(() => {
    const handleFocus = () => {
      // Invalidate posts to get latest status from webhooks
      queryClient.invalidateQueries({ queryKey: pfmKeys.posts() });
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [queryClient]);

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
    // Sort each group by date
    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => {
        const dateA = new Date(a.scheduled_at || a.created_at || 0);
        const dateB = new Date(b.scheduled_at || b.created_at || 0);
        return dateB.getTime() - dateA.getTime();
      });
    });
    return grouped;
  }, [posts]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post?")) return;

    setDeletingId(id);
    try {
      await deletePost.mutateAsync(id);
      toast.success("Post deleted");
    } catch (err) {
      toast.error("Failed to delete post");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRetry = async (post: SocialPost) => {
    try {
      await retryPost.mutateAsync(post);
      toast.success("Post retry initiated");
    } catch (err) {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="greeting-title">Posts</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your social content across platforms
          </p>
        </div>
        <div className="flex items-center gap-3">
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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-premium p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <LayoutGrid className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              <p className="text-xs text-slate-400">Total Posts</p>
            </div>
          </div>
        </div>
        <div className="card-premium p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {stats.scheduled}
              </p>
              <p className="text-xs text-slate-400">Scheduled</p>
            </div>
          </div>
        </div>
        <div className="card-premium p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {stats.processed}
              </p>
              <p className="text-xs text-slate-400">Published</p>
            </div>
          </div>
        </div>
        <div className="card-premium p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {stats.failed}
              </p>
              <p className="text-xs text-slate-400">Failed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Tabs
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <TabsList className="bg-slate-100/50">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="processed">Published</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "board" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("board")}
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            Board
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4 mr-2" />
            List
          </Button>
        </div>
      </div>

      {/* Content */}
      {posts.length === 0 ? (
        <div className="card-premium p-16 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            No posts yet
          </h3>
          <p className="text-slate-400 max-w-sm mx-auto mb-8">
            Create your first post to start scheduling and publishing content
            across your social platforms
          </p>
          <Button variant="premium" size="lg" asChild>
            <Link href="/posts/new">
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Post
            </Link>
          </Button>
        </div>
      ) : viewMode === "board" ? (
        <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4 snap-x">
          {statusFilter === "all" ? (
            <>
              <BoardColumn
                status="draft"
                posts={postsByStatus.draft}
                onDelete={handleDelete}
                onRetry={handleRetry}
                accounts={accountsMap}
              />
              <BoardColumn
                status="scheduled"
                posts={postsByStatus.scheduled}
                onDelete={handleDelete}
                onRetry={handleRetry}
                accounts={accountsMap}
              />
              <BoardColumn
                status="processing"
                posts={postsByStatus.processing}
                onDelete={handleDelete}
                onRetry={handleRetry}
                accounts={accountsMap}
              />
              <BoardColumn
                status="processed"
                posts={postsByStatus.processed}
                onDelete={handleDelete}
                onRetry={handleRetry}
                accounts={accountsMap}
              />
              <BoardColumn
                status="failed"
                posts={postsByStatus.failed}
                onDelete={handleDelete}
                onRetry={handleRetry}
                accounts={accountsMap}
              />
            </>
          ) : (
            <BoardColumn
              status={statusFilter}
              posts={postsByStatus[statusFilter] || []}
              onDelete={handleDelete}
              accounts={accountsMap}
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
