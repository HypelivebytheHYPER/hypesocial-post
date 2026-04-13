/**
 * Post For Me API Terminology & Type Definitions
 * Comprehensive reference for all API models and their usage
 */

/* ==================== MEDIA TYPES ==================== */

export type MediaType = "image" | "video" | "carousel" | "reel" | "story";

export interface MediaTypeDefinition {
  type: MediaType;
  label: string;
  description: string;
  platforms: string[];
  maxDuration?: number; // seconds
  aspectRatios: string[];
  maxFileSize: number; // bytes
  /** Supported content types (image, video) */
  supports?: ("image" | "video")[];
  features?: {
    customThumbnail?: boolean;
    analytics?: "basic" | "advanced";
    drafts?: boolean;
  };
}

export const MEDIA_TYPES: Record<string, MediaTypeDefinition> = {
  feed_image: {
    type: "image",
    label: "Feed Image",
    description: "Static image post for main feed",
    platforms: ["instagram", "facebook", "x", "linkedin", "pinterest", "bluesky", "threads"],
    aspectRatios: ["1:1", "4:5", "1.91:1"],
    maxFileSize: 8 * 1024 * 1024, // 8MB
  },
  feed_video: {
    type: "video",
    label: "Feed Video",
    description: "Video post for main feed",
    platforms: ["instagram", "facebook", "x", "linkedin", "bluesky", "threads"],
    maxDuration: 600, // 10 minutes
    aspectRatios: ["1:1", "4:5", "16:9"],
    maxFileSize: 512 * 1024 * 1024, // 512MB
  },
  reel: {
    type: "reel",
    label: "Reel",
    description: "Short-form vertical video (Instagram/Facebook)",
    platforms: ["instagram", "facebook"],
    maxDuration: 90, // 90 seconds
    aspectRatios: ["9:16"],
    maxFileSize: 512 * 1024 * 1024,
  },
  story: {
    type: "story",
    label: "Story",
    description: "Ephemeral 24-hour content - supports both images and videos",
    platforms: ["instagram", "facebook"],
    supports: ["image", "video"],
    maxDuration: 60, // 60 seconds for videos
    aspectRatios: ["9:16"],
    maxFileSize: 512 * 1024 * 1024, // 512MB for videos, 8MB for images
  },
  carousel: {
    type: "carousel",
    label: "Carousel",
    description: "Multi-image/video post",
    platforms: ["instagram", "facebook", "linkedin", "bluesky", "threads"],
    aspectRatios: ["1:1", "4:5"],
    maxFileSize: 8 * 1024 * 1024,
  },
  tiktok_video: {
    type: "video",
    label: "TikTok Video",
    description: "TikTok video content - Consumer API (basic posting)",
    platforms: ["tiktok"],
    maxDuration: 600, // 10 minutes
    aspectRatios: ["9:16", "1:1", "16:9"], // Vertical recommended, but square and landscape supported
    maxFileSize: 512 * 1024 * 1024,
    features: {
      customThumbnail: false,
      analytics: "basic", // like_count, comment_count, share_count, view_count
      drafts: true,
    },
  },
  tiktok_business_video: {
    type: "video",
    label: "TikTok Business Video",
    description: "TikTok video content - Business API (advanced analytics)",
    platforms: ["tiktok_business"],
    maxDuration: 600, // 10 minutes
    aspectRatios: ["9:16", "1:1", "16:9"],
    maxFileSize: 512 * 1024 * 1024,
    features: {
      customThumbnail: true, // Business API allows custom thumbnails
      analytics: "advanced", // watch_time, retention, demographics
      drafts: true,
    },
  },
  youtube_video: {
    type: "video",
    label: "YouTube Video",
    description: "Long-form YouTube content",
    platforms: ["youtube"],
    aspectRatios: ["16:9"],
    maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
  },
  youtube_short: {
    type: "video",
    label: "YouTube Short",
    description: "Short-form vertical YouTube content",
    platforms: ["youtube"],
    maxDuration: 60,
    aspectRatios: ["9:16"],
    maxFileSize: 512 * 1024 * 1024,
  },
  pinterest_pin: {
    type: "image",
    label: "Pin",
    description: "Pinterest image bookmark",
    platforms: ["pinterest"],
    aspectRatios: ["2:3"],
    maxFileSize: 20 * 1024 * 1024, // 20MB
  },
};

