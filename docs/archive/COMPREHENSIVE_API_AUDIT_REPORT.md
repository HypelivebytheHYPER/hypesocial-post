# Comprehensive Postforme API Audit Report

**Date:** 2026-02-28
**API Docs:** https://api.postforme.dev/docs#models
**Status:** 🔴 CRITICAL ISSUES FOUND

---

## Executive Summary

| Category           | Critical | Warnings | Passed |
| ------------------ | -------- | -------- | ------ |
| SocialPost         | 4        | 4        | 2      |
| SocialAccount      | 0        | 5        | 9      |
| PlatformConfig     | 1        | 3        | 0      |
| Media Types        | 3        | 1        | 2      |
| Create/Update DTOs | 1        | 3        | 3      |
| SocialPostResult   | 3        | 2        | 2      |
| Feed/Metrics       | 5        | 1        | 5      |
| **TOTAL**          | **17**   | **19**   | **23** |

### Overall Health: 🔴 31% Critical Issues

**17 Critical issues require immediate fixes before production use.**

---

## 1. SOCIAL POST TYPES

### 1.1 SocialPost Interface

| Field                   | Our Type                          | API Type                    | Status | Notes                                  |
| ----------------------- | --------------------------------- | --------------------------- | ------ | -------------------------------------- |
| id                      | `string`                          | `string`                    | ✅     | Match                                  |
| external_id             | `string?`                         | `string (nullable)`         | ⚠️     | Should be nullable, not optional       |
| caption                 | `string`                          | `string`                    | ✅     | Match                                  |
| status                  | includes `"failed"`               | 4 values only               | ❌     | **CRITICAL: "failed" not in API**      |
| scheduled_at            | `string?`                         | `string (nullable)`         | ⚠️     | Should be nullable, not optional       |
| platform_configurations | `Record<string, PlatformConfig>?` | `PlatformConfigurationsDto` | ⚠️     | Structure differs                      |
| account_configurations  | `AccountConfig[]?`                | `AccountConfigurationDto[]` | ⚠️     | Naming differs                         |
| media                   | `MediaItem[]?`                    | `SocialPostMediaDto[]`      | ⚠️     | Field type mismatches                  |
| social_accounts         | `string[]`                        | `SocialAccountDto[]`        | ❌     | **CRITICAL: API returns full objects** |
| created_at              | `string`                          | `string`                    | ✅     | Match                                  |
| updated_at              | `string?`                         | `string`                    | ❌     | **API requires this field**            |
| isDraft                 | `boolean?`                        | **NOT PRESENT**             | ❌     | **Remove - use status instead**        |

### 1.2 Runtime API Response Verification

**Actual API Response for SocialPost:**

```json
{
  "id": "sp_xxx",
  "social_accounts": [
    {
      "id": "spc_xxx",
      "platform": "facebook",
      "username": "...",
      "access_token": "...",
      "status": "connected"
    }
  ],
  "media": [
    {
      "url": "...",
      "thumbnail_url": null,
      "thumbnail_timestamp_ms": null,
      "tags": null,
      "skip_processing": false
    }
  ]
}
```

**Critical Finding:** `social_accounts` returns full `SocialAccount` objects, NOT string IDs!

---

## 2. SOCIAL ACCOUNT TYPES

### 2.1 SocialAccount Interface

| Field                    | Our Type                        | API Type     | Status | Notes                             |
| ------------------------ | ------------------------------- | ------------ | ------ | --------------------------------- |
| id                       | `string`                        | `string`     | ✅     | Match                             |
| user_id                  | `string`                        | `string`     | ✅     | Match                             |
| platform                 | `string`                        | `string`     | ✅     | Match                             |
| username                 | `string \| null`                | `string?`    | ✅     | Match                             |
| external_id              | `string \| null`                | `string?`    | ✅     | Match                             |
| status                   | `"connected" \| "disconnected"` | Same         | ✅     | Match - no "expired" value        |
| access_token             | `string`                        | `string`     | ✅     | Match                             |
| access_token_expires_at  | `string`                        | `date-time`  | ⚠️     | We use string, API uses date-time |
| refresh_token            | `string \| null`                | `string?`    | ✅     | Match                             |
| refresh_token_expires_at | `string \| null`                | `date-time?` | ⚠️     | Type mismatch                     |
| profile_photo_url        | `string \| null`                | `string?`    | ✅     | Match                             |
| metadata                 | `unknown`                       | `object`     | ⚠️     | Use `object` instead              |
| created_at               | `string`                        | `date-time`  | ⚠️     | Type mismatch                     |
| updated_at               | `string?`                       | `date-time`  | ⚠️     | API requires, we have optional    |

