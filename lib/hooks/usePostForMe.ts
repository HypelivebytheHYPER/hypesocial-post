/**
 * Post For Me API Hooks
 * TanStack Query (React Query) integration for Post For Me API
 */

import { useState, useEffect, useCallback } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import {
  PostForMeWebhook,
  PostForMeWebhookListResponse,
  PostForMeEventType,
} from "@/types/webhooks";
import {
  SocialPost,
  SocialPostListResponse,
  SocialAccount,
  SocialAccountListResponse,
  SocialAccountFeedResponse,
  SocialPostResultListResponse,
  SocialPostResult,
  CreateSocialPostDto,
  SocialPostPreviewResponse,
  SocialPostPreviewRequest,
} from "@/types/post-for-me";

// Query Keys
export const pfmKeys = {
  all: ["post-for-me"] as const,
  webhooks: () => [...pfmKeys.all, "webhooks"] as const,
  webhook: (id: string) => [...pfmKeys.webhooks(), id] as const,
  posts: () => [...pfmKeys.all, "posts"] as const,
  post: (id: string) => [...pfmKeys.posts(), id] as const,
  postResults: () => [...pfmKeys.all, "post-results"] as const,
  postResult: (id: string) => [...pfmKeys.postResults(), id] as const,
  postResultsByPost: (postId: string) =>
    [...pfmKeys.postResults(), "post", postId] as const,
  accounts: () => [...pfmKeys.all, "accounts"] as const,
  account: (id: string) => [...pfmKeys.accounts(), id] as const,
  feeds: () => [...pfmKeys.all, "feeds"] as const,
  feed: (accountId: string, cursor?: string) =>
    [...pfmKeys.feeds(), accountId, cursor ?? "initial"] as const,
  previews: () => [...pfmKeys.all, "previews"] as const,
};

// API Client for internal Next.js API routes
async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error || `API error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

// ==================== Webhooks ====================

/**
 * Get all webhooks with optional filtering
 *
 * Supports filtering by:
 * - url: string[] (OR logic for multiple URLs)
 * - event_type: PostForMeEventType[] (OR logic for multiple types)
 * - id: string[] (OR logic for multiple IDs)
 */
export function useWebhooks(
  filters?: {
    url?: string[];
    event_type?: PostForMeEventType[];
    id?: string[];
    offset?: number;
    limit?: number;
  },
  options?: Omit<
    UseQueryOptions<PostForMeWebhookListResponse, Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<PostForMeWebhookListResponse, Error>({
    queryKey: [...pfmKeys.webhooks(), filters],
    queryFn: () => {
      const searchParams = new URLSearchParams();

      if (filters?.offset)
        searchParams.set("offset", filters.offset.toString());
      if (filters?.limit) searchParams.set("limit", filters.limit.toString());
      filters?.url?.forEach((u) => searchParams.append("url", u));
      filters?.event_type?.forEach((e) => searchParams.append("event_type", e));
      filters?.id?.forEach((i) => searchParams.append("id", i));

      const query = searchParams.toString();
      return apiClient<PostForMeWebhookListResponse>(
        `/api/webhooks${query ? `?${query}` : ""}`,
      );
    },
    ...options,
  });
}

/**
 * Get single webhook by ID
 */
export function useWebhook(id: string) {
  return useQuery<PostForMeWebhook, Error>({
    queryKey: pfmKeys.webhook(id),
    queryFn: () => apiClient<PostForMeWebhook>(`/api/webhooks/${id}`),
    enabled: !!id,
  });
}

/**
 * Create webhook mutation
 */
export function useCreateWebhook() {
  const queryClient = useQueryClient();

  return useMutation<
    PostForMeWebhook,
    Error,
    { url: string; eventTypes: PostForMeEventType[] }
  >({
    mutationFn: ({ url, eventTypes }) =>
      apiClient<PostForMeWebhook>("/api/webhooks", {
        method: "POST",
        body: JSON.stringify({
          url,
          event_types: eventTypes,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pfmKeys.webhooks() });
    },
  });
}

/**
 * Update webhook mutation
 */
export function useUpdateWebhook() {
  const queryClient = useQueryClient();

  return useMutation<
    PostForMeWebhook,
    Error,
    {
      id: string;
      updates: { url?: string; event_types?: PostForMeEventType[] };
    }
  >({
    mutationFn: ({ id, updates }) =>
      apiClient<PostForMeWebhook>(`/api/webhooks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pfmKeys.webhooks() });
      queryClient.invalidateQueries({
        queryKey: pfmKeys.webhook(variables.id),
      });
    },
  });
}

