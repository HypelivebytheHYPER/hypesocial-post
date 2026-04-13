import { z } from "zod";
import { PAGINATION } from "@/lib/constants";

export const ListFeedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(PAGINATION.MAX_PAGE_SIZE).default(PAGINATION.DEFAULT_LIMIT),
  cursor: z.string().optional(),
  expand: z.array(z.enum(["metrics"])).optional(),
  external_post_id: z.array(z.string()).optional(),
  social_post_id: z.array(z.string()).optional(),
  platform_post_id: z.array(z.string()).optional(),
});
