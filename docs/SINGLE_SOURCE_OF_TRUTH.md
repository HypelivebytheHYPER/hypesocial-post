# Single Source of Truth Guide

> **Auto-generated:** 2026-03-01
> **Regenerate:** `node scripts/update-ssot.js` or `pnpm build`

This document defines the canonical sources for types, configurations, and utilities in this project to avoid confusion and inconsistencies.

---

## API Specification (Authoritative Source)

**Canonical Source:** `/Users/mdch/Downloads/api-post-for-me.json`

The OpenAPI JSON specification is the **Single Source of Truth** for all Post For Me API types.

### Why This File?

| Criteria                                          | Status                 |
| ------------------------------------------------- | ---------------------- |
| ✅ All 3 sources (JSON, YAML, Web) agree on types | Verified               |
| ✅ JSON is machine-readable for automation        | Yes                    |
| ✅ More detailed than web docs                    | Yes                    |
| ✅ Our types match the spec (96 types)            | All passing type check |

### Source Comparison

| Source           | Format           | Location                                     | Use Case            |
| ---------------- | ---------------- | -------------------------------------------- | ------------------- |
| **OpenAPI JSON** | Machine-readable | `/Users/mdch/Downloads/api-post-for-me.json` | **SSOT - Use this** |
| OpenAPI YAML     | Human-readable   | `/Users/mdch/Downloads/api-1 (2).yaml`       | Reference only      |
| Web Docs         | HTML             | https://api.postforme.dev/docs               | Quick reference     |
| MCP SDK          | TypeScript SDK   | `post-for-me-mcp`                            | SDK (looser types)  |

### How to Update Types from OpenAPI Spec

1. Check the JSON spec for the type definition
2. Update `types/post-for-me.ts` to match
3. Run `pnpm type-check` to verify
4. Run `pnpm build` to regenerate this doc

---

## Type Definitions

**Canonical Source:** `types/post-for-me.ts` (derived from OpenAPI JSON)

### Core Types

| Type                           | Kind       | Description          |
| ------------------------------ | ---------- | -------------------- |
| `SocialPost`                   | Interface  | Post For Me API type |
| `MediaItem`                    | Interface  | Post For Me API type |
| `MediaTag`                     | Interface  | Post For Me API type |
| `PlatformConfig`               | Interface  | Post For Me API type |
| `AccountConfig`                | Interface  | Post For Me API type |
| `CreateSocialPostDto`          | Interface  | Post For Me API type |
| `UpdateSocialPostDto`          | Interface  | Post For Me API type |
| `SocialPostListResponse`       | Interface  | Post For Me API type |
| `SocialAccount`                | Interface  | Post For Me API type |
| `CreateSocialAccountDto`       | Interface  | Post For Me API type |
| `UpdateSocialAccountDto`       | Interface  | Post For Me API type |
| `CreateAuthUrlDto`             | Interface  | Post For Me API type |
| `AuthUrlResponse`              | Interface  | Post For Me API type |
| `SocialAccountListResponse`    | Interface  | Post For Me API type |
| `CreateUploadUrlDto`           | Interface  | Post For Me API type |
| `CreateUploadUrlResponse`      | Interface  | Post For Me API type |
| `SocialPostResultPlatformData` | Interface  | Post For Me API type |
| `SocialPostResult`             | Interface  | Post For Me API type |
| `SocialPostResultListResponse` | Interface  | Post For Me API type |
| `VideoViewRetentionPoint`      | Interface  | Post For Me API type |
| `ImpressionSource`             | Interface  | Post For Me API type |
| `AudienceType`                 | Interface  | Post For Me API type |
| `AudienceGender`               | Interface  | Post For Me API type |
| `AudienceCountry`              | Interface  | Post For Me API type |
| `AudienceCity`                 | Interface  | Post For Me API type |
| `DemographicKeyValue`          | Interface  | Post For Me API type |
| `VideoRetentionGraphPoint`     | Interface  | Post For Me API type |
| `ActivityByActionType`         | Interface  | Post For Me API type |
| `TikTokMetrics`                | Interface  | Post For Me API type |
| `TikTokBusinessMetrics`        | Interface  | Post For Me API type |
| `InstagramMetrics`             | Interface  | Post For Me API type |
| `YouTubeMetrics`               | Interface  | Post For Me API type |
| `FacebookMetrics`              | Interface  | Post For Me API type |
| `XPublicMetrics`               | Interface  | Post For Me API type |
| `XOrganicMetrics`              | Interface  | Post For Me API type |
| `XNonPublicMetrics`            | Interface  | Post For Me API type |
| `XMetrics`                     | Interface  | Post For Me API type |
| `BlueskyMetrics`               | Interface  | Post For Me API type |
| `ThreadsMetrics`               | Interface  | Post For Me API type |
| `Pinterest90dMetrics`          | Interface  | Post For Me API type |
| `PinterestLifetimeMetrics`     | Interface  | Post For Me API type |
| `PinterestMetrics`             | Interface  | Post For Me API type |
| `LinkedInMetrics`              | Interface  | Post For Me API type |
| `SocialAccountFeedItem`        | Interface  | Post For Me API type |
| `SocialAccountFeedResponse`    | Interface  | Post For Me API type |
| `SocialPostPreviewAccount`     | Interface  | Post For Me API type |
| `SocialPostPreviewMedia`       | Interface  | Post For Me API type |
| `SocialPostPreview`            | Interface  | Post For Me API type |
| `SocialPostPreviewRequest`     | Interface  | Post For Me API type |
| `SocialPostPreviewResponse`    | Interface  | Post For Me API type |
| `PostForMeError`               | Interface  | Post For Me API type |
| `SocialAccountFeedItemMetrics` | Type Alias | Post For Me API type |