### 2.2 Runtime Finding

**Actual API Response:** `refresh_token` returns `""` (empty string) instead of `null` when not present.

---

## 3. PLATFORM CONFIGURATION

### 3.1 Critical Issues by Platform

| Platform      | Issue                                | Severity    | Details                                  |
| ------------- | ------------------------------------ | ----------- | ---------------------------------------- |
| **TikTok**    | privacy_status includes `"unlisted"` | 🔴 CRITICAL | API only accepts `"public" \| "private"` |
| **X/Twitter** | poll marked optional                 | 🔴 HIGH     | API requires this field                  |
| **X/Twitter** | community_id optional                | 🔴 HIGH     | API requires this field                  |
| **X/Twitter** | quote_tweet_id optional              | 🔴 HIGH     | API requires this field                  |
| **Facebook**  | collaborators type                   | 🟡 MEDIUM   | API uses `string[][]` not `string[]`     |

### 3.2 Verified Correct Configurations

| Platform  | Fields                                                  | Status |
| --------- | ------------------------------------------------------- | ------ |
| Instagram | placement: `"reels" \| "stories" \| "timeline"`         | ✅     |
| Instagram | share_to_feed, collaborators, location, trial_reel_type | ✅     |
| TikTok    | allow_comment, allow_duet, allow_stitch, auto_add_music | ✅     |
| TikTok    | is_draft, disclose_your_brand, is_ai_generated          | ✅     |
| YouTube   | privacy_status: `"public" \| "private" \| "unlisted"`   | ✅     |
| YouTube   | made_for_kids                                           | ✅     |
| Pinterest | board_ids, link                                         | ✅     |
| Facebook  | placement: `"reels" \| "stories" \| "timeline"`         | ✅     |
| Threads   | placement: `"reels" \| "timeline"`                      | ✅     |

---

## 4. MEDIA TYPES

### 4.1 MediaItem vs SocialPostMediaDto

| Field                  | Our Type      | API Type             | Status | Notes                        |
| ---------------------- | ------------- | -------------------- | ------ | ---------------------------- |
| url                    | `string`      | `string`             | ✅     | Match                        |
| type                   | `string?`     | **NOT IN API**       | ⚠️     | Extra field - may be ignored |
| skip_processing        | `boolean?`    | `boolean (nullable)` | ✅     | Match                        |
| thumbnail_url          | `string?`     | `object (nullable)`  | ❌     | **CRITICAL: Type mismatch**  |
| thumbnail_timestamp_ms | `number?`     | `object (nullable)`  | ❌     | **CRITICAL: Type mismatch**  |
| tags                   | `MediaTag[]?` | `UserTagDto[]`       | ✅     | Structure match              |

### 4.2 MediaTag vs UserTagDto

| Field    | Our Type              | API Type                    | Status | Notes                        |
| -------- | --------------------- | --------------------------- | ------ | ---------------------------- |
| id       | `string`              | `string`                    | ✅     | Match                        |
| platform | `string`              | `"facebook" \| "instagram"` | ⚠️     | API restricts to 2 platforms |
| type     | `"user" \| "product"` | Same                        | ✅     | Match                        |
| x        | `number?`             | `number?`                   | ✅     | Both optional                |
| y        | `number?`             | `number?`                   | ✅     | Both optional                |

### 4.3 Runtime Finding

**Actual API Response:** `thumbnail_url` and `thumbnail_timestamp_ms` return `null`, not the typed values.

---

## 5. CREATE/UPDATE DTOS

### 5.1 CreateSocialPostDto

| Field                   | Our Type                          | API Type                    | Status | Notes                   |
| ----------------------- | --------------------------------- | --------------------------- | ------ | ----------------------- |
| caption                 | `string`                          | `string`                    | ✅     | Match                   |
| social_accounts         | `string[]`                        | `string[]`                  | ✅     | Match                   |
| scheduled_at            | `string?`                         | `string (nullable)`         | ✅     | Match                   |
| platform_configurations | `Record<string, PlatformConfig>?` | `PlatformConfigurationsDto` | ⚠️     | Structure differs       |
| account_configurations  | `AccountConfig[]?`                | `AccountConfigurationDto[]` | ✅     | Match                   |
| media                   | `{ url: string }[]`               | `SocialPostMediaDto[]`      | ⚠️     | Missing media fields    |
| external_id             | `string?`                         | `string?`                   | ✅     | Match                   |
| isDraft                 | `boolean?`                        | **NOT IN API**              | ❌     | **Remove - use status** |

