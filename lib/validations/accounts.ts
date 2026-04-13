import { z } from "zod";
import { PAGINATION } from "@/lib/constants";

const platformEnum = z.enum([
  "facebook",
  "instagram",
  "tiktok",
  "tiktok_business",
  "x",
  "twitter",
  "linkedin",
  "youtube",
  "pinterest",
  "threads",
  "bluesky",
]);

export const ListAccountsQuerySchema = z.object({
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(PAGINATION.MAX_PAGE_SIZE).default(PAGINATION.DEFAULT_LIMIT),
  platform: z.array(z.string()).optional(),
  status: z.array(z.enum(["connected", "disconnected"])).optional(),
  username: z.array(z.string()).optional(),
  external_id: z.array(z.string()).optional(),
  id: z.array(z.string()).optional(),
});

export const CreateAccountSchema = z.object({
  platform: platformEnum,
  user_id: z.string().min(1, "user_id is required"),
  access_token: z.string().min(1, "access_token is required"),
  access_token_expires_at: z.union([z.string(), z.number()]).transform(String),
  username: z.string().optional(),
  external_id: z.string().optional(),
  refresh_token: z.string().optional(),
  refresh_token_expires_at: z
    .union([z.string(), z.number()])
    .transform(String)
    .optional(),
  metadata: z.record(z.any()).optional(),
});

export const UpdateAccountSchema = z
  .object({
    username: z.string().optional(),
    external_id: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message:
      "Request body cannot be empty. Provide at least one field to update.",
  });

/**
 * Provider-specific data schemas for Auth URL
 */
const TikTokProviderDataSchema = z.object({
  permission_overrides: z.array(z.array(z.string())).optional(),
});

const TikTokBusinessProviderDataSchema = z.object({
  permission_overrides: z.array(z.array(z.string())).optional(),
});

const InstagramProviderDataSchema = z.object({
  connection_type: z.enum(["instagram", "facebook"]),
  permission_overrides: z.array(z.array(z.string())).optional(),
});

const LinkedInProviderDataSchema = z.object({
  connection_type: z.enum(["personal", "organization"]),
  permission_overrides: z.array(z.array(z.string())).optional(),
});

const ProviderDataSchema = z.object({
  tiktok: TikTokProviderDataSchema.optional(),
  tiktok_business: TikTokBusinessProviderDataSchema.optional(),
  instagram: InstagramProviderDataSchema.optional(),
  linkedin: LinkedInProviderDataSchema.optional(),
  facebook: z.object({ permission_overrides: z.array(z.array(z.string())).optional() }).optional(),
  youtube: z.object({ permission_overrides: z.array(z.array(z.string())).optional() }).optional(),
  pinterest: z.object({ permission_overrides: z.array(z.array(z.string())).optional() }).optional(),
  threads: z.object({ permission_overrides: z.array(z.array(z.string())).optional() }).optional(),
  x: z.object({ permission_overrides: z.array(z.array(z.string())).optional() }).optional(),
  bluesky: z.object({ 
    app_password: z.string(),
    handle: z.string(),
    permission_overrides: z.array(z.array(z.string())).optional() 
  }).optional(),
});

export const AuthUrlSchema = z
  .object({
    platform: platformEnum,
    external_id: z.string().optional(),
    permissions: z.array(z.enum(["posts", "feeds"])).optional(),
    platform_data: ProviderDataSchema.optional(),
    connection_type: z.string().optional(),
    redirect_url_override: z.string().url().optional(),
  })
  .transform((data) => ({
    ...data,
    platform: data.platform.toLowerCase() as z.infer<typeof platformEnum>,
  }));
