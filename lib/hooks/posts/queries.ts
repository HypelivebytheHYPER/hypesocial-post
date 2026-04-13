/**
 * Posts Hooks - Queries
 * @module lib/hooks/posts/queries
 * 
 * All post-related queries in one place.
 * No useMemo - TanStack handles query key serialization.
 */

import { useQuery, useInfiniteQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { pfmKeys } from "../keys";
import { TIME, PAGINATION } from "@/lib/constants";
import type { SocialPost, SocialPostListResponse, SocialPostResult } from "@/types/post-for-me-types";
import type { PostStatus, PostsFilter, PostsByStatus, PostsStats, UsePostsOptions, PostResultsMap } from "./types";

// ==================== Query Key Helpers ====================

function buildPostsQueryKey(filters: PostsFilter): readonly unknown[] {
  return [
    ...pfmKeys.posts(),
    filters.offset ?? 0,
    filters.limit ?? PAGINATION.DEFAULT_LIMIT,
    filters.platform?.join(",") ?? null,
    filters.status?.join(",") ?? null,
  ] as const;
}

function buildQueryString(filters: PostsFilter): string {
  const params = new URLSearchParams();
  if (filters.offset != null) params.set("offset", filters.offset.toString());
  if (filters.limit != null) params.set("limit", filters.limit.toString());
  filters.platform?.forEach((p) => params.append("platform", p));
  filters.status?.forEach((s) => params.append("status", s));
  return params.toString();
}

// ==================== Base Query ====================

/**
 * Base posts query options factory
 */
export function postsQueryOptions(
  filters: PostsFilter = {},
  options?: Omit<UseQueryOptions<SocialPostListResponse, Error>, "queryKey" | "queryFn">
) {
  const queryString = buildQueryString(filters);
  
  return {
    queryKey: buildPostsQueryKey(filters),
    queryFn: () => apiClient<SocialPostListResponse>(`/api/posts${queryString ? `?${queryString}` : ""}`),
    placeholderData: (previous: SocialPostListResponse | undefined) => previous,
    staleTime: TIME.STALE_TIME_POSTS,
    gcTime: TIME.MINUTE * 10,
    refetchOnMount: false,
    refetchOnWindowFocus: true,
    ...options,
  } satisfies UseQueryOptions<SocialPostListResponse, Error>;
}

// ==================== List Queries ====================

/**
 * Get posts list
 */
export function usePosts<T = SocialPostListResponse>(
  filters: PostsFilter = {},
  options?: Omit<UseQueryOptions<SocialPostListResponse, Error, T>, "queryKey" | "queryFn">
) {
  const baseOptions = postsQueryOptions(filters);
  return useQuery<SocialPostListResponse, Error, T>({
    queryKey: baseOptions.queryKey,
    queryFn: baseOptions.queryFn,
    placeholderData: baseOptions.placeholderData,
    staleTime: baseOptions.staleTime,
    gcTime: baseOptions.gcTime,
    refetchOnMount: baseOptions.refetchOnMount,
    refetchOnWindowFocus: baseOptions.refetchOnWindowFocus,
    ...options,
  });
}

/**
 * Get posts with client-side filtering
 * Uses TanStack's select for derived data (more efficient than useMemo)
 */
export function usePostsWithSelect(options: UsePostsOptions = {}) {
  const { searchQuery, statusFilter, ...filters } = options;
  
  return useQuery<SocialPostListResponse, Error, SocialPostListResponse & { filtered: SocialPost[] }>({
    ...postsQueryOptions(filters),
    select: (data) => {
      if (!data?.data) return { ...data, filtered: [] };
      
      let filtered = data.data;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (post) =>
            post.caption?.toLowerCase().includes(query) ||
            post.social_accounts?.some((sa) =>
              sa.username?.toLowerCase().includes(query)
            )
        );
      }
      
      if (statusFilter && statusFilter !== "all") {
        filtered = filtered.filter((post) => post.status === statusFilter);
      }
      
      return { ...data, filtered };
    },
  });
}

/**
 * Get posts grouped by status
 */
export function usePostsByStatus(filters: Omit<PostsFilter, "status"> = {}) {
  return useQuery<SocialPostListResponse, Error, PostsByStatus>({
    ...postsQueryOptions(filters),
    select: (data) => {
      const posts = data.data ?? [];
      const grouped: PostsByStatus = {
        draft: [],
        scheduled: [],
        processing: [],
        processed: [],
        failed: [],
        all: posts,
      };
      
      for (const post of posts) {
        const status = (post.status || "draft") as PostStatus;
        if (grouped[status]) {
          grouped[status].push(post);
        }
      }
      
      // Sort each group by date
      for (const key of Object.keys(grouped) as Array<keyof PostsByStatus>) {
        if (key === "all") continue;
        grouped[key].sort((a, b) => {
          const dateA = new Date(a.scheduled_at || a.created_at || 0).getTime();
          const dateB = new Date(b.scheduled_at || b.created_at || 0).getTime();
          return dateB - dateA;
        });
      }
      
      return grouped;
    },
  });
}

/**
 * Get posts stats only
 */
export function usePostsStats(filters: Omit<PostsFilter, "status"> = {}) {
  return useQuery<SocialPostListResponse, Error, PostsStats>({
    ...postsQueryOptions(filters),
    select: (data) => {
      const posts = data.data ?? [];
      return {
        total: posts.length,
        scheduled: posts.filter((p) => p.status === "scheduled").length,
        processed: posts.filter((p) => p.status === "processed").length,
        failed: 0, // Calculated from results, not post status
        processing: posts.filter((p) => p.status === "processing").length,
        draft: posts.filter((p) => !p.status || p.status === "draft").length,
      };
    },
  });
}

