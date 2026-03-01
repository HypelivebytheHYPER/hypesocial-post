// Post For Me API Types
// https://api.postforme.dev/docs

// ==================== PLATFORM LIMITS ====================

/** Platform-specific character limits for captions */
export const PLATFORM_CHARACTER_LIMITS: Record<string, number> = {
  x: 280,
  twitter: 280,
  instagram: 2200,
  facebook: 63206,
  linkedin: 3000,
  tiktok: 2200,
  threads: 500,
  pinterest: 500,
  youtube: 5000,
  bluesky: 300,
};

/** Get the most restrictive limit for selected platforms */
export function getMostRestrictiveLimit(platforms: string[]): number {
  if (platforms.length === 0) return Infinity;
  const limits = platforms.map(
    (p) => PLATFORM_CHARACTER_LIMITS[p.toLowerCase()] || Infinity,
  );
  return Math.min(...limits);
}

/** Get warning threshold (80% of limit) */
export function getWarningThreshold(limit: number): number {
  return Math.floor(limit * 0.8);
}

/** Get danger threshold (95% of limit) */
export function getDangerThreshold(limit: number): number {
  return Math.floor(limit * 0.95);
}

// ==================== SOCIAL POSTS ====================

export interface SocialPost {
  id: string;
  caption: string;
  social_accounts: SocialAccount[]; // API returns full account objects, not IDs
  media?: MediaItem[];
  scheduled_at?: string; // ISO 8601 datetime
  /** API status: draft | scheduled | processing | processed. Note: "failed" comes from post results, not post status */
  status: "draft" | "scheduled" | "processing" | "processed";
  platform_configurations?: Record<string, PlatformConfig>;
  account_configurations?: AccountConfig[];
  external_id?: string;
  created_at: string;
  updated_at: string; // API requires this field
}

// https://api.postforme.dev/docs#model/socialpostdto
/** SocialPostDto - Official Post For Me API type alias */
export type SocialPostDto = SocialPost;

/** SocialPostMediaDto - Official Post For Me API type
 * https://api.postforme.dev/docs#model/socialpostmediadto
 */
export interface MediaItem {
  /** Public URL of the media (required) */
  url: string;
  /** Public URL of the thumbnail for the media - API returns object | null */
  thumbnail_url?: object | null;
  /** Timestamp in milliseconds of frame to use as thumbnail - API returns object | null */
  thumbnail_timestamp_ms?: object | null;
  /** List of tags to attach to the media (user/product tags for Facebook/Instagram) */
  tags?: MediaTag[];
  /** If true, media will not be processed. Increases failure risk if media doesn't meet platform requirements. */
  skip_processing?: boolean;
}

// https://api.postforme.dev/docs#model/socialpostmediadto
/** SocialPostMediaDto - Official Post For Me API type alias */
export type SocialPostMediaDto = MediaItem;

/** UserTagDto - Official Post For Me API type for media tags
 * https://api.postforme.dev/docs#model/usertagdto
 * Only Facebook and Instagram support media tagging
 */
export interface MediaTag {
  id: string;
  platform: "facebook" | "instagram";
  type: "user" | "product";
  x?: number; // percentage 0-100 (optional)
  y?: number; // percentage 0-100 (optional)
}

// Alias - UserTagDto is the official OpenAPI name
export type UserTagDto = MediaTag;

// https://api.postforme.dev/docs#model/twitterpolldto
export interface TwitterPollDto {
  /** Duration of the poll in minutes */
  duration_minutes: number;
  /** The choices of the poll, requiring 2-4 options */
  options: string[];
  /** Who can reply to the tweet */
  reply_settings?: "following" | "mentionedUsers" | "subscribers" | "verified";
}

export interface PlatformConfig {
  // Common - caption/media override
  caption?: string; // Override the caption from the post for this platform
  media?: MediaItem[]; // Override the media from the post for this platform

  // Instagram
  placement?: "reels" | "stories" | "timeline"; // Instagram post placement (NOT "feed")
  share_to_feed?: boolean; // If false, video posts will only be shown in the Reels tab
  collaborators?: string[]; // Instagram usernames to tag as collaborators
  location?: string; // Page id with location to tag the image/video with
  trial_reel_type?: "manual" | "performance"; // Instagram trial reel type

  // Facebook
  // (shares placement, location, collaborators with Instagram)
  // placement uses "timeline" NOT "feed"

  // YouTube
  title?: string; // Override the title from the post (for YouTube/TikTok)
  /** YouTube privacy: "public" | "private" | "unlisted". TikTok privacy: "public" | "private" ONLY (no "unlisted") */
  privacy_status?: "public" | "private" | "unlisted";
  made_for_kids?: boolean; // Notify YouTube the video is intended for kids - default: false

  // TikTok / TikTok Business
  allow_comment?: boolean; // default: true
  allow_duet?: boolean; // default: true
  allow_stitch?: boolean; // default: true
  auto_add_music?: boolean; // Automatically add music to photo posts (converts images to video) - default: true
  is_draft?: boolean; // Create as draft - user must complete posting in TikTok app - default: false
  disclose_your_brand?: boolean; // Disclose your brand on TikTok - default: false
  disclose_branded_content?: boolean; // Disclose branded content on TikTok - default: false
  is_ai_generated?: boolean; // Flag content as AI generated on TikTok - default: false

  // X (Twitter)
  poll?: TwitterPollDto;
  community_id?: string; // Id of the community to post to
  quote_tweet_id?: string; // Id of the tweet to quote
  reply_settings?: "following" | "mentionedUsers" | "subscribers" | "verified"; // Who can reply

  // Pinterest
  board_ids?: string[]; // Pinterest board IDs
  link?: string; // Pinterest post link

  // Threads
  // placement: "reels" | "timeline" (Note: no "stories" for Threads)
}

// ==================== PLATFORM CONFIGURATION DTOs (from OpenAPI spec) ====================

// https://api.postforme.dev/docs#model/pinterestconfigurationdto
export interface PinterestConfigurationDto {
  /** Overrides the caption from the post */
  caption?: object | null;
  /** Overrides the media from the post */
  media?: MediaItem[] | null;
  /** Pinterest board IDs */
  board_ids?: string[] | null;
  /** Pinterest post link */
  link?: string | null;
}

// https://api.postforme.dev/docs#model/instagramconfigurationdto
export interface InstagramConfigurationDto {
  /** Overrides the caption from the post */
  caption?: object | null;
  /** Overrides the media from the post */
  media?: MediaItem[] | null;
  /** Instagram post placement */
  placement?: "reels" | "stories" | "timeline" | null;
  /** Instagram usernames to be tagged as a collaborator */
  collaborators?: string[] | null;
  /** If false video posts will only be shown in the Reels tab */
  share_to_feed?: boolean | null;
  /** Page id with a location that you want to tag the image or video with */
  location?: string | null;
  /** Instagram trial reel type */
  trial_reel_type?: "manual" | "performance" | null;
}

// https://api.postforme.dev/docs#model/tiktokconfigurationdto
export interface TiktokConfigurationDto {
  /** Overrides the caption from the post */
  caption?: object | null;
  /** Overrides the media from the post */
  media?: MediaItem[] | null;
  /** Overrides the title from the post */
  title?: string | null;
  /** Sets the privacy status for TikTok (private, public) */
  privacy_status?: string | null;
  /** Allow comments on TikTok */
  allow_comment?: boolean | null;
  /** Allow duets on TikTok */
  allow_duet?: boolean | null;
  /** Allow stitch on TikTok */
  allow_stitch?: boolean | null;
  /** Disclose your brand on TikTok */
  disclose_your_brand?: boolean | null;
  /** Disclose branded content on TikTok */
  disclose_branded_content?: boolean | null;
  /** Flag content as AI generated on TikTok */
  is_ai_generated?: boolean | null;
  /** Will create a draft upload to TikTok */
  is_draft?: boolean | null;
  /** Will automatically add music to photo posts */
  auto_add_music?: boolean | null;
}