/**
 * Delete webhook mutation
 */
export function useDeleteWebhook() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) =>
      apiClient<{ success: boolean }>(`/api/webhooks/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pfmKeys.webhooks() });
    },
  });
}

// ==================== Posts ====================

/**
 * Get all posts
 *
 * Automatically polls every 10 seconds to show real-time status updates
 * from webhooks (post results, processing status, etc.)
 */
export function usePosts(params?: { offset?: number; limit?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.offset) searchParams.set("offset", params.offset.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  const query = searchParams.toString();

  return useQuery<SocialPostListResponse, Error>({
    queryKey: [...pfmKeys.posts(), params],
    queryFn: () =>
      apiClient<SocialPostListResponse>(
        `/api/posts${query ? `?${query}` : ""}`,
      ),
    // Poll every 30 seconds to catch webhook updates (reduced from 10s to prevent flashing)
    refetchInterval: 30000,
    refetchIntervalInBackground: false, // Pause when tab is not active
    refetchOnWindowFocus: true, // Refresh immediately when user returns to tab
    staleTime: 10000, // Consider data fresh for 10 seconds to prevent rapid refetching
  });
}

/**
 * Get single post
 */
export function usePost(id: string) {
  return useQuery<SocialPost, Error>({
    queryKey: pfmKeys.post(id),
    queryFn: () => apiClient<SocialPost>(`/api/posts/${id}`),
    enabled: !!id,
  });
}

/**
 * Create post mutation
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation<SocialPost, Error, CreateSocialPostDto>({
    mutationFn: (data) =>
      apiClient<SocialPost>("/api/posts", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pfmKeys.posts() });
    },
  });
}

/**
 * Delete post mutation
 */
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) =>
      apiClient<{ success: boolean }>(`/api/posts/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pfmKeys.posts() });
    },
  });
}

/**
 * Retry failed post mutation
 * Duplicates a failed post with a new ID to retry publishing
 */
export function useRetryPost() {
  const queryClient = useQueryClient();
  const createPost = useCreatePost();

  return useMutation<SocialPost, Error, SocialPost>({
    mutationFn: async (failedPost) => {
      // Create a new post with the same content
      const retryData: CreateSocialPostDto = {
        caption: failedPost.caption,
        social_accounts: failedPost.social_accounts?.map((a) => a.id) || [],
        scheduled_at: failedPost.scheduled_at,
        media: failedPost.media?.map((m) => ({ url: m.url })),
        platform_configurations: failedPost.platform_configurations,
        account_configurations: failedPost.account_configurations,
      };

      return createPost.mutateAsync(retryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pfmKeys.posts() });
    },
  });
}

/**
 * Get post results for a specific post
 * Shows per-platform success/failure status
 *
 * API: GET /v1/social-post-results?post_id={postId}
 * https://www.postforme.dev/resources/getting-post-results
 *
 * Response includes:
 * - success: boolean (whether post succeeded)
 * - error: unknown (error details if failed)
 * - details: unknown (detailed logs for debugging)
 * - platform_data: { id?: string, url?: string } (platform-specific IDs and URLs)
 *
 * Automatically polls every 5 seconds while post is processing
 * to show real-time updates without page refresh
 */
export function usePostResults(postId: string, isProcessing?: boolean) {
  return useQuery<SocialPostResultListResponse, Error>({
    queryKey: pfmKeys.postResultsByPost(postId),
    queryFn: async () => {
      const response = await apiClient<SocialPostResultListResponse>(
        `/api/post-results?post_id=${postId}`,
      );

      // Debug logging for troubleshooting video posts
      if (response.data.length > 0) {
        console.log("[Post Results] Fetched results:", {
          postId,
          count: response.data.length,
          results: response.data.map((r) => ({
            success: r.success,
            hasError: !!r.error,
            platformData: r.platform_data,
          })),
        });
      }

      return response;
    },
    enabled: !!postId,
    // Poll every 5 seconds while processing to get real-time updates
    refetchInterval: isProcessing ? 5000 : false,
    // Continue polling even when tab is in background
    refetchIntervalInBackground: true,
  });
}

/**
 * Get single post result by ID
 */
export function usePostResult(id: string) {
  return useQuery<SocialPostResult, Error>({
    queryKey: pfmKeys.postResult(id),
    queryFn: () => apiClient<SocialPostResult>(`/api/post-results/${id}`),
    enabled: !!id,
  });
}

/**
 * List post results with filters
 *
 * API: GET /v1/social-post-results?post_id=...&platform=...&social_account_id=...
 */
