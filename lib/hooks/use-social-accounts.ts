/**
 * Social Account Hooks - Production Grade TanStack Query
 * @module lib/hooks/use-social-accounts
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, useQueries, UseQueryResult } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { pfmKeys } from "./keys";
import { TIME, PAGINATION } from "@/lib/constants";
import type { 
  SocialAccount, 
  SocialAccountListResponse, 
  SocialAccountFeedItem,
  UpdateSocialAccountDto,
  CreateSocialAccountDto,
} from "@/types/post-for-me-types";
import { toast } from "sonner";

// ==================== Types ====================

interface AccountsFilter {
  limit?: number;
  offset?: number;
  platform?: string[];
  status?: ("connected" | "disconnected")[];
}

// ==================== Queries ====================

/**
 * Get all social accounts with optimized caching
 * 
 * Features:
 * - placeholderData: Shows cached data immediately (no loading spinner)
 * - staleTime: 2 minutes - data considered fresh
 * - gcTime: 10 minutes - keep in cache for back navigation
 */
export function useSocialAccounts<T = SocialAccountListResponse>(
  limit: number = PAGINATION.DEFAULT_LIMIT,
  offset: number = 0,
  platform?: string[],
  status?: ("connected" | "disconnected")[],
  options?: Omit<Parameters<typeof useQuery<SocialAccountListResponse, Error, T>>[0], 'queryKey' | 'queryFn'>
) {
  return useQuery<SocialAccountListResponse, Error, T>({
    // TanStack Query handles key serialization internally - no useMemo needed
    queryKey: [
      ...pfmKeys.accounts(),
      limit,
      offset,
      platform?.join(",") ?? null,
      status?.join(",") ?? null,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("limit", limit.toString());
      params.set("offset", offset.toString());
      platform?.forEach((p) => params.append("platform", p));
      status?.forEach((s) => params.append("status", s));
      
      return apiClient<SocialAccountListResponse>(`/api/accounts?${params}`);
    },
    // CRITICAL: Show cached data immediately while fetching
    placeholderData: (previousData) => previousData,
    // Data stays fresh for 2 minutes
    staleTime: TIME.STALE_TIME_ACCOUNTS,
    // Keep in cache for 10 minutes (back navigation)
    gcTime: TIME.MINUTE * 10,
    // Don't refetch on mount if data exists
    refetchOnMount: false,
    // Refetch on window focus for fresh status
    refetchOnWindowFocus: true,
    ...options,
  });
}

/**
 * Get single account by ID
 */
export function useSocialAccount(id: string) {
  return useQuery<SocialAccount, Error>({
    queryKey: pfmKeys.account(id),
    queryFn: () => apiClient<SocialAccount>(`/api/accounts/${id}`),
    enabled: !!id,
    placeholderData: (previousData) => previousData,
    staleTime: TIME.MINUTE * 5,
  });
}

/**
 * Prefetch an account for instant navigation
 */
export function usePrefetchAccount() {
  const queryClient = useQueryClient();

  return (id: string) => {
    if (!id) return;
    queryClient.prefetchQuery({
      queryKey: pfmKeys.account(id),
      queryFn: () => apiClient<SocialAccount>(`/api/accounts/${id}`),
      staleTime: TIME.MINUTE * 5,
    });
  };
}

// ==================== Mutations ====================

/**
 * Connect a new social account
 * Initiates OAuth flow
 */