// https://api.postforme.dev/docs#model/twitterconfigurationdto
export interface TwitterConfigurationDto {
  /** Overrides the caption from the post */
  caption?: object | null;
  /** Overrides the media from the post */
  media?: MediaItem[] | null;
  /** Poll options for the tweet */
  poll?: TwitterPollDto;
  /** Id of the community to post to */
  community_id?: string;
  /** Id of the tweet you want to quote */
  quote_tweet_id?: string;
  /** Who can reply to the tweet */
  reply_settings?: "following" | "mentionedUsers" | "subscribers" | "verified" | null;
}

// https://api.postforme.dev/docs#model/youtubeconfigurationdto
export interface YoutubeConfigurationDto {
  /** Overrides the caption from the post */
  caption?: object | null;
  /** Overrides the media from the post */
  media?: MediaItem[] | null;
  /** Overrides the title from the post */
  title?: string | null;
  /** Sets the privacy status of the video */
  privacy_status?: "public" | "private" | "unlisted" | null;
  /** If true will notify YouTube the video is intended for kids */
  made_for_kids?: boolean | null;
}

// https://api.postforme.dev/docs#model/facebookconfigurationdto
export interface FacebookConfigurationDto {
  /** Overrides the caption from the post */
  caption?: object | null;
  /** Overrides the media from the post */
  media?: MediaItem[] | null;
  /** Facebook post placement */
  placement?: "reels" | "stories" | "timeline" | null;
  /** Page id with a location that you want to tag the image or video with */
  location?: string | null;
  /** List of page ids to invite as collaborators for a Video Reel */
  collaborators?: string[][] | null;
}

// https://api.postforme.dev/docs#model/linkedinconfigurationdto
export interface LinkedinConfigurationDto {
  /** Overrides the caption from the post */
  caption?: object | null;
  /** Overrides the media from the post */
  media?: MediaItem[] | null;
}

// https://api.postforme.dev/docs#model/blueskyconfigurationdto
export interface BlueskyConfigurationDto {
  /** Overrides the caption from the post */
  caption?: object | null;
  /** Overrides the media from the post */
  media?: MediaItem[] | null;
}

// https://api.postforme.dev/docs#model/threadsconfigurationdto
export interface ThreadsConfigurationDto {
  /** Overrides the caption from the post */
  caption?: object | null;
  /** Overrides the media from the post */
  media?: MediaItem[] | null;
  /** Threads post placement */
  placement?: "reels" | "timeline" | null;
}

// https://api.postforme.dev/docs#model/platformconfigurationsdto
export interface PlatformConfigurationsDto {
  /** Pinterest configuration */
  pinterest?: PinterestConfigurationDto | null;
  /** Instagram configuration */
  instagram?: InstagramConfigurationDto | null;
  /** TikTok configuration */
  tiktok?: TiktokConfigurationDto | null;
  /** Twitter configuration */
  x?: TwitterConfigurationDto | null;
  /** YouTube configuration */
  youtube?: YoutubeConfigurationDto | null;
  /** Facebook configuration */
  facebook?: FacebookConfigurationDto | null;
  /** LinkedIn configuration */
  linkedin?: LinkedinConfigurationDto | null;
  /** Bluesky configuration */
  bluesky?: BlueskyConfigurationDto | null;
  /** Threads configuration */
  threads?: ThreadsConfigurationDto | null;
  /** TikTok Business configuration */
  tiktok_business?: TiktokConfigurationDto | null;
}

// Legacy AccountConfig - kept for backward compatibility
// Use AccountConfigurationDto for new code
export interface AccountConfig {
  social_account_id: string;
  configuration: {
    caption?: object | null;
    media?: MediaItem[] | null;
    poll?: TwitterPollDto;
    // Pinterest
    board_ids?: string[];
    link?: string;
    // Instagram/Facebook/TikTok/YouTube/Threads
    placement?: "reels" | "stories" | "timeline";
    // YouTube/TikTok
    title?: string;
    privacy_status?: "public" | "private" | "unlisted";
    made_for_kids?: boolean;
    // TikTok
    allow_comment?: boolean;
    allow_duet?: boolean;
    allow_stitch?: boolean;
    disclose_your_brand?: boolean;
    disclose_branded_content?: boolean;
    is_draft?: boolean;
    is_ai_generated?: boolean;
    auto_add_music?: boolean;
    // X (Twitter)
    community_id?: string;
    quote_tweet_id?: string;
    reply_settings?:
      | "following"
      | "mentionedUsers"
      | "subscribers"
      | "verified";
    // Instagram/Facebook
    location?: string;
    collaborators?: string[][] | null;
    share_to_feed?: boolean;
    trial_reel_type?: "manual" | "performance";
  };
}

// https://api.postforme.dev/docs#model/accountconfigurationdetailsdto
export interface AccountConfigurationDetailsDto {
  /** Overrides the caption from the post */
  caption?: object | null;
  /** Overrides the media from the post */
  media?: MediaItem[] | null;
  /** Pinterest board IDs */
  board_ids?: string[] | null;
  /** Pinterest post link */
  link?: string | null;
  /** Post placement for Facebook/Instagram/Threads */
  placement?: "reels" | "stories" | "timeline" | null;
  /** Overrides the title from the post */
  title?: string | null;
  /** Sets the privacy status for TikTok or YouTube */
  privacy_status?: "public" | "private" | "unlisted" | null;
  /** If true will notify YouTube the video is intended for kids */
  made_for_kids?: boolean | null;
  /** Allow comments on TikTok */
  allow_comment?: boolean | null;
  /** Allow duets on TikTok */
  allow_duet?: boolean | null;
  /** Allow stitch on TikTok */
  allow_stitch?: boolean | null;
  /** Disclose your brand on TikTok */
  disclose_your_brand?: boolean | null;
  /** Disclose branded content on TikTok */
  disclose_branded_content?: boolean | null;
  /** Will create a draft upload to TikTok */
  is_draft?: boolean | null;
  /** Flag content as AI generated on TikTok */
  is_ai_generated?: boolean | null;
  /** Will automatically add music to photo posts on TikTok */
  auto_add_music?: boolean | null;
  /** Poll options for the twitter */
  poll?: TwitterPollDto;
  /** Id of the twitter community to post to */
  community_id?: string;
  /** Id of the tweet you want to quote */
  quote_tweet_id?: string;
  /** Who can reply to the tweet */
  reply_settings?: "following" | "mentionedUsers" | "subscribers" | "verified" | null;
  /** Page id with a location that you want to tag the image or video with */
  location?: string | null;
  /** List of page ids or users to invite as collaborators */
  collaborators?: string[][] | null;
  /** If false Instagram video posts will only be shown in the Reels tab */
  share_to_feed?: boolean | null;
  /** Instagram trial reel type */
  trial_reel_type?: "manual" | "performance" | null;
}

// https://api.postforme.dev/docs#model/accountconfigurationdto
export interface AccountConfigurationDto {
  /** ID of the social account you want to apply the configuration to */
  social_account_id: string;
  /** Configuration for the social account */
  configuration: AccountConfigurationDetailsDto;
}

// Request body for creating a post
// https://api.postforme.dev/docs#model/createsocialpostdto
export interface CreateSocialPostDto {
  caption: string;
  social_accounts: string[];
  media?: MediaItem[];
  scheduled_at?: string;
  /** If true, post will not be processed (draft mode) */
  isDraft?: boolean;
  platform_configurations?: PlatformConfigurationsDto | null;
  account_configurations?: AccountConfigurationDto[] | null;
  external_id?: string;
}

