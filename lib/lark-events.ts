/**
 * Lark Base EVENTS table — persistence layer for the unified webhook event bus.
 *
 * The EVENTS table is the single source of truth for everything that has
 * happened in the system. Both webhook receivers (Post For Me, Lark Base)
 * write here. The streaming catch-up endpoint reads from here. Polling fallbacks
 * also read from here. This file owns all writes/reads against that one table.
 *
 * Idempotency: every row is keyed by `event_id`. Duplicate writes are no-ops.
 *
 * Ordering: Lark's auto-number `seq` field gives a monotonic per-row sequence
 * which we use as the streaming Last-Event-ID for catch-up after disconnect.
 *
 * @see lib/validations/events.ts for the canonical schema
 */

import { createHash } from "crypto";
import {
  larkSearchRecords,
  larkCreateRecords,
  filterAnd,
  eq,
  gte,
  larkText,
  larkNumber,
  larkDateToISO,
} from "@/lib/lark";
import {
  EVENT_FIELD,
  EventSchema,
  MAX_PAYLOAD_BYTES,
  type Event,
  type EventSource,
} from "@/lib/validations/events";
import { TRACE_HEADERS } from "@/lib/request-context";
import { PAGINATION } from "@/lib/constants";

function getTableId(): string | null {
  const id = process.env.LARK_EVENTS_TABLE_ID;
  if (!id) {
    console.warn("[LarkEvents] LARK_EVENTS_TABLE_ID not set — events will be logged but not persisted");
    return null;
  }
  return id;
}

/**
 * Compute a stable synthetic event_id when the upstream provider doesn't send one.
 *
 * For Post For Me: hash(event_type | resource_id | provider_timestamp)
 * For Lark Base:   hash(event_type | record_id | created_time)
 *
 * Two deliveries of the same provider event (e.g. a retry) collapse to the
 * same id and dedupe at write time.
 */
export function syntheticEventId(parts: ReadonlyArray<string | undefined>): string {
  const hash = createHash("sha256");
  for (const p of parts) hash.update(p ?? "");
  hash.update("hype-social-v1");
  return `evt_${hash.digest("hex").slice(0, 32)}`;
}

/**
 * Truncate payload JSON to fit Lark's text-field budget while preserving the
 * fact that truncation happened (so consumers don't try to JSON.parse it blindly).
 */
function truncatePayload(payload: unknown): string {
  let json: string;
  try {
    json = JSON.stringify(payload);
  } catch {
    return JSON.stringify({ __error: "payload not serializable" });
  }
  if (Buffer.byteLength(json, "utf8") <= MAX_PAYLOAD_BYTES) return json;
  // Cut at byte boundary, then mark as truncated. Don't try to keep the JSON
  // valid — consumers should treat truncated payloads as opaque.
  const head = Buffer.from(json, "utf8")
    .subarray(0, MAX_PAYLOAD_BYTES - 64)
    .toString("utf8");
  return JSON.stringify({ __truncated: true, head });
}

export interface AppendEventInput {
  event_id: string;
  source: EventSource;
  event_type: string;
  resource_id?: string | null;
  post_id?: string | null;
  social_account_id?: string | null;
  user_id?: string | null;
  /** Lark Bitable table id for record-change events. */
  table_id?: string | null;
  /** Normalized "created" | "updated" | "deleted" for Lark record events. */
  action_type?: string | null;
  payload: unknown;
  /** Trace context for debugging */
  trace_id?: string | null;
  request_id?: string | null;
}

export interface AppendEventResult {
  /** True if a new row was written; false if the event_id already existed. */
  inserted: boolean;
  event: Event;
}

/**
 * Idempotent append. Looks up event_id first; if it exists, returns the
 * existing row. Otherwise writes one record and returns it.
 *
 * @param input - Event data to append
 * @param traceHeaders - Optional trace headers to propagate to downstream services
 */