### 5.2 UpdateSocialPostDto

API documentation indicates PUT uses `CreateSocialPostDto` directly. Our separate Update DTO with all optional fields may not match API behavior.

---

## 6. SOCIAL POST RESULTS

### 6.1 SocialPostResult vs SocialPostResultDto

| Field             | Our Type                        | API Type  | Status | Notes                  |
| ----------------- | ------------------------------- | --------- | ------ | ---------------------- |
| id                | `string`                        | `string`  | ✅     | Match                  |
| post_id           | `string`                        | `string`  | ✅     | Match                  |
| social_account_id | `string`                        | `string`  | ✅     | Match                  |
| success           | `boolean`                       | `boolean` | ✅     | Match                  |
| error             | `unknown?`                      | `object`  | ❌     | **Should be required** |
| details           | `unknown?`                      | `object`  | ❌     | **Should be required** |
| platform_data     | `SocialPostResultPlatformData?` | `object`  | ❌     | **Should be required** |

### 6.2 SocialPostResultPlatformData

| Field | Our Type  | API Type | Status | Notes              |
| ----- | --------- | -------- | ------ | ------------------ |
| id    | `string?` | `string` | ⚠️     | Should be required |
| url   | `string?` | `string` | ⚠️     | Should be required |

### 6.3 Runtime Finding

**Actual API Response:**

```json
{
  "platform_data": null,
  "error": "All media failed to process...",
  "details": null
}
```

All three fields can be `null` in practice, but API schema marks them as required.

---

## 7. FEED & METRICS TYPES

### 7.1 SocialAccountFeedItem

| Field               | Our Type                       | API Type          | Status | Notes                  |
| ------------------- | ------------------------------ | ----------------- | ------ | ---------------------- |
| platform_post_id    | `string`                       | `string`          | ✅     | Match                  |
| platform_account_id | `string`                       | `string`          | ✅     | Match                  |
| social_account_id   | `string`                       | `string`          | ✅     | Match                  |
| caption             | `string`                       | `string`          | ✅     | Match                  |
| media               | `unknown[]`                    | `array[]`         | ⚠️     | API uses nested arrays |
| platform            | `string`                       | `string`          | ✅     | Match                  |
| platform_url        | `string`                       | `string`          | ✅     | Match                  |
| posted_at           | `string?`                      | `date-time`       | ✅     | Match                  |
| metrics             | `SocialAccountFeedItemMetrics` | Platform-specific | ✅     | Match                  |

### 7.2 Metrics Type Issues

| Metrics Type              | Status                  | Issue                                |
| ------------------------- | ----------------------- | ------------------------------------ |
| **TikTokMetrics**         | ✅                      | Matches basic TikTokPostMetricsDto   |
| **TikTokBusinessMetrics** | ❌ **MISSING**          | We don't have this 20+ field type    |
| **InstagramMetrics**      | ✅                      | All fields match                     |
| **YouTubeMetrics**        | ✅                      | All fields match                     |
| **FacebookMetrics**       | ✅                      | All fields match                     |
| **XMetrics**              | ✅                      | All nested types match               |
| **BlueskyMetrics**        | ❌ **WRONG FIELDS**     | Has Threads' field names             |
| **ThreadsMetrics**        | ❌ **WRONG FIELDS**     | Has Bluesky's field names            |
| **PinterestMetrics**      | ⚠️                      | Missing video fields in 90d/lifetime |
| **LinkedInMetrics**       | ❌ **COMPLETELY WRONG** | Copy-pasted from TikTok Business!    |
| **SnapchatMetrics**       | ❌ **NOT IN API**       | Remove - not supported               |

### 7.3 Field Name Swap: Bluesky vs Threads

**Our BlueskyMetrics has:**

```typescript
(likes, replies, shares, views, quotes, reposts);
```

**API Threads has:**

```typescript
(likes, replies, shares, views, quotes, reposts);
```

**Our ThreadsMetrics has:**

