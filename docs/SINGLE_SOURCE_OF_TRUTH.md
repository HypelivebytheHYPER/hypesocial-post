# Single Source of Truth Guide

> **Auto-generated:** 2026-03-01
> **Regenerate:** `node scripts/update-ssot.js` or `pnpm build`

This document defines the canonical sources for types, configurations, and utilities in this project to avoid confusion and inconsistencies.

---

## Type Definitions

**Canonical Source:** `types/post-for-me.ts`

### Core Types

| Type | Kind | Description |
|------|------|-------------|
| `SocialPost` | Interface | Post For Me API type |
| `MediaItem` | Interface | Post For Me API type |
| `MediaTag` | Interface | Post For Me API type |
| `TwitterPollDto` | Interface | Post For Me API type |
| `PlatformConfig` | Interface | Post For Me API type |
| `PinterestConfigurationDto` | Interface | Post For Me API type |
| `InstagramConfigurationDto` | Interface | Post For Me API type |
| `TiktokConfigurationDto` | Interface | Post For Me API type |
| `TwitterConfigurationDto` | Interface | Post For Me API type |
| `YoutubeConfigurationDto` | Interface | Post For Me API type |
| `FacebookConfigurationDto` | Interface | Post For Me API type |
| `LinkedinConfigurationDto` | Interface | Post For Me API type |
| `BlueskyConfigurationDto` | Interface | Post For Me API type |
| `ThreadsConfigurationDto` | Interface | Post For Me API type |
| `PlatformConfigurationsDto` | Interface | Post For Me API type |
| `AccountConfig` | Interface | Post For Me API type |
| `AccountConfigurationDetailsDto` | Interface | Post For Me API type |
| `AccountConfigurationDto` | Interface | Post For Me API type |
| `CreateSocialPostDto` | Interface | Post For Me API type |
| `UpdateSocialPostDto` | Interface | Post For Me API type |
| `SocialPostListResponse` | Interface | Post For Me API type |
| `SocialAccount` | Interface | Post For Me API type |
| `CreateSocialAccountDto` | Interface | Post For Me API type |
| `UpdateSocialAccountDto` | Interface | Post For Me API type |
| `BlueskyAuthUrlProviderData` | Interface | Post For Me API type |
| `LinkedInUrlProviderData` | Interface | Post For Me API type |
| `InstagramAuthUrlProviderData` | Interface | Post For Me API type |
| `FacebookAuthUrlProviderData` | Interface | Post For Me API type |
| `TikTokAuthUrlProviderData` | Interface | Post For Me API type |
| `TikTokBusinessAuthUrlProviderData` | Interface | Post For Me API type |
| `YouTubeAuthUrlProviderData` | Interface | Post For Me API type |
| `PinterestAuthUrlProviderData` | Interface | Post For Me API type |
| `ThreadsAuthUrlProviderData` | Interface | Post For Me API type |
| `AuthUrlProviderData` | Interface | Post For Me API type |
| `CreateAuthUrlDto` | Interface | Post For Me API type |
| `SocialAccountProviderAuthUrlDto` | Interface | Post For Me API type |
| `SocialAccountListResponse` | Interface | Post For Me API type |
| `CreateUploadUrlDto` | Interface | Post For Me API type |
| `CreateUploadUrlResponse` | Interface | Post For Me API type |
| `SocialPostResultPlatformData` | Interface | Post For Me API type |
| `PostError` | Interface | Post For Me API type |
| `PostDetails` | Interface | Post For Me API type |
| `SocialPostResult` | Interface | Post For Me API type |
| `SocialPostResultListResponse` | Interface | Post For Me API type |
| `VideoViewRetentionPoint` | Interface | Post For Me API type |
| `ImpressionSource` | Interface | Post For Me API type |
| `AudienceType` | Interface | Post For Me API type |
| `AudienceGender` | Interface | Post For Me API type |
| `AudienceCountry` | Interface | Post For Me API type |
| `AudienceCity` | Interface | Post For Me API type |
| `DemographicKeyValue` | Interface | Post For Me API type |
| `VideoRetentionGraphPoint` | Interface | Post For Me API type |
| `ActivityByActionType` | Interface | Post For Me API type |
| `TikTokMetrics` | Interface | Post For Me API type |
| `TikTokBusinessMetrics` | Interface | Post For Me API type |
| `InstagramMetrics` | Interface | Post For Me API type |
| `YouTubeMetrics` | Interface | Post For Me API type |
| `FacebookMetrics` | Interface | Post For Me API type |
| `XPublicMetrics` | Interface | Post For Me API type |
| `XOrganicMetrics` | Interface | Post For Me API type |
| `XNonPublicMetrics` | Interface | Post For Me API type |
| `XMetrics` | Interface | Post For Me API type |
| `BlueskyMetrics` | Interface | Post For Me API type |
| `ThreadsMetrics` | Interface | Post For Me API type |
| `PinterestMetricValue` | Interface | Post For Me API type |
| `Pinterest90dMetrics` | Interface | Post For Me API type |
| `PinterestLifetimeMetrics` | Interface | Post For Me API type |
| `PinterestMetrics` | Interface | Post For Me API type |
| `LinkedInMetrics` | Interface | Post For Me API type |
| `PlatformPostDto` | Interface | Post For Me API type |
| `SocialAccountFeedItem` | Interface | Post For Me API type |
| `SocialAccountFeedResponse` | Interface | Post For Me API type |
| `TikTokPostMetricsDto` | Interface | Post For Me API type |
| `TikTokBusinessVideoMetricPercentageDto` | Interface | Post For Me API type |
| `TikTokBusinessPostImpressionSourceDto` | Interface | Post For Me API type |
| `TikTokBusinessPostAudienceTypeDto` | Interface | Post For Me API type |
| `TikTokBusinessPostAudienceGenderDto` | Interface | Post For Me API type |
| `TikTokBusinessPostAudienceCountryDto` | Interface | Post For Me API type |
| `TikTokBusinessPostAudienceCityDto` | Interface | Post For Me API type |
| `TikTokBusinessMetricsDto` | Interface | Post For Me API type |
| `InstagramPostMetricsDto` | Interface | Post For Me API type |
| `YouTubePostMetricsDto` | Interface | Post For Me API type |
| `FacebookVideoViewTimeByDemographicDto` | Interface | Post For Me API type |
| `FacebookVideoRetentionGraphDto` | Interface | Post For Me API type |
| `FacebookActivityByActionTypeDto` | Interface | Post For Me API type |
| `FacebookPostMetricsDto` | Interface | Post For Me API type |
| `TwitterPublicMetricsDto` | Interface | Post For Me API type |
| `TwitterOrganicMetricsDto` | Interface | Post For Me API type |
| `TwitterNonPublicMetricsDto` | Interface | Post For Me API type |
| `TwitterPostMetricsDto` | Interface | Post For Me API type |
| `ThreadsPostMetricsDto` | Interface | Post For Me API type |
| `LinkedInPostMetricsDto` | Interface | Post For Me API type |
| `PinterestMetricsWindowDto` | Interface | Post For Me API type |
| `PinterestPostMetricsDto` | Interface | Post For Me API type |
| `BlueskyPostMetricsDto` | Interface | Post For Me API type |
| `SocialPostPreviewAccount` | Interface | Post For Me API type |
| `SocialPostPreviewMedia` | Interface | Post For Me API type |
| `PreviewUsername` | Interface | Post For Me API type |
| `PreviewProfilePictureUrl` | Interface | Post For Me API type |
| `PreviewConfiguration` | Interface | Post For Me API type |
| `SocialPostPreview` | Interface | Post For Me API type |
| `SocialPostPreviewRequest` | Interface | Post For Me API type |
| `SocialPostPreviewResponse` | Interface | Post For Me API type |
| `TikTokProviderData` | Interface | Post For Me API type |
| `TikTokBusinessProviderData` | Interface | Post For Me API type |
| `FacebookProviderData` | Interface | Post For Me API type |
| `InstagramProviderData` | Interface | Post For Me API type |
| `YouTubeProviderData` | Interface | Post For Me API type |
| `XProviderData` | Interface | Post For Me API type |
| `PinterestProviderData` | Interface | Post For Me API type |
| `LinkedInProviderData` | Interface | Post For Me API type |
| `BlueskyProviderData` | Interface | Post For Me API type |
| `ThreadsProviderData` | Interface | Post For Me API type |
| `InvalidSocialPostDto` | Interface | Post For Me API type |
| `DeleteEntityResponseDto` | Interface | Post For Me API type |
| `DisconnectedSocialAccountDto` | Interface | Post For Me API type |
| `ErrorDetails` | Interface | Post For Me API type |
| `PostForMeError` | Interface | Post For Me API type |
| `SocialPostDto` | Type Alias | Post For Me API type |
| `SocialPostMediaDto` | Type Alias | Post For Me API type |
| `UserTagDto` | Type Alias | Post For Me API type |
| `SocialAccountMetadata` | Type Alias | Post For Me API type |
| `SocialAccountDto` | Type Alias | Post For Me API type |
| `CreateSocialAccountProviderAuthUrlDto` | Type Alias | Post For Me API type |
| `AuthUrlResponse` | Type Alias | Post For Me API type |
| `CreateUploadUrlResponseDto` | Type Alias | Post For Me API type |
| `SocialPostResultDto` | Type Alias | Post For Me API type |
| `SocialAccountFeedItemMetrics` | Type Alias | Post For Me API type |
| `SocialAccountPreview` | Type Alias | Post For Me API type |
| `SocialPostPreviewDto` | Type Alias | Post For Me API type |
| `CreateSocialPostPreviewDto` | Type Alias | Post For Me API type |
| `SocialPostPreviewResponseDto` | Type Alias | Post For Me API type |
| `SocialAccountProviderData` | Type Alias | Post For Me API type |

