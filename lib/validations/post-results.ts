import { z } from "zod";
import { PAGINATION } from "@/lib/constants";

export const ListPostResultsQuerySchema = z.object({
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
  post_id: z.array(z.string()).optional(),
  social_account_id: z.array(z.string()).optional(),
  platform: z.array(z.string()).optional(),
});
