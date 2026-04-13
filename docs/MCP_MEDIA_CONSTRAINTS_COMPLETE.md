# MCP Media Constraints - Complete Platform Support

## Overview

Comprehensive media constraints for **12 platforms** including Reels, TikTok (2 types), Stories, and more.

## Platform Matrix

| Platform | Feed Images | Feed Videos | Reels/Shorts | Stories | Max Items |
|----------|-------------|-------------|--------------|---------|-----------|
| **Instagram** | 8MB, 4:5 | 100MB, 60s | 100MB, 90s, 9:16 | 100MB, 60s | 10 (carousel) |
| **Facebook** | 10MB | 1000MB, 4hrs | 1000MB, 90s | 100MB, 20s | 10 |
| **TikTok Personal** | - | 287MB, 10min | 287MB, 10min, 9:16 | - | 1 |
| **TikTok Business** | - | 1000MB, 10min | 1000MB, 10min, 9:16 | - | 1 |
| **Twitter/X** | 5MB, 4 images | 512MB, 140s | - | - | 4 images / 1 video |
| **LinkedIn** | 8MB, 9 images | 5000MB, 30min | - | - | 9 / 1 video |
| **YouTube** | - | 256GB, 12hrs | 60GB, 60s, 9:16 | - | 1 |
| **Pinterest** | 20MB, 2:3 | 2000MB, 15min | - | Idea Pins: 20 pages | 1 |
| **Bluesky** | 1MB, 4 images | 100MB, 60s | - | - | 4 |
| **Threads** | 8MB, 20 images | 100MB, 5min | - | - | 20 images / 1 video |

## Detailed Constraints

### Instagram

```typescript
FEED: {
  images: {
    maxSizeMB: 8,
    formats: ["jpg", "png", "webp"],
    minWidth: 320,
    maxWidth: 1440,
    aspectRatio: "1:1 to 4:5"
  },
  videos: {
    maxSizeMB: 100,
    maxDurationSec: 60,
    formats: ["mp4", "mov"],
    minResolution: "720p",
    aspectRatio: "4:5 to 16:9"
  },
  carousel: { maxItems: 10 }
}

REELS: {
  videos: {
    maxSizeMB: 100,
    maxDurationSec: 90,
    formats: ["mp4", "mov"],
    aspectRatio: "9:16",
    minResolution: "720x1280",
    maxResolution: "1080x1920"
  },
  coverImage: {
    maxSizeMB: 8,
    formats: ["jpg", "png"],
    aspectRatio: "9:16"
  }
}

STORIES: {
  images: { maxSizeMB: 8, aspectRatio: "9:16" },
  videos: { maxSizeMB: 100, maxDurationSec: 60, aspectRatio: "9:16" }
}
```

### TikTok (Personal vs Business)

```typescript
PERSONAL: {
  videos: {
    maxSizeMB: 287,
    maxDurationSec: 600, // 10 minutes
    formats: ["mp4", "mov"],
    aspectRatio: "9:16",
    minResolution: "540x960",
    recommendedResolution: "1080x1920"
  }
}

BUSINESS: {
  videos: {
    maxSizeMB: 1000, // 1GB
    maxDurationSec: 600,
    formats: ["mp4", "mov"],
    aspectRatio: "9:16",
    minResolution: "720x1280"
  }
}
```

### YouTube & Shorts

```typescript
YOUTUBE: {
  videos: {
    maxSizeMB: 256 * 1024, // 256GB!
    maxDurationSec: 12 * 3600, // 12 hours
    formats: ["mp4", "mov", "avi", "wmv", "flv"],
    maxResolution: "8K"
  },
  shorts: {
    maxSizeMB: 60 * 1024, // 60GB
    maxDurationSec: 60,
    formats: ["mp4"],
    aspectRatio: "9:16"
  },
  thumbnails: {
    maxSizeMB: 2,
    formats: ["jpg", "png"],
    minWidth: 640,
    aspectRatio: "16:9"
  }
}
```

