/**
 * Canva Catalog persistence layer — Lark Base is the backing database.
 *
 * Every read/write goes through `lib/lark.ts` (the SSOT Lark client). This
 * module's job is to map between the TypeScript-friendly schema shape
 * (Campaign/Product/Page from `lib/validations/canva-catalog.ts`) and the
 * Lark wire format — which has quirks this mapper hides from callers:
 *
 *   - URL fields are sent/received as `{ text, link }` objects, not strings
 *   - DateTime fields are ms-since-epoch numbers (not ISO strings)
 *   - Text fields may come back as `{ text, type }` segments or arrays
 *
 * Field-name strings live in one place: the `CANVA_*_FIELD` constants from
 * the validations module. Callers should never hardcode `"Image URL"`.
 */

import {
  larkSearchRecords,
  larkCreateRecords,
  larkUpdateRecords,
  larkDeleteRecords,
  larkText,
  larkNumber,
  larkDateMs,
  larkUrl,
  toLarkUrl,
  eq,
  filterAnd,
} from "@/lib/lark";
import {
  CANVA_CAMPAIGN_FIELD,
  CANVA_PRODUCT_FIELD,
  CANVA_PAGE_FIELD,
  type CanvaCampaign,
  type CanvaProduct,
  type CanvaPage,
} from "@/lib/validations/canva-catalog";

// Re-export under the legacy names so existing callers keep working.
export type Campaign = CanvaCampaign;
export type Product = CanvaProduct;
export type Page = CanvaPage;

// ==================== Config ====================

/**
 * Reads Canva catalog table IDs from env.
 *
 * Canonical names: `LARK_CANVA_<DOMAIN>_TABLE_ID`. Legacy
 * `LARK_TABLE_ID_CANVA_<DOMAIN>` names are still accepted as fallback so
 * Vercel env can be migrated phased — remove fallbacks in Phase D.
 */
function getTableIds() {
  return {
    campaigns:
      process.env.LARK_CANVA_CAMPAIGNS_TABLE_ID ??
      process.env.LARK_TABLE_ID_CANVA_CAMPAIGNS!,
    products:
      process.env.LARK_CANVA_PRODUCTS_TABLE_ID ??
      process.env.LARK_TABLE_ID_CANVA_PRODUCTS!,
    pages:
      process.env.LARK_CANVA_PAGES_TABLE_ID ??
      process.env.LARK_TABLE_ID_CANVA_PAGES!,
  };
}

// ==================== Campaigns ====================

function campaignToLark(c: Partial<Campaign>): Record<string, unknown> {
  const f: Record<string, unknown> = {};
  if (c.Name !== undefined) f[CANVA_CAMPAIGN_FIELD.NAME] = c.Name;
  if (c.Status !== undefined) f[CANVA_CAMPAIGN_FIELD.STATUS] = c.Status;
  if (c["Date Start"] !== undefined) f[CANVA_CAMPAIGN_FIELD.DATE_START] = c["Date Start"];
  if (c["Date End"] !== undefined) f[CANVA_CAMPAIGN_FIELD.DATE_END] = c["Date End"];
  return f;
}

function larkToCampaign(
  record_id: string,
  fields: Record<string, unknown>,
): Campaign {
  return {
    record_id,
    Name: larkText(fields[CANVA_CAMPAIGN_FIELD.NAME]) ?? "",
    Status: larkText(fields[CANVA_CAMPAIGN_FIELD.STATUS]),
    "Date Start": larkDateMs(fields[CANVA_CAMPAIGN_FIELD.DATE_START]),
    "Date End": larkDateMs(fields[CANVA_CAMPAIGN_FIELD.DATE_END]),
  };
}

export async function listCampaigns(): Promise<Campaign[]> {
  const { campaigns } = getTableIds();
  const res = await larkSearchRecords(campaigns, undefined, 500);
  return res.items.map((item) => larkToCampaign(item.record_id, item.fields));
}