export function usePostResultsList(params?: {
  postId?: string;
  platform?: string;
  socialAccountId?: string;
  limit?: number;
  offset?: number;
}) {
  const {
    postId,
    platform,
    socialAccountId,
    limit = 50,
    offset = 0,
  } = params || {};

  return useQuery<SocialPostResultListResponse, Error>({
    queryKey: [
      ...pfmKeys.postResults(),
      { postId, platform, socialAccountId, limit, offset },
    ],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      searchParams.set("limit", limit.toString());
      searchParams.set("offset", offset.toString());
      if (postId) searchParams.set("post_id", postId);
      if (platform) searchParams.set("platform", platform);
      if (socialAccountId)
        searchParams.set("social_account_id", socialAccountId);

      return apiClient<SocialPostResultListResponse>(
        `/api/post-results?${searchParams.toString()}`,
      );
    },
    enabled: !!(postId || platform || socialAccountId),
  });
}

/**
 * Upload media mutation
 */
export function useUploadMedia() {
  return useMutation<
    { url: string; key: string },
    Error,
    { file: File; onProgress?: (progress: number) => void }
  >({
    mutationFn: async ({ file, onProgress }) => {
      // Step 1: Get presigned URL
      const { upload_url, key } = await apiClient<{
        upload_url: string;
        key: string;
      }>("/api/media", {
        method: "POST",
        body: JSON.stringify({
          filename: file.name,
          content_type: file.type,
          size: file.size,
        }),
      });

      // Step 2: Upload file to presigned URL
      const response = await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      // Step 3: Return the final URL
      return { url: upload_url.split("?")[0], key };
    },
  });
}

/**
 * Upload thumbnail image from data URL
 * Used for video thumbnails on Facebook, Instagram, TikTok Business, YouTube
 *
 * Based on: https://www.postforme.dev/resources/posting-media
 * Thumbnail URLs supported for: Facebook, Instagram, TikTok Business, YouTube
 */
export function useUploadThumbnail() {
  return useMutation<
    { url: string; key: string },
    Error,
    { dataUrl: string; filename?: string }
  >({
    mutationFn: async ({ dataUrl, filename = "thumbnail.jpg" }) => {
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Create a File from the blob
      const file = new File([blob], filename, { type: "image/jpeg" });

      // Step 1: Get presigned URL
      const { upload_url, key } = await apiClient<{
        upload_url: string;
        key: string;
      }>("/api/media", {
        method: "POST",
        body: JSON.stringify({
          filename: file.name,
          content_type: file.type,
          size: file.size,
        }),
      });

      // Step 2: Upload file to presigned URL
      const uploadResponse = await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Thumbnail upload failed");
      }

      // Step 3: Return the final URL
      return { url: upload_url.split("?")[0], key };
    },
  });
}

// ==================== Accounts ====================

/**
 * Get all accounts
 */
export function useAccounts() {
  return useQuery<SocialAccountListResponse, Error>({
    queryKey: pfmKeys.accounts(),
    queryFn: () => apiClient<SocialAccountListResponse>("/api/accounts"),
  });
}

/**
 * Account pause state - stored in localStorage
 * Allows users to temporarily pause posting to specific accounts
 */
const PAUSED_ACCOUNTS_KEY = "hypesocial_paused_accounts";

function getPausedAccounts(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem(PAUSED_ACCOUNTS_KEY);
    if (!stored) return new Set();
    return new Set(JSON.parse(stored));
  } catch {
    return new Set();
  }
}

function savePausedAccounts(paused: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PAUSED_ACCOUNTS_KEY, JSON.stringify([...paused]));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Hook to manage paused accounts
 * Returns paused account IDs and functions to pause/resume
 */
export function usePausedAccounts() {
  const [pausedIds, setPausedIds] = useState<Set<string>>(new Set());
  const [isReady, setIsReady] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setPausedIds(getPausedAccounts());
    setIsReady(true);
  }, []);

  const pauseAccount = useCallback((accountId: string) => {
    setPausedIds((prev) => {
      const next = new Set(prev);
      next.add(accountId);
      savePausedAccounts(next);
      return next;
    });
  }, []);

  const resumeAccount = useCallback((accountId: string) => {
    setPausedIds((prev) => {
      const next = new Set(prev);
      next.delete(accountId);
      savePausedAccounts(next);
      return next;
    });
  }, []);

  const toggleAccount = useCallback((accountId: string) => {
    setPausedIds((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      savePausedAccounts(next);
      return next;
    });
  }, []);

  const isPaused = useCallback(
    (accountId: string) => pausedIds.has(accountId),
    [pausedIds],
  );

  return {
    pausedIds,
    isReady,
    pauseAccount,
    resumeAccount,
    toggleAccount,
    isPaused,
  };
}

