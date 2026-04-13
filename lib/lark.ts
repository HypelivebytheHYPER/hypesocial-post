/**
 * Lark HTTP Direct API Client
 * Uses the Lark HTTP Direct Worker REST endpoints for Lark Base CRUD operations.
 * Worker docs: GET https://lark-http-hype.hypelive.workers.dev/
 */

import { TRACE_HEADERS } from "@/lib/request-context";
import { PAGINATION } from "@/lib/constants";

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
  code?: number;
  msg?: string;
  data: LarkRecord[];
  total: number;
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
export function filterAnd(...conditions: LarkFilterCondition[]): LarkFilter {
  return { conjunction: "and", conditions };
}

/** Build a filter with OR conjunction */
export function filterOr(...conditions: LarkFilterCondition[]): LarkFilter {
  return { conjunction: "or", conditions };
}

/** field_name == value */
export function eq(field_name: string, value: unknown): LarkFilterCondition {
  return { field_name, operator: "is", value: [value] };
}

/** field_name != value */
export function neq(field_name: string, value: unknown): LarkFilterCondition {
  return { field_name, operator: "isNot", value: [value] };
}

/** field_name >= value */
export function gte(field_name: string, value: unknown): LarkFilterCondition {
  return { field_name, operator: "isGreaterEqual", value: [value] };
}

/** field_name <= value */
export function lte(field_name: string, value: unknown): LarkFilterCondition {
  return { field_name, operator: "isLessEqual", value: [value] };
}

/** field_name contains value */
export function contains(field_name: string, value: string): LarkFilterCondition {
  return { field_name, operator: "contains", value: [value] };
}

// ==================== Core API ====================

/**
 * POST to a Lark HTTP Direct Worker REST endpoint.
 * e.g. callLarkEndpoint("/records/search", { app_token, table_id, ... })
 * 
 * @param path - API endpoint path
 * @param body - Request body
 * @param traceHeaders - Optional trace headers to propagate (x-trace-id, x-request-id)
 */
async function callLarkEndpoint(
  path: string,
  body: Record<string, unknown>,
  traceHeaders?: Record<string, string>,
): Promise<unknown> {
  const { workerUrl } = getConfig();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  // Add API key if available
  const apiKey = process.env.LARK_API_KEY;
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }
  
  // Propagate trace headers for distributed tracing
  if (traceHeaders) {
    Object.entries(traceHeaders).forEach(([key, value]) => {
      if (key.toLowerCase().startsWith("x-")) {
        headers[key] = value;
      }
    });
  }

  const url = `${workerUrl}${path}`;

  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch (fetchErr) {
    throw new Error(`Lark fetch error to ${url}: ${fetchErr}`);
  }

  if (!res.ok) {
    let text;
    try {
      text = await res.text();
    } catch {
      text = "(could not read response body)";
    }
    throw new Error(`Lark API error (${res.status} ${res.statusText}): ${text?.substring(0, 200)}`);
  }

  let json;
  try {
    json = await res.json();
  } catch (parseErr) {
    const raw = await res.text().catch(() => "(unreadable)");
    throw new Error(`Lark JSON parse error: ${parseErr}, raw: ${raw.substring(0, 200)}`);
  }
  
  // Handle both worker format (no code/msg) and standard Lark format (with code/msg)
  if (json.code !== undefined && json.code !== 0) {
    throw new Error(`Lark API error (${json.code}): ${json.msg}`);
  }

  return json;
}

// ==================== Record Operations ====================

/**
 * Search records with optional structured filter and pagination.
 * 
 * @param tableId - Lark Base table ID
 * @param filter - Optional filter conditions
 * @param limit - Maximum records to return
 * @param traceHeaders - Optional trace headers for propagation
 */