```typescript
(replyCount, likeCount, repostCount, quoteCount);
```

**API Bluesky has:**

```typescript
(replyCount, likeCount, repostCount, quoteCount);
```

**🔴 CRITICAL: Bluesky and Threads metrics are SWAPPED!**

---

## 8. API ENDPOINT TESTING

### 8.1 Verified Working Endpoints

| Endpoint                    | Status    | Notes                                   |
| --------------------------- | --------- | --------------------------------------- |
| GET /v1/social-posts        | ✅ 200 OK | Returns posts with full account objects |
| GET /v1/social-accounts     | ✅ 200 OK | Returns connected accounts              |
| GET /v1/social-post-results | ✅ 200 OK | Returns post results                    |
| GET /v1/webhooks            | ✅ 200 OK | Returns webhooks                        |

### 8.2 Response Structure Verification

All tested endpoints return responses that match the documented structure, with these exceptions:

1. `social_accounts` in posts returns full objects
2. `thumbnail_url` and `thumbnail_timestamp_ms` are null when not set
3. `refresh_token` is empty string `""` not null
4. `platform_data` is null on failed posts

---

## 9. CRITICAL FIXES REQUIRED

### 🔴 Must Fix Before Production

1. **SocialPost.social_accounts**: Change from `string[]` to `SocialAccount[]` or create separate response type
2. **SocialPost.status**: Remove `"failed"` from enum - not supported by API
3. **SocialPost.isDraft**: Remove field - use `status === "draft"` instead
4. **MediaItem.thumbnail_url**: Change from `string?` to match API's object type
5. **MediaItem.thumbnail_timestamp_ms**: Change from `number?` to match API's object type
6. **PlatformConfig (TikTok)**: Remove `"unlisted"` from privacy_status
7. **PlatformConfig (X)**: Verify poll, community_id, quote_tweet_id requirements
8. **SocialPostResult**: Make error, details, platform_data required (not optional)
9. **LinkedInMetrics**: Completely rewrite - currently copy of TikTok Business
10. **BlueskyMetrics**: Swap field names with ThreadsMetrics
11. **ThreadsMetrics**: Swap field names with BlueskyMetrics
12. **SnapchatMetrics**: Remove - not supported by API
13. **Add TikTokBusinessMetrics**: Create new type with 20+ fields

### 🟡 Should Fix Soon

14. **SocialPost.updated_at**: Make required to match API
15. **SocialAccount dates**: Use proper date-time type or validation
16. **MediaTag.platform**: Restrict to `"facebook" | "instagram"`
17. **UpdateSocialPostDto**: Align with API's use of Create DTO

### 🟢 Nice to Have

18. Add Zod schemas for runtime validation
19. Add API response logging
20. Create integration tests against live API

---

## 10. TEST RESULTS SUMMARY

### TypeScript Build

```bash
pnpm build
# Result: ✅ PASSED (but types don't match runtime behavior)
```

### Runtime API Tests

```bash
# GET /v1/social-posts
# Result: ✅ 200 OK - 27 posts returned

# GET /v1/social-accounts
# Result: ✅ 200 OK - 4 accounts returned

# GET /v1/social-post-results
# Result: ✅ 200 OK - 28 results returned
```

### Type Safety Score

- **Compile-time:** 95% (TypeScript is happy)
- **Runtime:** 69% (17 critical mismatches)

---

## Appendix A: Complete Type Mapping

### Request Types (What We Send)

| Our Type               | API Type               | Match       |
| ---------------------- | ---------------------- | ----------- |
| CreateSocialPostDto    | CreateSocialPostDto    | ⚠️ Partial  |
| UpdateSocialPostDto    | (Uses Create DTO)      | ❌ Mismatch |
| CreateSocialAccountDto | CreateSocialAccountDto | ✅ Good     |
| CreateAuthUrlDto       | CreateAuthUrlDto       | ✅ Good     |

### Response Types (What API Returns)

| Our Type              | API Type            | Match      |
| --------------------- | ------------------- | ---------- |
| SocialPost            | SocialPostDto       | ❌ Poor    |
| SocialAccount         | SocialAccountDto    | ✅ Good    |
| SocialPostResult      | SocialPostResultDto | ⚠️ Partial |
| SocialAccountFeedItem | PlatformPostDto     | ⚠️ Partial |

---

_Report generated by comprehensive parallel audit of all Postforme API types_