export async function createCampaign(
  fields: Omit<Campaign, "record_id">,
): Promise<string> {
  const { campaigns } = getTableIds();
  const res = await larkCreateRecords(campaigns, [campaignToLark(fields)]);
  return res.record_ids[0]!;
}

export async function updateCampaign(
  recordId: string,
  fields: Partial<Campaign>,
): Promise<void> {
  const { campaigns } = getTableIds();
  await larkUpdateRecords(campaigns, [
    { record_id: recordId, fields: campaignToLark(fields) },
  ]);
}

export async function deleteCampaign(recordId: string): Promise<void> {
  const { campaigns } = getTableIds();
  await larkDeleteRecords(campaigns, [recordId]);
}

// ==================== Products ====================

function productToLark(p: Partial<Product>): Record<string, unknown> {
  const f: Record<string, unknown> = {};
  if (p["Campaign ID"] !== undefined) f[CANVA_PRODUCT_FIELD.CAMPAIGN_ID] = p["Campaign ID"];
  if (p.Name !== undefined) f[CANVA_PRODUCT_FIELD.NAME] = p.Name;
  if (p.Category !== undefined) f[CANVA_PRODUCT_FIELD.CATEGORY] = p.Category;
  if (p.SKU !== undefined) f[CANVA_PRODUCT_FIELD.SKU] = p.SKU;
  if (p.Price !== undefined) f[CANVA_PRODUCT_FIELD.PRICE] = p.Price;
  if (p.Promo !== undefined) f[CANVA_PRODUCT_FIELD.PROMO] = p.Promo;
  if (p["Sort Order"] !== undefined) f[CANVA_PRODUCT_FIELD.SORT_ORDER] = p["Sort Order"];
  // URL-type field: must go as { text, link }, not a bare string.
  if (p["Image URL"] !== undefined) {
    const v = toLarkUrl(p["Image URL"]);
    if (v !== undefined) f[CANVA_PRODUCT_FIELD.IMAGE_URL] = v;
  }
  return f;
}

function larkToProduct(
  record_id: string,
  fields: Record<string, unknown>,
): Product {
  return {
    record_id,
    "Campaign ID": larkText(fields[CANVA_PRODUCT_FIELD.CAMPAIGN_ID]) ?? "",
    Name: larkText(fields[CANVA_PRODUCT_FIELD.NAME]) ?? "",
    Category: larkText(fields[CANVA_PRODUCT_FIELD.CATEGORY]),
    SKU: larkText(fields[CANVA_PRODUCT_FIELD.SKU]),
    Price: larkText(fields[CANVA_PRODUCT_FIELD.PRICE]) ?? "",
    Promo: larkText(fields[CANVA_PRODUCT_FIELD.PROMO]),
    "Sort Order":
      fields[CANVA_PRODUCT_FIELD.SORT_ORDER] !== undefined
        ? larkNumber(fields[CANVA_PRODUCT_FIELD.SORT_ORDER])
        : undefined,
    "Image URL": larkUrl(fields[CANVA_PRODUCT_FIELD.IMAGE_URL]) ?? "",
  };
}

export async function listProducts(campaignId: string): Promise<Product[]> {
  const { products } = getTableIds();
  const res = await larkSearchRecords(
    products,
    filterAnd(eq(CANVA_PRODUCT_FIELD.CAMPAIGN_ID, campaignId)),
    500,
  );
  return res.items.map((item) => larkToProduct(item.record_id, item.fields));
}

export async function createProducts(
  records: Omit<Product, "record_id">[],
): Promise<string[]> {
  const { products } = getTableIds();
  const res = await larkCreateRecords(products, records.map(productToLark));
  return res.record_ids;
}

export async function updateProducts(
  records: Array<{ record_id: string; fields: Partial<Product> }>,
): Promise<void> {
  const { products } = getTableIds();
  await larkUpdateRecords(
    products,
    records.map((r) => ({ record_id: r.record_id, fields: productToLark(r.fields) })),
  );
}

