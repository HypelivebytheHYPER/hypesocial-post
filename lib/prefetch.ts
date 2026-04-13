import { QueryClient, dehydrate } from "@tanstack/react-query";
import { pfm } from "@/lib/post-for-me-client";
import { pfmKeys } from "./hooks/keys";
import { PAGINATION } from "./constants";

/**
 * Server-side prefetch for dashboard data.
 *
 * Calls pfm SDK directly (no HTTP round-trip through Next.js API routes)
 * and dehydrates the QueryClient state for HydrationBoundary.
 *
 * Query keys MUST match the hooks exactly:
 * - useSocialAccounts(DEFAULT_LIMIT, 0) → ["post-for-me", "accounts", DEFAULT_LIMIT, 0, undefined, undefined]
 * - useSocialPosts({ limit: DEFAULT_LIMIT }) → ["post-for-me", "posts", undefined, DEFAULT_LIMIT, undefined, undefined]
 *
 * If prefetch fails, it silently swallows the error — the client hook will fetch normally.
 */
export async function prefetchDashboardData() {
  const queryClient = new QueryClient();

  // These keys MUST match the hooks exactly
  await Promise.all([
    // useSocialAccounts(DEFAULT_LIMIT, 0)
    queryClient.prefetchQuery({
      queryKey: [...pfmKeys.accounts(), PAGINATION.DEFAULT_LIMIT, 0, undefined, undefined],
      queryFn: () => pfm.socialAccounts.list({ limit: PAGINATION.DEFAULT_LIMIT, offset: 0 }),
    }),
    // useSocialPosts({ limit: DEFAULT_LIMIT })
    queryClient.prefetchQuery({
      queryKey: [...pfmKeys.posts(), undefined, PAGINATION.DEFAULT_LIMIT, undefined, undefined],
      queryFn: () => pfm.socialPosts.list({ limit: PAGINATION.DEFAULT_LIMIT }),
    }),
  ]);

  return dehydrate(queryClient);
}

/**
 * Prefetch for posts page
 * Includes dashboard data (DEFAULT_LIMIT) + posts page data (MAX_PAGE_SIZE)
 */
export async function prefetchPostsData() {
  const queryClient = new QueryClient();

  await Promise.all([
    // Shared with dashboard
    queryClient.prefetchQuery({
      queryKey: [...pfmKeys.accounts(), PAGINATION.DEFAULT_LIMIT, 0, undefined, undefined],
      queryFn: () => pfm.socialAccounts.list({ limit: PAGINATION.DEFAULT_LIMIT, offset: 0 }),
    }),
    // Posts page: larger limit
    queryClient.prefetchQuery({
      queryKey: [...pfmKeys.posts(), undefined, PAGINATION.MAX_PAGE_SIZE, undefined, undefined],
      queryFn: () => pfm.socialPosts.list({ limit: PAGINATION.MAX_PAGE_SIZE }),
    }),
    // Post results for status indicators
    queryClient.prefetchQuery({
      queryKey: [...pfmKeys.postResults(), PAGINATION.MAX_PAGE_SIZE, undefined, undefined],
      queryFn: () => pfm.socialPostResults.list({ limit: PAGINATION.MAX_PAGE_SIZE }),
    }),
  ]);

  return dehydrate(queryClient);
}

/**
 * Prefetch for accounts page
 */
export async function prefetchAccountsData() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: [...pfmKeys.accounts(), PAGINATION.MAX_PAGE_SIZE, 0, undefined, undefined],
    queryFn: () => pfm.socialAccounts.list({ limit: PAGINATION.MAX_PAGE_SIZE, offset: 0 }),
  });

  return dehydrate(queryClient);
}

/**
 * Prefetch for feed page (uses dashboard accounts)
 */
export async function prefetchFeedData() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: [...pfmKeys.accounts(), PAGINATION.DEFAULT_LIMIT, 0, undefined, undefined],
    queryFn: () => pfm.socialAccounts.list({ limit: PAGINATION.DEFAULT_LIMIT, offset: 0 }),
  });

  return dehydrate(queryClient);
}

/**
 * Prefetch for webhooks page
 * Note: Webhooks are fetched via API route, not SDK
 */
export async function prefetchWebhooksData() {
  const queryClient = new QueryClient();
  // Webhooks are fetched via /api/webhooks route
  // No server prefetch needed - client will fetch
  return dehydrate(queryClient);
}

/**
 * Prefetch for analytics page
 */
export async function prefetchAnalyticsData() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: [...pfmKeys.accounts(), PAGINATION.DEFAULT_LIMIT, 0, undefined, undefined],
    queryFn: () => pfm.socialAccounts.list({ limit: PAGINATION.DEFAULT_LIMIT, offset: 0 }),
  });

  return dehydrate(queryClient);
}
