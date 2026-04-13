import { z } from "zod";

// ============================================
// POST FOR ME WEBHOOK API SCHEMAS
// ============================================

/**
 * Webhook DTO - Response from Post For Me API
 */
export const WebhookDtoSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  secret: z.string(),
  event_types: z.array(z.string()),
});

export type WebhookDto = z.infer<typeof WebhookDtoSchema>;

/**
 * Webhook List Response
 */
export const WebhookListResponseSchema = z.object({
  data: z.array(WebhookDtoSchema),
  meta: z.object({
    total: z.number(),
    offset: z.number(),
    limit: z.number(),
    next: z.string().nullable(),
  }),
});

export type WebhookListResponse = z.infer<typeof WebhookListResponseSchema>;

/**
 * Create Webhook Request
 */
export const CreateWebhookRequestSchema = z.object({
  url: z.string().url(),
  event_types: z.array(z.enum([
    "social.post.created",
    "social.post.updated",
    "social.post.deleted",
    "social.post.result.created",
    "social.account.created",
    "social.account.updated",
  ])),
});

export type CreateWebhookRequest = z.infer<typeof CreateWebhookRequestSchema>;

/**
 * Update Webhook Request
 */
export const UpdateWebhookRequestSchema = z.object({
  url: z.string().url().optional(),
  event_types: z.array(z.enum([
    "social.post.created",
    "social.post.updated",
    "social.post.deleted",
    "social.post.result.created",
    "social.account.created",
    "social.account.updated",
  ])).optional(),
});

export type UpdateWebhookRequest = z.infer<typeof UpdateWebhookRequestSchema>;

/**
 * Delete Webhook Response
 */
export const DeleteWebhookResponseSchema = z.object({
  success: z.boolean(),
});

export type DeleteWebhookResponse = z.infer<typeof DeleteWebhookResponseSchema>;

// ============================================
// WEBHOOK EVENT PAYLOAD SCHEMAS
// ============================================

/**
 * Social Account in Post/Result events
 */
export const SocialAccountSchema = z.object({
  id: z.string(),
  platform: z.string(),
  username: z.string().nullable(),
  status: z.enum(["connected", "disconnected"]),
});

export type SocialAccount = z.infer<typeof SocialAccountSchema>;

/**
 * Media item in Post events
 */
export const PostMediaSchema = z.object({
  url: z.string(),
  skip_processing: z.boolean().optional(),
});

export type PostMedia = z.infer<typeof PostMediaSchema>;

/**
 * Post Created/Updated Event Data
 */
export const PostEventDataSchema = z.object({
  id: z.string(),
  social_accounts: z.array(SocialAccountSchema),
  caption: z.string(),
  media: z.array(PostMediaSchema).nullable().optional(),
  status: z.enum(["draft", "scheduled", "processing", "processed"]),
  scheduled_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type PostEventData = z.infer<typeof PostEventDataSchema>;

/**
 * Post Result Event Data
 */
export const PostResultEventDataSchema = z.object({
  id: z.string(),
  post_id: z.string(),
  social_account_id: z.string(),
  success: z.boolean(),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
  }).nullable(),
  details: z.record(z.unknown()).nullable(),
  platform_data: z.object({
    id: z.string().optional(),
    url: z.string().optional(),
  }).nullable().optional(),
});

export type PostResultEventData = z.infer<typeof PostResultEventDataSchema>;

/**
 * Post Result type (alias for convenience)
 */
export type PostResult = PostResultEventData;

/**
 * Account Event Data
 */
export const AccountEventDataSchema = z.object({
  id: z.string(),
  platform: z.string(),
  username: z.string().nullable(),
  user_id: z.string().optional(),
  profile_photo_url: z.string().nullable().optional(),
  access_token: z.string().optional(),
  refresh_token: z.string().nullable().optional(),
  access_token_expires_at: z.string().optional(),
  refresh_token_expires_at: z.string().nullable().optional(),
  status: z.enum(["connected", "disconnected"]),
  external_id: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
});

export type AccountEventData = z.infer<typeof AccountEventDataSchema>;

/**
 * Webhook Event Payload (from Post For Me)
 */
export const WebhookEventPayloadSchema = z.discriminatedUnion("event_type", [
  z.object({
    event_type: z.literal("social.post.created"),
    data: PostEventDataSchema,
  }),
  z.object({
    event_type: z.literal("social.post.updated"),
    data: PostEventDataSchema,
  }),
  z.object({
    event_type: z.literal("social.post.deleted"),
    data: z.object({ id: z.string() }),
  }),
  z.object({
    event_type: z.literal("social.post.result.created"),
    data: PostResultEventDataSchema,
  }),
  z.object({
    event_type: z.literal("social.account.created"),
    data: AccountEventDataSchema,
  }),
  z.object({
    event_type: z.literal("social.account.updated"),
    data: AccountEventDataSchema,
  }),
]);

export type WebhookEventPayload = z.infer<typeof WebhookEventPayloadSchema>;

// ============================================
// LARK BASE FIELD MAPPING
// ============================================

/**
 * Field name mapping from Post For Me to Lark Base
 */
export const POST_FIELD_MAP = {
  // Post For Me → Lark Base
  "id": "id",
  "caption": "Caption",
  "status": "Status",
  "scheduled_at": "Scheduled At",
  "created_at": "Created At",
  "updated_at": "Updated At",
  "social_accounts": "Social Account IDs",
  "media": "Media URLs",
  "platform_configurations": "Platform Configurations",
} as const;

export const POST_RESULT_FIELD_MAP = {
  // Post For Me → Lark Base
  "id": "id",
  "post_id": "social_post_id",
  "social_account_id": "social_account_id",
  "success": "Success",
  "error": "Error",
  "details": "Details",
  "platform_data.id": "external_post_id",
  "platform_data.url": "external_post_url",
} as const;

export const ACCOUNT_FIELD_MAP = {
  // Post For Me → Lark Base
  "id": "id",
  "platform": "Platform",
  "username": "Username",
  "user_id": "User ID",
  "profile_photo_url": "Profile Photo URL",
  "access_token": "Access Token",
  "refresh_token": "Refresh Token",
  "access_token_expires_at": "Access Token Expires",
  "refresh_token_expires_at": "Refresh Token Expires",
  "status": "Status",
  "external_id": "External ID",
  "metadata": "Metadata",
} as const;

// ============================================
// TANSTACK QUERY KEY FACTORIES
// ============================================

export const webhookKeys = {
  all: ["webhooks"] as const,
  lists: () => [...webhookKeys.all, "list"] as const,
  list: (filters: { offset?: number; limit?: number; url?: string; event_type?: string[] } = {}) =>
    [...webhookKeys.lists(), filters] as const,
  details: () => [...webhookKeys.all, "detail"] as const,
  detail: (id: string) => [...webhookKeys.details(), id] as const,
};

export const postKeys = {
  all: ["posts"] as const,
  lists: () => [...postKeys.all, "list"] as const,
  list: (filters: { status?: string; platform?: string } = {}) =>
    [...postKeys.lists(), filters] as const,
  details: () => [...postKeys.all, "detail"] as const,
  detail: (id: string) => [...postKeys.details(), id] as const,
  results: (postId: string) => [...postKeys.detail(postId), "results"] as const,
};

export const accountKeys = {
  all: ["accounts"] as const,
  lists: () => [...accountKeys.all, "list"] as const,
  list: (filters: { platform?: string; status?: string } = {}) =>
    [...accountKeys.lists(), filters] as const,
  details: () => [...accountKeys.all, "detail"] as const,
  detail: (id: string) => [...accountKeys.details(), id] as const,
};