export function useConnectSocialAccount() {
  const queryClient = useQueryClient();

  return useMutation<
    { url: string; platform: string },
    Error,
    { platform: string; redirect_uri: string }
  >({
    mutationFn: ({ platform, redirect_uri }) => {
      // Build body - only include redirect_url for non-Quickstart projects
      const body: { 
        platform: string; 
        redirect_url?: string; 
        permissions?: string[];
        platform_data?: Record<string, unknown>;
      } = { 
        platform,
        // Request both posting and feed access
        permissions: ["posts", "feeds"],
      };
      if (redirect_uri && redirect_uri.trim() !== "") {
        body.redirect_url = redirect_uri;
      }
      // LinkedIn requires connection_type in platform_data
      if (platform === "linkedin") {
        body.platform_data = {
          linkedin: {
            connection_type: "personal" // or "organization" for Community API
          }
        };
      }
      return apiClient<{ url: string; platform: string }>("/api/accounts/auth-url", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    onSuccess: (data) => {
      // Redirect to OAuth provider
      window.location.href = data.url;
    },

    onError: (error) => {
      toast.error(error.message || "Failed to connect account");
    },
  });
}

/**
 * Disconnect a social account
 */
export function useDisconnectSocialAccount() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) =>
      apiClient<{ success: boolean }>(`/api/accounts/${id}/disconnect`, {
        method: "POST",
      }),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: pfmKeys.accounts() });

      const previousAccounts = queryClient.getQueryData<SocialAccountListResponse>(
        pfmKeys.accounts()
      );

      queryClient.setQueryData<SocialAccountListResponse>(
        pfmKeys.accounts(),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((acc) =>
              acc.id === id ? { ...acc, status: "disconnected" as const } : acc
            ),
          };
        }
      );

      return { previousAccounts };
    },

    onError: (error, _id, context) => {
      const ctx = context as { previousAccounts?: SocialAccountListResponse } | undefined;
      if (ctx?.previousAccounts) {
        queryClient.setQueryData(pfmKeys.accounts(), ctx.previousAccounts);
      }
      toast.error(error.message || "Failed to disconnect account");
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pfmKeys.accounts() });
      toast.success("Account disconnected");
    },
  });
}

/**
 * Create a social account manually with existing access token
 * For admin/migration use cases
 */
export function useCreateSocialAccount() {
  const queryClient = useQueryClient();

  return useMutation<
    SocialAccount,
    Error,
    CreateSocialAccountDto
  >({
    mutationFn: (data) =>
      apiClient<SocialAccount>("/api/accounts/manual", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pfmKeys.accounts() });
      toast.success("Account created successfully");
    },

    onError: (error) => {
      toast.error(error.message || "Failed to create account");
    },
  });
}

/**
 * Update account settings
 */
