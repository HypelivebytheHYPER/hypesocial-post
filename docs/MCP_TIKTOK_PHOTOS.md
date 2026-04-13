# TikTok Photo Carousel Support

## Overview

TikTok now supports **photo carousels/slideshows** - users can post multiple images with music, similar to Instagram carousel but with some key differences.

## TikTok Photo Carousel vs Instagram Carousel

| Feature | TikTok Photos | Instagram Carousel |
|---------|---------------|-------------------|
| **Max Images** | 35 | 10 |
| **Format** | Slideshow with music | Scrollable carousel |
| **Aspect Ratio** | 9:16 recommended | 1:1 to 4:5 |
| **Auto-advance** | Yes (user sets duration) | No (manual swipe) |
| **Music** | Required | Optional |
| **File Size** | 20MB per image | 8MB per image |
| **Video in Carousel** | ❌ No | ❌ No |

## TikTok Media Constraints (Updated)

```typescript
TIKTOK_PERSONAL: {
  photos: { 
    maxSizeMB: 20, 
    formats: ["jpg", "png"], 
    maxImages: 35, 
    aspectRatio: "9:16 recommended",
    minWidth: 720,
    maxWidth: 4096,
  },
  videos: { 
    maxSizeMB: 287, 
    maxDurationSec: 600, 
    formats: ["mp4", "mov"], 
    aspectRatio: "9:16", 
    minResolution: "540x960", 
    recommendedResolution: "1080x1920" 
  },
  coverImage: { 
    maxSizeMB: 5, 
    formats: ["jpg", "png"], 
    aspectRatio: "9:16" 
  },
}

TIKTOK_BUSINESS: {
  photos: { 
    maxSizeMB: 20, 
    formats: ["jpg", "png"], 
    maxImages: 35, 
    aspectRatio: "9:16 recommended",
    minWidth: 720,
    maxWidth: 4096,
  },
  videos: { 
    maxSizeMB: 1000,  // 1GB for Business!
    maxDurationSec: 600, 
    formats: ["mp4", "mov"], 
    aspectRatio: "9:16", 
    minResolution: "720x1280" 
  },
  coverImage: { 
    maxSizeMB: 5, 
    formats: ["jpg", "png"], 
    aspectRatio: "9:16" 
  },
}
```

## MCP Tool Schema Updates

### Platform Target Options

```typescript
platform_target: {
  enum: [
    // Instagram
    "instagram_feed", "instagram_reels", "instagram_stories",
    // Facebook  
    "facebook_feed", "facebook_reels",
    // TikTok (NEW: separated photos vs videos)
    "tiktok_photos",      // ← NEW for photo carousels
    "tiktok_videos",      // ← NEW for video posts
    // YouTube
    "youtube_shorts",
    // Others
    "twitter", "linkedin", "pinterest", "bluesky", "threads"
  ]
}
```

### Helper Functions

```typescript
// Generic media array (supports up to 35 for TikTok)
JsonSchemaHelpers.mediaArray(description, maxItems)

// Instagram-specific carousel helper
JsonSchemaHelpers.instagramCarousel(description)
// → 2-10 images, max 8MB each

// TikTok photo carousel helper  
JsonSchemaHelpers.tiktokPhotoCarousel(description)
// → 2-35 images, max 20MB each, 9:16 recommended
```

## Usage Examples

### Create TikTok Photo Carousel

```json
{
  "method": "tools/call",
  "params": {
    "name": "create_post",
    "arguments": {
      "caption": "Our product line! Swipe through all 10 colors ✨",
      "social_accounts": ["sa_tiktok_xxx"],
      "media": [
        {
          "url": "https://cdn.example.com/product1.jpg",
          "type": "image",
          "platform_target": "tiktok_photos",
          "width": 1080,
          "height": 1920
        },
        {
          "url": "https://cdn.example.com/product2.jpg",
          "type": "image",
          "platform_target": "tiktok_photos",
          "width": 1080,
          "height": 1920
        }
        // ... up to 35 images
      ]
    }
  }
}
```

### Create TikTok Video

```json
{
  "method": "tools/call",
  "params": {
    "name": "create_post",
    "arguments": {
      "caption": "New tutorial video!",
      "social_accounts": ["sa_tiktok_xxx"],
      "media": [{
        "url": "https://cdn.example.com/video.mp4",
        "type": "video",
        "platform_target": "tiktok_videos",
        "duration_sec": 45,
        "width": 1080,
        "height": 1920
      }]
    }
  }
}
```

## Comparison Matrix

| Platform | Max Photos | Max Videos | Photo Size | Video Size | Duration |
|----------|------------|------------|------------|------------|----------|
| **TikTok** | 35 | 1 | 20MB | 287MB-1GB | 10 min |
| **Instagram** | 10 | 1 | 8MB | 100MB | 60s feed / 90s reels |
| **Facebook** | 10 | 1 | 10MB | 1GB | 4 hours |
| **Threads** | 20 | 1 | 8MB | 100MB | 5 min |
| **Twitter** | 4 | 1 | 5MB | 512MB | 140s |
| **LinkedIn** | 9 | 1 | 8MB | 5GB | 30 min |
| **Pinterest** | 1 | 1 | 20MB | 2GB | 15 min |
| **Bluesky** | 4 | 1 | 1MB | 100MB | 60s |

## Key Differences from Instagram

### TikTok Photo Carousel
- ✅ More images (35 vs 10)
- ✅ Larger file size (20MB vs 8MB)
- ✅ 9:16 aspect ratio (vertical)
- ✅ Music is key feature
- ✅ Auto-advances with timing control
- ❌ No video mixing in carousel

### Instagram Carousel  
- ✅ Mix photos and videos in one post
- ✅ More aspect ratio flexibility
- ✅ Manual swipe navigation
- ✅ Shopping tags on images
- ❌ Fewer images (10 max)
- ❌ Smaller file size limit

## Files Updated

1. `workers/mcp-post-for-me/src/schemas/media.ts`
   - Added `photos` constraint for TikTok Personal & Business
   - Updated `platform_target` enum with `tiktok_photos`, `tiktok_videos`

2. `workers/mcp-post-for-me/src/schemas/index.ts`
   - Added `instagramCarousel()` helper
   - Added `tiktokPhotoCarousel()` helper
   - Updated `mediaArray()` to accept maxItems parameter

## Summary

| Feature | TikTok Photos | Instagram Carousel |
|---------|---------------|-------------------|
| **Use for** | Music-forward slideshows | Mixed photo/video storytelling |
| **Best ratio** | 9:16 vertical | 4:5 portrait / 1:1 square |
| **Max items** | 35 photos | 10 items (photos+videos) |
| **File limit** | 20MB each | 8MB each |

---

*TikTok photo carousels launched 2023, expanded to 35 images in 2024*
