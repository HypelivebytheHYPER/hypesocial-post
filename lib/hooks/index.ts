/**
 * React Query Hooks - Single Source of Truth
 * @module lib/hooks
 * 
 * PROPER TanStack Patterns:
 * - Use `select` option for data transformation (not useMemo)
 * - Use `placeholderData` for previous data
 * - Use `useQueries` for parallel fetching
 * - Use `useInfiniteQuery` for pagination
 * 
 * ANTI-PATTERNS to avoid:
 * - useMemo for data transformation
 * - Manual caching with useState
 * - Fetching in useEffect
 */

// Query Keys
export { pfmKeys } from "./keys";

// NEW: Proper TanStack hooks (using select, not useMemo)
export { usePostsWithFilters } from "./usePostsWithFilters";
export { useAnalytics } from "./useAnalytics";

// Posts - Production Grade
export * from "./posts";

// Events
export { useEvents } from "./use-events";

// Webhooks
export {
  useWebhooks,
  useWebhook,
  useCreateWebhook,
  useUpdateWebhook,
  useDeleteWebhook,
} from "./use-webhooks";

// Media Upload
export {
  useUploadMedia,
  useUploadThumbnail,
} from "./use-media-upload";

// Social Accounts
export {
  useSocialAccounts,
  useSocialAccount,
  usePrefetchAccount,
  useConnectSocialAccount,
  useDisconnectSocialAccount,
  useCreateSocialAccount,
  useUpdateSocialAccount,
  useAccountFeed,
  useAccountFeedPagination,
  useAllAccountFeeds,
  usePausedSocialAccounts,
} from "./use-social-accounts";

// Canva
export {
  useCanvaToken,
  useConnectCanva,
  useDisconnectCanva,
  useCanvaDesigns,
  useCanvaBrandTemplates,
  useCanvaTemplateDataset,
  useCreateAutofillJob,
  useAutofillJob,
  useCreateExportJob,
  useExportJob,
  useCreateResizeJob,
  useResizeJob,
  useCreateAssetUploadJob,
  useAssetUploadJob,
  canvaKeys,
} from "./use-canva";

export {
  useCanvaCampaigns,
  useCreateCanvaCampaign,
  useUpdateCanvaCampaign,
  useDeleteCanvaCampaign,
  useCanvaProducts,
  useCreateCanvaProducts,
  useUpdateCanvaProducts,
  useDeleteCanvaProducts,
  useCanvaPages,
  useCreateCanvaPage,
  useUpdateCanvaPage,
  useDeleteCanvaPage,
  canvaCatalogKeys,
  type Campaign,
  type Product,
  type Page,
} from "./use-canva-catalog";

// Post Preview
export {
  usePostPreview,
  useRegisterAppWebhook,
} from "./use-post-preview";

// Media Validation
export {
  useMediaValidation,
  getRecommendedVideoSettings,
} from "./use-media-validation";

// ==================== Legacy Exports (For Component Compatibility) ====================
// These exports maintain backwards compatibility with existing components.
// New code should use the hooks from @/lib/hooks/posts directly.

export {
  usePostResultsList,
  usePrefetchResults,
} from "./posts/queries";

// Re-export with legacy names for backwards compatibility
export {
  usePosts as useSocialPosts,
  usePostsInfinite as useSocialPostsInfinite,
  usePost as useSocialPost,
  usePrefetchPost,
  useCreatePost as useCreateSocialPost,
  useUpdatePost as useUpdateSocialPost,
  useDeletePost as useDeleteSocialPost,
  useRetryPost as useRetrySocialPost,
} from "./posts";