### Helper Functions

| Function | Purpose |
|----------|---------|
| `getMostRestrictiveLimit()` | See types/post-for-me.ts |
| `getWarningThreshold()` | See types/post-for-me.ts |
| `getDangerThreshold()` | See types/post-for-me.ts |
| `PLATFORM_CHARACTER_LIMITS` | Constant |

### Import Pattern

```typescript
// ✅ Correct
import type { SocialPost, SocialAccount, CreateSocialPostDto } from "@/types/post-for-me";
import { PLATFORM_CHARACTER_LIMITS, getMostRestrictiveLimit } from "@/types/post-for-me";
```

---

## Platform Configuration

**Canonical Source:** `lib/social-platforms.ts`

All platform-related configuration lives here.

### Exports

| Export | Kind |
|--------|------|
| `socialPlatforms` | Constant |
| `platformIconsMap` | Constant |
| `defaultConnectedPlatforms` | Constant |
| `getPlatformById()` | Function |
| `getPlatformByName()` | Function |
| `getPlatformIcon()` | Function |
| `getPlatformsWithStatus()` | Function |

### Usage Pattern

```typescript
import { platformIconsMap, getPlatformIcon } from "@/lib/social-platforms";

// Get icon component
const Icon = platformIconsMap[platform.toLowerCase()];
```

