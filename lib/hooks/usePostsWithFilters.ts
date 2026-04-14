"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { pfmKeys } from "./keys";
import { TIME, PAGINATION } from "@/lib/constants";
import type { SocialPost, SocialPostListResponse } from "@/types/post-for-me-types";
import type { StatusFilter, ViewMode } from "@/app/(dashboard)/posts/config";

interface UsePostsWithFiltersResult {
  // Filter state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (status: StatusFilter) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  
  // Data (from TanStack with select transform)
  posts: SocialPost[];
  filteredPosts: SocialPost[];
  postsByStatus: Record<StatusFilter, SocialPost[]>;
  stats: {
    total: number;
    scheduled: number;
    processed: number;
    failed: number;
    draft: number;
  };
  
  // Query state
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  
  // Actions
  refetch: () => void;
}

// Build query key based on filters that affect server data
function buildQueryKey(limit: number) {
  return [...pfmKeys.posts(), "with-filters", limit] as const;
}

/**
 * PROPER TanStack pattern: Use select for ALL data transformations
 * No useMemo needed - TanStack handles caching and structural sharing
 */
export function usePostsWithFilters(
  limit: number = PAGINATION.MAX_PAGE_SIZE,
  options?: Omit<UseQueryOptions<SocialPostListResponse, Error>, "queryKey" | "queryFn" | "select">
): UsePostsWithFiltersResult {
  const queryClient = useQueryClient();
  
  // Client-side only filter state (not in query key)
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("board");

  // Single query with select transform for ALL derived data
  const query = useQuery<SocialPostListResponse, Error, {
    all: SocialPost[];
    filtered: SocialPost[];
    byStatus: Record<StatusFilter, SocialPost[]>;
    stats: UsePostsWithFiltersResult['stats'];
  }>({
    queryKey: buildQueryKey(limit),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("limit", limit.toString());
      return apiClient<SocialPostListResponse>(`/api/posts?${params}`);
    },
    // ALL transformations happen here - cached by TanStack
    select: useCallback((data: SocialPostListResponse) => {
      const all = data.data ?? [];
      
      // Filter by search and status
      const filtered = all.filter((post) => {
        const matchesSearch = !searchQuery ||
          post.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.id.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = statusFilter === "all" || post.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      });

      // Group by status
      const byStatus: Record<StatusFilter, SocialPost[]> = {
        all,
        draft: all.filter((p) => !p.status || p.status === "draft"),
        scheduled: all.filter((p) => p.status === "scheduled"),
        processing: all.filter((p) => p.status === "processing"),
        processed: all.filter((p) => p.status === "processed"),
        failed: [], // Calculated from results separately
      };

      // Calculate stats
      const stats = {
        total: all.length,
        scheduled: all.filter((p) => p.status === "scheduled").length,
        processed: all.filter((p) => p.status === "processed").length,
        failed: 0, // From results, calculated separately
        draft: all.filter((p) => !p.status || p.status === "draft").length,
      };

      return { all, filtered, byStatus, stats };
    }, [searchQuery, statusFilter]), // Only re-run when these change
    staleTime: TIME.STALE_TIME_POSTS,
    gcTime: TIME.MINUTE * 10,
    refetchOnMount: false,
    refetchOnWindowFocus: true,
    ...options,
  });

  return {
    // Filter state
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    viewMode,
    setViewMode,
    
    // Data (from select transform - properly cached)
    posts: query.data?.all ?? [],
    filteredPosts: query.data?.filtered ?? [],
    postsByStatus: query.data?.byStatus ?? { all: [], draft: [], scheduled: [], processing: [], processed: [], failed: [] },
    stats: query.data?.stats ?? { total: 0, scheduled: 0, processed: 0, failed: 0, draft: 0 },
    
    // Query state
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    
    // Actions
    refetch: () => queryClient.invalidateQueries({ queryKey: buildQueryKey(limit) }),
  };
}