export async function appendEvent(
  input: AppendEventInput,
  traceHeaders?: Record<string, string>,
): Promise<AppendEventResult> {
  const tableId = getTableId();
  
  // Graceful degradation: if no table configured, just log and return
  if (!tableId) {
    const event: Event = EventSchema.parse({
      event_id: input.event_id,
      source: input.source,
      event_type: input.event_type,
      resource_id: input.resource_id ?? null,
      post_id: input.post_id ?? null,
      social_account_id: input.social_account_id ?? null,
      user_id: input.user_id ?? null,
      table_id: input.table_id ?? null,
      action_type: input.action_type ?? null,
      payload_json: truncatePayload(input.payload),
      received_at: new Date().toISOString(),
      trace_id: input.trace_id ?? null,
      request_id: input.request_id ?? null,
    });
    
    console.log("[LarkEvents] Event not persisted (no table):", {
      event_id: event.event_id,
      event_type: event.event_type,
      source: event.source,
    });
    
    return { inserted: true, event };
  }

  const event: Event = EventSchema.parse({
    event_id: input.event_id,
    source: input.source,
    event_type: input.event_type,
    resource_id: input.resource_id ?? null,
    post_id: input.post_id ?? null,
    social_account_id: input.social_account_id ?? null,
    user_id: input.user_id ?? null,
    table_id: input.table_id ?? null,
    action_type: input.action_type ?? null,
    payload_json: truncatePayload(input.payload),
    received_at: new Date().toISOString(),
    // Trace context stored in payload for debugging
    trace_id: input.trace_id ?? null,
    request_id: input.request_id ?? null,
  });

  // Idempotent dedupe by event_id
  // Wrap in try-catch to handle case where table doesn't exist (404)
  try {
    const existing = await larkSearchRecords(
      tableId,
      filterAnd(eq(EVENT_FIELD.EVENT_ID, event.event_id)),
      1,
      traceHeaders,
    );
    if (existing.items.length > 0) {
      return { inserted: false, event };
    }

    // Include trace context in the record for debugging
    const fields: Record<string, unknown> = {
      [EVENT_FIELD.EVENT_ID]: event.event_id,
      [EVENT_FIELD.SOURCE]: event.source,
      [EVENT_FIELD.EVENT_TYPE]: event.event_type,
      [EVENT_FIELD.RESOURCE_ID]: event.resource_id ?? "",
      [EVENT_FIELD.POST_ID]: event.post_id ?? "",
      [EVENT_FIELD.SOCIAL_ACCOUNT_ID]: event.social_account_id ?? "",
      [EVENT_FIELD.USER_ID]: event.user_id ?? "",
      [EVENT_FIELD.TABLE_ID]: event.table_id ?? "",
      [EVENT_FIELD.ACTION_TYPE]: event.action_type ?? "",
      [EVENT_FIELD.PAYLOAD_JSON]: event.payload_json,
      // Lark DateTime fields take ms epoch, not ISO
      [EVENT_FIELD.RECEIVED_AT]: Date.parse(event.received_at),
    };

    // Add trace context if provided (stored in payload or dedicated fields if available)
    if (input.trace_id) {
      fields[TRACE_HEADERS.TRACE_ID] = input.trace_id;
    }
    if (input.request_id) {
      fields[TRACE_HEADERS.REQUEST_ID] = input.request_id;
    }

    await larkCreateRecords(tableId, [fields], traceHeaders);

    return { inserted: true, event };
  } catch (error) {
    // If table not found (404), log warning and return event without persisting
    const isNotFound = error instanceof Error && 
      (error.message.includes("404") || error.message.includes("Not found"));
    
    if (isNotFound) {
      console.warn("[LarkEvents] EVENTS table not found (404), event logged but not persisted:", {
        event_id: event.event_id,
        event_type: event.event_type,
        table_id: tableId,
      });
      return { inserted: true, event };
    }
    
    // Re-throw other errors
    throw error;
  }
}

/**
 * Wire-format event used by the streaming endpoint and React hook. Includes the
 * monotonic `seq` from Lark so clients can track Last-Event-ID.
 */
export interface WireEvent extends Event {
  seq: number;
}

