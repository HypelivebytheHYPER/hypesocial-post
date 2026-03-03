import { z } from "zod";

export const UpdatePostSchema = z.object({
  caption: z.string().optional(),
  social_accounts: z.array(z.string()).optional(),
  media: z
    .array(z.object({ url: z.string().url() }))
    .optional(),
  scheduled_at: z.string().datetime().optional(),
  isDraft: z.boolean().optional(),
  platform_configs: z.record(z.any()).optional(),
  status: z.string().optional(),
});
