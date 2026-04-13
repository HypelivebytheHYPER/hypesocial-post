/**
 * MCP Tool Schemas - Single Source of Truth
 * 
 * All validation schemas defined here and used by:
 * - tools.ts (JSON Schema for MCP clients)
 * - index.ts (Zod for runtime validation)
 */

import { z } from "zod";
import { 
  getMediaConstraintsSummary, 
  getCaptionLimitsSummary,
  MediaPlatformSchema 
} from "./media";

// ============================================================================
// ID Patterns
// Configurable via environment variables, with API-compatible defaults
// ============================================================================

// Read from env or use API-compatible defaults (no hardcoding)
const POST_ID_PREFIX = (typeof process !== 'undefined' && process.env?.POST_ID_PREFIX) || 'sp';
const ACCOUNT_ID_PREFIX = (typeof process !== 'undefined' && process.env?.ACCOUNT_ID_PREFIX) || 'spc';

// Build regex patterns dynamically from env or defaults
const POST_PATTERN_STRING = `^${POST_ID_PREFIX}_[a-zA-Z0-9]+$`;
const ACCOUNT_PATTERN_STRING = `^${ACCOUNT_ID_PREFIX}_[a-zA-Z0-9]+$`;

export const ID_PATTERNS = {
  POST: new RegExp(POST_PATTERN_STRING),
  ACCOUNT: new RegExp(ACCOUNT_PATTERN_STRING),
} as const;

export const ID_EXAMPLES = {
  POST: `${POST_ID_PREFIX}_abc123xyz`,
  ACCOUNT: `${ACCOUNT_ID_PREFIX}_xyz789abc`,
} as const;

// ============================================================================
// Base Schemas
// ============================================================================

export const PostIdSchema = z.string()
  .regex(ID_PATTERNS.POST, `Post ID must match format: ${ID_EXAMPLES.POST}`);

export const AccountIdSchema = z.string()
  .regex(ID_PATTERNS.ACCOUNT, `Account ID must match format: ${ID_EXAMPLES.ACCOUNT}`);

// Re-export platform media constraints
export { 
  PLATFORM_MEDIA_CONSTRAINTS, 
  PLATFORM_CAPTION_LIMITS,
  getPlatformConstraints, 
  getPlatformErrorMessage,
  getMediaConstraintsSummary,
  getCaptionLimits,
  getCaptionLimitsSummary,
} from "./media";

// Legacy media schema (for backwards compatibility)
export const MediaItemSchema = z.object({
  url: z.string().url("Must be a valid publicly accessible URL"),
  type: z.enum(["image", "video"], {
    description: "Type of media file",
  }).optional(),
  mime_type: z.string().optional(),
  size_bytes: z.number().int().positive().optional(),
});

// ============================================================================
// Tool Input Schemas
// ============================================================================

export const ListSocialAccountsSchema = z.object({
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
  platform: z.array(z.string()).optional(),
  status: z.array(z.enum(["connected", "disconnected"])).optional(),
});

export const GetSocialAccountSchema = z.object({
  id: AccountIdSchema,
});

export const DisconnectSocialAccountSchema = z.object({
  id: AccountIdSchema,
});

export const ListPostsSchema = z.object({
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
  status: z.array(z.enum(["draft", "scheduled", "processing", "processed", "failed"])).optional(),
  platform: z.array(z.enum(["bluesky", "facebook", "instagram", "linkedin", "pinterest", "threads", "tiktok", "x", "youtube"])).optional(),
  external_id: z.array(z.string()).optional(),
  social_account_id: z.array(AccountIdSchema).optional(),
});

export const CreatePostSchema = z.object({
  caption: z.string().min(1).describe("Post caption. " + getCaptionLimitsSummary()),
  social_accounts: z.array(AccountIdSchema).min(1),
  media: z.array(MediaItemSchema).optional(),
  scheduled_at: z.string().datetime().optional(),
  external_id: z.string().max(255).optional(),
});

// Schema for getting caption limits
export const GetCaptionLimitsSchema = z.object({
  platform: z.enum(["instagram", "facebook", "tiktok", "twitter", "linkedin", "youtube", "pinterest", "bluesky", "threads"]).optional()
    .describe("Filter by specific platform (optional)"),
  content_type: z.enum(["feed", "reels", "stories", "photos", "videos", "shorts"]).optional()
    .describe("Filter by content type (feed, reels, stories, photos, videos, shorts)"),
});

export const GetPostSchema = z.object({
  id: PostIdSchema,
});

