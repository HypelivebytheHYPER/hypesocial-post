import { QueryClient, dehydrate } from "@tanstack/react-query";
import { pfm } from "@/lib/post-for-me";

/**
 * Server-side prefetch for dashboard data.
 *
 * Calls pfm SDK directly (no HTTP round-trip through Next.js API routes)
 * and dehydrates the QueryClient state for HydrationBoundary.
 *
 * Query keys are inlined here (not imported from usePostForMe.ts) because
 * that file contains React hooks which cannot be imported in server components.
 *
 * Keys match the client-side hooks exactly:
 * - useAccounts()  → ["post-for-me", "accounts"]
 * - usePosts()     → ["post-for-me", "posts", undefined]
 *
 * If either prefetch fails, prefetchQuery silently swallows the error —
 * the client hook will fetch normally. Safe degradation.
 */
export async function prefetchDashboardData() {
  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["post-for-me", "accounts"],
      queryFn: () => pfm.socialAccounts.list(),
    }),
    queryClient.prefetchQuery({
      queryKey: ["post-for-me", "posts", undefined],
      queryFn: () => pfm.socialPosts.list(),
    }),
  ]);

  return dehydrate(queryClient);
}
