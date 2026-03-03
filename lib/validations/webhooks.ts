import { z } from "zod";

export const PostForMeEventTypeSchema = z.enum([
  "social.post.created",
  "social.post.updated",
  "social.post.deleted",
  "social.post.result.created",
  "social.account.created",
  "social.account.updated",
]);

// Social account as returned in webhook payloads (full object, not just ID)
const SocialAccountWebhookSchema = z
  .object({
    id: z.string(),
    platform: z.string(),
    username: z.string().nullable(),
    status: z.enum(["connected", "disconnected"]),
  })
  .passthrough();

export const PostCreatedDataSchema = z
  .object({
    id: z.string(),
    social_accounts: z.array(SocialAccountWebhookSchema),
    caption: z.string(),
    media: z.array(z.object({ url: z.string() }).passthrough()).nullable(),
    status: z.enum(["draft", "scheduled", "processing", "processed"]),
    scheduled_at: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .passthrough();

export const PostUpdatedDataSchema = PostCreatedDataSchema;

export const PostDeletedDataSchema = z
  .object({
    id: z.string(),
  })
  .passthrough();

export const PostResultCreatedDataSchema = z
  .object({
    id: z.string(),
    post_id: z.string(),
    social_account_id: z.string(),
    success: z.boolean(),
    error: z.unknown().nullable(),
    details: z.unknown().nullable(),
    platform_data: z
      .object({
        id: z.string(),
        url: z.string(),
      })
      .nullable(),
  })
  .passthrough();

export const AccountCreatedDataSchema = z
  .object({
    id: z.string(),
    platform: z.string(),
    username: z.string().nullable(),
    status: z.enum(["connected", "disconnected"]),
  })
  .passthrough();

export const AccountUpdatedDataSchema = AccountCreatedDataSchema;

// Webhook envelope — API sends only event_type + data (no event_id/timestamp)
export const PostForMeWebhookPayloadSchema = z.discriminatedUnion(
  "event_type",
  [
    z
      .object({
        event_type: z.literal("social.post.created"),
        data: PostCreatedDataSchema,
      })
      .passthrough(),
    z
      .object({
        event_type: z.literal("social.post.updated"),
        data: PostUpdatedDataSchema,
      })
      .passthrough(),
    z
      .object({
        event_type: z.literal("social.post.deleted"),
        data: PostDeletedDataSchema,
      })
      .passthrough(),
    z
      .object({
        event_type: z.literal("social.post.result.created"),
        data: PostResultCreatedDataSchema,
      })
      .passthrough(),
    z
      .object({
        event_type: z.literal("social.account.created"),
        data: AccountCreatedDataSchema,
      })
      .passthrough(),
    z
      .object({
        event_type: z.literal("social.account.updated"),
        data: AccountUpdatedDataSchema,
      })
      .passthrough(),
  ],
);

export type PostForMeWebhookPayload = z.infer<
  typeof PostForMeWebhookPayloadSchema
>;
export type PostCreatedData = z.infer<typeof PostCreatedDataSchema>;
export type PostUpdatedData = z.infer<typeof PostUpdatedDataSchema>;
export type PostDeletedData = z.infer<typeof PostDeletedDataSchema>;
export type PostResultCreatedData = z.infer<typeof PostResultCreatedDataSchema>;
export type AccountCreatedData = z.infer<typeof AccountCreatedDataSchema>;
export type AccountUpdatedData = z.infer<typeof AccountUpdatedDataSchema>;
export type PostForMeEventType = z.infer<typeof PostForMeEventTypeSchema>;

// --- Webhook registration DTOs ---

export const WebhookDtoSchema = z.object({
  // Required per API: id, url, secret, event_types
  id: z.string(),
  url: z.string().url(),
  secret: z.string(),
  event_types: z.array(PostForMeEventTypeSchema),
  // Optional — API may or may not return these
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  deleted_at: z.string().nullable().optional(),
});

export const WebhookListResponseSchema = z.object({
  data: z.array(WebhookDtoSchema),
  meta: z.object({
    total: z.number(),
    offset: z.number(),
    limit: z.number(),
    next: z.string().nullable(),
  }),
});

export const CreateWebhookDtoSchema = z.object({
  url: z.string().url(),
  event_types: z.array(PostForMeEventTypeSchema),
});

export const UpdateWebhookDtoSchema = z.object({
  url: z.string().url().optional(),
  event_types: z.array(PostForMeEventTypeSchema).optional(),
});

export type WebhookDto = z.infer<typeof WebhookDtoSchema>;
export type WebhookListResponse = z.infer<typeof WebhookListResponseSchema>;
export type CreateWebhookDto = z.infer<typeof CreateWebhookDtoSchema>;
export type UpdateWebhookDto = z.infer<typeof UpdateWebhookDtoSchema>;