export async function deleteProducts(recordIds: string[]): Promise<void> {
  const { products } = getTableIds();
  await larkDeleteRecords(products, recordIds);
}

// ==================== Pages ====================

function pageToLark(p: Partial<Page>): Record<string, unknown> {
  const f: Record<string, unknown> = {};
  if (p["Campaign ID"] !== undefined) f[CANVA_PAGE_FIELD.CAMPAIGN_ID] = p["Campaign ID"];
  if (p["Page Name"] !== undefined) f[CANVA_PAGE_FIELD.PAGE_NAME] = p["Page Name"];
  if (p["Design ID"] !== undefined) f[CANVA_PAGE_FIELD.DESIGN_ID] = p["Design ID"];
  if (p["Template ID"] !== undefined) f[CANVA_PAGE_FIELD.TEMPLATE_ID] = p["Template ID"];
  if (p["Sort Order"] !== undefined) f[CANVA_PAGE_FIELD.SORT_ORDER] = p["Sort Order"];
  if (p["Layers JSON"] !== undefined) f[CANVA_PAGE_FIELD.LAYERS_JSON] = p["Layers JSON"];
  if (p["Mappings JSON"] !== undefined) f[CANVA_PAGE_FIELD.MAPPINGS_JSON] = p["Mappings JSON"];
  if (p["Export Jobs JSON"] !== undefined) f[CANVA_PAGE_FIELD.EXPORT_JOBS_JSON] = p["Export Jobs JSON"];
  if (p["Resize Jobs JSON"] !== undefined) f[CANVA_PAGE_FIELD.RESIZE_JOBS_JSON] = p["Resize Jobs JSON"];
  return f;
}

function larkToPage(
  record_id: string,
  fields: Record<string, unknown>,
): Page {
  return {
    record_id,
    "Campaign ID": larkText(fields[CANVA_PAGE_FIELD.CAMPAIGN_ID]) ?? "",
    "Page Name": larkText(fields[CANVA_PAGE_FIELD.PAGE_NAME]) ?? "",
    "Design ID": larkText(fields[CANVA_PAGE_FIELD.DESIGN_ID]),
    "Template ID": larkText(fields[CANVA_PAGE_FIELD.TEMPLATE_ID]) ?? "",
    "Sort Order":
      fields[CANVA_PAGE_FIELD.SORT_ORDER] !== undefined
        ? larkNumber(fields[CANVA_PAGE_FIELD.SORT_ORDER])
        : undefined,
    "Layers JSON": larkText(fields[CANVA_PAGE_FIELD.LAYERS_JSON]),
    "Mappings JSON": larkText(fields[CANVA_PAGE_FIELD.MAPPINGS_JSON]) ?? "",
    "Export Jobs JSON": larkText(fields[CANVA_PAGE_FIELD.EXPORT_JOBS_JSON]),
    "Resize Jobs JSON": larkText(fields[CANVA_PAGE_FIELD.RESIZE_JOBS_JSON]),
  };
}

export async function listPages(campaignId: string): Promise<Page[]> {
  const { pages } = getTableIds();
  const res = await larkSearchRecords(
    pages,
    filterAnd(eq(CANVA_PAGE_FIELD.CAMPAIGN_ID, campaignId)),
    500,
  );
  return res.items.map((item) => larkToPage(item.record_id, item.fields));
}

export async function createPage(
  fields: Omit<Page, "record_id">,
): Promise<string> {
  const { pages } = getTableIds();
  const res = await larkCreateRecords(pages, [pageToLark(fields)]);
  return res.record_ids[0]!;
}

export async function updatePage(
  recordId: string,
  fields: Partial<Page>,
): Promise<void> {
  const { pages } = getTableIds();
  await larkUpdateRecords(pages, [
    { record_id: recordId, fields: pageToLark(fields) },
  ]);
}

export async function deletePage(recordId: string): Promise<void> {
  const { pages } = getTableIds();
  await larkDeleteRecords(pages, [recordId]);
}