export function useUpdateSocialAccount() {
  const queryClient = useQueryClient();

  return useMutation<
    SocialAccount,
    Error,
    { id: string; data: UpdateSocialAccountDto }
  >({
    mutationFn: ({ id, data }) =>
      apiClient<SocialAccount>(`/api/accounts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: pfmKeys.account(id) });
      await queryClient.cancelQueries({ queryKey: pfmKeys.accounts() });

      const previousAccount = queryClient.getQueryData<SocialAccount>(
        pfmKeys.account(id)
      );
      const previousAccounts = queryClient.getQueryData<SocialAccountListResponse>(
        pfmKeys.accounts()
      );

      queryClient.setQueryData<SocialAccount>(pfmKeys.account(id), (old) => {
        if (!old) return old;
        return { ...old, ...data };
      });

      queryClient.setQueryData<SocialAccountListResponse>(
        pfmKeys.accounts(),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((acc) =>
              acc.id === id ? { ...acc, ...data } : acc
            ),
          };
        }
      );

      return { previousAccount, previousAccounts };
    },

    onError: (error, variables, context) => {
      const ctx = context as { previousAccount?: SocialAccount; previousAccounts?: SocialAccountListResponse } | undefined;
      if (ctx?.previousAccount) {
        queryClient.setQueryData(pfmKeys.account(variables.id), ctx.previousAccount);
      }
      if (ctx?.previousAccounts) {
        queryClient.setQueryData(pfmKeys.accounts(), ctx.previousAccounts);
      }
      toast.error(error.message || "Failed to update account");
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pfmKeys.accounts() });
      queryClient.invalidateQueries({ queryKey: pfmKeys.account(variables.id) });
      toast.success("Account updated");
    },
  });
}

// ==================== Feed Queries ====================

interface AccountFeedOptions {
  limit?: number;
  cursor?: string;
  expand?: string[];
}

interface AccountFeedResponse {
  data: SocialAccountFeedItem[];
  meta: {
    cursor?: string;
    has_more: boolean;
  };
}

/**
 * Get feed for a single account
 */
export function useAccountFeed(
  accountId: string,
  options: AccountFeedOptions = {}
) {
  const { limit = PAGINATION.DEFAULT_LIMIT, cursor, expand } = options;

  return useQuery<AccountFeedResponse, Error>({
    queryKey: pfmKeys.feed(accountId, cursor),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("limit", limit.toString());
      if (cursor) params.set("cursor", cursor);
      if (expand?.length) params.set("expand", expand.join(","));

      return apiClient<AccountFeedResponse>(
        `/api/account-feeds/${accountId}?${params}`
      );
    },
    enabled: !!accountId,
    staleTime: TIME.MINUTE * 2,
  });
}

/**
 * Get feeds for multiple accounts in parallel
 * Returns normalized data for easy consumption
 */
export function useAllAccountFeeds(
  accountIds: string[],
  limit: number = PAGINATION.DEFAULT_LIMIT
) {
  const queries = useQueries({
    queries: accountIds.map((id) => ({
      queryKey: pfmKeys.feed(id, undefined),
      queryFn: async () => {
        const params = new URLSearchParams();
        params.set("limit", limit.toString());
        return apiClient<AccountFeedResponse>(
          `/api/account-feeds/${id}?${params}`
        );
      },
      enabled: !!id,
      staleTime: TIME.MINUTE * 2,
    })),
  });

  // Build feeds by account map
  const feedsByAccount = new Map<string, SocialAccountFeedItem[]>();
  queries.forEach((q, index) => {
    const accountId = accountIds[index];
    if (accountId && q.data?.data) {
      feedsByAccount.set(accountId, q.data.data);
    }
  });

  // Combine all feed items and sort by date
  const allItems = queries
    .flatMap((q) => q.data?.data ?? [])
    .sort((a, b) => 
      new Date(b.posted_at || 0).getTime() - new Date(a.posted_at || 0).getTime()
    );

  const isLoading = queries.some((q) => q.isLoading);
  const isAllLoaded = queries.every((q) => !q.isLoading);
  const loadingAccountIds = accountIds.filter((_, index) => queries[index]?.isLoading);
  
  // Build errors map for easy lookup by account ID
  const errors = new Map<string, Error>();
  queries.forEach((q, index) => {
    const accountId = accountIds[index];
    if (accountId && q.error) {
      errors.set(accountId, q.error);
    }
  });

  return {
    // For backwards compatibility
    data: feedsByAccount,
    feedsByAccount,
    allItems,
    items: allItems,
    isLoading,
    isAllLoaded,
    loadingAccountIds,
    errors,
    queries,
  };
}

// ==================== Utility Hooks ====================

/**
 * Get paused accounts for reconnect prompt
 * Maintains backwards compatibility with existing components
 */
export function usePausedSocialAccounts() {
  const { data, isLoading } = useSocialAccounts(PAGINATION.DEFAULT_LIMIT, 0, undefined, ["disconnected"]);
  const [selectedPausedIds, setSelectedPausedIds] = useState<Set<string>>(new Set());

  const pausedAccounts = data?.data ?? [];

  const isPaused = (accountId: string) => {
    return pausedAccounts.some((acc) => acc.id === accountId);
  };

  const isReady = (accountId: string) => {
    return selectedPausedIds.has(accountId);
  };

  const toggleAccount = (accountId: string) => {
    setSelectedPausedIds((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  };

  return { 
    pausedAccounts, 
    isPaused, 
    isLoading,
    // Backwards compatibility
    isReady,
    toggleAccount,
    selectedPausedIds,
  };
}