---

## Character Limits

**Canonical Source:** `types/post-for-me.ts`

```typescript
import { PLATFORM_CHARACTER_LIMITS, getMostRestrictiveLimit } from "@/types/post-for-me";

// Get limit for platforms
const limit = getMostRestrictiveLimit(["x", "instagram"]);
// Returns: 280 (X is more restrictive)
```

---

## API Hooks

**Canonical Source:** `lib/hooks/usePostForMe.ts`

All TanStack Query hooks for Post For Me API.

### Available Hooks

| Hook | Kind |
|------|------|
| `useWebhooks()` | Hook |
| `useWebhook()` | Hook |
| `useCreateWebhook()` | Hook |
| `useUpdateWebhook()` | Hook |
| `useDeleteWebhook()` | Hook |
| `usePosts()` | Hook |
| `usePost()` | Hook |
| `useCreatePost()` | Hook |
| `useDeletePost()` | Hook |
| `useRetryPost()` | Hook |
| `usePostResults()` | Hook |
| `usePostResult()` | Hook |
| `usePostResultsList()` | Hook |
| `useUploadMedia()` | Hook |
| `useUploadThumbnail()` | Hook |
| `useAccounts()` | Hook |
| `usePausedAccounts()` | Hook |
| `useAccount()` | Hook |
| `useConnectAccount()` | Hook |
| `useAccountFeed()` | Hook |
| `usePostPreview()` | Hook |
| `useRegisterAppWebhook()` | Hook |

### Query Keys

All query keys are centralized in `pfmKeys`:

```typescript
import { pfmKeys } from "@/lib/hooks/usePostForMe";

// Use for invalidation
queryClient.invalidateQueries({ queryKey: pfmKeys.posts() });
```

---

## Webhook Types

**Canonical Source:** `types/webhooks.ts`

```typescript
import type { PostForMeWebhook, PostForMeEventType } from "@/types/webhooks";
```

---

## File Naming Convention

| File | Purpose |
|------|---------|
| `types/post-for-me.ts` | Post For Me API types |
| `types/webhooks.ts` | Webhook-specific types |
| `lib/hooks/usePostForMe.ts` | API hooks |
| `lib/social-platforms.ts` | Platform config |

---

## Migration History

### 2026-02-28: Type Naming Standardization

Legacy aliases removed:
- ~~`PostForMePost`~~ → Use `SocialPost`
- ~~`PostForMeAccount`~~ → Use `SocialAccount`
- ~~`PostForMePostResult`~~ → Use `SocialPostResult`
- ~~`PostForMePostListResponse`~~ → Use `SocialPostListResponse`
- ~~`PostForMeAccountListResponse`~~ → Use `SocialAccountListResponse`

---

## Checklist for New Code

- [ ] Import types from `@/types/post-for-me` using new naming
- [ ] Import platform config from `@/lib/social-platforms`
- [ ] Use `pfmKeys` for query keys (not hardcoded strings)
- [ ] Use `platformIconsMap` for icons (not hardcoded imports)
- [ ] Use helper functions from types (e.g., `getMostRestrictiveLimit()`)

---

*This document is auto-generated. Do not edit manually - instead update the source files and run `node scripts/update-ssot.js`.*
