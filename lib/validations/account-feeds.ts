import { z } from "zod";

export const ListFeedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
  expand: z.enum(["metrics"]).optional(),
  external_post_id: z.array(z.string()).optional(),
  social_post_id: z.array(z.string()).optional(),
  platform_post_id: z.array(z.string()).optional(),
});
