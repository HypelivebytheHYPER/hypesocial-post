# MCP Caption Limits by Platform

## New Tool: `get_caption_limits`

Query caption/character limits for all social media platforms, categorized by media type.

### Tool Description

```
Get character/caption limits for all social media platforms.
Returns max character limits, hashtag limits, and special notes for each platform and content type.
Useful for validating captions before creating posts.
```

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `platform` | enum | Optional | Filter by specific platform |
| `content_type` | enum | Optional | Filter by content type |

**Platform Options:** `instagram`, `facebook`, `tiktok`, `twitter`, `linkedin`, `youtube`, `pinterest`, `bluesky`, `threads`

**Content Type Options:** `feed`, `reels`, `stories`, `photos`, `videos`, `shorts`

---

## Caption Limits Matrix

### By Platform & Media Type

| Platform | Feed Posts | Reels/Shorts | Stories | Photos | Videos |
|----------|-----------|--------------|---------|--------|--------|
| **Instagram** | 2,200 chars<br>30 hashtags<br>20 mentions | 2,200 chars<br>30 hashtags<br>20 mentions | ❌ Not supported | - | - |
| **Facebook** | 63,206 chars* | 2,200 chars | ❌ Not supported | - | - |
| **TikTok** | - | - | - | 2,200 chars | 2,200 chars |
| **Twitter/X** | 280 chars** | - | - | - | - |
| **LinkedIn** | 3,000 chars*** | - | - | - | - |
| **YouTube** | - | 100 chars (Title) | - | - | 5,000 chars (Desc) |
| **Pinterest** | 500 chars<br>100 (Title) | - | - | - | - |
| **Bluesky** | 300 chars | - | - | - | - |
| **Threads** | 500 chars**** | - | - | - | - |

**Notes:**
- `*` Long Facebook posts truncated with "see more"
- `**` Twitter Premium: 25,000 characters
- `***` Company posts: 700 chars optimal display
- `****` 500 chars per thread, unlimited replies

---

## MCP Response Examples

### Get All Platforms

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_caption_limits",
    "arguments": {}
  }
}
```

**Response:**
```json
{
  "platforms": {
    "instagram": {
      "feed": { "maxChars": 2200, "hashtags": 30, "mentions": 20 },
      "reels": { "maxChars": 2200, "hashtags": 30, "mentions": 20 },
      "stories": { "maxChars": 0, "note": "Caption not supported" }
    },
    "facebook": {
      "feed": { "maxChars": 63206, "note": "Long posts truncated" },
      "reels": { "maxChars": 2200 },
      "stories": { "maxChars": 0 }
    },
    "tiktok": {
      "photos": { "maxChars": 2200 },
      "videos": { "maxChars": 2200 }
    },
    "twitter": { "feed": { "maxChars": 280, "note": "Premium: 25,000" } },
    "linkedin": { "feed": { "maxChars": 3000 } },
    "youtube": {
      "shorts": { "maxChars": 100, "note": "Title limit" },
      "videos": { "maxChars": 5000 }
    },
    "pinterest": { "feed": { "maxChars": 500, "titleMaxChars": 100 } },
    "bluesky": { "feed": { "maxChars": 300, "note": "Hard limit" } },
    "threads": { "feed": { "maxChars": 500 } }
  },
  "summary": {
    "instagram": "2,200 chars (Feed, Reels) | Stories: not supported",
    "facebook": "63,206 chars | Reels: 2,200 chars",
    "tiktok": "2,200 chars (Photos & Videos)",
    "twitter": "280 chars (Premium: 25,000)",
    "linkedin": "3,000 chars",
    "youtube": "5,000 chars (Description) | Shorts: 100 chars",
    "pinterest": "500 chars",
    "bluesky": "300 chars",
    "threads": "500 chars per post"
  }
}
```

### Get Specific Platform

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_caption_limits",
    "arguments": {
      "platform": "instagram",
      "content_type": "reels"
    }
  }
}
```

**Response:**
```json
{
  "platform": "instagram",
  "content_type": "reels",
  "limits": {
    "maxChars": 2200,
    "hashtags": 30,
    "mentions": 20
  }
}
```

---

## Comparison: Caption Limits by Media Type

### Photos (Carousel)

| Platform | Max Chars | Hashtags | Notes |
|----------|-----------|----------|-------|
| **Instagram** | 2,200 | 30 | Mix photos+videos in carousel |
| **TikTok** | 2,200 | - | Up to 35 photos |
| **Facebook** | 63,206 | - | 10 photos max |
| **LinkedIn** | 3,000 | - | 9 photos max |
| **Twitter** | 280 | - | 4 photos max |
| **Pinterest** | 500 | - | Title: 100 chars |

### Videos

| Platform | Max Chars | Duration | Notes |
|----------|-----------|----------|-------|
| **Instagram Feed** | 2,200 | 60s | - |
| **Instagram Reels** | 2,200 | 90s | 9:16 ratio |
| **TikTok** | 2,200 | 10min | 9:16 ratio |
| **YouTube** | 5,000 (desc) | 12hrs | Title: 100 chars |
| **YouTube Shorts** | 100 (title) | 60s | 9:16 ratio |
| **Facebook** | 63,206 | 4hrs | - |
| **LinkedIn** | 3,000 | 30min | - |

### Stories

| Platform | Caption Support | Duration | Notes |
|----------|-----------------|----------|-------|
| **Instagram** | ❌ No | 60s | Text overlays only |
| **Facebook** | ❌ No | 20s | Text overlays only |
| **TikTok** | N/A | N/A | No Stories feature |

---

## Key Insights

### Shortest to Longest (Feed Posts)

```
Bluesky (300) → Twitter (280/25000) → Threads (500) → Pinterest (500) 
→ LinkedIn (3000) → Instagram (2200) → TikTok (2200) 
→ YouTube (5000 desc) → Facebook (63206)
```

### Cross-Posting Strategy

If posting to multiple platforms, optimize for the **lowest common denominator**:

| Platforms Combined | Safe Caption Length |
|-------------------|---------------------|
| Twitter + Instagram | 280 chars |
| Threads + Twitter | 280 chars |
| All except Twitter | 500 chars |
| Instagram + Facebook + TikTok | 2,200 chars |

### Files Updated

1. `src/schemas/media.ts` - Added `PLATFORM_CAPTION_LIMITS` and helper functions
2. `src/schemas/index.ts` - Added `GetCaptionLimitsSchema` and exports
3. `src/tools.ts` - Added `get_caption_limits` tool definition
4. `src/index.ts` - Added handler for the new tool

---

**Deployed:** https://mcp-post-for-me.hypelive.workers.dev/mcp
**Version:** 3556fc0c-cc5f-4e29-bb67-c7839de6c879
**Total Tools:** 13 (added `get_caption_limits`)
