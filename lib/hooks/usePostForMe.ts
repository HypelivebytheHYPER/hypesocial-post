/**
 * Post For Me API Hooks
 * TanStack Query (React Query) integration for Post For Me API
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  useQuery,
  useQueries,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import {
  PostForMeWebhook,
  PostForMeWebhookListResponse,
  PostForMeEventType,
} from "@/types/webhooks";
import { WebhookListResponseSchema } from "@/lib/validations/webhooks";
import { apiClient } from "@/lib/api-client";
import type { WebhookEvent } from "@/lib/webhook-event-store";
import {
  SocialPost,
  SocialPostListResponse,
  SocialAccount,
  SocialAccountListResponse,
  SocialAccountFeedResponse,
  SocialAccountFeedItem,
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
};


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
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (filters?.offset != null)
        searchParams.set("offset", filters.offset.toString());
      if (filters?.limit != null)
        searchParams.set("limit", filters.limit.toString());
      filters?.url?.forEach((u) => searchParams.append("url", u));
      filters?.event_type?.forEach((e) => searchParams.append("event_type", e));
      filters?.id?.forEach((i) => searchParams.append("id", i));

      const query = searchParams.toString();
      const raw = await apiClient<PostForMeWebhookListResponse>(
        `/api/webhooks${query ? `?${query}` : ""}`,
      );

      // Validate at fetch time — runs once per fetch, not on every render
      const result = WebhookListResponseSchema.safeParse(raw);
      if (!result.success) {
        console.warn("Webhook response validation failed:", result.error.issues);
        return raw; // Fallback to raw data if validation fails
      }
      return result.data;
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
 * Updates are now webhook-driven via `useWebhookStatus()` which invalidates
 * this query when a webhook event arrives. Falls back to `refetchOnWindowFocus`
 * (React Query default) when the status endpoint is unavailable.
 */
