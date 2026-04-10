/**
 * Lark Base EVENTS table — persistence layer for the unified webhook event bus.
 *
 * The EVENTS table is the single source of truth for everything that has
 * happened in the system. Both webhook receivers (Post For Me, Lark Base)
 * write here. The SSE catch-up endpoint reads from here. Polling fallbacks
 * also read from here. This file owns all writes/reads against that one table.
 *
 * Idempotency: every row is keyed by `event_id`. Duplicate writes are no-ops.
 *
 * Ordering: Lark's auto-number `seq` field gives a monotonic per-row sequence
 * which we use as the SSE Last-Event-ID for catch-up after disconnect.
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

function getTableId(): string {
  const id = process.env.LARK_EVENTS_TABLE_ID;
  if (!id) {
    throw new Error(
      "LARK_EVENTS_TABLE_ID is not set — see ENVIRONMENT_VARIABLES.md " +
        "for the EVENTS table schema and create it in Lark Base.",
    );
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
 * Race condition note: two concurrent requests with the same event_id may
 * both miss the lookup and both insert. That's acceptable — duplicates show
 * up as two rows with identical event_id, and consumers dedupe by event_id
 * on read. We pay the cost (extra row) instead of holding a distributed lock.
 */
export async function appendEvent(
  input: AppendEventInput,
): Promise<AppendEventResult> {
  const tableId = getTableId();

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
  });

  // Idempotent dedupe by event_id
  const existing = await larkSearchRecords(
    tableId,
    filterAnd(eq(EVENT_FIELD.EVENT_ID, event.event_id)),
    1,
  );
  if (existing.items.length > 0) {
    return { inserted: false, event };
  }

  await larkCreateRecords(tableId, [
    {
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
    },
  ]);

  return { inserted: true, event };
}

/**
 * Wire-format event used by the SSE endpoint and React hook. Includes the
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
    event_type: larkText(row.fields[EVENT_FIELD.EVENT_TYPE]),
    resource_id: larkText(row.fields[EVENT_FIELD.RESOURCE_ID]) || null,
    post_id: larkText(row.fields[EVENT_FIELD.POST_ID]) || null,
    social_account_id:
      larkText(row.fields[EVENT_FIELD.SOCIAL_ACCOUNT_ID]) || null,
    user_id: larkText(row.fields[EVENT_FIELD.USER_ID]) || null,
    table_id: larkText(row.fields[EVENT_FIELD.TABLE_ID]) || null,
    action_type: larkText(row.fields[EVENT_FIELD.ACTION_TYPE]) || null,
    payload_json: larkText(row.fields[EVENT_FIELD.PAYLOAD_JSON]),
    received_at: larkDateToISO(row.fields[EVENT_FIELD.RECEIVED_AT]),
    seq: larkNumber(row.fields[EVENT_FIELD.SEQ]),
  };
}

/**
 * Fetch events with seq strictly greater than `sinceSeq`. Used by:
 * - SSE endpoint on (re)connect to replay missed events
 * - SSE endpoint's tail-loop while the connection is open
 * - The diagnostics page
 *
 * Pass `userId` to scope to a single user. Pass `null` to fetch global events
 * (current behavior — see file header re multi-tenant filtering).
 */
export async function getEventsSince(
  sinceSeq: number,
  opts: { userId?: string | null; limit?: number } = {},
): Promise<WireEvent[]> {
  const tableId = getTableId();
  const limit = Math.min(opts.limit ?? 100, 500);

  const conditions = [gte(EVENT_FIELD.SEQ, sinceSeq + 1)];
  if (opts.userId) {
    conditions.push(eq(EVENT_FIELD.USER_ID, opts.userId));
  }

  const result = await larkSearchRecords(
    tableId,
    filterAnd(...conditions),
    limit,
  );

  return result.items
    .map(rowToWireEvent)
    .filter((e): e is WireEvent => e !== null)
    .sort((a, b) => a.seq - b.seq);
}

/**
 * Lookup a single event by id (for verification + diagnostics).
 */
export async function getEventById(
  event_id: string,
): Promise<WireEvent | null> {
  const tableId = getTableId();
  const result = await larkSearchRecords(
    tableId,
    filterAnd(eq(EVENT_FIELD.EVENT_ID, event_id)),
    1,
  );
  const first = result.items[0];
  if (!first) return null;
  return rowToWireEvent(first);
}