/**
 * Infinite scroll posts
 */
export function usePostsInfinite(limit: number = PAGINATION.DEFAULT_LIMIT, platform?: string[]) {
  return useInfiniteQuery<SocialPostListResponse, Error>({
    queryKey: [...pfmKeys.posts(), "infinite", limit, platform?.join(",") ?? null],
    queryFn: ({ pageParam = 0 }) => {
      const params = new URLSearchParams();
      params.set("limit", limit.toString());
      params.set("offset", String(pageParam));
      platform?.forEach((p) => params.append("platform", p));
      return apiClient<SocialPostListResponse>(`/api/posts?${params}`);
    },
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, page) => acc + (page.data?.length ?? 0), 0);
      return loaded < (lastPage.meta?.total ?? 0) ? loaded : undefined;
    },
    initialPageParam: 0,
    staleTime: TIME.STALE_TIME_POSTS,
  });
}

// ==================== Single Post ====================

/**
 * Get single post
 */
export function usePost(id: string) {
  return useQuery<SocialPost, Error>({
    queryKey: pfmKeys.post(id),
    queryFn: () => apiClient<SocialPost>(`/api/posts/${id}`),
    enabled: !!id,
    placeholderData: (previous) => previous,
    staleTime: TIME.MINUTE,
  });
}

/**
 * Prefetch a post for instant navigation
 */
export function usePrefetchPost() {
  const queryClient = useQueryClient();
  return (id: string) => {
    if (!id) return;
    queryClient.prefetchQuery({
      queryKey: pfmKeys.post(id),
      queryFn: () => apiClient<SocialPost>(`/api/posts/${id}`),
      staleTime: TIME.MINUTE * 5,
    });
  };
}

// ==================== Results Queries ====================

/**
 * Get post results mapped by post_id
 */
export function usePostResultsMap(limit: number = PAGINATION.MAX_PAGE_SIZE) {
  return useQuery<SocialPostResult[], Error, PostResultsMap>({
    queryKey: [...pfmKeys.postResults(), "map", limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("limit", limit.toString());
      const res = await apiClient<{ data: SocialPostResult[] }>(`/api/post-results?${params}`);
      return res.data ?? [];
    },
    select: (data) => {
      const map = new Map<string, SocialPostResult[]>();
      for (const result of data) {
        const existing = map.get(result.post_id);
        if (existing) {
          existing.push(result);
        } else {
          map.set(result.post_id, [result]);
        }
      }
      return map;
    },
    staleTime: TIME.STALE_TIME_POSTS,
    gcTime: TIME.MINUTE * 5,
  });
}

/**
 * Get raw post results
 */
export function usePostResults(limit: number = PAGINATION.MAX_PAGE_SIZE) {
  return useQuery<SocialPostResult[], Error>({
    queryKey: [...pfmKeys.postResults(), "list", limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("limit", limit.toString());
      const res = await apiClient<{ data: SocialPostResult[] }>(`/api/post-results?${params}`);
      return res.data ?? [];
    },
    staleTime: TIME.STALE_TIME_POSTS,
    gcTime: TIME.MINUTE * 5,
  });
}

// ==================== Legacy Compatibility (ListResponse format) ====================

import type { SocialPostResultListResponse } from "@/types/post-for-me-types";

/**
 * Legacy: Get post results list with full response wrapper
 * @deprecated Use usePostResults instead (returns array directly)
 */
export function usePostResultsList<T = SocialPostResultListResponse>(
  filters?: { postId?: string[]; socialAccountId?: string[]; limit?: number; offset?: number },
  options?: Omit<UseQueryOptions<SocialPostResultListResponse, Error, T>, "queryKey" | "queryFn">
) {
  return useQuery<SocialPostResultListResponse, Error, T>({
    queryKey: [
      ...pfmKeys.postResults(),
      "list",
      filters?.limit ?? PAGINATION.DEFAULT_LIMIT,
      filters?.postId?.join(",") ?? null,
      filters?.socialAccountId?.join(",") ?? null,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.limit) params.set("limit", filters.limit.toString());
      if (filters?.offset !== undefined) params.set("offset", filters.offset.toString());
      filters?.postId?.forEach((id) => params.append("post_id", id));
      filters?.socialAccountId?.forEach((id) => params.append("social_account_id", id));
      return apiClient<SocialPostResultListResponse>(`/api/post-results?${params}`);
    },
    placeholderData: (previousData) => previousData,
    staleTime: TIME.STALE_TIME_POSTS,
    gcTime: TIME.MINUTE * 5,
    refetchOnMount: false,
    ...options,
  });
}

/**
 * Legacy: Prefetch results
 * @deprecated Components should handle their own prefetching
 */
export function usePrefetchResults() {
  const queryClient = useQueryClient();
  return (filters?: { postId?: string[]; limit?: number }) => {
    const params = new URLSearchParams();
    params.set("limit", (filters?.limit ?? PAGINATION.DEFAULT_LIMIT).toString());
    filters?.postId?.forEach((id) => params.append("post_id", id));
    queryClient.prefetchQuery({
      queryKey: [...pfmKeys.postResults(), "list", filters?.limit ?? PAGINATION.DEFAULT_LIMIT, filters?.postId?.join(",") ?? null],
      queryFn: () => apiClient<SocialPostResultListResponse>(`/api/post-results?${params}`),
      staleTime: TIME.MINUTE * 2,
    });
  };
}
