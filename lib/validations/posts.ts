import { z } from "zod";

export const UpdatePostSchema = z.object({
  caption: z.string().optional(),
  social_accounts: z.array(z.string()).optional(),
  media: z
    .array(z.object({ url: z.string().url() }))
    .optional(),
  scheduled_at: z.string().datetime().optional(),
  isDraft: z.boolean().optional(),
  platform_configurations: z.record(z.any()).optional(),
  account_configurations: z.array(z.object({
    social_account_id: z.string(),
    configuration: z.record(z.any()),
  })).optional(),
  external_id: z.string().optional(),
});
