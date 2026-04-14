/**
 * Social Account Hooks - Production Grade TanStack Query
 * @module lib/hooks/use-social-accounts
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
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
    next?: string;
  };
}

interface UseSocialAccountsOptions {
  staleTime?: number;
  gcTime?: number;
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
}

// ==================== Query Builders ====================

function buildAccountsQueryParams(
  limit: number,
  offset: number,
  platform?: string[],
  status?: ("connected" | "disconnected")[]
): string {
  const params = new URLSearchParams();
  params.set("limit", limit.toString());
  params.set("offset", offset.toString());
  platform?.forEach((platformItem) => params.append("platform", platformItem));
  status?.forEach((statusItem) => params.append("status", statusItem));
  return params.toString();
}

function buildFeedQueryParams(
  limit: number,
  cursor?: string,
  expand?: string[]
): string {
  const params = new URLSearchParams();
  params.set("limit", limit.toString());
  if (cursor) params.set("cursor", cursor);
  if (expand?.length) params.set("expand", expand.join(","));
  return params.toString();
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
export function useSocialAccounts(
  limit: number = PAGINATION.DEFAULT_LIMIT,
  offset: number = 0,
  platform?: string[],
  status?: ("connected" | "disconnected")[],
  options?: UseSocialAccountsOptions
) {
  const queryParams = buildAccountsQueryParams(limit, offset, platform, status);
  
  return useQuery<SocialAccountListResponse, Error>({
    queryKey: [
      ...pfmKeys.accounts(),
      limit,
      offset,
      platform?.join(",") ?? null,
      status?.join(",") ?? null,
    ],
    queryFn: async () => {
      return apiClient<SocialAccountListResponse>(`/api/accounts?${queryParams}`);
    },
    placeholderData: (previousData) => previousData,
    staleTime: options?.staleTime ?? TIME.STALE_TIME_ACCOUNTS,
    gcTime: options?.gcTime ?? TIME.MINUTE * 10,
    refetchOnMount: options?.refetchOnMount ?? false,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? true,
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

  return (id: string): void => {
    if (!id) return;
    queryClient.prefetchQuery({
      queryKey: pfmKeys.account(id),
      queryFn: () => apiClient<SocialAccount>(`/api/accounts/${id}`),
      staleTime: TIME.MINUTE * 5,
    });
  };
}

// ==================== Mutations ====================

interface ConnectAccountVariables {
  platform: string;
  redirect_uri: string;
}

interface ConnectAccountResponse {
  url: string;
  platform: string;
}

/**
 * Connect a new social account
 * Initiates OAuth flow
 */