// Request body for updating a post
// https://api.postforme.dev/docs#model/updatesocialpostdto
export interface UpdateSocialPostDto {
  caption?: string;
  social_accounts?: string[];
  media?: MediaItem[];
  scheduled_at?: string;
  /** If true, post will not be processed (draft mode) */
  isDraft?: boolean;
  platform_configurations?: PlatformConfigurationsDto | null;
  account_configurations?: AccountConfigurationDto[] | null;
}

export interface SocialPostListResponse {
  data: SocialPost[];
  meta: {
    total: number;
    offset: number;
    limit: number;
    next?: string;
  };
}

// ==================== SOCIAL ACCOUNTS ====================

// Forward declaration - defined at end of file with provider data types
export type SocialAccountMetadata = SocialAccountProviderData;

export interface SocialAccount {
  id: string;
  user_id: string;
  platform: string;
  username: string | null;
  external_id: string | null;
  status: "connected" | "disconnected";
  access_token: string;
  access_token_expires_at: string;
  refresh_token: string | null;
  refresh_token_expires_at: string | null;
  profile_photo_url: string | null;
  /** The metadata of the social account - contains provider-specific data */
  metadata?: SocialAccountMetadata;
  created_at: string;
  updated_at: string; // API requires this field
}

// https://api.postforme.dev/docs#model/socialaccountdto
/** SocialAccountDto - Official Post For Me API type alias */
export type SocialAccountDto = SocialAccount;

// Request body for creating/updating account
// https://api.postforme.dev/docs#model/createsocialaccountdto
export interface CreateSocialAccountDto {
  platform: string;
  user_id: string;
  access_token: string;
  access_token_expires_at: string;
  external_id?: string | null;
  username?: string | null;
  refresh_token?: string | null;
  refresh_token_expires_at?: string | null;
  /** The metadata of the social account */
  metadata?: SocialAccountMetadata;
}

// Request body for updating account
// https://api.postforme.dev/docs#model/updatesocialaccountdto
export interface UpdateSocialAccountDto {
  external_id?: string;
  username?: string;
}

// Auth URL Provider Data Types
// https://api.postforme.dev/docs#model/blueskyauthurlproviderdata
export interface BlueskyAuthUrlProviderData {
  /** The handle of the account */
  handle: string;
  /** The app password of the account */
  app_password: string;
}

// https://api.postforme.dev/docs#model/linkedinurlproviderdata
export interface LinkedInUrlProviderData {
  /** The type of connection */
  connection_type?: "personal" | "organization";
  /** Override the default permissions/scopes requested during OAuth */
  permission_overrides?: string[][];
}

// https://api.postforme.dev/docs#model/instagramproviderdata (for AuthUrl)
export interface InstagramAuthUrlProviderData {
  /** The type of connection */
  connection_type?: "instagram" | "facebook";
  /** Override the default permissions/scopes requested during OAuth */
  permission_overrides?: string[][];
}

// https://api.postforme.dev/docs#model/facebookproviderdata (for AuthUrl)
export interface FacebookAuthUrlProviderData {
  /** Override the default permissions/scopes requested during OAuth */
  permission_overrides?: string[][];
}

// https://api.postforme.dev/docs#model/tiktokproviderdata (for AuthUrl)
export interface TikTokAuthUrlProviderData {
  /** Override the default permissions/scopes requested during OAuth */
  permission_overrides?: string[][];
}

// https://api.postforme.dev/docs#model/tiktokbusinessproviderdata (for AuthUrl)
export interface TikTokBusinessAuthUrlProviderData {
  /** Override the default permissions/scopes requested during OAuth */
  permission_overrides?: string[][];
}

// https://api.postforme.dev/docs#model/youtubeproviderdata (for AuthUrl)
export interface YouTubeAuthUrlProviderData {
  /** Override the default permissions/scopes requested during OAuth */
  permission_overrides?: string[][];
}

// https://api.postforme.dev/docs#model/pinterestproviderdata (for AuthUrl)
export interface PinterestAuthUrlProviderData {
  /** Override the default permissions/scopes requested during OAuth */
  permission_overrides?: string[][];
}

// https://api.postforme.dev/docs#model/threadsproviderdata (for AuthUrl)
export interface ThreadsAuthUrlProviderData {
  /** Override the default permissions/scopes requested during OAuth */
  permission_overrides?: string[][];
}

// https://api.postforme.dev/docs#model/authurlproviderdata
export interface AuthUrlProviderData {
  /** Additional data needed for connecting bluesky accounts */
  bluesky?: BlueskyAuthUrlProviderData;
  /** Additional data for connecting linkedin accounts */
  linkedin?: LinkedInUrlProviderData;
  /** Additional data for connecting instagram accounts */
  instagram?: InstagramAuthUrlProviderData;
  /** Additional data for connecting facebook accounts */
  facebook?: FacebookAuthUrlProviderData;
  /** Additional data for connecting TikTok accounts */
  tiktok?: TikTokAuthUrlProviderData;
  /** Additional data for connecting TikTok Business accounts */
  tiktok_business?: TikTokBusinessAuthUrlProviderData;
  /** Additional data for connecting YouTube accounts */
  youtube?: YouTubeAuthUrlProviderData;
  /** Additional data for connecting Pinterest accounts */
  pinterest?: PinterestAuthUrlProviderData;
  /** Additional data for connecting Threads accounts */
  threads?: ThreadsAuthUrlProviderData;
}

// Request body for OAuth URL - CreateSocialAccountProviderAuthUrlDto
// https://api.postforme.dev/docs#model/createsocialaccountproviderauthurldto
export interface CreateAuthUrlDto {
  /** Platform to connect (facebook, instagram, tiktok, tiktok_business, x, youtube, linkedin, pinterest, threads, bluesky) */
  platform: string;
  /** Additional data needed for the provider (required for bluesky) */
  platform_data?: AuthUrlProviderData;
  /** External account ID (optional, for reconnection) */
  external_id?: string;
  /** Permissions to request: ["posts", "feeds"] */
  permissions?: ("posts" | "feeds")[];
  /** Standard redirect URL - user returns here after OAuth */
  redirect_url?: string;
  /**
   * Override redirect for white-label OAuth interception.
   * Your domain must be registered with the social platform.
   */
  redirect_url_override?: string;
}

// https://api.postforme.dev/docs#model/createsocialaccountproviderauthurldto
/** CreateSocialAccountProviderAuthUrlDto - Official Post For Me API type alias */
export type CreateSocialAccountProviderAuthUrlDto = CreateAuthUrlDto;

/** SocialAccountProviderAuthUrlDto - Official Post For Me API type
 * https://api.postforme.dev/docs#model/socialaccountproviderauthurldto
 */
export interface SocialAccountProviderAuthUrlDto {
  /** The url to redirect the user to, in order to connect their account */
  url: string;
  /** The social account provider */
  platform: string;
}

/** Alias for SocialAccountProviderAuthUrlDto */
export type AuthUrlResponse = SocialAccountProviderAuthUrlDto;

export interface SocialAccountListResponse {
  data: SocialAccount[];
  meta: {
    total: number;
    offset: number;
    limit: number;
    next?: string;
  };
}

// ==================== MEDIA ====================

export interface CreateUploadUrlDto {
  filename: string;
  content_type: string;
  size?: number;
}

export interface CreateUploadUrlResponse {
  upload_url: string; // Signed URL for uploading
  media_url: string; // Public URL after upload
}

// https://api.postforme.dev/docs#model/createuploadurlresponsedto
/** CreateUploadUrlResponseDto - Official Post For Me API type alias */
export type CreateUploadUrlResponseDto = CreateUploadUrlResponse;

// ==================== SOCIAL POST RESULTS ====================