/* ==================== CAROUSEL vs PHOTO SLIDESHOW ==================== */

/**
 * IMPORTANT DISTINCTION:
 * 
 * CAROUSEL (Instagram, Facebook, LinkedIn, Bluesky, Threads):
 * - Swipeable gallery where users manually browse each image
 * - Can mix images AND videos in one post
 * - User controls viewing pace
 * - Each item is a separate "slide"
 * 
 * PHOTO SLIDESHOW (TikTok only):
 * - Auto-playing video-like experience
 * - Images transition automatically (synced to music beats)
 * - Users cannot swipe through individual images
 * - Treated as video content by TikTok algorithm
 * - Requires music (auto-added or specified)
 * - 2-35 images only (no videos in slideshow)
 */
export const CAROUSEL_VS_SLIDESHOW = {
  carousel: {
    platforms: ["instagram", "facebook", "linkedin", "bluesky", "threads"],
    behavior: "Swipeable gallery",
    user_control: "Manual swiping",
    media_types: "Images AND videos mixed",
    interaction: "User browses at their own pace",
  },
  photo_slideshow: {
    platforms: ["tiktok", "tiktok_business"],
    behavior: "Auto-playing with transitions",
    user_control: "Auto-advances (can tap to pause)",
    media_types: "Images only (2-35)",
    interaction: "Like a video - watch or skip",
    music: "Required - synced to transitions",
  },
};

/* ==================== PLATFORM-SPECIFIC TERMINOLOGY ==================== */