### Helper Functions

| Function                    | Purpose                  |
| --------------------------- | ------------------------ |
| `getMostRestrictiveLimit()` | See types/post-for-me.ts |
| `getWarningThreshold()`     | See types/post-for-me.ts |
| `getDangerThreshold()`      | See types/post-for-me.ts |
| `PLATFORM_CHARACTER_LIMITS` | Constant                 |

### Import Pattern

```typescript
// ✅ Correct
import type {
  SocialPost,
  SocialAccount,
  CreateSocialPostDto,
} from "@/types/post-for-me";
import {
  PLATFORM_CHARACTER_LIMITS,
  getMostRestrictiveLimit,
} from "@/types/post-for-me";
```

---

## Platform Configuration

**Canonical Source:** `lib/social-platforms.ts`

All platform-related configuration lives here.

### Exports

| Export                      | Kind     |
| --------------------------- | -------- |
| `socialPlatforms`           | Constant |
| `platformIconsMap`          | Constant |
| `defaultConnectedPlatforms` | Constant |
| `getPlatformById()`         | Function |
| `getPlatformByName()`       | Function |
| `getPlatformIcon()`         | Function |
| `getPlatformsWithStatus()`  | Function |

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
import {
  PLATFORM_CHARACTER_LIMITS,
  getMostRestrictiveLimit,
} from "@/types/post-for-me";

// Get limit for platforms
const limit = getMostRestrictiveLimit(["x", "instagram"]);
// Returns: 280 (X is more restrictive)
```

---

## API Hooks

**Canonical Source:** `lib/hooks/usePostForMe.ts`

All TanStack Query hooks for Post For Me API.

### Available Hooks

| Hook                      | Kind |
| ------------------------- | ---- |
| `useWebhooks()`           | Hook |
| `useWebhook()`            | Hook |
| `useCreateWebhook()`      | Hook |
| `useUpdateWebhook()`      | Hook |
| `useDeleteWebhook()`      | Hook |
| `usePosts()`              | Hook |
| `usePost()`               | Hook |
| `useCreatePost()`         | Hook |
| `useDeletePost()`         | Hook |
| `useRetryPost()`          | Hook |
| `usePostResults()`        | Hook |
| `usePostResult()`         | Hook |
| `usePostResultsList()`    | Hook |
| `useUploadMedia()`        | Hook |
| `useUploadThumbnail()`    | Hook |
| `useAccounts()`           | Hook |
| `usePausedAccounts()`     | Hook |
| `useAccount()`            | Hook |
| `useConnectAccount()`     | Hook |
| `useAccountFeed()`        | Hook |
| `usePostPreview()`        | Hook |
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

| File                        | Purpose                |
| --------------------------- | ---------------------- |
| `types/post-for-me.ts`      | Post For Me API types  |
| `types/webhooks.ts`         | Webhook-specific types |
| `lib/hooks/usePostForMe.ts` | API hooks              |
| `lib/social-platforms.ts`   | Platform config        |

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

## Type Verification

When in doubt, check the OpenAPI JSON spec:

```bash
# Find a type definition
grep -A 20 '"SocialPostMediaDto"' /Users/mdch/Downloads/api-post-for-me.json

# Verify field types
grep -A 5 '"thumbnail_url"' /Users/mdch/Downloads/api-post-for-me.json
```

### Known Discrepancies

| Field                    | OpenAPI Spec     | MCP SDK   | Our Types                 |
| ------------------------ | ---------------- | --------- | ------------------------- |
| `thumbnail_url`          | `object \| null` | `unknown` | `object \| null` ✓        |
| `thumbnail_timestamp_ms` | `object \| null` | `unknown` | `object \| null` ✓        |
| `metadata`               | `object \| null` | `unknown` | `SocialAccountMetadata` ✓ |

**Note:** MCP SDK uses `unknown` for flexibility, but we follow the stricter OpenAPI spec.

---

## Checklist for New Code

- [ ] Import types from `@/types/post-for-me` using new naming
- [ ] Import platform config from `@/lib/social-platforms`
- [ ] Use `pfmKeys` for query keys (not hardcoded strings)
- [ ] Use `platformIconsMap` for icons (not hardcoded imports)
- [ ] Use helper functions from types (e.g., `getMostRestrictiveLimit()`)
- [ ] **Verify against OpenAPI JSON spec when adding new API types**

---

_This document is auto-generated. Do not edit manually - instead update the source files and run `node scripts/update-ssot.js`._