/**
 * Platform-specific data returned by Post For Me API
 * https://www.postforme.dev/resources/getting-post-results
 */
export interface SocialPostResultPlatformData {
  /** Platform-specific ID (e.g., Facebook post ID) - can be null if not available */
  id: string;
  /** URL of the posted content on the platform - can be null if not available */
  url: string;
}

/** Post error object returned by API when post fails
 * https://api.postforme.dev/docs#model/socialpostresultdto
 */
export interface PostError {
  message?: string;
  code?: string;
  [key: string]: unknown;
}

/** Post details object returned by API for debugging
 * https://api.postforme.dev/docs#model/socialpostresultdto
 */
export interface PostDetails {
  logs?: string[];
  [key: string]: unknown;
}

/**
 * Social Post Result - Per-platform posting outcome
 * Retrieved via GET /v1/social-post-results?post_id={id}
 *
 * Note: API structure details:
 * - platform_data contains the platform_post_id (as id) and platform_post_url (as url)
 * - error is PostError type (can be string or object depending on platform)
 * - details contains detailed logs for debugging
 */
export interface SocialPostResult {
  /** Unique identifier of the post result */
  id: string;
  /** The ID of the associated post */
  post_id: string;
  /** The ID of the associated social account */
  social_account_id: string;
  /** Indicates if the post was successful */
  success: boolean;
  /** Error message/object if the post failed - API returns object | null */
  error: PostError | null;
  /** Detailed logs from the post for debugging - API returns object | null */
  details: PostDetails | null;
  /** Platform-specific data (contains id and url of the posted content) - API returns this (can be null) */
  platform_data: SocialPostResultPlatformData;
}

// https://api.postforme.dev/docs#model/socialpostresultdto
/** SocialPostResultDto - Official Post For Me API type alias */
export type SocialPostResultDto = SocialPostResult;

export interface SocialPostResultListResponse {
  data: SocialPostResult[];
  meta: {
    total: number;
    offset: number;
    limit: number;
    next?: string;
  };
}

// ==================== SOCIAL ACCOUNT FEEDS ====================

// Video view retention data point
export interface VideoViewRetentionPoint {
  percentage: number;
  second: string;
}

// Impression source breakdown
export interface ImpressionSource {
  percentage: number;
  impression_source: string;
}

// Audience type breakdown
export interface AudienceType {
  percentage: number;
  type: string;
}

// Audience gender breakdown
export interface AudienceGender {
  percentage: number;
  gender: string;
}

// Audience country breakdown
export interface AudienceCountry {
  percentage: number;
  country: string;
}

// Audience city breakdown
export interface AudienceCity {
  percentage: number;
  city_name: string;
}

// Demographic key-value (for video view time by age/gender/region/country)
export interface DemographicKeyValue {
  key: string;
  value: number;
}

// Video retention graph point
export interface VideoRetentionGraphPoint {
  time: number;
  rate: number;
}

// Activity by action type
export interface ActivityByActionType {
  action_type: string;
  value: number;
}

// TikTok/TikTok Business metrics format
export interface TikTokMetrics {
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
}

// TikTok Business metrics format (extends basic TikTok with more fields)
export interface TikTokBusinessMetrics {
  likes: number;
  comments: number;
  shares: number;
  favorites: number;
  reach: number;
  video_views: number;
  total_time_watched: number;
  average_time_watched: number;
  full_video_watched_rate: number;
  new_followers: number;
  profile_views: number;
  website_clicks: number;
  phone_number_clicks: number;
  lead_submissions: number;
  app_download_clicks: number;
  email_clicks: number;
  address_clicks: number;
  video_view_retention: VideoViewRetentionPoint[];
  impression_sources: ImpressionSource[];
  audience_types: AudienceType[];
  audience_genders: AudienceGender[];
  audience_countries: AudienceCountry[];
  audience_cities: AudienceCity[];
  engagement_likes: VideoViewRetentionPoint[];
}

// Instagram metrics format
export interface InstagramMetrics {
  likes: number;
  comments: number;
  views: number;
  reach: number;
  saved: number;
  shares: number;
  replies?: number;
  follows?: number;
  ig_reels_avg_watch_time?: number;
  ig_reels_video_view_total_time?: number;
  navigation?: number;
  profile_activity?: number;
  profile_visits?: number;
  total_interactions?: number;
}

// YouTube metrics format
export interface YouTubeMetrics {
  views: number;
  likes: number;
  comments: number;
  dislikes: number;
  engagedViews?: number;
  redViews?: number;
  videosAddedToPlaylists?: number;
  videosRemovedFromPlaylists?: number;
  shares?: number;
  estimatedMinutesWatched?: number;
  estimatedRedMinutesWatched?: number;
  averageViewDuration?: number;
  averageViewPercentage?: number;
  annotationClickThroughRate?: number;
  annotationCloseRate?: number;
  annotationImpressions?: number;
  annotationClickableImpressions?: number;
  annotationClosableImpressions?: number;
  annotationClicks?: number;
  annotationCloses?: number;
  cardClickRate?: number;
  cardTeaserClickRate?: number;
  cardImpressions?: number;
  cardTeaserImpressions?: number;
  cardClicks?: number;
  cardTeaserClicks?: number;
  subscribersGained?: number;
  subscribersLost?: number;
}

// Facebook metrics format
export interface FacebookMetrics {
  reach: number;
  viral_reach?: number;
  paid_reach?: number;
  fan_reach?: number;
  organic_reach?: number;
  nonviral_reach?: number;
  media_views?: number;
  reactions_total?: number;
  reactions_like?: number;
  reactions_love?: number;
  reactions_wow?: number;
  reactions_haha?: number;
  reactions_sorry?: number;
  reactions_anger?: number;
  reactions_by_type?: Record<string, number>;
  video_views?: number;
  video_views_unique?: number;
  video_views_organic?: number;
  video_views_organic_unique?: number;
  video_views_paid?: number;
  video_views_paid_unique?: number;
  video_views_autoplayed?: number;
  video_views_clicked_to_play?: number;
  video_views_15s?: number;
  video_views_60s?: number;
  video_views_sound_on?: number;
  video_complete_views_organic?: number;
  video_complete_views_organic_unique?: number;
  video_complete_views_paid?: number;
  video_complete_views_paid_unique?: number;
  video_view_time?: number;
  video_view_time_organic?: number;
  video_avg_time_watched?: number;
  video_length?: number;
  video_view_time_by_age_gender?: DemographicKeyValue[];
  video_view_time_by_region?: DemographicKeyValue[];
  video_view_time_by_country?: DemographicKeyValue[];
  video_views_by_distribution_type?: Record<string, number>;
  video_view_time_by_distribution_type?: Record<string, number>;
  video_retention_graph_clicked_to_play?: VideoRetentionGraphPoint[];
  video_retention_graph_autoplayed?: VideoRetentionGraphPoint[];
  video_social_actions_unique?: number;
  activity_by_action_type?: ActivityByActionType[];
  activity_by_action_type_unique?: ActivityByActionType[];
  comments?: number;
  shares?: number;
}

// X (Twitter) public metrics
export interface XPublicMetrics {
  retweet_count: number;
  reply_count: number;
  like_count: number;
  quote_count: number;
  impression_count: number;
  bookmark_count: number;
}

// X (Twitter) organic metrics
export interface XOrganicMetrics {
  impression_count: number;
  like_count: number;
  reply_count: number;
  retweet_count: number;
  url_link_clicks: number;
  user_profile_clicks: number;
}

// X (Twitter) non-public metrics
export interface XNonPublicMetrics {
  impression_count: number;
  url_link_clicks: number;
  user_profile_clicks: number;
}

