import { z } from "zod";

/**
 * Canonical schema + field map for the Lark Base "Builder Templates" table.
 *
 * Mirrors the pattern used by `lib/validations/events.ts` so every
 * Lark-backed table in this project has ONE place that owns:
 *   1. the Zod schema (what code produces / consumes)
 *   2. the Lark column-name constants (what the table actually uses)
 *
 * When Phase B of the naming migration runs (rename Builder Templates
 * fields to snake_case in Lark UI), ONLY the string values in
 * `BUILDER_TEMPLATE_FIELD` below need to change — every caller uses the
 * constants, not the raw strings. That's the whole point of this file.
 */

export const BuilderTemplateFormatSchema = z.enum([
  "ig-post",
  "ig-story",
  "ig-reel",
  "tiktok",
  "yt-thumbnail",
  "fb-post",
  "x-post",
  "linkedin-post",
  "pinterest-pin",
]);

export const BuilderTemplateThemeSchema = z.object({
  primaryColor: z.string(),
  borderRadius: z.number(),
  fontFamily: z.string(),
  backgroundColor: z.string(),
});

export const BuilderTemplatePageSchema = z.object({
  id: z.string(),
  name: z.string(),
  layers: z.array(z.record(z.unknown())),
  canvasBackground: z.object({
    color: z.string(),
    image: z.string(),
  }),
});

export const BuilderTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  format: BuilderTemplateFormatSchema,
  pages: z.array(BuilderTemplatePageSchema),
  theme: BuilderTemplateThemeSchema,
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type BuilderTemplate = z.infer<typeof BuilderTemplateSchema>;

/**
 * Lark Base column names for the Builder Templates table.
 *
 * Keep in sync with the table schema in Lark (see
 * docs/ENVIRONMENT_VARIABLES.md → Builder Templates table).
 *
 * NOTE: these values are currently Title Case because the table schema
 * is still in the original shape. Phase B of the naming migration will
 * rename the Lark columns to snake_case (`name`, `blocks_json`, etc.);
 * at that point, update ONLY the string values below and every caller
 * will pick up the change automatically.
 */
export const BUILDER_TEMPLATE_FIELD = {
  /** Template display name. */
  NAME: "Name",
  /** JSON blob containing `{ format, pages: [{ id, name, layers, canvasBackground }] }`. */
  BLOCKS_JSON: "Blocks JSON",
  /** JSON blob containing the full theme object. */
  THEME_JSON: "Theme JSON",
  /** Legacy column — pre-`Name` field, still present as fallback on read. */
  TEXT_LEGACY: "Text",
  /** Unix epoch ms. */
  CREATED_AT: "Created At",
  /** Unix epoch ms. */
  UPDATED_AT: "Updated At",
} as const;