export function useConnectSocialAccount() {
  return useMutation<ConnectAccountResponse, Error, ConnectAccountVariables>({
    mutationFn: ({ platform, redirect_uri }) => {
      const body: { 
        platform: string; 
        redirect_url?: string; 
        permissions?: string[];
        platform_data?: Record<string, unknown>;
      } = { 
        platform,
        permissions: ["posts", "feeds"],
      };
      
      if (redirect_uri?.trim()) {
        body.redirect_url = redirect_uri;
      }
      
      if (platform === "linkedin") {
        body.platform_data = {
          linkedin: {
            connection_type: "personal"
          }
        };
      }
      
      return apiClient<ConnectAccountResponse>("/api/accounts/auth-url", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    onSuccess: (data) => {
      window.location.href = data.url;
    },

    onError: (error) => {
      toast.error(error.message || "Failed to connect account");
    },
  });
}

interface DisconnectContext {
  previousAccounts?: SocialAccountListResponse;
}

/**
 * Disconnect a social account
 */
export function useDisconnectSocialAccount() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, string, DisconnectContext>({
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
            data: old.data.map((account) =>
              account.id === id ? { ...account, status: "disconnected" as const } : account
            ),
          };
        }
      );

      return { previousAccounts };
    },

    onError: (error, _id, context) => {
      if (context?.previousAccounts) {
        queryClient.setQueryData(pfmKeys.accounts(), context.previousAccounts);
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

  return useMutation<SocialAccount, Error, CreateSocialAccountDto>({
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

interface UpdateAccountVariables {
  id: string;
  data: UpdateSocialAccountDto;
}

interface UpdateAccountContext {
  previousAccount?: SocialAccount;
  previousAccounts?: SocialAccountListResponse;
}

/**
 * Update account settings
 */
export function useUpdateSocialAccount() {
  const queryClient = useQueryClient();

  return useMutation<SocialAccount, Error, UpdateAccountVariables, UpdateAccountContext>({
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
            data: old.data.map((account) =>
              account.id === id ? { ...account, ...data } : account
            ),
          };
        }
      );

      return { previousAccount, previousAccounts };
    },

    onError: (error, variables, context) => {
      if (context?.previousAccount) {
        queryClient.setQueryData(pfmKeys.account(variables.id), context.previousAccount);
      }
      if (context?.previousAccounts) {
        queryClient.setQueryData(pfmKeys.accounts(), context.previousAccounts);
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

/**
 * Get feed for a single account
 */
export function useAccountFeed(
  accountId: string,
  options: AccountFeedOptions = {}
) {
  const { limit = PAGINATION.DEFAULT_LIMIT, cursor, expand } = options;
  const queryParams = buildFeedQueryParams(limit, cursor, expand);

  return useQuery<AccountFeedResponse, Error>({
    queryKey: pfmKeys.feed(accountId, cursor),
    queryFn: () => apiClient<AccountFeedResponse>(`/api/account-feeds/${accountId}?${queryParams}`),
    enabled: !!accountId,
    staleTime: TIME.MINUTE * 2,
  });
}

interface PaginationActions {
  loadMore: () => void;
  reset: () => void;
}

interface PaginationResult extends PaginationActions {
  items: SocialAccountFeedItem[];
  latestPage: SocialAccountFeedItem[];
  hasMore: boolean;
  cursor?: string;
  nextUrl?: string;
  cursors: string[];
  accumulatedItems: SocialAccountFeedItem[];
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  query: ReturnType<typeof useQuery<AccountFeedResponse, Error>>;
}

/**
 * Hook for cursor-based pagination with accumulated results
 * 
 * Features:
 * - Accumulates all loaded items
 * - Manages cursor history for pagination
 * - Provides helpers for next page navigation
 * 
 * @example
 * ```tsx
 * const { items, hasMore, loadMore, isLoading, reset } = useAccountFeedPagination(accountId);
 * ```
 */
export function useAccountFeedPagination(
  accountId: string,
  options: { limit?: number; expand?: string[] } = {}
): PaginationResult {
  const { limit = PAGINATION.DEFAULT_LIMIT, expand } = options;
  const queryClient = useQueryClient();
  
  const [cursors, setCursors] = useState<string[]>([]);
  const [accumulatedItems, setAccumulatedItems] = useState<SocialAccountFeedItem[]>([]);
  
  const currentCursor = cursors.length > 0 ? cursors[cursors.length - 1] : undefined;
  const queryParams = buildFeedQueryParams(limit, currentCursor, expand);
  
  const query = useQuery<AccountFeedResponse, Error>({
    queryKey: [...pfmKeys.feed(accountId, currentCursor), "pagination"],
    queryFn: () => apiClient<AccountFeedResponse>(`/api/account-feeds/${accountId}?${queryParams}`),
    enabled: !!accountId,
    staleTime: TIME.MINUTE * 2,
  });

  // Accumulate items when data changes
  useEffect(() => {
    if (!query.data?.data) return;

    const newData = query.data.data;
    
    if (cursors.length <= 1) {
      // First load or reset - replace all items
      setAccumulatedItems(newData);
    } else {
      // Subsequent loads - append new unique items
      setAccumulatedItems((previous) => {
        const existingIds = new Set(previous.map((item) => item.platform_post_id));
        const newItems = newData.filter(
          (item) => !existingIds.has(item.platform_post_id)
        );
        return [...previous, ...newItems];
      });
    }
  }, [query.data?.data, cursors.length]);

  const loadMore = useCallback((): void => {
    const nextCursor = query.data?.meta?.cursor;
    if (nextCursor) {
      setCursors((previous) => [...previous, nextCursor]);
    }
  }, [query.data?.meta?.cursor]);

  const reset = useCallback((): void => {
    setCursors([]);
    setAccumulatedItems([]);
    queryClient.invalidateQueries({ queryKey: pfmKeys.feeds() });
  }, [queryClient]);

  return {
    items: accumulatedItems,
    latestPage: query.data?.data ?? [],
    hasMore: query.data?.meta?.has_more ?? false,
    cursor: query.data?.meta?.cursor,
    nextUrl: query.data?.meta?.next,
    cursors,
    accumulatedItems,
    loadMore,
    reset,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    query,
  };
}

// ==================== Aggregated Feed Queries ====================

interface AllAccountFeedsResult {
  /** @deprecated Use feedsByAccount instead */
  data: Map<string, SocialAccountFeedItem[]>;
  feedsByAccount: Map<string, SocialAccountFeedItem[]>;
  allItems: SocialAccountFeedItem[];
  items: SocialAccountFeedItem[];
  isLoading: boolean;
  isAllLoaded: boolean;
  loadingAccountIds: string[];
  errors: Map<string, Error>;
  queries: ReturnType<typeof useQueries>;
}

/**
 * Get feeds for multiple accounts in parallel
 * Returns normalized data for easy consumption
 */
export function useAllAccountFeeds(
  accountIds: string[],
  limit: number = PAGINATION.DEFAULT_LIMIT
): AllAccountFeedsResult {
  const queries = useQueries({
    queries: accountIds.map((id) => ({
      queryKey: pfmKeys.feed(id, undefined),
      queryFn: async () => {
        const params = buildFeedQueryParams(limit, undefined, undefined);
        return apiClient<AccountFeedResponse>(`/api/account-feeds/${id}?${params}`);
      },
      enabled: !!id,
      staleTime: TIME.MINUTE * 2,
    })),
  });

  // Build feeds by account map
  const feedsByAccount = new Map<string, SocialAccountFeedItem[]>();
  queries.forEach((queryResult, index) => {
    const accountId = accountIds[index];
    if (accountId && queryResult.data?.data) {
      feedsByAccount.set(accountId, queryResult.data.data);
    }
  });

  // Combine all feed items and sort by date
  const allItems = queries
    .flatMap((queryResult) => queryResult.data?.data ?? [])
    .sort((a, b) => 
      new Date(b.posted_at || 0).getTime() - new Date(a.posted_at || 0).getTime()
    );

  const isLoading = queries.some((queryResult) => queryResult.isLoading);
  const isAllLoaded = queries.every((queryResult) => !queryResult.isLoading);
  const loadingAccountIds = accountIds.filter((_, index) => queries[index]?.isLoading);
  
  // Build errors map for easy lookup by account ID
  const errors = new Map<string, Error>();
  queries.forEach((queryResult, index) => {
    const accountId = accountIds[index];
    if (accountId && queryResult.error) {
      errors.set(accountId, queryResult.error as Error);
    }
  });

  return {
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

interface PausedAccountsResult {
  pausedAccounts: SocialAccount[];
  isPaused: (accountId: string) => boolean;
  isLoading: boolean;
  isReady: (accountId: string) => boolean;
  toggleAccount: (accountId: string) => void;
  selectedPausedIds: Set<string>;
}

/**
 * Get paused accounts for reconnect prompt
 * Maintains backwards compatibility with existing components
 */
export function usePausedSocialAccounts(): PausedAccountsResult {
  const { data, isLoading } = useSocialAccounts(
    PAGINATION.DEFAULT_LIMIT, 
    0, 
    undefined, 
    ["disconnected"]
  );
  const [selectedPausedIds, setSelectedPausedIds] = useState<Set<string>>(new Set());

  const pausedAccounts = useMemo(() => data?.data ?? [], [data]);

  const isPaused = useCallback((accountId: string): boolean => {
    return pausedAccounts.some((account: { id: string }) => account.id === accountId);
  }, [pausedAccounts]);

  const isReady = useCallback((accountId: string): boolean => {
    return selectedPausedIds.has(accountId);
  }, [selectedPausedIds]);

  const toggleAccount = useCallback((accountId: string): void => {
    setSelectedPausedIds((previous) => {
      const next = new Set(previous);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  }, []);

  return { 
    pausedAccounts, 
    isPaused, 
    isLoading,
    isReady,
    toggleAccount,
    selectedPausedIds,
  };
}