// X (Twitter) metrics format
export interface XMetrics {
  public_metrics: XPublicMetrics;
  organic_metrics?: XOrganicMetrics;
  non_public_metrics?: XNonPublicMetrics;
}

// Bluesky metrics format
export interface BlueskyMetrics {
  replyCount: number;
  likeCount: number;
  repostCount: number;
  quoteCount: number;
}

// Threads metrics format
export interface ThreadsMetrics {
  likes: number;
  replies: number;
  shares: number;
  views: number;
  quotes: number;
  reposts: number;
}

// Pinterest metric value object (for user_follow, profile_visit)
export interface PinterestMetricValue {
  value?: number;
  [key: string]: unknown;
}

// Pinterest 90-day metrics
export interface Pinterest90dMetrics {
  impression: number;
  outbound_click: number;
  pin_click: number;
  save: number;
  comment: number;
  reaction: number;
  user_follow: PinterestMetricValue | null;
  profile_visit: PinterestMetricValue | null;
  video_views?: number;
  video_10s_views?: number;
  video_p95_views?: number;
  video_total_time?: number;
  video_average_time?: number;
  last_updated?: string;
}

// Pinterest lifetime metrics
export interface PinterestLifetimeMetrics {
  impression: number;
  outbound_click: number;
  pin_click: number;
  save: number;
  comment: number;
  reaction: number;
  user_follow: PinterestMetricValue | null;
  profile_visit: PinterestMetricValue | null;
  video_views?: number;
  video_10s_views?: number;
  video_p95_views?: number;
  video_total_time?: number;
  video_average_time?: number;
  last_updated?: string;
}

// Pinterest metrics format
export interface PinterestMetrics {
  "90d": Pinterest90dMetrics;
  lifetime_metrics: PinterestLifetimeMetrics;
}

// LinkedIn metrics format (verified via MCP - matches LinkedInPostMetricsDto)
export interface LinkedInMetrics {
  clickCount: number;
  commentCount: number;
  engagement: number;
  impressionCount: number;
  likeCount: number;
  shareCount: number;
  videoView: number;
  viewer: number;
  timeWatched: number;
  timeWatchedForVideoViews: number;
}

// Union type for all platform metrics
export type SocialAccountFeedItemMetrics =
  | LinkedInMetrics
  | TikTokMetrics
  | TikTokBusinessMetrics
  | InstagramMetrics
  | YouTubeMetrics
  | FacebookMetrics
  | XMetrics
  | BlueskyMetrics
  | ThreadsMetrics
  | PinterestMetrics
  | BlueskyMetrics;

// https://api.postforme.dev/docs#model/platformpostdto
/** PlatformPostDto - Official Post For Me API type
 * Represents a post from a social platform feed
 */
export interface PlatformPostDto {
  /** Social media platform name */
  platform: string;
  /** ID of the social post result */
  social_post_result_id: string | null;
  /** Date the post was published */
  posted_at: string;
  /** ID of the social post */
  social_post_id: string | null;
  /** External post ID from the platform */
  external_post_id: string | null;
  /** Platform-specific post ID */
  platform_post_id: string;
  /** ID of the social account */
  social_account_id: string;
  /** External account ID from the platform */
  external_account_id: string | null;
  /** Platform-specific account ID */
  platform_account_id: string;
  /** URL to the post on the platform */
  platform_url: string;
  /** Caption or text content of the post */
  caption: string;
  /** Array of media items attached to the post */
  media: SocialPostMediaDto[];
  /** Post metrics and analytics data */
  metrics?:
    | TikTokBusinessMetrics
    | TikTokMetrics
    | InstagramMetrics
    | YouTubeMetrics
    | FacebookMetrics
    | XMetrics
    | ThreadsMetrics
    | LinkedInMetrics
    | PinterestMetrics
    | BlueskyMetrics;
}

export interface SocialAccountFeedItem {
  platform_post_id: string;
  platform_account_id: string;
  social_account_id: string;
  caption: string;
  /** Array of media items - uses SocialPostMediaDto format */
  media: SocialPostMediaDto[];
  platform: string;
  platform_url: string;
  posted_at?: string;
  social_post_id?: string | null;
  social_post_result_id?: string | null;
  external_post_id?: string | null;
  external_account_id?: string | null;
  metrics?: SocialAccountFeedItemMetrics;
}

export interface SocialAccountFeedResponse {
  data: SocialAccountFeedItem[];
  meta: {
    limit: number;
    cursor: string;
    next: string | null;
    has_more?: boolean;
  };
}

// ==================== METRICS DTOs (from OpenAPI spec) ====================

// https://api.postforme.dev/docs#model/tiktokpostmetricsdto
export interface TikTokPostMetricsDto {
  /** Number of likes on the video */
  like_count: number;
  /** Number of comments on the video */
  comment_count: number;
  /** Number of shares of the video */
  share_count: number;
  /** Number of views on the video */
  view_count: number;
}

// https://api.postforme.dev/docs#model/tiktokbusinessvideometricpercentagedto
export interface TikTokBusinessVideoMetricPercentageDto {
  /** Percentage value for the metric */
  percentage: number;
  /** Time in seconds for the metric */
  second: string;
}

// https://api.postforme.dev/docs#model/tiktokbusinesspostimpressionsourcedto
export interface TikTokBusinessPostImpressionSourceDto {
  /** Percentage of impressions from this source */
  percentage: number;
  /** Name of the impression source */
  impression_source: string;
}

// https://api.postforme.dev/docs#model/tiktokbusinesspostaudiencetypedto
export interface TikTokBusinessPostAudienceTypeDto {
  /** Percentage of audience of this type */
  percentage: number;
  /** Type of audience */
  type: string;
}

// https://api.postforme.dev/docs#model/tiktokbusinesspostaudiencegenderdto
export interface TikTokBusinessPostAudienceGenderDto {
  /** Percentage of audience of this gender */
  percentage: number;
  /** Gender category */
  gender: string;
}

// https://api.postforme.dev/docs#model/tiktokbusinesspostaudiencecountrydto
export interface TikTokBusinessPostAudienceCountryDto {
  /** Percentage of audience from this country */
  percentage: number;
  /** Country name */
  country: string;
}

// https://api.postforme.dev/docs#model/tiktokbusinesspostaudiencecitydto
export interface TikTokBusinessPostAudienceCityDto {
  /** Percentage of audience from this city */
  percentage: number;
  /** City name */
  city_name: string;
}

// https://api.postforme.dev/docs#model/tiktokbusinessmetricsdto
export interface TikTokBusinessMetricsDto {
  /** Number of likes on the post */
  likes: number;
  /** Number of comments on the post */
  comments: number;
  /** Number of shares on the post */
  shares: number;
  /** Number of favorites on the post */
  favorites: number;
  /** Total reach of the post */
  reach: number;
  /** Total number of video views */
  video_views: number;
  /** Total time watched in seconds */
  total_time_watched: number;
  /** Average time watched in seconds */
  average_time_watched: number;
  /** Rate of full video watches as a percentage */
  full_video_watched_rate: number;
  /** Number of new followers gained from the post */
  new_followers: number;
  /** Number of profile views generated */
  profile_views: number;
  /** Number of website clicks */
  website_clicks: number;
  /** Number of phone number clicks */
  phone_number_clicks: number;
  /** Number of lead submissions */
  lead_submissions: number;
  /** Number of app download clicks */
  app_download_clicks: number;
  /** Number of email clicks */
  email_clicks: number;
  /** Number of address clicks */
  address_clicks: number;
  /** Video view retention data by percentage and time */
  video_view_retention: TikTokBusinessVideoMetricPercentageDto[];
  /** Impression sources breakdown */
  impression_sources: TikTokBusinessPostImpressionSourceDto[];
  /** Audience types breakdown */
  audience_types: TikTokBusinessPostAudienceTypeDto[];
  /** Audience genders breakdown */
  audience_genders: TikTokBusinessPostAudienceGenderDto[];
  /** Audience countries breakdown */
  audience_countries: TikTokBusinessPostAudienceCountryDto[];
  /** Audience cities breakdown */
  audience_cities: TikTokBusinessPostAudienceCityDto[];
  /** Engagement likes data by percentage and time */
  engagement_likes: TikTokBusinessVideoMetricPercentageDto[];
}

