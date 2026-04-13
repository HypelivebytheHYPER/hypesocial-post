/**
 * Posts Hooks - Production Grade Single Source of Truth
 * @module lib/hooks/posts
 * 
 * Usage:
 * ```tsx
 * import { usePosts, useCreatePost } from "@/lib/hooks/posts";
 * ```
 */

// Types
export type {
  PostStatus,
  PostsFilter,
  PostsStats,
  PostsByStatus,
  UsePostsOptions,
  PostsQueryResult,
  PostResultsMap,
} from "./types";

// Queries
export {
  postsQueryOptions,
  usePosts,
  usePostsWithSelect,
  usePostsByStatus,
  usePostsStats,
  usePostsInfinite,
  usePost,
  usePrefetchPost,
  usePostResults,
  usePostResultsMap,
  // Legacy compatibility
  usePostResultsList,
  usePrefetchResults,
} from "./queries";

// Mutations
export {
  useCreatePost,
  useUpdatePost,
  useDeletePost,
  useRetryPost,
} from "./mutations";
