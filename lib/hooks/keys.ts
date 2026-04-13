/**
 * TanStack Query keys for Post For Me API
 * @module lib/hooks/keys
 * 
 * Centralized query key factory for cache invalidation.
 * Import: import { pfmKeys } from "@/lib/hooks/keys";
 */

export const pfmKeys = {
  all: ["post-for-me"] as const,
  
  // Webhooks
  webhooks: () => [...pfmKeys.all, "webhooks"] as const,
  webhook: (id: string) => [...pfmKeys.webhooks(), id] as const,
  
  // Social Posts
  posts: () => [...pfmKeys.all, "posts"] as const,
  post: (id: string) => [...pfmKeys.posts(), id] as const,
  
  // Post Results
  postResults: () => [...pfmKeys.all, "post-results"] as const,
  postResult: (id: string) => [...pfmKeys.postResults(), id] as const,
  postResultsByPost: (postId: string) =>
    [...pfmKeys.postResults(), "post", postId] as const,
  
  // Social Accounts
  accounts: () => [...pfmKeys.all, "accounts"] as const,
  account: (id: string) => [...pfmKeys.accounts(), id] as const,
  
  // Account Feeds
  feeds: () => [...pfmKeys.all, "feeds"] as const,
  feed: (accountId: string, cursor?: string) =>
    [...pfmKeys.feeds(), accountId, cursor ?? "initial"] as const,
};
