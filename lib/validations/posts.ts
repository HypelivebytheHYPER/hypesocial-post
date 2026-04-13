import { z } from "zod";

/**
 * Media tag schema for Instagram/Facebook user tagging
 */
const MediaTagSchema = z.object({
  id: z.string(),
  platform: z.enum(["facebook", "instagram"]),
  type: z.enum(["user", "product"]),
  x: z.number().optional(),
  y: z.number().optional(),
});

/**
 * Media item schema - matches MediaItem type
 */
const MediaItemSchema = z.object({
  url: z.string().url(),
  thumbnail_url: z.string().url().optional().nullable(),
  thumbnail_timestamp_ms: z.number().optional().nullable(),
  tags: z.array(MediaTagSchema).optional().nullable(),
  skip_processing: z.boolean().optional().nullable(),
});

export const UpdatePostSchema = z.object({
  caption: z.string().optional(),
  social_accounts: z.array(z.string()).optional(),
  media: z.array(MediaItemSchema).optional(),
  scheduled_at: z.string().datetime().optional(),
  isDraft: z.boolean().optional(),
  platform_configurations: z.record(z.any()).optional(),
  account_configurations: z
    .array(
      z.object({
        social_account_id: z.string(),
        configuration: z.record(z.any()),
      }),
    )
    .optional(),
  external_id: z.string().optional(),
});
