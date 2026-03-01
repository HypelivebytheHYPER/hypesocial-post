# Deep Dive Analysis: Facebook & TikTok Posting

**Date:** 2026-02-28
**Method:** MCP Official Post For Me Server
**Sources:** Post For Me SDK, API Documentation

---

## Executive Summary

| Platform     | Status     | Critical Issues               | Missing Fields                                    |
| ------------ | ---------- | ----------------------------- | ------------------------------------------------- |
| **Facebook** | ⚠️ Partial | Collaborators type mismatch   | skip_processing, tags, thumbnails                 |
| **TikTok**   | ⚠️ Partial | Privacy status too permissive | disclose_brand, disclose_content, is_ai_generated |

---

## Facebook Deep Dive

### 1. Configuration (FacebookConfigurationDto)

**Official API Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `caption` | object | No | Override caption for Facebook |
| `media` | array | No | Override media (SocialPostMediaDto[]) |
| `placement` | enum | No | `"reels"` \| `"stories"` \| `"timeline"` |
| `location` | string | No | Page ID with location |
| `collaborators` | Array<Array<unknown>> | No | **Nested arrays for collaborators** |

### 2. Critical Issue: Collaborators Type

**🔴 CRITICAL:** Our type has `collaborators?: string[]` but API expects `string[][]` (nested arrays)

```typescript
// Current (WRONG)
collaborators?: string[];

// Should be (CORRECT)
collaborators?: string[][];  // Nested arrays for Facebook
```

### 3. Missing Media Features

| Feature                  | API Support | Our Implementation               | Status  |
| ------------------------ | ----------- | -------------------------------- | ------- |
| `skip_processing`        | ✅ Yes      | ❌ Missing                       | **Add** |
| `tags` (user/product)    | ✅ Yes      | ❌ Missing                       | **Add** |
| `thumbnail_url`          | ✅ Yes      | ⚠️ Wrong type (string vs object) | **Fix** |
| `thumbnail_timestamp_ms` | ✅ Yes      | ⚠️ Wrong type (number vs object) | **Fix** |

### 4. Upload Requirements

**Endpoint:** `POST /v1/media/create-upload-url`

**Our Current Limits:**

- Images: 8MB
- Videos: 512MB
- Formats: jpeg, png, gif, webp, mp4, mov, webm

**⚠️ Note:** API handles platform-specific validation internally. Our limits are reasonable defaults.

---

## TikTok Deep Dive

### 1. Configuration (TiktokConfigurationDto)

**Official API Fields:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `caption` | object | - | Override caption |
| `media` | array | - | Override media |
| `title` | string | - | Override title |
| `privacy_status` | string | "public" | `"public"` \| `"private"` ONLY |
| `allow_comment` | boolean | true | Allow comments |
| `allow_duet` | boolean | true | Allow duets |
| `allow_stitch` | boolean | true | Allow stitch |
| `disclose_your_brand` | boolean | false | **MISSING IN OUR TYPE** |
| `disclose_branded_content` | boolean | false | **MISSING IN OUR TYPE** |
| `is_ai_generated` | boolean | false | **MISSING IN OUR TYPE** |
| `is_draft` | boolean | false | Create as draft |
| `auto_add_music` | boolean | true | Auto-add music to photos |

### 2. Critical Issue: Privacy Status

**🔴 CRITICAL:** TikTok does NOT support "unlisted"

```typescript
// Current (WRONG for TikTok)
privacy_status?: "public" | "private" | "unlisted";

// Correct for TikTok:
privacy_status?: "public" | "private";  // ONLY

// YouTube can use:
privacy_status?: "public" | "private" | "unlisted";  // YouTube only
```

**MCP Verified:** TikTok privacy_status = "public" | "private" ONLY

### 3. Missing TikTok Fields

Add these to PlatformConfig:

```typescript
// TikTok / TikTok Business
disclose_your_brand?: boolean;      // default: false - MISSING
disclose_branded_content?: boolean; // default: false - MISSING
is_ai_generated?: boolean;          // default: false - MISSING
```

