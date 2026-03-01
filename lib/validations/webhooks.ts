import { z } from "zod";

export const PostForMeEventTypeSchema = z.enum([
  "social.post.created",
  "social.post.updated",
  "social.post.deleted",
  "social.post.result.created",
  "social.account.created",
  "social.account.updated",
]);

export const PostCreatedDataSchema = z.object({
  id: z.string(),
  social_accounts: z.array(z.string()),
  caption: z.string(),
  media: z.array(z.object({ url: z.string() })).nullable(),
  status: z.enum(["draft", "scheduled", "processing", "processed"]),
  scheduled_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const PostUpdatedDataSchema = PostCreatedDataSchema;

export const PostDeletedDataSchema = z.object({
  id: z.string(),
  deleted_at: z.string(),
});

export const PostResultCreatedDataSchema = z.object({
  post_id: z.string(),
  social_account_id: z.string(),
  platform_post_id: z.string().nullable(),
  platform_post_url: z.string().nullable(),
  status: z.enum(["success", "failed"]),
  error: z
    .object({
      message: z.string(),
      code: z.string(),
    })
    .nullable(),
  details: z
    .object({
      logs: z.array(z.string()),
    })
    .nullable(),
  platform_data: z
    .object({
      id: z.string(),
      url: z.string(),
    })
    .nullable(),
  created_at: z.string(),
});

export const AccountCreatedDataSchema = z.object({
  id: z.string(),
  platform: z.string(),
  username: z.string().nullable(),
  external_id: z.string().nullable(),
  profile_photo_url: z.string().nullable(),
  status: z.enum(["connected", "disconnected"]),
  created_at: z.string(),
  updated_at: z.string(),
});

export const AccountUpdatedDataSchema = AccountCreatedDataSchema;

export const PostForMeWebhookPayloadSchema = z.discriminatedUnion("event_type", [
  z.object({
    event_id: z.string(),
    event_type: z.literal("social.post.created"),
    timestamp: z.string(),
    data: PostCreatedDataSchema,
  }),
  z.object({
    event_id: z.string(),
    event_type: z.literal("social.post.updated"),
    timestamp: z.string(),
    data: PostUpdatedDataSchema,
  }),
  z.object({
    event_id: z.string(),
    event_type: z.literal("social.post.deleted"),
    timestamp: z.string(),
    data: PostDeletedDataSchema,
  }),
  z.object({
    event_id: z.string(),
    event_type: z.literal("social.post.result.created"),
    timestamp: z.string(),
    data: PostResultCreatedDataSchema,
  }),
  z.object({
    event_id: z.string(),
    event_type: z.literal("social.account.created"),
    timestamp: z.string(),
    data: AccountCreatedDataSchema,
  }),
  z.object({
    event_id: z.string(),
    event_type: z.literal("social.account.updated"),
    timestamp: z.string(),
    data: AccountUpdatedDataSchema,
  }),
]);

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