export async function larkSearchRecords(
  tableId: string,
  filter?: LarkFilter,
  limit: number = PAGINATION.MAX_LIMIT,
  traceHeaders?: Record<string, string>,
): Promise<{ items: Array<{ record_id: string; fields: Record<string, unknown> }> }> {
  const { appToken } = getConfig();
  
  const body: Record<string, unknown> = {
    app_token: appToken,
    table_id: tableId,
    limit,
  };
  
  if (filter) {
    body.filter = filter;
  }

  const res = (await callLarkEndpoint("/records/search", body, traceHeaders)) as {
    items?: Array<{ record_id: string; fields: Record<string, unknown> }>;
    data?: {
      items?: Array<{ record_id: string; fields: Record<string, unknown> }>;
    };
  };

  // Handle both direct array and nested data format
  const items = res.items ?? res.data?.items ?? [];
  return { items };
}

/**
 * Create multiple records in a table.
 * 
 * @param tableId - Lark Base table ID
 * @param records - Array of record field objects
 * @param traceHeaders - Optional trace headers for propagation
 */
export async function larkCreateRecords(
  tableId: string,
  records: Record<string, unknown>[],
  traceHeaders?: Record<string, string>,
): Promise<{ record_ids: string[] }> {
  const { appToken } = getConfig();

  const res = (await callLarkEndpoint(
    "/records/batch-create",
    {
      app_token: appToken,
      table_id: tableId,
      records: records.map((fields) => ({ fields })),
    },
    traceHeaders,
  )) as { record_ids: string[]; data?: { record_ids: string[] } };

  return { record_ids: res.record_ids ?? res.data?.record_ids ?? [] };
}

/**
 * Update multiple records in a table.
 * 
 * @param tableId - Lark Base table ID
 * @param records - Array of records with record_id and fields
 * @param traceHeaders - Optional trace headers for propagation
 */
export async function larkUpdateRecords(
  tableId: string,
  records: Array<{ record_id: string; fields: Record<string, unknown> }>,
  traceHeaders?: Record<string, string>,
): Promise<{ record_ids: string[] }> {
  const { appToken } = getConfig();

  const res = (await callLarkEndpoint(
    "/records/batch-update",
    {
      app_token: appToken,
      table_id: tableId,
      records,
    },
    traceHeaders,
  )) as { record_ids: string[]; data?: { record_ids: string[] } };

  return { record_ids: res.record_ids ?? res.data?.record_ids ?? [] };
}

/**
 * Delete records from a table.
 * 
 * @param tableId - Lark Base table ID
 * @param recordIds - Array of record IDs to delete
 * @param traceHeaders - Optional trace headers for propagation
 */
export async function larkDeleteRecords(
  tableId: string,
  recordIds: string[],
  traceHeaders?: Record<string, string>,
): Promise<void> {
  const { appToken } = getConfig();

  await callLarkEndpoint(
    "/records/batch-delete",
    {
      app_token: appToken,
      table_id: tableId,
      record_ids: recordIds,
    },
    traceHeaders,
  );
}

// ==================== Field Value Helpers ====================

/** Extract text value from Lark field */
export function larkText(field: unknown): string | undefined {
  if (typeof field === "string") return field;
  if (field && typeof field === "object" && "text" in field) {
    return String((field as { text?: unknown }).text ?? "");
  }
  return undefined;
}

/** Extract number value from Lark field */
export function larkNumber(field: unknown): number {
  if (typeof field === "number") return field;
  if (field && typeof field === "object" && "value" in field) {
    return Number((field as { value?: unknown }).value ?? 0);
  }
  return Number(field ?? 0);
}

/** Extract array value from Lark field */
export function larkArray<T>(field: unknown): T[] {
  if (Array.isArray(field)) return field as T[];
  return [];
}

/** Convert Lark date field (ms timestamp) to ISO string */
export function larkDateToISO(field: unknown): string | undefined {
  if (typeof field === "number") {
    return new Date(field).toISOString();
  }
  if (field && typeof field === "object" && "value" in field) {
    const val = (field as { value?: number }).value;
    if (typeof val === "number") {
      return new Date(val).toISOString();
    }
  }
  return undefined;
}
