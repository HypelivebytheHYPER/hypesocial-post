import { z } from "zod";

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
  limit: z.coerce.number().int().min(1).max(100).default(20),
  platform: z.array(z.string()).optional(),
  status: z.array(z.string()).optional(),
  username: z.array(z.string()).optional(),
  external_id: z.array(z.string()).optional(),
  id: z.array(z.string()).optional(),
});

export const CreateAccountSchema = z.object({
  platform: platformEnum,
  user_id: z.string().min(1, "user_id is required"),
  access_token: z.string().min(1, "access_token is required"),
  access_token_expires_at: z
    .union([z.string(), z.number()])
    .transform(String),
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
    message: "Request body cannot be empty. Provide at least one field to update.",
  });

export const AuthUrlSchema = z
  .object({
    platform: platformEnum,
    external_id: z.string().optional(),
    permissions: z.array(z.string()).optional(),
    platform_data: z.record(z.any()).optional(),
    connection_type: z.string().optional(),
    redirect_url_override: z.string().url().optional(),
  })
  .transform((data) => ({
    ...data,
    platform: data.platform.toLowerCase() as z.infer<typeof platformEnum>,
  }));
