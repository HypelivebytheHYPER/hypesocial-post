import { z } from "zod";

// ==================== OAuth ====================

export const CanvaAuthUrlSchema = z.object({
  redirect_path: z.string().optional(),
});

export const CanvaCallbackSchema = z.object({
  code: z.string(),
  state: z.string(),
});

// ==================== Token Response ====================

export const CanvaTokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  token_type: z.literal("Bearer"),
  expires_in: z.number().optional(),
  scope: z.string().optional(),
});

// ==================== Designs ====================

export const CanvaDesignsQuerySchema = z.object({
  continuation: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sort_by: z.enum(["relevance", "created_at", "modified_at", "title"]).optional(),
});

// ==================== API Types ====================

export type CanvaAuthUrlInput = z.infer<typeof CanvaAuthUrlSchema>;
export type CanvaCallbackInput = z.infer<typeof CanvaCallbackSchema>;
export type CanvaTokenResponse = z.infer<typeof CanvaTokenResponseSchema>;
export type CanvaDesignsQuery = z.infer<typeof CanvaDesignsQuerySchema>;

// Loose schema for Canva list designs response (we proxy it mostly as-is)
export const CanvaListDesignsResponseSchema = z.object({
  items: z.array(z.record(z.any())),
  continuation: z.string().optional(),
});