// https://api.postforme.dev/docs#model/instagrampostmetricsdto
export interface InstagramPostMetricsDto {
  /** Number of likes on the post */
  likes?: number;
  /** Number of comments on the post */
  comments?: number;
  /** Number of views on the post */
  views?: number;
  /** Total number of unique accounts that have seen the media */
  reach?: number;
  /** Total number of unique accounts that have saved the media */
  saved?: number;
  /** Total number of shares of the media */
  shares?: number;
  /** Number of replies to the story (story media only) */
  replies?: number;
  /** Number of new follows from this post */
  follows?: number;
  /** Average watch time for Reels (in milliseconds) */
  ig_reels_avg_watch_time?: number;
  /** Total watch time for Reels (in milliseconds) */
  ig_reels_video_view_total_time?: number;
  /** Navigation actions taken on the media */
  navigation?: number;
  /** Profile activity generated from this post */
  profile_activity?: number;
  /** Number of profile visits from this post */
  profile_visits?: number;
  /** Total interactions on the post */
  total_interactions?: number;
}

// https://api.postforme.dev/docs#model/youtubepostmetricsdto
export interface YouTubePostMetricsDto {
  /** Number of views on the video */
  views: number;
  /** Number of likes on the video */
  likes: number;
  /** Number of comments on the video */
  comments: number;
  /** Number of dislikes on the video */
  dislikes: number;
  /** Number of engaged views */
  engagedViews?: number;
  /** Number of views from YouTube Premium (Red) members */
  redViews?: number;
  /** Number of times the video was added to playlists */
  videosAddedToPlaylists?: number;
  /** Number of times the video was removed from playlists */
  videosRemovedFromPlaylists?: number;
  /** Number of shares */
  shares?: number;
  /** Estimated minutes watched */
  estimatedMinutesWatched?: number;
  /** Estimated minutes watched by YouTube Premium (Red) members */
  estimatedRedMinutesWatched?: number;
  /** Average view duration in seconds */
  averageViewDuration?: number;
  /** Average percentage of the video watched */
  averageViewPercentage?: number;
  /** Annotation click-through rate */
  annotationClickThroughRate?: number;
  /** Annotation close rate */
  annotationCloseRate?: number;
  /** Number of annotation impressions */
  annotationImpressions?: number;
  /** Number of clickable annotation impressions */
  annotationClickableImpressions?: number;
  /** Number of closable annotation impressions */
  annotationClosableImpressions?: number;
  /** Number of annotation clicks */
  annotationClicks?: number;
  /** Number of annotation closes */
  annotationCloses?: number;
  /** Card click-through rate */
  cardClickRate?: number;
  /** Card teaser click-through rate */
  cardTeaserClickRate?: number;
  /** Number of card impressions */
  cardImpressions?: number;
  /** Number of card teaser impressions */
  cardTeaserImpressions?: number;
  /** Number of card clicks */
  cardClicks?: number;
  /** Number of card teaser clicks */
  cardTeaserClicks?: number;
  /** Subscribers gained */
  subscribersGained?: number;
  /** Subscribers lost */
  subscribersLost?: number;
}

// https://api.postforme.dev/docs#model/facebookvideoviewtimebydemographicdto
export interface FacebookVideoViewTimeByDemographicDto {
  /** Demographic key (e.g., age_gender, region, country) */
  key: string;
  /** Total view time in milliseconds */
  value: number;
}

// https://api.postforme.dev/docs#model/facebookvideoretentiongraphdto
export interface FacebookVideoRetentionGraphDto {
  /** Time in seconds */
  time: number;
  /** Percentage of viewers at this time */
  rate: number;
}

// https://api.postforme.dev/docs#model/facebookactivitybyactiontypedto
export interface FacebookActivityByActionTypeDto {
  /** Action type (e.g., like, comment, share) */
  action_type: string;
  /** Number of actions */
  value: number;
}

// https://api.postforme.dev/docs#model/facebookpostmetricsdto
export interface FacebookPostMetricsDto {
  /** Total number of unique people who saw the post */
  reach?: number;
  /** Number of people who saw the post in News Feed via viral reach */
  viral_reach?: number;
  /** Number of people who saw the post via paid distribution */
  paid_reach?: number;
  /** Number of fans who saw the post */
  fan_reach?: number;
  /** Number of people who saw the post via organic distribution */
  organic_reach?: number;
  /** Number of people who saw the post via non-viral distribution */
  nonviral_reach?: number;
  /** Number of times the photo or video was viewed */
  media_views?: number;
  /** Total number of reactions (all types) */
  reactions_total?: number;
  /** Number of like reactions */
  reactions_like?: number;
  /** Number of love reactions */
  reactions_love?: number;
  /** Number of wow reactions */
  reactions_wow?: number;
  /** Number of haha reactions */
  reactions_haha?: number;
  /** Number of sad reactions */
  reactions_sorry?: number;
  /** Number of anger reactions */
  reactions_anger?: number;
  /** Breakdown of all reaction types */
  reactions_by_type?: object;
  /** Number of times video was viewed for 3+ seconds */
  video_views?: number;
  /** Number of unique people who viewed the video for 3+ seconds */
  video_views_unique?: number;
  /** Number of times video was viewed for 3+ seconds organically */
  video_views_organic?: number;
  /** Number of unique people who viewed the video for 3+ seconds organically */
  video_views_organic_unique?: number;
  /** Number of times video was viewed for 3+ seconds via paid distribution */
  video_views_paid?: number;
  /** Number of unique people who viewed the video for 3+ seconds via paid distribution */
  video_views_paid_unique?: number;
  /** Number of times video was autoplayed for 3+ seconds */
  video_views_autoplayed?: number;
  /** Number of times video was clicked to play for 3+ seconds */
  video_views_clicked_to_play?: number;
  /** Number of times video was viewed for 15+ seconds */
  video_views_15s?: number;
  /** Number of times video was viewed for 60+ seconds */
  video_views_60s?: number;
  /** Number of times video was viewed with sound on */
  video_views_sound_on?: number;
  /** Number of times video was viewed to 95% organically */
  video_complete_views_organic?: number;
  /** Number of unique people who viewed video to 95% organically */
  video_complete_views_organic_unique?: number;
  /** Number of times video was viewed to 95% via paid distribution */
  video_complete_views_paid?: number;
  /** Number of unique people who viewed video to 95% via paid distribution */
  video_complete_views_paid_unique?: number;
  /** Total time video was viewed in milliseconds */
  video_view_time?: number;
  /** Total time video was viewed in milliseconds via organic distribution */
  video_view_time_organic?: number;
  /** Average time video was viewed in milliseconds */
  video_avg_time_watched?: number;
  /** Length of the video in milliseconds */
  video_length?: number;
  /** Video view time breakdown by age and gender */
  video_view_time_by_age_gender?: FacebookVideoViewTimeByDemographicDto[];
  /** Video view time breakdown by region */
  video_view_time_by_region?: FacebookVideoViewTimeByDemographicDto[];
  /** Video view time breakdown by country */
  video_view_time_by_country?: FacebookVideoViewTimeByDemographicDto[];
  /** Video views breakdown by distribution type */
  video_views_by_distribution_type?: object;
  /** Video view time breakdown by distribution type */
  video_view_time_by_distribution_type?: object;
  /** Video retention graph for clicked-to-play views */
  video_retention_graph_clicked_to_play?: FacebookVideoRetentionGraphDto[];
  /** Video retention graph for autoplayed views */
  video_retention_graph_autoplayed?: FacebookVideoRetentionGraphDto[];
  /** Number of unique people who performed social actions on the video */
  video_social_actions_unique?: number;
  /** Total activity breakdown by action type */
  activity_by_action_type?: FacebookActivityByActionTypeDto[];
  /** Unique users activity breakdown by action type */
  activity_by_action_type_unique?: FacebookActivityByActionTypeDto[];
  /** Number of comments (from post object) */
  comments?: number;
  /** Number of shares (from post object) */
  shares?: number;
}