export const PLATFORM_TERMS = {
  instagram: {
    posts: {
      feed: "Feed Post",
      reel: "Reel",
      story: "Story",
      carousel: "Carousel",
    },
    placements: {
      timeline: "Feed/Timeline",
      reels: "Reels",
      stories: "Stories",
    },
    metrics: {
      likes: "Likes",
      comments: "Comments",
      shares: "Shares",
      saves: "Saves",
      views: "Views",
      reach: "Reach",
      impressions: "Impressions",
      profile_visits: "Profile Visits",
      follows: "Follows",
      // Reel-specific
      ig_reels_avg_watch_time: "Avg Watch Time (ms)",
      ig_reels_video_view_total_time: "Total Watch Time (ms)",
      navigation: "Navigation Actions",
      profile_activity: "Profile Activity",
      total_interactions: "Total Interactions",
    },
    features: {
      share_to_feed: "Share to Feed (Reels)",
      trial_reel: "Trial Reel",
      branded_content: "Branded Content",
      paid_partnership: "Paid Partnership",
      collaborations: "Collabs",
      user_tags: "User Tags",
      product_tags: "Product Tags",
      stories_image_video: "Stories support both images and videos",
    },
    reels_config: {
      share_to_feed: "Default: true. Set to false to show ONLY in Reels tab (not main feed)",
      trial_reel_type: {
        manual: "Can be manually graduated to main grid in native app",
        performance: "Auto-graduates if performs well (requires 1,000+ followers)",
      },
    },
    stories_note: "Stories placement: Supports BOTH images and videos. Multiple media items create individual story posts (not carousel). Each counts separately toward post limits. Stories are ephemeral (24 hours).",
    stories_metrics: {
      views: "Story views (tracked via Instagram API)",
      replies: "Direct replies to story (story media only)",
      likes: "Story likes",
      shares: "Story shares",
      navigation: "Navigation actions (forward/back/exit)",
    },
    stories_best_practices: [
      "Images AND videos both supported for Stories",
      "9:16 aspect ratio recommended",
      "Multiple uploads = individual story posts (not swipeable)",
      "Views are tracked and available via metrics API",
      "Stories expire after 24 hours but metrics persist",
    ],
  },
  
  facebook: {
    posts: {
      feed: "Feed Post",
      reel: "Reel",
      story: "Story",
    },
    placements: {
      timeline: "Timeline (Feed)",
      reels: "Reels",
      stories: "Stories",
    },
    metrics: {
      likes: "Reactions",
      comments: "Comments",
      shares: "Shares",
      views: "Views",
      // Video-specific
      video_views_autoplayed: "Autoplayed Views",
      video_views_clicked_to_play: "Clicked Views",
      video_views_unique: "Unique Views",
      video_avg_time_watched: "Avg Watch Time",
      video_total_time_watched: "Total Watch Time",
      // Demographics
      demographics_age_gender: "Age & Gender",
      demographics_country: "Country",
      activity_by_action: "Actions",
    },
    features: {
      reels_music: "Music (Reels)",
      reels_duet: "Duet",
      reels_stitch: "Stitch",
      reels_disclose: "Branded Content",
    },
    stories_note: "Stories placement: Supports BOTH images and videos. Multiple media items create individual story posts (not carousel). Each counts separately toward post limits. Stories are ephemeral (24 hours).",
    stories_metrics: {
      views: "Story views (tracked via Facebook Graph API)",
      likes: "Story reactions",
      shares: "Story shares/reshares",
      navigation: "Navigation actions",
    },
    stories_best_practices: [
      "Images AND videos both supported for Stories",
      "9:16 aspect ratio recommended",
      "Multiple uploads = individual story posts (not swipeable carousel)",
      "Views are tracked and available via metrics API",
      "Stories expire after 24 hours but metrics persist in API",
    ],
  },
  
  tiktok: {
    connection: "Consumer API",
    description: "Standard TikTok connection for general posting",
    permissions: [
      "user.info.basic",
      "video.list",
      "video.upload",
      "video.publish",
    ],
    posts: {
      video: "Video",
      photo_slideshow: "Photo Slideshow (NOT carousel - auto-playing with music)",
    },
    photo_slideshow_note: "Photo Slideshow is NOT a carousel. It creates an auto-playing video-like experience with transitions synced to music. Users cannot swipe through individual images - it plays automatically like a video. Use 2-35 images.",
    metrics: {
      likes: "Likes",
      comments: "Comments",
      shares: "Shares",
      views: "Views",
      play_count: "Total Plays",
      // Consumer API limited to 4 core metrics
    },
    features: {
      allow_duet: "Allow Duet",
      allow_stitch: "Allow Stitch",
      allow_comment: "Allow Comments",
      auto_add_music: "Auto-add Music",
      privacy_level: "Privacy",
      is_draft: "Save as Draft (TikTok Native)",
      disclose_brand: "Branded Content",
      ai_generated: "AI-Generated Content",
      custom_thumbnail: "Custom Thumbnail (Not Available)",
    },
    limitations: {
      customThumbnail: false,
      analytics: "Basic only - like_count, comment_count, share_count, view_count",
    },
  },

  tiktok_business: {
    connection: "Business API",
    description: "TikTok Marketing & Business API for advanced analytics",
    permissions: [
      "user.info.basic",
      "user.info.username",
      "user.info.stats",
      "user.info.profile",
      "user.account.type",
      "user.insights",
      "video.list",
      "video.insights",
      "comment.list",
      "comment.list.manage",
      "video.publish",
      "video.upload",
      "biz.spark.auth",
      "discovery.search.words",
    ],
    posts: {
      video: "Video",
      photo_slideshow: "Photo Slideshow",
    },
    metrics: {
      // Core metrics
      likes: "Likes",
      comments: "Comments",
      shares: "Shares",
      views: "Views",
      video_views: "Video Views",
      favorites: "Favorites",
      // Engagement
      new_followers: "New Followers",
      profile_views: "Profile Views",
      reach: "Reach",
      // Watch time
      total_time_watched: "Total Time Watched (seconds)",
      average_time_watched: "Avg Time Watched (seconds)",
      full_video_watched_rate: "Full Watch Rate (%)",
      // Retention graph
      video_view_retention: "View Retention by Time",
      engagement_likes: "Engagement Likes by Time",
      // Impression sources
      impression_sources: "Impression Sources",
      // Demographics
      audience_types: "Audience Types",
      audience_genders: "Audience Genders",
      audience_countries: "Audience Countries",
      audience_cities: "Audience Cities",
      // Click metrics
      website_clicks: "Website Clicks",
      email_clicks: "Email Clicks",
      phone_number_clicks: "Phone Clicks",
      address_clicks: "Address Clicks",
      app_download_clicks: "App Download Clicks",
      lead_submissions: "Lead Submissions",
    },
    features: {
      allow_duet: "Allow Duet",
      allow_stitch: "Allow Stitch",
      allow_comment: "Allow Comments",
      auto_add_music: "Auto-add Music",
      privacy_level: "Privacy",
      is_draft: "Save as Draft (TikTok Native)",
      disclose_brand: "Branded Content",
      ai_generated: "AI-Generated Content",
      custom_thumbnail: "Custom Thumbnail (Available)",
    },
    advantages: {
      customThumbnail: true,
      analytics: "Advanced - demographics, retention, watch time",
      demographics: "Gender, Country, City breakdown",
    },
  },
  
  youtube: {
    posts: {
      video: "Video",
      short: "Short",
    },
    metrics: {
      views: "Views",
      redViews: "Premium Views",
      likes: "Likes",
      comments: "Comments",
      estimatedMinutesWatched: "Est. Minutes Watched",
      averageViewDuration: "Avg View Duration",
      averageViewPercentage: "Avg View %",
      subscribersGained: "Subscribers Gained",
      subscribersLost: "Subscribers Lost",
    },
    features: {
      privacy: "Privacy",
      made_for_kids: "Made for Kids",
      title: "Video Title",
    },
  },
  
  x: {
    posts: {
      tweet: "Post",
      reply: "Reply",
      quote: "Quote Post",
    },
    metrics: {
      // Public
      retweet_count: "Reposts",
      reply_count: "Replies",
      like_count: "Likes",
      quote_count: "Quotes",
      bookmark_count: "Bookmarks",
      impression_count: "Impressions",
      // Organic
      organic_retweet_count: "Organic Reposts",
      organic_reply_count: "Organic Replies",
      organic_like_count: "Organic Likes",
      organic_impression_count: "Organic Impressions",
      organic_quote_count: "Organic Quotes",
      // Non-public (promoted)
      url_link_clicks: "Link Clicks",
      user_profile_clicks: "Profile Clicks",
    },
    features: {
      reply_settings: "Reply Settings",
      quote_tweet_id: "Quote Tweet ID",
      poll: "Poll",
    },
  },
  
  linkedin: {
    posts: {
      feed: "Post",
      article: "Article",
    },
    metrics: {
      likes: "Reactions",
      commentCount: "Comments",
      shareCount: "Shares",
      impressionCount: "Impressions",
      videoView: "Video Views",
    },
    limitations: {
      note: "Metrics only available for Company Pages, not personal profiles",
    },
  },
  
  bluesky: {
    posts: {
      post: "Post",
    },
    metrics: {
      likes: "Likes",
      comments: "Replies",
      shares: "Reposts",
      quotes: "Quotes",
    },
    limitations: {
      note: "View counts not available via API",
    },
  },
  
  threads: {
    posts: {
      thread: "Thread",
      reply: "Reply",
    },
    metrics: {
      likes: "Likes",
      replies: "Replies",
      reposts: "Reposts",
      quotes: "Quotes",
      views: "Views",
    },
  },
  
  pinterest: {
    posts: {
      pin: "Pin",
    },
    metrics: {
      saves: "Saves",
      pin_clicks: "Pin Clicks",
      outbound_clicks: "Outbound Clicks",
      impressions: "Impressions",
    },
    features: {
      board: "Board",
      link: "Destination Link",
    },
  },
};

