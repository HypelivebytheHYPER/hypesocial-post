/**
 * Lark HTTP Direct API Client
 * Uses the Lark HTTP Direct Worker REST endpoints for Lark Base CRUD operations.
 * Worker docs: GET https://lark-http-hype.hypelive.workers.dev/
 */

// ==================== Types ====================

interface LarkField {
  [key: string]: unknown;
}

interface LarkRecord {
  record_id: string;
  fields: LarkField;
}

interface LarkSearchResponse {
  code: number;
  msg: string;
  data: {
    items: LarkRecord[];
    total: number;
    has_more: boolean;
    page_token?: string;
  };
}

interface LarkBatchResponse {
  code: number;
  msg: string;
  data: {
    records: LarkRecord[];
  };
}

export interface LarkFilterCondition {
  field_name: string;
  operator: string;
  value: unknown[];
}

export interface LarkFilter {
  conjunction: "and" | "or";
  conditions: LarkFilterCondition[];
}

// ==================== Config ====================

function getConfig() {
  const workerUrl = process.env.LARK_HTTP_WORKER_URL;
  const appToken = process.env.LARK_APP_TOKEN;
  if (!workerUrl) throw new Error("LARK_HTTP_WORKER_URL is not set");
  if (!appToken) throw new Error("LARK_APP_TOKEN is not set");
  return { workerUrl, appToken };
}

// ==================== Filter Helpers ====================

/** Build a filter with AND conjunction */
export function filterAnd(
  ...conditions: LarkFilterCondition[]
): LarkFilter {
  return { conjunction: "and", conditions };
}

/** Build a filter with OR conjunction */
export function filterOr(
  ...conditions: LarkFilterCondition[]
): LarkFilter {
  return { conjunction: "or", conditions };
}

/** field_name == value */
export function eq(
  field_name: string,
  value: unknown,
): LarkFilterCondition {
  return { field_name, operator: "is", value: [value] };
}

/** field_name != value */
export function neq(
  field_name: string,
  value: unknown,
): LarkFilterCondition {
  return { field_name, operator: "isNot", value: [value] };
}

/** field_name >= value */
export function gte(
  field_name: string,
  value: unknown,
): LarkFilterCondition {
  return { field_name, operator: "isGreaterEqual", value: [value] };
}

/** field_name <= value */
export function lte(
  field_name: string,
  value: unknown,
): LarkFilterCondition {
  return { field_name, operator: "isLessEqual", value: [value] };
}

// ==================== Core API ====================

/**
 * POST to a Lark HTTP Direct Worker REST endpoint.
 * e.g. callLarkEndpoint("/records/search", { app_token, table_id, ... })
 */
async function callLarkEndpoint(
  path: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  const { workerUrl } = getConfig();

  const res = await fetch(`${workerUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Lark API error (${res.status}): ${text}`);
  }

  const json = await res.json();
  if (json.code !== 0) {
    throw new Error(`Lark API error (${json.code}): ${json.msg}`);
  }

  return json;
}

// ==================== Record Operations ====================

/**
 * Search records with optional structured filter and pagination.
 * POST /records/search
 */
export async function larkSearchRecords(
  tableId: string,
  filter?: LarkFilter,
  pageSize = 500,
  pageToken?: string,
): Promise<LarkSearchResponse["data"]> {
  const { appToken } = getConfig();

  const body: Record<string, unknown> = {
    app_token: appToken,
    table_id: tableId,
    page_size: pageSize,
  };
  if (filter) body.filter = filter;
  if (pageToken) body.page_token = pageToken;

  const res = (await callLarkEndpoint(
    "/records/search",
    body,
  )) as LarkSearchResponse;
  return res.data;
}

/**
 * Fetch all records matching a filter, handling pagination automatically.
 */
export async function larkSearchAllRecords(
  tableId: string,
  filter?: LarkFilter,
): Promise<LarkRecord[]> {
  const all: LarkRecord[] = [];
  let pageToken: string | undefined;

  do {
    const data = await larkSearchRecords(tableId, filter, 500, pageToken);
    if (data.items) all.push(...data.items);
    pageToken = data.page_token;
  } while (pageToken);

  return all;
}

/**
 * Create records in batch (up to 500 at a time).
 * POST /records/batch_create
 */
export async function larkCreateRecords(
  tableId: string,
  records: LarkField[],
): Promise<LarkRecord[]> {
  const { appToken } = getConfig();

  const res = (await callLarkEndpoint("/records/batch_create", {
    app_token: appToken,
    table_id: tableId,
    records: records.map((fields) => ({ fields })),
  })) as LarkBatchResponse;

  return res.data.records;
}

/**
 * Update records in batch (up to 500 at a time).
 * POST /records/batch_update
 */
export async function larkUpdateRecords(
  tableId: string,
  records: { record_id: string; fields: LarkField }[],
): Promise<LarkRecord[]> {
  const { appToken } = getConfig();

  const res = (await callLarkEndpoint("/records/batch_update", {
    app_token: appToken,
    table_id: tableId,
    records,
  })) as LarkBatchResponse;

  return res.data.records;
}

/**
 * Delete records in batch (up to 500 at a time).
 * POST /records/batch_delete
 */
export async function larkDeleteRecords(
  tableId: string,
  recordIds: string[],
): Promise<void> {
  const { appToken } = getConfig();

  await callLarkEndpoint("/records/batch_delete", {
    app_token: appToken,
    table_id: tableId,
    records: recordIds,
  });
}

// ==================== Helpers ====================

/** Convert a Lark DateTime field (ms timestamp) to ISO string. Returns "" if falsy. */
export function larkDateToISO(val: unknown): string {
  if (!val) return "";
  const n = typeof val === "number" ? val : Number(val);
  return isNaN(n) ? "" : new Date(n).toISOString();
}

/**
 * Extract plain text from a Lark text field.
 * Lark returns text as [{text: "value", type: "text"}] or plain string.
 */
export function larkText(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (Array.isArray(val)) {
    return val
      .map((v: { text?: string }) => v?.text || "")
      .join("");
  }
  return String(val);
}

/** Extract number from a Lark field. */
export function larkNumber(val: unknown): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

/** Extract boolean from a Lark checkbox field. */
export function larkBool(val: unknown): boolean {
  return val === true;
}

export type { LarkField, LarkRecord };