// https://api.postforme.dev/docs#model/twitterpublicmetricsdto
export interface TwitterPublicMetricsDto {
  /** Number of Retweets of this Tweet */
  retweet_count: number;
  /** Number of Replies of this Tweet */
  reply_count: number;
  /** Number of Likes of this Tweet */
  like_count: number;
  /** Number of Quotes of this Tweet */
  quote_count: number;
  /** Number of times this Tweet has been viewed */
  impression_count: number;
  /** Number of times this Tweet has been bookmarked */
  bookmark_count: number;
}

// https://api.postforme.dev/docs#model/twitterorganicmetricsdto
export interface TwitterOrganicMetricsDto {
  /** Number of times this Tweet has been viewed organically */
  impression_count: number;
  /** Number of Likes of this Tweet from organic distribution */
  like_count: number;
  /** Number of Replies of this Tweet from organic distribution */
  reply_count: number;
  /** Number of Retweets of this Tweet from organic distribution */
  retweet_count: number;
  /** Number of clicks on links in this Tweet from organic distribution */
  url_link_clicks: number;
  /** Number of clicks on the author's profile from organic distribution */
  user_profile_clicks: number;
}

// https://api.postforme.dev/docs#model/twitternonpublicmetricsdto
export interface TwitterNonPublicMetricsDto {
  /** Number of times this Tweet has been viewed via promoted distribution */
  impression_count: number;
  /** Number of clicks on links in this Tweet via promoted distribution */
  url_link_clicks: number;
  /** Number of clicks on the author's profile via promoted distribution */
  user_profile_clicks: number;
}

// https://api.postforme.dev/docs#model/twitterpostmetricsdto
export interface TwitterPostMetricsDto {
  /** Publicly available metrics for the Tweet */
  public_metrics?: TwitterPublicMetricsDto;
  /** Organic metrics for the Tweet (available to the Tweet owner) */
  organic_metrics?: TwitterOrganicMetricsDto;
  /** Non-public metrics for the Tweet (available to the Tweet owner or advertisers) */
  non_public_metrics?: TwitterNonPublicMetricsDto;
}

// https://api.postforme.dev/docs#model/threadspostmetricsdto
export interface ThreadsPostMetricsDto {
  /** Number of likes on the post */
  likes: number;
  /** Number of replies on the post */
  replies: number;
  /** Number of shares of the post */
  shares: number;
  /** Number of views on the post */
  views: number;
  /** Number of quotes of the post */
  quotes: number;
  /** Number of reposts of the post */
  reposts: number;
}

// https://api.postforme.dev/docs#model/linkedinpostmetricsdto
export interface LinkedInPostMetricsDto {
  /** Number of clicks */
  clickCount?: number;
  /** Number of comments */
  commentCount?: number;
  /** Engagement rate */
  engagement?: number;
  /** Number of impressions */
  impressionCount?: number;
  /** Number of likes */
  likeCount?: number;
  /** Number of shares */
  shareCount?: number;
  /** Video views with play-pause cycles for at least 3 seconds */
  videoView?: number;
  /** Unique viewers who made engaged plays on the video */
  viewer?: number;
  /** The time the video was watched in milliseconds */
  timeWatched?: number;
  /** The time watched in milliseconds for video play-pause cycles that are at least 3 seconds */
  timeWatchedForVideoViews?: number;
}

// https://api.postforme.dev/docs#model/pinterestmetricswindowdto
export interface PinterestMetricsWindowDto {
  /** Number of times the Pin was shown (impressions) */
  impression: number;
  /** Number of clicks from the Pin to an external destination */
  outbound_click: number;
  /** Number of clicks on the Pin to view it in closeup */
  pin_click: number;
  /** Number of saves of the Pin */
  save: number;
  /** Number of comments on the Pin */
  comment: number;
  /** Total number of reactions on the Pin */
  reaction: number;
  /** Number of follows driven from the Pin */
  user_follow: object | null;
  /** Number of visits to the author's profile driven from the Pin */
  profile_visit: object | null;
  /** Number of video views */
  video_views?: number;
  /** Number of video views of at least 10 seconds */
  video_10s_views?: number;
  /** Number of video views that reached 95% completion */
  video_p95_views?: number;
  /** Total watch time for the video */
  video_total_time?: number;
  /** Average watch time for the video */
  video_average_time?: number;
  /** The last time Pinterest updated these metrics */
  last_updated?: string;
}

// https://api.postforme.dev/docs#model/pinterestpostmetricsdto
export interface PinterestPostMetricsDto {
  /** Last 90 days of Pin metrics */
  "90d": PinterestMetricsWindowDto;
  /** Lifetime Pin metrics */
  lifetime_metrics: PinterestMetricsWindowDto;
}

// https://api.postforme.dev/docs#model/blueskypostmetricsdto
export interface BlueskyPostMetricsDto {
  /** Number of replies on the post */
  replyCount: number;
  /** Number of likes on the post */
  likeCount: number;
  /** Number of reposts of the post */
  repostCount: number;
  /** Number of quotes of the post */
  quoteCount: number;
}

// ==================== SOCIAL POST PREVIEWS ====================

// https://api.postforme.dev/docs#model/socialaccountpreview
export interface SocialPostPreviewAccount {
  /** ID of the social account, ex: spc_12312 */
  id: string;
  /** Platform of the social account */
  platform: string;
  /** Username of the social account */
  username?: string;
}

/** SocialAccountPreview - Official Post For Me API type alias */
export type SocialAccountPreview = SocialPostPreviewAccount;

// https://api.postforme.dev/docs#model/socialpostmediadto
/** SocialPostPreviewMedia - Official Post For Me API SocialPostMediaDto type */
export interface SocialPostPreviewMedia {
  /** Public URL of the media */
  url: string;
  /** Public URL of the thumbnail for the media - API returns object | null */
  thumbnail_url?: object | null;
  /** Timestamp in milliseconds of frame to use as thumbnail - API returns object | null */
  thumbnail_timestamp_ms?: object | null;
  /** List of tags to attach to the media (user/product tags for Facebook/Instagram) */
  tags?: MediaTag[] | null;
  /** If true the media will not be processed at all and instead be posted as is */
  skip_processing?: boolean | null;
}

// Preview username object returned by API
export interface PreviewUsername {
  value?: string;
  [key: string]: unknown;
}

// Preview profile picture URL object returned by API
export interface PreviewProfilePictureUrl {
  url?: string;
  [key: string]: unknown;
}

// Preview configuration object returned by API
export interface PreviewConfiguration {
  [key: string]: unknown;
}

// https://api.postforme.dev/docs#model/socialpostpreviewdto
/** SocialPostPreview - Official Post For Me API SocialPostPreviewDto type */
export interface SocialPostPreview {
  /** Caption text for the post */
  caption: string;
  /** Array of media URLs associated with the post */
  media: SocialPostPreviewMedia[] | null;
  /** Platform of the post */
  platform: string;
  /** Id of the social account */
  social_account_id: string;
  /** Username of the social account - API returns object */
  social_account_username: PreviewUsername;
  /** Url of the social account profile picture - API returns object */
  social_account_profile_picture_url?: PreviewProfilePictureUrl;
  /** Additional configuration for this platform - API returns object */
  configuration?: PreviewConfiguration;
}