/* ==================== METRIC AVAILABILITY BY PLATFORM ==================== */

export const METRIC_AVAILABILITY: Record<string, Record<string, boolean>> = {
  instagram: {
    likes: true,
    comments: true,
    shares: true,
    saves: true,
    views: true,
    reach: true,
    impressions: true,
    profile_visits: true,
    follows: true,
  },
  facebook: {
    likes: true,
    comments: true,
    shares: true,
    views: true,
    video_views_autoplayed: true,
    video_views_clicked_to_play: true,
    video_views_unique: true,
  },
  tiktok: {
    likes: true,
    comments: true,
    shares: true,
    views: true,
    play_count: true,
    // Consumer API limited to 4 core metrics
  },
  tiktok_business: {
    likes: true,
    comments: true,
    shares: true,
    views: true,
    video_views: true,
    favorites: true,
    new_followers: true,
    profile_views: true,
    reach: true,
    total_time_watched: true,
    average_time_watched: true,
    full_video_watched_rate: true,
    video_view_retention: true,
    engagement_likes: true,
    impression_sources: true,
    audience_types: true,
    audience_genders: true,
    audience_countries: true,
    audience_cities: true,
    website_clicks: true,
    email_clicks: true,
    phone_number_clicks: true,
    address_clicks: true,
    app_download_clicks: true,
    lead_submissions: true,
  },
  youtube: {
    likes: true,
    comments: true,
    views: true,
    redViews: true,
    estimatedMinutesWatched: true,
    shares: false,
  },
  x: {
    likes: true,
    comments: true,
    shares: true,
    views: true,
    quotes: true,
    bookmarks: true,
    impressions: true,
  },
  linkedin: {
    likes: true,
    comments: true,
    shares: true,
    views: true,
    impressionCount: true,
  },
  bluesky: {
    likes: true,
    comments: true,
    shares: true,
    views: false, // Not available
  },
  threads: {
    likes: true,
    comments: true,
    shares: true,
    views: true,
    quotes: true,
  },
  pinterest: {
    likes: true, // Actually "saves"
    comments: false,
    shares: false,
    views: false,
    saves: true,
  },
};