### 4. TikTok vs TikTok Business

**Important:** Both use the same `TiktokConfigurationDto`:

```typescript
// PlatformConfigurationsDto
tiktok: {
  $ref: TiktokConfigurationDto;
}
tiktok_business: {
  $ref: TiktokConfigurationDto;
} // Same schema!
```

### 5. Media Specifications (from web research)

| Spec         | Value                                        |
| ------------ | -------------------------------------------- |
| Duration     | 3 sec - 10 min max                           |
| File Size    | Up to 4GB (theoretical), ~72-287MB practical |
| Formats      | MP4 (recommended), MOV, WebM                 |
| Codecs       | H.264 (recommended), H.265, VP8              |
| Audio        | AAC                                          |
| Aspect Ratio | 9:16 (recommended), 1:1, 16:9                |
| Resolution   | 360x640 min to 4096x4096 max                 |
| Frame Rate   | 23-60 FPS                                    |

---

## Preview API Analysis

**Endpoint:** `POST /v1/social-post-previews`

### Request (CreateSocialPostPreviewDto)

```typescript
{
  caption: string;                          // Required
  preview_social_accounts: { id: string; platform: string }[];  // Required
  media?: SocialPostMediaDto[];             // Optional
  platform_configurations?: PlatformConfigurationsDto;  // Optional
  account_configurations?: AccountConfigurationDto[];   // Optional
}
```

### Response (SocialPostPreviewDto)

```typescript
{
  caption: string;
  media: string[];
  platform: string;
  social_account_id: string;
  social_account_username: unknown;
  social_account_profile_picture_url: unknown;
  configuration?: object;
}
```

**Our Implementation:** ✅ Correctly forwards to API

---

## Recommended Fixes

### High Priority

1. **Fix Facebook Collaborators Type**

   ```typescript
   collaborators?: string[][];  // Nested arrays for Facebook
   ```

2. **Add Missing TikTok Fields**

   ```typescript
   disclose_your_brand?: boolean;      // default: false
   disclose_branded_content?: boolean; // default: false
   is_ai_generated?: boolean;          // default: false
   ```

3. **Fix MediaItem Thumbnail Types**
   ```typescript
   // API returns object | null, not string/number
   thumbnail_url?: unknown;           // Was: string
   thumbnail_timestamp_ms?: unknown;  // Was: number
   ```

### Medium Priority

4. **Add Media Features**

   ```typescript
   skip_processing?: boolean;  // For large videos
   tags?: MediaTag[];          // User/product tags
   ```

5. **Update MediaTag Platform Restriction**
   ```typescript
   platform: "facebook" | "instagram"; // API only supports these for tagging
   ```

### Low Priority

6. **Add TikTok Media Warnings**
   - Video duration warning (>10 min)
   - File size warning (>287MB)
   - Aspect ratio recommendation (9:16)

---

## Files to Update

| File                            | Changes                                                      |
| ------------------------------- | ------------------------------------------------------------ |
| `types/post-for-me.ts`          | Add missing TikTok fields, fix MediaItem types, add comments |
| `app/(dashboard)/feed/page.tsx` | Update metrics normalization for LinkedIn                    |
| `app/api/media/route.ts`        | Add skip_processing support                                  |

---

## Verification Status

| Check                       | Status              | Source      |
| --------------------------- | ------------------- | ----------- |
| Facebook collaborators type | ❌ Mismatch         | MCP SDK     |
| TikTok privacy_status       | ❌ Too permissive   | MCP SDK     |
| MediaItem fields            | ⚠️ Partial          | MCP SDK     |
| Missing TikTok fields       | ❌ Missing 3 fields | MCP SDK     |
| Preview API                 | ✅ Correct          | Code review |
| Upload flow                 | ✅ Correct          | Code review |

---

_Analysis completed using official Post For Me MCP server and SDK_