export const GetPostWithAccountsSchema = z.object({
  id: PostIdSchema,
});

export const DeletePostSchema = z.object({
  id: PostIdSchema,
});

export const ListPostResultsSchema = z.object({
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
  post_id: PostIdSchema.optional(),
});

export const SearchPostsSchema = z.object({
  query: z.string().min(1).max(255),
  limit: z.number().min(1).max(100).optional(),
  sort: z.enum(["relevance", "newest", "oldest"]).optional(),
});

export const GetAccountStatsSchema = z.object({
  account_id: AccountIdSchema,
  period: z.enum(["7d", "30d", "90d", "all"]).optional(),
});

export const BatchDeletePostsSchema = z.object({
  post_ids: z.array(PostIdSchema).min(1).max(50),
});

// ============================================================================
// Tool Schemas Registry
// ============================================================================

export const ToolSchemas = {
  list_social_accounts: ListSocialAccountsSchema,
  get_social_account: GetSocialAccountSchema,
  disconnect_social_account: DisconnectSocialAccountSchema,
  list_posts: ListPostsSchema,
  create_post: CreatePostSchema,
  get_post: GetPostSchema,
  get_post_with_accounts: GetPostWithAccountsSchema,
  delete_post: DeletePostSchema,
  list_post_results: ListPostResultsSchema,
  search_posts: SearchPostsSchema,
  get_account_stats: GetAccountStatsSchema,
  batch_delete_posts: BatchDeletePostsSchema,
  get_caption_limits: GetCaptionLimitsSchema,
} as const;

export type ToolName = keyof typeof ToolSchemas;

// ============================================================================
// JSON Schema Helpers (for tools.ts)
// ============================================================================

export const JsonSchemaHelpers = {
  postId: (description = "Post ID") => ({
    type: "string" as const,
    description: `${description} (format: ${ID_EXAMPLES.POST})`,
    pattern: ID_PATTERNS.POST.source,
  }),
  
  accountId: (description = "Account ID") => ({
    type: "string" as const,
    description: `${description} (format: ${ID_EXAMPLES.ACCOUNT})`,
    pattern: ID_PATTERNS.ACCOUNT.source,
  }),
  
  accountIdArray: (description = "Account IDs") => ({
    type: "array" as const,
    description,
    items: {
      type: "string",
      pattern: ID_PATTERNS.ACCOUNT.source,
    },
    minItems: 1,
  }),
  
  postIdArray: (description = "Post IDs") => ({
    type: "array" as const,
    description,
    items: {
      type: "string",
      pattern: ID_PATTERNS.POST.source,
    },
    minItems: 1,
    maxItems: 50,
  }),
  
  // Media schema with platform-specific metadata
  mediaItem: () => MediaPlatformSchema,
  
  mediaArray: (description = "Media attachments", maxItems?: number) => ({
    type: "array" as const,
    description: `${description}. ${getMediaConstraintsSummary()}`,
    items: MediaPlatformSchema,
    maxItems: maxItems || 35, // TikTok allows 35 photos, Threads 20, Instagram 10
  }),
  
  // Platform-specific media arrays
  instagramCarousel: (description = "Instagram carousel photos") => ({
    type: "array" as const,
    description: `${description}. Instagram carousel: 2-10 images, max 8MB each, 4:5 to 1:1 ratio`,
    items: {
      ...MediaPlatformSchema,
      properties: {
        ...MediaPlatformSchema.properties,
        platform_target: { const: "instagram_feed" },
      },
    },
    minItems: 2,
    maxItems: 10,
  }),
  
  tiktokPhotoCarousel: (description = "TikTok photo slideshow") => ({
    type: "array" as const,
    description: `${description}. TikTok photo carousel: 2-35 images, max 20MB each, 9:16 ratio recommended`,
    items: {
      ...MediaPlatformSchema,
      properties: {
        ...MediaPlatformSchema.properties,
        platform_target: { const: "tiktok_photos" },
        type: { const: "image" },
      },
    },
    minItems: 2,
    maxItems: 35,
  }),
};

// ============================================================================
// Type Exports
// ============================================================================

export type ListSocialAccountsInput = z.infer<typeof ListSocialAccountsSchema>;
export type GetSocialAccountInput = z.infer<typeof GetSocialAccountSchema>;
export type CreatePostInput = z.infer<typeof CreatePostSchema>;
export type GetPostInput = z.infer<typeof GetPostSchema>;
export type ListPostsInput = z.infer<typeof ListPostsSchema>;
