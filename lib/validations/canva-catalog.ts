import { z } from "zod";

/**
 * Canonical schemas + field-name constants for the 3 Canva catalog tables.
 *
 * Mirrors `lib/validations/events.ts` and `lib/validations/builder-templates.ts`.
 *
 * Lark column names here follow Title-Case-With-Spaces (dominant convention;
 * only EVENTS uses snake_case). The `*_FIELD` constants below are the SINGLE
 * source of truth for those strings — no caller should hardcode `"Image URL"`
 * anywhere. TypeScript interfaces mirror the exact schema shape so code
 * touches the same property names Lark stores; quirks like URL-field
 * `{text, link}` serialization are hidden inside `lib/canva-catalog-lark.ts`.
 */

// ==================== Canva Campaigns ====================

/**
 * Lark column names for the Canva Campaigns table.
 * Primary field is `Name` (Text). DateTime fields are ms since epoch.
 */
export const CANVA_CAMPAIGN_FIELD = {
  NAME: "Name",
  STATUS: "Status",
  DATE_START: "Date Start",
  DATE_END: "Date End",
} as const;

export const CanvaCampaignSchema = z.object({
  /** Server-assigned on create; always present on reads. */
  record_id: z.string(),
  Name: z.string(),
  Status: z.string().optional(),
  /** ms since epoch; Lark stores DateTime as number, not string. */
  "Date Start": z.number().int().nonnegative().optional(),
  "Date End": z.number().int().nonnegative().optional(),
});

export type CanvaCampaign = z.infer<typeof CanvaCampaignSchema>;

// ==================== Canva Products ====================

/**
 * Lark column names for the Canva Products table.
 * Primary field is `Campaign ID` (Text — non-unique; N products per campaign).
 * `Image URL` is URL-type: stored on-wire as `{ text, link }` object, but
 * exposed here as a plain string — serialization happens inside the
 * persistence layer.
 */
export const CANVA_PRODUCT_FIELD = {
  CAMPAIGN_ID: "Campaign ID",
  NAME: "Name",
  CATEGORY: "Category",
  SKU: "SKU",
  PRICE: "Price",
  PROMO: "Promo",
  SORT_ORDER: "Sort Order",
  /** URL-type field — Lark requires `{ text, link }` on write. */
  IMAGE_URL: "Image URL",
} as const;

/**
 * On reads, every field comes back as a string — `larkText(undefined) ?? ""`
 * and `larkUrl(undefined) ?? ""` both default to "" — so the identity
 * fields and URL are typed as non-optional string. Only truly optional
 * metadata (SKU/Category/Promo/Sort Order) uses `.optional()`.
 */
export const CanvaProductSchema = z.object({
  /** Server-assigned on create; always present on reads. */
  record_id: z.string(),
  "Campaign ID": z.string(),
  Name: z.string(),
  Price: z.string(),
  /** Plain URL string at the TypeScript boundary; persistence layer
   *  serializes to Lark's `{ text, link }` wire format on write and
   *  unwraps it on read. Empty string means no image. */
  "Image URL": z.string(),
  Category: z.string().optional(),
  SKU: z.string().optional(),
  Promo: z.string().optional(),
  "Sort Order": z.number().int().optional(),
});

export type CanvaProduct = z.infer<typeof CanvaProductSchema>;

// ==================== Canva Pages ====================

/**
 * Lark column names for the Canva Pages table.
 * Primary field is `Campaign ID` (Text — non-unique; N pages per campaign).
 */
export const CANVA_PAGE_FIELD = {
  CAMPAIGN_ID: "Campaign ID",
  PAGE_NAME: "Page Name",
  DESIGN_ID: "Design ID",
  TEMPLATE_ID: "Template ID",
  SORT_ORDER: "Sort Order",
  LAYERS_JSON: "Layers JSON",
  MAPPINGS_JSON: "Mappings JSON",
  EXPORT_JOBS_JSON: "Export Jobs JSON",
  RESIZE_JOBS_JSON: "Resize Jobs JSON",
} as const;

export const CanvaPageSchema = z.object({
  /** Server-assigned on create; always present on reads. */
  record_id: z.string(),
  "Campaign ID": z.string(),
  "Page Name": z.string(),
  "Template ID": z.string(),
  "Mappings JSON": z.string(),
  "Design ID": z.string().optional(),
  "Sort Order": z.number().int().optional(),
  /** JSON blobs stored as Text in Lark — kept as strings at the boundary
   *  so callers decide when to `JSON.parse`. */
  "Layers JSON": z.string().optional(),
  "Export Jobs JSON": z.string().optional(),
  "Resize Jobs JSON": z.string().optional(),
});

export type CanvaPage = z.infer<typeof CanvaPageSchema>;