/* ==================== TIKTOK DRAFTS ==================== */

/**
 * TIKTOK DRAFT vs SYSTEM DRAFT
 * 
 * These are controlled by two entirely different parameters:
 * 
 * 1. PLATFORM DRAFT (is_draft in tiktok config):
 *    - Location: platform_configurations.tiktok.is_draft
 *    - Effect: Post is sent to TikTok's servers as a draft
 *    - User receives notification in TikTok app
 *    - User can add native effects, music, filters
 *    - Status becomes "processed" even though unpublished
 *    - Use case: Hand-off to native app for editing
 * 
 * 2. SYSTEM DRAFT (isDraft at root):
 *    - Location: root level of post payload
 *    - Effect: Post stored in Post For Me database only
 *    - Never sent to TikTok or any platform
 *    - Status remains "draft"
 *    - Use case: Save work-in-progress
 * 
 * Example payload with TikTok draft:
 * {
 *   caption: "My video",
 *   isDraft: false,           // System-level: false (will process)
 *   platform_configurations: {
 *     tiktok: {
 *       is_draft: true        // Platform-level: true (send to TikTok as draft)
 *     }
 *   }
 * }
 */

export interface TiktokDraftConfig {
  /** Send to TikTok as native draft (user gets app notification) */
  is_draft?: boolean;
  /** Allow user to edit in TikTok app */
  allow_edit?: boolean;
}

/* ==================== POST STATUS LIFECYCLE ==================== */

export type PostStatus = 
  | "draft"           // Not scheduled, being edited (system draft)
  | "scheduled"       // Scheduled for future publication
  | "processing"      // Being processed by platform
  | "processed"       // Successfully posted OR sent as platform draft
  | "failed"          // Failed to post
  | "cancelled";      // Cancelled by user

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  processing: "Publishing...",
  processed: "Published",
  failed: "Failed",
  cancelled: "Cancelled",
};

