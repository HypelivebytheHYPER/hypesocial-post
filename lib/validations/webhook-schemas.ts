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
    media: z
      .array(z.object({ url: z.string() }).passthrough())
      .nullable()
      .optional(),
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
        id: z.string().optional(),
        url: z.string().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
  })
  .passthrough();

export const AccountCreatedDataSchema = z
  .object({
    id: z.string(), // Post For Me's UUID for the account
    platform: z.string(),
    username: z.string().nullable(),
    user_id: z.string().optional(), // Platform's user ID (e.g., Instagram user ID)
    profile_photo_url: z.string().nullable().optional(),
    access_token: z.string().optional(),
    refresh_token: z.string().nullable().optional(),
    access_token_expires_at: z.string().optional(),
    refresh_token_expires_at: z.string().nullable().optional(),
    status: z.enum(["connected", "disconnected"]),
    external_id: z.string().nullable().optional(),
    metadata: z.record(z.unknown()).nullable().optional(),
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

// ─────────────────────────────────────────────────────────────────────────────
// Lark Open Platform — Bitable record change event (drive.file.bitable_record_changed_v1)
//
// This is the SINGLE Lark event type hype-social actually subscribes to (per
// the cleanup audit). It fires whenever any record in any table of the Lark
// Base changes — created, edited, or deleted. The event payload includes a
// list of actions because Lark batches multiple changes from the same operator
// in a short window into one delivery.
//
// Reference: https://open.larksuite.com/document/server-docs/docs/bitable-v1/event/notification
//
// Wire shape:
//   {
//     schema: "2.0",
//     header: { event_id, event_type: "drive.file.bitable_record_changed_v1", ... },
//     event: {
//       file_token: "<base_app_token>",
//       table_id: "tbl...",
//       revision: 123,
//       action_list: [
//         { action: "record_added", record_id: "rec...", after_value?: [...] },
//         { action: "record_edited", record_id: "rec...", before_value?: [...], after_value?: [...] },
//         { action: "record_deleted", record_id: "rec...", before_value?: [...] },
//       ],
//       subscriber_id_list?: [...]
//     }
//   }
//
// We tolerate field-name drift via .passthrough() because Lark occasionally
// renames fields between API versions. The receiver only needs the four core
// fields below — anything else gets preserved in payload_json.
// ─────────────────────────────────────────────────────────────────────────────

export const LarkBitableActionSchema = z
  .object({
    /** Lark wire-format action: record_added / record_edited / record_deleted. */
    action: z.string(),
    /** Affected record id. */
    record_id: z.string(),
  })
  .passthrough();

export const LarkBitableRecordChangedEventSchema = z
  .object({
    file_token: z.string().optional(),
    table_id: z.string().optional(),
    revision: z.number().optional(),
    action_list: z.array(LarkBitableActionSchema).optional(),
    subscriber_id_list: z.array(z.unknown()).optional(),
  })
  .passthrough();

export const LarkV2HeaderSchema = z
  .object({
    event_id: z.string(),
    event_type: z.string(),
    create_time: z.string().optional(),
    token: z.string().optional(),
    tenant_key: z.string().optional(),
    app_id: z.string().optional(),
  })
  .passthrough();

export const LarkBitableRecordChangedPayloadSchema = z
  .object({
    schema: z.literal("2.0"),
    header: LarkV2HeaderSchema,
    event: LarkBitableRecordChangedEventSchema,
  })
  .passthrough();

export type LarkBitableAction = z.infer<typeof LarkBitableActionSchema>;
export type LarkBitableRecordChangedPayload = z.infer<
  typeof LarkBitableRecordChangedPayloadSchema
>;

/**
 * Map Lark's wire-format action names to the normalized event_type stored in
 * the EVENTS table. Unknown actions fall through to `lark.record.changed`.
 */
export function normalizeLarkRecordAction(
  action: string,
): { event_type: string; action_type: string } {
  switch (action) {
    case "record_added":
      return { event_type: "lark.record.created", action_type: "created" };
    case "record_edited":
      return { event_type: "lark.record.updated", action_type: "updated" };
    case "record_deleted":
      return { event_type: "lark.record.deleted", action_type: "deleted" };
    default:
      return { event_type: "lark.record.changed", action_type: action };
  }
}

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

// --- Social Post DTOs (matching Post For Me API spec) ---

export const SocialPostMediaSchema = z.object({
  url: z.string(),
  skip_processing: z.boolean().optional(),
});

export const SocialPostDtoSchema = z.object({
  id: z.string(),
  caption: z.string(),
  status: z.enum(["draft", "scheduled", "processing", "processed"]),
  scheduled_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  external_id: z.string().nullable(),
  social_accounts: z.array(z.object({ id: z.string() })),
  media: z.array(SocialPostMediaSchema),
  platform_configurations: z.record(z.unknown()).nullable(),
  account_configurations: z.array(z.record(z.unknown())).optional(),
});

// --- Social Account DTOs (matching Post For Me API spec) ---

export const SocialAccountMetadataSchema = z.object({}).passthrough();

export const SocialAccountDtoSchema = z.object({
  id: z.string(),
  platform: z.string(),
  username: z.string().nullable(),
  user_id: z.string(),
  profile_photo_url: z.string().nullable(),
  access_token: z.string(),
  refresh_token: z.string().nullable(),
  access_token_expires_at: z.string(),
  refresh_token_expires_at: z.string().nullable(),
  status: z.enum(["connected", "disconnected"]),
  external_id: z.string().nullable(),
  metadata: SocialAccountMetadataSchema.nullable(),
});

// --- Create DTOs ---

export const CreateSocialPostDtoSchema = z.object({
  caption: z.string(),
  status: z.enum(["draft", "scheduled"]).optional(),
  scheduled_at: z.string().nullable().optional(),
  social_account_ids: z.array(z.string()),
  media: z.array(SocialPostMediaSchema).optional(),
  platform_configurations: z.record(z.unknown()).optional(),
  account_configurations: z.array(z.record(z.unknown())).optional(),
});

export type SocialPostDto = z.infer<typeof SocialPostDtoSchema>;
export type SocialAccountDto = z.infer<typeof SocialAccountDtoSchema>;
export type CreateSocialPostDto = z.infer<typeof CreateSocialPostDtoSchema>;
