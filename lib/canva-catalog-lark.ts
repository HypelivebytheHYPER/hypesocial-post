/**
 * Canva Catalog Lark Base persistence layer
 * Uses existing lib/lark.ts helpers
 */

import {
  larkSearchRecords,
  larkCreateRecords,
  larkUpdateRecords,
  larkDeleteRecords,
  eq,
  filterAnd,
  type LarkFilter,
} from "@/lib/lark";

// ==================== Config ====================

function getTableIds() {
  return {
    campaigns: process.env.LARK_TABLE_ID_CANVA_CAMPAIGNS!,
    products: process.env.LARK_TABLE_ID_CANVA_PRODUCTS!,
    pages: process.env.LARK_TABLE_ID_CANVA_PAGES!,
  };
}

// ==================== Campaigns ====================

export interface Campaign {
  record_id?: string;
  Name: string;
  "Date Start"?: string;
  "Date End"?: string;
  Status?: string;
}

export async function listCampaigns(): Promise<Campaign[]> {
  const { campaigns } = getTableIds();
  const res = await larkSearchRecords(campaigns, undefined, 500);
  return res.items.map((item) => ({
    record_id: item.record_id,
    ...item.fields,
  })) as Campaign[];
}

export async function createCampaign(fields: Omit<Campaign, "record_id">): Promise<string> {
  const { campaigns } = getTableIds();
  const res = await larkCreateRecords(campaigns, [fields]);
  return res.record_ids[0]!;
}

export async function updateCampaign(recordId: string, fields: Partial<Campaign>): Promise<void> {
  const { campaigns } = getTableIds();
  await larkUpdateRecords(campaigns, [{ record_id: recordId, fields }]);
}

export async function deleteCampaign(recordId: string): Promise<void> {
  const { campaigns } = getTableIds();
  await larkDeleteRecords(campaigns, [recordId]);
}

// ==================== Products ====================

export interface Product {
  record_id?: string;
  "Campaign ID": string;
  SKU?: string;
  Name: string;
  Price: string;
  Promo?: string;
  "Image URL": string;
  Category?: string;
  "Sort Order"?: number;
}

export async function listProducts(campaignId: string): Promise<Product[]> {
  const { products } = getTableIds();
  const res = await larkSearchRecords(products, filterAnd(eq("Campaign ID", campaignId)), 500);
  return res.items.map((item) => ({
    record_id: item.record_id,
    ...item.fields,
  })) as Product[];
}

export async function createProducts(records: Omit<Product, "record_id">[]): Promise<string[]> {
  const { products } = getTableIds();
  const res = await larkCreateRecords(products, records);
  return res.record_ids;
}

export async function updateProducts(
  records: Array<{ record_id: string; fields: Partial<Product> }>,
): Promise<void> {
  const { products } = getTableIds();
  await larkUpdateRecords(products, records);
}

export async function deleteProducts(recordIds: string[]): Promise<void> {
  const { products } = getTableIds();
  await larkDeleteRecords(products, recordIds);
}

// ==================== Pages ====================

export interface Page {
  record_id?: string;
  "Campaign ID": string;
  "Page Name": string;
  "Template ID": string;
  "Mappings JSON": string;
  "Design ID"?: string;
  "Resize Jobs JSON"?: string;
  "Export Jobs JSON"?: string;
  "Layers JSON"?: string;
  "Sort Order"?: number;
}

export async function listPages(campaignId: string): Promise<Page[]> {
  const { pages } = getTableIds();
  const res = await larkSearchRecords(pages, filterAnd(eq("Campaign ID", campaignId)), 500);
  return res.items.map((item) => ({
    record_id: item.record_id,
    ...item.fields,
  })) as Page[];
}

export async function createPage(fields: Omit<Page, "record_id">): Promise<string> {
  const { pages } = getTableIds();
  const res = await larkCreateRecords(pages, [fields]);
  return res.record_ids[0]!;
}

export async function updatePage(recordId: string, fields: Partial<Page>): Promise<void> {
  const { pages } = getTableIds();
  await larkUpdateRecords(pages, [{ record_id: recordId, fields }]);
}

export async function deletePage(recordId: string): Promise<void> {
  const { pages } = getTableIds();
  await larkDeleteRecords(pages, [recordId]);
}