export function usePosts(params?: { offset?: number; limit?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.offset != null)
    searchParams.set("offset", params.offset.toString());
  if (params?.limit != null)
    searchParams.set("limit", params.limit.toString());
  const query = searchParams.toString();

  return useQuery<SocialPostListResponse, Error>({
    queryKey: [...pfmKeys.posts(), params],
    queryFn: () =>
      apiClient<SocialPostListResponse>(
        `/api/posts${query ? `?${query}` : ""}`,
      ),
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
 * Update post mutation
 * API: PUT /v1/social-posts/{id}
 */
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation<
    SocialPost,
    Error,
    { id: string; data: Partial<CreateSocialPostDto> }
  >({
    mutationFn: ({ id, data }) =>
      apiClient<SocialPost>(`/api/posts/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pfmKeys.posts() });
      queryClient.invalidateQueries({
        queryKey: pfmKeys.post(variables.id),
      });
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
        media: failedPost.media?.map((m) => ({
          url: m.url,
          thumbnail_url: m.thumbnail_url,
          skip_processing: m.skip_processing,
        })),
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
 * Polls every 5s while processing, stops once results arrive or status is terminal.
 */
export function usePostResults(postId: string, isProcessing?: boolean) {
  return useQuery<SocialPostResultListResponse, Error>({
    queryKey: pfmKeys.postResultsByPost(postId),
    queryFn: () =>
      apiClient<SocialPostResultListResponse>(
        `/api/post-results?post_id=${postId}`,
      ),
    enabled: !!postId,
    // Poll every 5s while processing, stop when terminal
    refetchInterval: isProcessing ? 5_000 : false,
    refetchIntervalInBackground: false,
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
  });
}

/**
 * Upload media mutation
 */
export function useUploadMedia() {
  return useMutation<
    { url: string },
    Error,
    { file: File }
  >({
    mutationFn: async ({ file }) => {
      // Step 1: Get presigned upload URL and public media URL
      const { upload_url, media_url } = await apiClient<{
        upload_url: string;
        media_url: string;
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
        const errorText = await response.text().catch(() => "");
        throw new Error(`Upload failed: ${response.status} ${errorText || response.statusText}`);
      }

      // Step 3: Return the public media URL (for use in posts)
      return { url: media_url };
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
    { url: string },
    Error,
    { dataUrl: string; filename?: string }
  >({
    mutationFn: async ({ dataUrl, filename = "thumbnail.jpg" }) => {
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      if (!response.ok) {
        throw new Error("Failed to convert thumbnail data URL to blob");
      }
      const blob = await response.blob();

      // Create a File from the blob
      const file = new File([blob], filename, { type: "image/jpeg" });

      // Step 1: Get presigned upload URL and public media URL
      const { upload_url, media_url } = await apiClient<{
        upload_url: string;
        media_url: string;
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
        const errorText = await uploadResponse.text().catch(() => "");
        throw new Error(`Thumbnail upload failed: ${uploadResponse.status} ${errorText || uploadResponse.statusText}`);
      }

      // Step 3: Return the public media URL (for use in posts)
      return { url: media_url };
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
  return useMutation<
    { url: string },
    Error,
    {
      platform: string;
      /** For white-label OAuth interception. Your domain must be registered with social platform. */
      redirectUrlOverride?: string;
      /** Permissions to request. Defaults to ["posts", "feeds"] for posting + analytics. */
      permissions?: ("posts" | "feeds")[];
    }
  >({
    mutationFn: ({ platform, redirectUrlOverride, permissions }) =>
      apiClient<{ url: string }>("/api/accounts/auth-url", {
        method: "POST",
        body: JSON.stringify({
          platform,
          redirect_url_override: redirectUrlOverride,
          permissions: permissions || ["posts", "feeds"],
        }),
      }),
    onSuccess: (data) => {
      // Redirect to OAuth URL
      window.location.href = data.url;
    },
  });
}

/**
 * Disconnect account mutation
 * Disconnects a social account by ID
 * API: POST /api/accounts/{id}/disconnect
 */
export function useDisconnectAccount() {
  const queryClient = useQueryClient();

  return useMutation<SocialAccount, Error, string>({
    mutationFn: (id) =>
      apiClient<SocialAccount>(`/api/accounts/${id}/disconnect`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pfmKeys.accounts() });
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

/**
 * Fetch feeds for all accounts in parallel using useQueries.
 * Used by the analytics page to aggregate metrics across all connected accounts.
 */
export function useAllAccountFeeds(
  accountIds: string[],
  options?: { limit?: number; expand?: string },
) {
  const { limit = 50, expand = "metrics" } = options || {};

  const queries = useQueries({
    queries: accountIds.map((accountId) => ({
      queryKey: pfmKeys.feed(accountId),
      queryFn: () => {
        const params = new URLSearchParams();
        params.set("limit", limit.toString());
        if (expand) params.set("expand", expand);
        return apiClient<SocialAccountFeedResponse>(
          `/api/account-feeds/${accountId}?${params.toString()}`,
        );
      },
      enabled: !!accountId,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const isAllLoaded = queries.every((q) => !q.isLoading);
  const loadingAccountIds = accountIds.filter((_, i) => queries[i]?.isLoading);

  const data = new Map<string, SocialAccountFeedItem[]>();
  const errors = new Map<string, Error>();
  queries.forEach((q, i) => {
    const accountId = accountIds[i] ?? "";
    if (q.data) data.set(accountId, q.data.data);
    if (q.error) errors.set(accountId, q.error as Error);
  });

  const allItems: SocialAccountFeedItem[] = [];
  data.forEach((items) => allItems.push(...items));

  return { data, allItems, isLoading, isAllLoaded, loadingAccountIds, errors, queries };
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
    mutationFn: (data) =>
      apiClient<SocialPostPreviewResponse>("/api/social-post-previews", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

// ==================== Helper Hooks ====================

/**
 * Register app webhook helper
 * Uses a ref to ensure registration is only attempted once per mount,
 * preventing infinite retry loops on auth errors (401).
 */
export function useRegisterAppWebhook() {
  const createWebhook = useCreateWebhook();
  // Register the Cloudflare Worker URL (relays to Vercel), not the Vercel URL directly
  const webhookUrl =
    process.env.NEXT_PUBLIC_WEBHOOK_URL ||
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/post-for-me`;
  const attempted = useRef(false);

  // Query webhooks filtered by our app URL to check if already registered
  // retry: false prevents TanStack Query from retrying 401 errors
  const { data: existingWebhooks, isLoading: isChecking } = useWebhooks(
    { url: [webhookUrl] },
    { retry: false, staleTime: Infinity },
  );

  const register = useCallback(
    async (eventTypes?: PostForMeEventType[]) => {
      // Only attempt once per app mount
      if (attempted.current) return;

      // Don't mark as attempted until query has loaded — avoids race condition
      // where register() is called before the webhook list query resolves
      if (isChecking) return;
      attempted.current = true;

      // Check if webhook already exists
      const exists = existingWebhooks?.data?.some((w) => w.url === webhookUrl);
      if (exists) {
        return existingWebhooks?.data.find((w) => w.url === webhookUrl);
      }

      return createWebhook.mutateAsync({
        url: webhookUrl,
        eventTypes: eventTypes || [
          "social.post.created",
          "social.post.updated",
          "social.post.deleted",
          "social.post.result.created",
          "social.account.created",
          "social.account.updated",
        ],
      });
    },
    // Only re-create when data is actually ready (not on every error/refetch)
    [existingWebhooks, isChecking, webhookUrl, createWebhook],
  );

  return {
    register,
    isLoading: createWebhook.isPending,
    error: createWebhook.error,
  };
}

// ==================== Webhook Status Monitor ====================

/**
 * Map webhook event types to the React Query keys that should be invalidated.
 */
function getInvalidationKeys(eventType: string): readonly (readonly string[])[] {
  if (eventType === "social.post.result.created") {
    return [pfmKeys.postResults(), pfmKeys.posts()];
  }
  if (eventType.startsWith("social.post.")) {
    return [pfmKeys.posts()];
  }
  if (eventType.startsWith("social.account.")) {
    // Account changes may affect webhook registrations too
    return [pfmKeys.accounts(), pfmKeys.webhooks()];
  }
  // Unknown event — invalidate everything under post-for-me
  return [pfmKeys.all];
}

/**
 * Poll the lightweight `/api/webhooks/post-for-me/status` endpoint every 10s.
 * When a new webhook event is detected (timestamp changed), trigger targeted
 * `invalidateQueries` so React Query refetches only the affected data.
 *
 * This replaces the 30s blind `refetchInterval` on `usePosts()` with a
 * webhook-driven approach: ~80 bytes per check instead of full data refetches.
 *
 * Degradation: if the status endpoint fails or returns `null` (cold instance),
 * no invalidation happens — `refetchOnWindowFocus` remains as the safety net.
 */
export function useWebhookStatus() {
  const queryClient = useQueryClient();
  const lastSeenTs = useRef<number | null>(null);
  const hiddenAtTs = useRef<number | null>(null);

  const { data } = useQuery<{ last_event: WebhookEvent | null }>({
    queryKey: ["webhook-status"],
    queryFn: () =>
      apiClient<{ last_event: WebhookEvent | null }>(
        "/api/webhooks/post-for-me/status",
      ),
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
    staleTime: 5_000,
    gcTime: 0,
    retry: 3,
  });

  // When returning from background after >15s, broadly invalidate core queries.
  // The in-memory event store has a 60s TTL, so targeted invalidation may miss
  // events that arrived while the mobile browser was backgrounded.
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "hidden") {
        hiddenAtTs.current = Date.now();
      } else if (document.visibilityState === "visible" && hiddenAtTs.current) {
        const awayMs = Date.now() - hiddenAtTs.current;
        hiddenAtTs.current = null;
        // Only force-invalidate if away long enough to miss polling cycles
        if (awayMs > 15_000) {
          queryClient.invalidateQueries({ queryKey: pfmKeys.posts() });
          queryClient.invalidateQueries({ queryKey: pfmKeys.postResults() });
          queryClient.invalidateQueries({ queryKey: pfmKeys.accounts() });
        }
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [queryClient]);

  useEffect(() => {
    const event = data?.last_event;
    if (!event) return;

    // Skip if we've already processed this timestamp
    if (lastSeenTs.current !== null && event.ts <= lastSeenTs.current) return;
    lastSeenTs.current = event.ts;

    // Targeted invalidation based on event type
    const keys = getInvalidationKeys(event.event_type);
    for (const key of keys) {
      queryClient.invalidateQueries({ queryKey: key });
    }
  }, [data, queryClient]);
}
