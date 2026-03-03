import { z } from "zod";

export const CreatePreviewSchema = z.object({
  caption: z.string().min(1, "caption is required"),
  preview_social_accounts: z
    .array(
      z.object({
        id: z.string(),
        platform: z.string(),
        username: z.string().optional(),
      }),
    )
    .min(1, "preview_social_accounts must be a non-empty array"),
  media: z
    .array(
      z.object({
        url: z.string().url(),
        thumbnail_url: z.any().optional(),
        thumbnail_timestamp_ms: z.any().optional(),
        tags: z.any().optional(),
        skip_processing: z.boolean().optional().nullable(),
      }),
    )
    .optional(),
  platform_configurations: z.record(z.any()).optional().nullable(),
  account_configurations: z
    .array(
      z.object({
        social_account_id: z.string(),
        configuration: z.record(z.any()),
      }),
    )
    .optional()
    .nullable(),
});