## MCP Tool Schema

### Media Object

```json
{
  "type": "object",
  "description": "Media file with platform-specific requirements",
  "properties": {
    "url": {
      "type": "string",
      "format": "uri",
      "description": "Publicly accessible URL of the media file"
    },
    "type": {
      "type": "string",
      "enum": ["image", "video"],
      "description": "Type of media"
    },
    "platform_target": {
      "type": "string",
      "enum": [
        "instagram_feed",
        "instagram_reels",
        "instagram_stories",
        "facebook_feed",
        "facebook_reels",
        "tiktok",
        "youtube_shorts",
        "twitter",
        "linkedin",
        "pinterest",
        "bluesky",
        "threads"
      ],
      "description": "Target platform for optimized validation"
    },
    "mime_type": {
      "type": "string",
      "enum": [
        "image/jpeg", "image/png", "image/webp", "image/gif",
        "video/mp4", "video/quicktime", "video/avi", "video/webm"
      ]
    },
    "size_bytes": { "type": "integer", "minimum": 1 },
    "width": { "type": "integer", "minimum": 1 },
    "height": { "type": "integer", "minimum": 1 },
    "duration_sec": { "type": "number", "minimum": 0.1 }
  },
  "required": ["url", "type"]
}
```

## Usage Examples

### Create Post with Instagram Reel

```json
{
  "method": "tools/call",
  "params": {
    "name": "create_post",
    "arguments": {
      "caption": "Check out our new reel!",
      "social_accounts": ["sa_instagram_xxx"],
      "media": [{
        "url": "https://cdn.example.com/reel.mp4",
        "type": "video",
        "platform_target": "instagram_reels",
        "mime_type": "video/mp4",
        "size_bytes": 45000000,
        "width": 1080,
        "height": 1920,
        "duration_sec": 45
      }]
    }
  }
}
```

### Create YouTube Short

```json
{
  "method": "tools/call",
  "params": {
    "name": "create_post",
    "arguments": {
      "caption": "Quick tutorial #shorts",
      "social_accounts": ["sa_youtube_xxx"],
      "media": [{
        "url": "https://cdn.example.com/short.mp4",
        "type": "video",
        "platform_target": "youtube_shorts",
        "duration_sec": 58
      }]
    }
  }
}
```

### Multi-Platform Post

```json
{
  "method": "tools/call",
  "params": {
    "name": "create_post",
    "arguments": {
      "caption": "New product launch!",
      "social_accounts": [
        "sa_instagram_xxx",
        "sa_tiktok_xxx",
        "sa_threads_xxx"
      ],
      "media": [{
        "url": "https://cdn.example.com/product.jpg",
        "type": "image",
        "width": 1200,
        "height": 1500
      }]
    }
  }
}
```

## Validation Errors

When media doesn't meet platform requirements:

```json
{
  "content": [{
    "type": "text",
    "text": "Error: instagram_reels video requirements not met: size exceeds 100MB. Allowed: mp4/mov, max 100MB, max 90s, 9:16 aspect ratio"
  }],
  "isError": true
}
```

## Files Updated

1. `src/schemas/media.ts` - Platform constraints definitions
2. `src/schemas/index.ts` - Re-exports and helpers
3. `src/tools.ts` - Updated create_post description

## Deployment

✅ **Deployed:** https://mcp-post-for-me.hypelive.workers.dev
**Version:** e5217276-de10-4b2e-8286-08a9705031b6

## Summary

- **12 platforms** supported
- **4 content types** (Feed, Reels/Shorts, Stories, Standard)
- **Image formats:** JPEG, PNG, WebP, GIF
- **Video formats:** MP4, MOV, AVI, WebM
- **Max items:** Up to 20 (Threads)
- **Max video size:** 256GB (YouTube)
- **Max duration:** 12 hours (YouTube)

---

*Complete media constraints for all social media platforms*
