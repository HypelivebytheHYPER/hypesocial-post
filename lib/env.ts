import { z } from "zod";

/**
 * Server-side environment variable validation.
 *
 * Validates required env vars at import time so missing configuration
 * fails fast with a clear message instead of cryptic runtime errors.
 *
 * Usage: import { env } from "@/lib/env" in server-side code only.
 */

const serverSchema = z.object({
  // Post For Me API
  POST_FOR_ME_API_KEY: z.string().min(1, "POST_FOR_ME_API_KEY is required"),
  POST_FOR_ME_BASE_URL: z
    .string()
    .url()
    .default("https://api.postforme.dev"),

  // Authentication (optional — auth disabled if not set)
  NEXTAUTH_SECRET: z.string().optional(),
  LARK_USERS_TABLE_ID: z.string().optional(),

  // Webhook secrets
  POST_FOR_ME_WEBHOOK_SECRET: z
    .string()
    .min(1, "POST_FOR_ME_WEBHOOK_SECRET is required")
    .optional(),

  // OAuth callback
  POST_FOR_ME_REDIRECT_URI: z.string().url().optional(),

  // Lark (moodboard)
  LARK_APP_TOKEN: z.string().optional(),
  LARK_HTTP_WORKER_URL: z.string().url().optional(),
  LARK_MOODBOARD_PROJECTS_TABLE_ID: z.string().optional(),
  LARK_MOODBOARD_ITEMS_TABLE_ID: z.string().optional(),

  // R2 storage (moodboard uploads)
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().url().optional(),
});

/**
 * Validated server environment variables.
 * Throws at import time if required vars are missing.
 */
export const env = serverSchema.parse(process.env);
