/**
 * Posts Hooks - Types
 * @module lib/hooks/posts/types
 */

import type { SocialPost, SocialPostResult } from "@/types/post-for-me-types";

export type PostStatus = "draft" | "scheduled" | "processing" | "processed" | "failed";

export interface PostsFilter {
  offset?: number;
  limit?: number;
  platform?: string[];
  status?: PostStatus[];
}

export interface PostsStats {
  total: number;
  scheduled: number;
  processed: number;
  failed: number;
  processing: number;
  draft: number;
}

export interface PostsByStatus {
  draft: SocialPost[];
  scheduled: SocialPost[];
  processing: SocialPost[];
  processed: SocialPost[];
  failed: SocialPost[];
  all: SocialPost[];
}

export interface UsePostsOptions extends PostsFilter {
  searchQuery?: string;
  statusFilter?: PostStatus | "all";
}

// Query result types for better inference
export type PostsQueryResult = {
  posts: SocialPost[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
};

export type PostResultsMap = Map<string, SocialPostResult[]>;