/* ==================== ACCOUNT STATUS ==================== */

export type AccountStatus = "connected" | "disconnected" | "expired" | "pending";

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  connected: "Connected",
  disconnected: "Disconnected",
  expired: "Token Expired",
  pending: "Pending",
};

/* ==================== HELPER FUNCTIONS ==================== */

/**
 * Get display label for a metric key
 */
export function getMetricLabel(platform: string, key: string): string {
  const platformTerms = PLATFORM_TERMS[platform as keyof typeof PLATFORM_TERMS];
  if (!platformTerms) return key;
  
  return platformTerms.metrics[key as keyof typeof platformTerms.metrics] || key;
}

/**
 * Check if a metric is available for a platform
 */
export function isMetricAvailable(platform: string, metric: string): boolean {
  return METRIC_AVAILABILITY[platform]?.[metric] ?? false;
}

/**
 * Get media type definition
 */
export function getMediaTypeDefinition(type: string): MediaTypeDefinition | undefined {
  return MEDIA_TYPES[type];
}

/**
 * Get recommended aspect ratios for platform
 */
export function getRecommendedAspectRatios(platform: string): string[] {
  const types = Object.values(MEDIA_TYPES).filter(
    (t) => t.platforms.includes(platform)
  );
  const allRatios = types.flatMap((t) => t.aspectRatios);
  return [...new Set(allRatios)];
}

/**
 * Get supported media types for a platform's story placement
 * Stories support both images and videos
 */
export function getStorySupportedMediaTypes(platform: string): ("image" | "video")[] {
  const storyType = MEDIA_TYPES.story;
  if (!storyType || !storyType.platforms.includes(platform)) {
    return [];
  }
  return storyType.supports || ["image", "video"];
}

/**
 * Check if a media type is supported for stories on a platform
 */
export function isMediaTypeSupportedForStories(
  platform: string,
  mediaType: "image" | "video"
): boolean {
  const supported = getStorySupportedMediaTypes(platform);
  return supported.includes(mediaType);
}

/* ==================== TIKTOK BUSINESS METRIC DTOs ==================== */

/**
 * TikTokBusinessPostImpressionSourceDto
 * Breakdown of where impressions came from
 */
export interface TikTokBusinessPostImpressionSourceDto {
  /** Name of the impression source (e.g., "For You", "Following") */
  impression_source: string;
  /** Percentage of impressions from this source */
  percentage: number;
}

/**
 * TikTokBusinessPostAudienceTypeDto
 * Audience breakdown by type
 */
export interface TikTokBusinessPostAudienceTypeDto {
  /** Type of audience (e.g., "Follower", "Non-follower") */
  type: string;
  /** Percentage of audience of this type */
  percentage: number;
}

/**
 * TikTokBusinessPostAudienceGenderDto
 * Audience breakdown by gender
 */
export interface TikTokBusinessPostAudienceGenderDto {
  /** Gender category */
  gender: string;
  /** Percentage of audience of this gender */
  percentage: number;
}

/**
 * TikTokBusinessPostAudienceCountryDto
 * Audience breakdown by country
 */
export interface TikTokBusinessPostAudienceCountryDto {
  /** Country name */
  country: string;
  /** Percentage of audience from this country */
  percentage: number;
}

/**
 * TikTokBusinessPostAudienceCityDto
 * Audience breakdown by city
 */
export interface TikTokBusinessPostAudienceCityDto {
  /** City name */
  city_name: string;
  /** Percentage of audience from this city */
  percentage: number;
}

/**
 * TikTokBusinessVideoMetricPercentageDto
 * Metric data by percentage and time
 */
export interface TikTokBusinessVideoMetricPercentageDto {
  /** Percentage value for the metric */
  percentage: number;
  /** Time in seconds for the metric */
  second: string;
}

/**
 * TikTokBusinessMetricsDto
 * Complete TikTok Business metrics
 */