function rowToWireEvent(row: { fields: Record<string, unknown> }): WireEvent | null {
  const event_id = larkText(row.fields[EVENT_FIELD.EVENT_ID]);
  if (!event_id) return null;

  return {
    event_id,
    source: (larkText(row.fields[EVENT_FIELD.SOURCE]) || "post-for-me") as EventSource,
    event_type: larkText(row.fields[EVENT_FIELD.EVENT_TYPE]) ?? "",
    resource_id: larkText(row.fields[EVENT_FIELD.RESOURCE_ID]) ?? null,
    post_id: larkText(row.fields[EVENT_FIELD.POST_ID]) ?? null,
    social_account_id:
      larkText(row.fields[EVENT_FIELD.SOCIAL_ACCOUNT_ID]) ?? null,
    user_id: larkText(row.fields[EVENT_FIELD.USER_ID]) ?? null,
    table_id: larkText(row.fields[EVENT_FIELD.TABLE_ID]) ?? null,
    action_type: larkText(row.fields[EVENT_FIELD.ACTION_TYPE]) ?? null,
    payload_json: larkText(row.fields[EVENT_FIELD.PAYLOAD_JSON]) ?? "",
    received_at: larkDateToISO(row.fields[EVENT_FIELD.RECEIVED_AT]) ?? new Date().toISOString(),
    seq: larkNumber(row.fields[EVENT_FIELD.SEQ]),
    trace_id: larkText(row.fields[TRACE_HEADERS.TRACE_ID]) ?? null,
    request_id: larkText(row.fields[TRACE_HEADERS.REQUEST_ID]) ?? null,
  };
}

/**
 * Fetch events with seq strictly greater than `sinceSeq`. Used by:
 * - Streaming endpoint on (re)connect to replay missed events
 * - Streaming endpoint's tail-loop while the connection is open
 * - The diagnostics page
 *
 * Pass `userId` to scope to a single user. Pass `null` to fetch global events
 * (current behavior — see file header re multi-tenant filtering).
 * 
 * @param sinceSeq - Sequence number to start from (exclusive)
 * @param opts - Options including userId filter, limit, and trace headers
 */
export async function getEventsSince(
  sinceSeq: number,
  opts: { 
    userId?: string | null; 
    limit?: number;
    traceHeaders?: Record<string, string>;
  } = {},
): Promise<WireEvent[]> {
  const tableId = getTableId();
  if (!tableId) {
    console.warn("[LarkEvents] getEventsSince: no table configured");
    return [];
  }
  
  try {
    const limit = Math.min(opts.limit ?? PAGINATION.MAX_PAGE_SIZE, PAGINATION.MAX_LIMIT);

    const conditions = [gte(EVENT_FIELD.SEQ, sinceSeq + 1)];
    if (opts.userId) {
      conditions.push(eq(EVENT_FIELD.USER_ID, opts.userId));
    }

    const result = await larkSearchRecords(
      tableId,
      filterAnd(...conditions),
      limit,
      opts.traceHeaders,
    );

    return result.items
      .map(rowToWireEvent)
      .filter((e): e is WireEvent => e !== null)
      .sort((a, b) => a.seq - b.seq);
  } catch (error) {
    // If table not found (404), return empty array
    const isNotFound = error instanceof Error && 
      (error.message.includes("404") || error.message.includes("Not found"));
    
    if (isNotFound) {
      console.warn("[LarkEvents] getEventsSince: table not found (404), returning empty");
      return [];
    }
    
    // Re-throw other errors
    throw error;
  }
}

/**
 * Lookup a single event by id (for verification + diagnostics).
 * 
 * @param event_id - Event ID to look up
 * @param traceHeaders - Optional trace headers for propagation
 */
export async function getEventById(
  event_id: string,
  traceHeaders?: Record<string, string>,
): Promise<WireEvent | null> {
  const tableId = getTableId();
  if (!tableId) {
    console.warn("[LarkEvents] getEventById: no table configured");
    return null;
  }
  
  try {
    const result = await larkSearchRecords(
      tableId,
      filterAnd(eq(EVENT_FIELD.EVENT_ID, event_id)),
      1,
      traceHeaders,
    );
    const first = result.items[0];
    if (!first) return null;
    return rowToWireEvent(first);
  } catch (error) {
    // If table not found (404), return null (event doesn't exist)
    const isNotFound = error instanceof Error && 
      (error.message.includes("404") || error.message.includes("Not found"));
    
    if (isNotFound) {
      console.warn("[LarkEvents] getEventById: table not found (404), treating as no existing event");
      return null;
    }
    
    // Re-throw other errors
    throw error;
  }
}