// https://api.postforme.dev/docs#model/createsocialpostpreviewdto
/** SocialPostPreviewRequest - Official Post For Me API CreateSocialPostPreviewDto type */
export interface SocialPostPreviewRequest {
  /** Caption text for the post */
  caption: string;
  /** Array of social accounts. Can preview non connected accounts, just specify a random ID */
  preview_social_accounts: SocialPostPreviewAccount[];
  /** Array of media URLs associated with the post */
  media?: SocialPostPreviewMedia[] | null;
  /** Platform-specific configurations for the post */
  platform_configurations?: Record<string, PlatformConfig> | null;
  /** Account-specific configurations for the post */
  account_configurations?: AccountConfig[] | null;
}

export interface SocialPostPreviewResponse {
  data: SocialPostPreview[];
}

// Official Post For Me API DTO aliases
// https://api.postforme.dev/docs#model/socialpostpreviewdto
/** SocialPostPreviewDto - Official Post For Me API type */
export type SocialPostPreviewDto = SocialPostPreview;

// https://api.postforme.dev/docs#model/createsocialpostpreviewdto
/** CreateSocialPostPreviewDto - Official Post For Me API type */
export type CreateSocialPostPreviewDto = SocialPostPreviewRequest;

// https://api.postforme.dev/docs#model/socialpostpreviewresponsedto
/** SocialPostPreviewResponseDto - Official Post For Me API type */
export type SocialPostPreviewResponseDto = SocialPostPreviewResponse;

// ==================== PROVIDER DATA (from SocialAccount.metadata) ====================

/** TikTok Provider Data - Returned in SocialAccount.metadata for TikTok accounts */
export interface TikTokProviderData {
  display_name?: string;
  profile_image?: string;
  follower_count?: number;
  following_count?: number;
  likes_count?: number;
  video_count?: number;
  is_verified?: boolean;
  bio_description?: string;
}

/** TikTok Business Provider Data - Returned in SocialAccount.metadata for TikTok Business accounts */
export interface TikTokBusinessProviderData {
  display_name?: string;
  profile_image?: string;
  follower_count?: number;
  following_count?: number;
  likes_count?: number;
  video_count?: number;
  is_verified?: boolean;
  bio_description?: string;
  /** Business-specific fields */
  business_id?: string;
  advertiser_id?: string;
}

/** Facebook Provider Data - Returned in SocialAccount.metadata for Facebook accounts */
export interface FacebookProviderData {
  name?: string;
  picture?: {
    data?: {
      url?: string;
      height?: number;
      width?: number;
    };
  };
  followers_count?: number;
  fan_count?: number;
  verification_status?: string;
  about?: string;
  category?: string;
  page_token?: string;
}

/** Instagram Provider Data - Returned in SocialAccount.metadata for Instagram accounts */
export interface InstagramProviderData {
  username?: string;
  account_type?: "BUSINESS" | "MEDIA_CREATOR" | "PERSONAL";
  media_count?: number;
  followers_count?: number;
  follows_count?: number;
  profile_picture_url?: string;
  name?: string;
  biography?: string;
  website?: string;
}

/** YouTube Provider Data - Returned in SocialAccount.metadata for YouTube accounts */
export interface YouTubeProviderData {
  title?: string;
  description?: string;
  thumbnail?: string;
  subscriber_count?: number;
  video_count?: number;
  view_count?: number;
  custom_url?: string;
  country?: string;
  published_at?: string;
}

/** X (Twitter) Provider Data - Returned in SocialAccount.metadata for X accounts */
export interface XProviderData {
  name?: string;
  username?: string;
  profile_image_url?: string;
  verified?: boolean;
  verified_type?: "blue" | "business" | "government";
  followers_count?: number;
  following_count?: number;
  tweet_count?: number;
  listed_count?: number;
  description?: string;
  location?: string;
  url?: string;
  created_at?: string;
  protected?: boolean;
}

/** Pinterest Provider Data - Returned in SocialAccount.metadata for Pinterest accounts */
export interface PinterestProviderData {
  username?: string;
  profile_image?: string;
  board_count?: number;
  pin_count?: number;
  follower_count?: number;
  following_count?: number;
  monthly_views?: number;
  bio?: string;
  website_url?: string;
}

/** LinkedIn Provider Data - Returned in SocialAccount.metadata for LinkedIn accounts */
export interface LinkedInProviderData {
  first_name?: string;
  last_name?: string;
  profile_picture?: string;
  headline?: string;
  vanity_name?: string;
  followers_count?: number;
  connections_count?: number;
  location?: string;
  industry?: string;
}

/** Bluesky Provider Data - Returned in SocialAccount.metadata for Bluesky accounts */
export interface BlueskyProviderData {
  display_name?: string;
  avatar?: string;
  description?: string;
  followers_count?: number;
  follows_count?: number;
  posts_count?: number;
  handle?: string;
  indexed_at?: string;
}

/** Threads Provider Data - Returned in SocialAccount.metadata for Threads accounts */
export interface ThreadsProviderData {
  username?: string;
  name?: string;
  profile_picture_url?: string;
  biography?: string;
  followers_count?: number;
  following_count?: number;
  threads_count?: number;
}

/** Union type for all provider data */
export type SocialAccountProviderData =
  | TikTokProviderData
  | TikTokBusinessProviderData
  | FacebookProviderData
  | InstagramProviderData
  | YouTubeProviderData
  | XProviderData
  | PinterestProviderData
  | LinkedInProviderData
  | BlueskyProviderData
  | ThreadsProviderData;

// ==================== RESPONSE DTOs ====================

// https://api.postforme.dev/docs#model/invalidsocialpostdto
/** InvalidSocialPostDto - Official Post For Me API type */
export interface InvalidSocialPostDto {
  /** Errors for the invalid post */
  error: string[];
}

// https://api.postforme.dev/docs#model/deleteentityresponsedto
/** DeleteEntityResponseDto - Official Post For Me API type */
export interface DeleteEntityResponseDto {
  /** Whether or not the entity was deleted */
  success: boolean;
}

// https://api.postforme.dev/docs#model/disconnectedsocialaccountdto
/** DisconnectedSocialAccountDto - Official Post For Me API type
 * Same as SocialAccountDto but status is always "disconnected"
 */
export interface DisconnectedSocialAccountDto {
  /** The unique identifier of the social account */
  id: string;
  /** The platform of the social account */
  platform: string;
  /** The platform's username of the social account */
  username: string | null;
  /** The platform's id of the social account */
  user_id: string;
  /** The platform's profile photo of the social account */
  profile_photo_url: string | null;
  /** The access token of the social account */
  access_token: string;
  /** The refresh token of the social account */
  refresh_token: string | null;
  /** The access token expiration date of the social account */
  access_token_expires_at: string;
  /** The refresh token expiration date of the social account */
  refresh_token_expires_at: string | null;
  /** Status of the account - always "disconnected" for this type */
  status: "disconnected";
  /** The external id of the social account */
  external_id: string | null;
  /** The metadata of the social account */
  metadata?: SocialAccountMetadata;
}

// Error details object
export interface ErrorDetails {
  field?: string;
  reason?: string;
  [key: string]: unknown;
}

// ==================== ERROR RESPONSES ====================

export interface PostForMeError {
  error: string;
  message: string;
  statusCode: number;
  details?: ErrorDetails;
}

// Webhooks (re-export from webhooks.ts for convenience)
export type {
  PostForMeEventType,
  PostForMeWebhook,
  PostForMeWebhookPayload,
  PostForMeWebhookListResponse,
} from "./webhooks";