export interface TikTokBusinessMetricsDto {
  /** Number of address clicks */
  address_clicks: number;
  /** Number of app download clicks */
  app_download_clicks: number;
  /** Audience cities breakdown */
  audience_cities: TikTokBusinessPostAudienceCityDto[];
  /** Audience countries breakdown */
  audience_countries: TikTokBusinessPostAudienceCountryDto[];
  /** Audience genders breakdown */
  audience_genders: TikTokBusinessPostAudienceGenderDto[];
  /** Audience types breakdown */
  audience_types: TikTokBusinessPostAudienceTypeDto[];
  /** Average time watched in seconds */
  average_time_watched: number;
  /** Number of comments */
  comments: number;
  /** Number of email clicks */
  email_clicks: number;
  /** Engagement likes data by percentage and time */
  engagement_likes: TikTokBusinessVideoMetricPercentageDto[];
  /** Number of favorites */
  favorites: number;
  /** Rate of full video watches as percentage */
  full_video_watched_rate: number;
  /** Impression sources breakdown */
  impression_sources: TikTokBusinessPostImpressionSourceDto[];
  /** Number of lead submissions */
  lead_submissions: number;
  /** Number of likes */
  likes: number;
  /** Number of new followers gained */
  new_followers: number;
  /** Number of phone number clicks */
  phone_number_clicks: number;
  /** Number of profile views */
  profile_views: number;
  /** Total reach of the post */
  reach: number;
  /** Number of shares */
  shares: number;
  /** Total time watched in seconds */
  total_time_watched: number;
  /** Video view retention data */
  video_view_retention: TikTokBusinessVideoMetricPercentageDto[];
  /** Total number of video views */
  video_views: number;
  /** Number of website clicks */
  website_clicks: number;
}

/**
 * TikTokPostMetricsDto (Consumer API - Basic metrics only)
 */
export interface TikTokPostMetricsDto {
  /** Number of comments */
  comment_count: number;
  /** Number of likes */
  like_count: number;
  /** Number of shares */
  share_count: number;
  /** Number of views */
  view_count: number;
}
/**
 * OAuth Permission Scopes for Social Platforms
 * Use these when requesting permission_overrides during auth
 */

/* ==================== TIKTOK CONSUMER SCOPES ==================== */
export const TIKTOK_CONSUMER_SCOPES: string[] = [
  "user.info.basic",
  "video.list",
  "video.upload",
  "video.publish",
];

/* ==================== TIKTOK BUSINESS SCOPES ==================== */
export const TIKTOK_BUSINESS_SCOPES: string[] = [
  "user.info.basic",
  "user.info.username",
  "user.info.stats",
  "user.info.profile",
  "user.account.type",
  "user.insights",
  "video.list",
  "video.insights",
  "comment.list",
  "comment.list.manage",
  "video.publish",
  "video.upload",
  "biz.spark.auth",
  "discovery.search.words",
];

/* ==================== HELPER FOR AUTH URL ==================== */

/**
 * Get the appropriate permission scopes for a platform
 */
export function getPlatformScopes(platform: string): string[][] {
  switch (platform) {
    case "tiktok":
      return [TIKTOK_CONSUMER_SCOPES];
    case "tiktok_business":
      return [TIKTOK_BUSINESS_SCOPES];
    default:
      return []; // Use platform defaults
  }
}

/**
 * Build platform_data for auth URL request
 */
export function buildAuthPlatformData(
  platform: string,
  useBusinessScopes = false
): Record<string, { permission_overrides?: string[][] }> | undefined {
  if (platform === "tiktok" && useBusinessScopes) {
    return {
      tiktok: {
        permission_overrides: [TIKTOK_BUSINESS_SCOPES],
      },
    };
  }
  
  if (platform === "tiktok_business") {
    return {
      tiktok_business: {
        permission_overrides: [TIKTOK_BUSINESS_SCOPES],
      },
    };
  }
  
  if (platform === "tiktok") {
    return {
      tiktok: {
        permission_overrides: [TIKTOK_CONSUMER_SCOPES],
      },
    };
  }
  
  return undefined;
}
