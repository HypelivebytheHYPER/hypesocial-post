/**
 * TanStack Query keys for every query in the app.
 * @module lib/hooks/keys
 *
 * Centralized key factory so cache invalidation can reason across boundaries
 * (e.g. a webhook event invalidates both the PFM post query and the Lark
 * builder template list that depends on it).
 *
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

  // Builder Templates (Lark-backed, not Post For Me — lives here alongside
  // PFM keys so cross-cutting invalidation can reach it from one import)
  builderTemplates: () => [...pfmKeys.all, "builder", "templates"] as const,
  builderTemplate: (id: string) =>
    [...pfmKeys.builderTemplates(), id] as const,
};