/**
 * Get single account
 */
export function useAccount(id: string) {
  return useQuery<SocialAccount, Error>({
    queryKey: pfmKeys.account(id),
    queryFn: () => apiClient<SocialAccount>(`/api/accounts/${id}`),
    enabled: !!id,
  });
}

/**
 * Connect account mutation
 *
 * Standard OAuth: User redirected to Post For Me, returns to your callback
 * Intercepted OAuth: User redirected to your app (white-label), you handle callback
 *
 * Requirements for Intercepted OAuth:
 * - Must use your own credentials (NOT Quickstart)
 * - Your domain must be in social platform's authorized redirect domains
 * - Set Project Redirect URL in Post For Me dashboard
 *
 * Docs: https://www.postforme.dev/resources/intercepting-the-oauth-flow
 */
export function useConnectAccount() {
  const queryClient = useQueryClient();

  return useMutation<
    { auth_url: string },
    Error,
    {
      platform: string;
      /** For white-label OAuth interception. Your domain must be registered with social platform. */
      redirectUrlOverride?: string;
    }
  >({
    mutationFn: ({ platform, redirectUrlOverride }) =>
      apiClient<{ auth_url: string }>("/api/accounts", {
        method: "POST",
        body: JSON.stringify({
          platform,
          redirect_url_override: redirectUrlOverride,
        }),
      }),
    onSuccess: (data) => {
      // Redirect to OAuth URL
      window.location.href = data.auth_url;
    },
  });
}

// ==================== Account Feeds ====================

/**
 * Get social account feed with cursor-based pagination
 * Official API: GET /v1/social-account-feeds/{accountId}
 *
 * Docs: https://www.postforme.dev/resources/pagination-account-feeds
 */
export function useAccountFeed(
  accountId: string,
  options?: {
    limit?: number;
    cursor?: string;
    expand?: string; // e.g., "metrics"
    externalPostId?: string;
    socialPostId?: string;
    platformPostId?: string;
  },
) {
  const {
    limit = 50,
    cursor,
    expand,
    externalPostId,
    socialPostId,
    platformPostId,
  } = options || {};

  return useQuery<SocialAccountFeedResponse, Error>({
    queryKey: pfmKeys.feed(accountId, cursor),
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("limit", limit.toString());
      if (cursor) params.set("cursor", cursor);
      if (expand) params.set("expand", expand);
      if (externalPostId) params.set("external_post_id", externalPostId);
      if (socialPostId) params.set("social_post_id", socialPostId);
      if (platformPostId) params.set("platform_post_id", platformPostId);

      return apiClient<SocialAccountFeedResponse>(
        `/api/account-feeds/${accountId}?${params.toString()}`,
      );
    },
    enabled: !!accountId,
  });
}

// ==================== Social Post Previews ====================

/**
 * Generate preview of how posts will look on social platforms
 * Useful for validating content before publishing
 *
 * API: POST /v1/social-post-previews
 * https://api.postforme.dev/docs#tag/social-post-previews/POST/v1/social-post-previews
 */
export function usePostPreview() {
  return useMutation<
    SocialPostPreviewResponse,
    Error,
    SocialPostPreviewRequest
  >({
    mutationFn: async (data) => {
      const response = await fetch("/api/social-post-previews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to generate preview");
      }

      return response.json();
    },
  });
}

// ==================== Helper Hooks ====================

/**
 * Register app webhook helper
 */
export function useRegisterAppWebhook() {
  const createWebhook = useCreateWebhook();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const webhookUrl = `${appUrl}/api/webhooks/post-for-me`;

  // Query webhooks filtered by our app URL to check if already registered
  const { data: existingWebhooks } = useWebhooks({ url: [webhookUrl] });

  const register = async (eventTypes?: PostForMeEventType[]) => {
    // Check if webhook already exists
    const exists = existingWebhooks?.data.some((w) => w.url === webhookUrl);

    if (exists) {
      console.log("[Webhook] Already registered");
      return existingWebhooks?.data.find((w) => w.url === webhookUrl);
    }

    return createWebhook.mutateAsync({
      url: webhookUrl,
      eventTypes: eventTypes || [
        "social.post.created",
        "social.post.updated",
        "social.post.result.created",
        "social.account.created",
        "social.account.updated",
      ],
    });
  };

  return {
    register,
    isLoading: createWebhook.isPending,
    error: createWebhook.error,
  };
}
