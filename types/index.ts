/**
 * Type Definitions for HypeSocial
 * @module types
 * 
 * Centralized type exports for the application.
 * 
 * @example
 * ```tsx
 * import type { SocialPost, SocialAccount } from "@/types";
 * ```
 */

// Post For Me API Types
export type {
  // Core Post Types
  SocialPost,
  SocialPostDto,
  CreateSocialPostDto,
  UpdateSocialPostDto,
  SocialPostListResponse,
  
  // Media Types
  MediaItem,
  SocialPostMediaDto,
  MediaTag,
  UserTagDto,
  
  // Platform Configuration
  PlatformConfigurationsDto,
  PlatformConfigBuilder,
  PinterestConfigurationDto,
  InstagramConfigurationDto,
  TiktokConfigurationDto,
  TwitterConfigurationDto,
  YoutubeConfigurationDto,
  FacebookConfigurationDto,
  LinkedinConfigurationDto,
  BlueskyConfigurationDto,
  ThreadsConfigurationDto,
  TwitterPollDto,
  
  // Account Configuration
  AccountConfigurationDetailsDto,
  AccountConfigurationDto,
  
  // Account Types
  SocialAccount,
  SocialAccountDto,
  SocialAccountMetadata,
  CreateSocialAccountDto,
  UpdateSocialAccountDto,
  SocialAccountListResponse,
  
  // Feed Types
  SocialAccountFeedResponse,
  SocialAccountFeedItem,
  SocialAccountFeedItemMetrics,
  
  // Post Results
  SocialPostResult,
  SocialPostResultListResponse,
  
  // Preview Types
  SocialPostPreview,
  SocialPostPreviewResponse,
  SocialPostPreviewRequest,
  SocialPostPreviewAccount,
  SocialAccountPreview,
  SocialPostPreviewMedia,
  PreviewUsername,
  PreviewProfilePictureUrl,
  PreviewConfiguration,
  
  // Upload Types
  CreateUploadUrlDto,
  CreateUploadUrlResponse,
  
  // Auth URL Types
  CreateAuthUrlDto,
  CreateSocialAccountProviderAuthUrlDto,
  SocialAccountProviderAuthUrlDto,
  AuthUrlResponse,
  AuthUrlProviderData,
  BlueskyAuthUrlProviderData,
  LinkedInUrlProviderData,
  InstagramAuthUrlProviderData,
  FacebookAuthUrlProviderData,
  TikTokAuthUrlProviderData,
  TikTokBusinessAuthUrlProviderData,
  YouTubeAuthUrlProviderData,
  PinterestAuthUrlProviderData,
  ThreadsAuthUrlProviderData,
  
  // Provider Data
  TikTokProviderData,
  TikTokBusinessProviderData,
  
  // Error Types
  PostForMeError,

} from "./post-for-me-types";

// Webhook Types
export type {
  PostForMeWebhook,
  PostForMeWebhookListResponse,
  PostForMeEventType,
} from "./webhook-types";

// Re-export constants
export {
  PLATFORM_CHARACTER_LIMITS,
  getMostRestrictiveLimit,
  getWarningThreshold,
} from "./post-for-me-types";
