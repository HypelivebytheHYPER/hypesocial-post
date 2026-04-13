import { z } from "zod";

/**
 * Canonical event envelope persisted to the Lark Base EVENTS table.
 *
 * One row per webhook delivery (deduplicated by event_id). The same shape
 * is replayed to clients via the streaming catch-up endpoint, so this is the
 * single source of truth for "what happened in the system".
 *
 * Sources:
 * - "post-for-me"  → Post For Me webhook (post lifecycle, results, accounts)
 * - "lark-base"    → Lark Base record-change webhook (settings, future tables)
 * - "callback"     → OAuth callback interception (account connection)
 */
export const EventSourceSchema = z.enum([
  "post-for-me",
  "lark-base",
  "callback",
]);

export const EventSchema = z.object({
  /** Stable, unique id used for idempotent dedupe (header-supplied or synthetic). */
  event_id: z.string().min(1),
  /** Origin of the event. */
  source: EventSourceSchema,
  /**
   * Provider event type. For Lark Bitable record changes, this is normalized
   * to `lark.record.created` / `lark.record.updated` / `lark.record.deleted`
   * regardless of the underlying `drive.file.bitable_record_changed_v1` wire
   * type, so consumers can filter cleanly without parsing action_list.
   */
  event_type: z.string().min(1),
  /** Resource the event is about (post_id, account_id, record_id). */
  resource_id: z.string().nullable(),
  /** Related post id, if known. Lets clients filter by post efficiently. */
  post_id: z.string().nullable(),
  /** Related social account id, if known. */
  social_account_id: z.string().nullable(),
  /**
   * Owning user id from NextAuth/Lark USERS table. May be null when the
   * provider doesn't tell us which user owns the resource — in that case
   * Streaming broadcasts the event to all connected sessions.
   */
  user_id: z.string().nullable(),
  /**
   * Lark Bitable table id (`tbl...`) when the event is a record change.
   * Null for non-Lark events. Lets consumers filter EVENTS by source table
   * (e.g. only watch the Posts table) without parsing payload_json.
   */
  table_id: z.string().nullable(),
  /**
   * Normalized action for Lark record changes: "created" | "updated" | "deleted".
   * Null for non-Lark events. Pulled from action_list[*].action and mapped:
   * `record_added` → created, `record_edited` → updated, `record_deleted` → deleted.
   */
  action_type: z.string().nullable(),
  /** Compact JSON of the original payload (truncated at 8KB to stay under Lark text limits). */
  payload_json: z.string(),
  /** Server-assigned receipt time (ISO). */
  received_at: z.string(),
  /** Trace ID for distributed tracing (propagated from incoming request). */
  trace_id: z.string().nullable().optional(),
  /** Request ID for request correlation (propagated from incoming request). */
  request_id: z.string().nullable().optional(),
});

export type Event = z.infer<typeof EventSchema>;
export type EventSource = z.infer<typeof EventSourceSchema>;

/**
 * Lark Base column names. Keep in sync with the table schema documented in
 * ENVIRONMENT_VARIABLES.md → "Lark EVENTS table".
 */
export const EVENT_FIELD = {
  EVENT_ID: "event_id",
  SOURCE: "source",
  EVENT_TYPE: "event_type",
  RESOURCE_ID: "resource_id",
  POST_ID: "post_id",
  SOCIAL_ACCOUNT_ID: "social_account_id",
  USER_ID: "user_id",
  /** Lark Bitable table id for record-change events. */
  TABLE_ID: "table_id",
  /** Normalized "created" | "updated" | "deleted" for Lark events. */
  ACTION_TYPE: "action_type",
  PAYLOAD_JSON: "payload_json",
  RECEIVED_AT: "received_at",
  /** Lark auto-number field — provides monotonic seq for streaming Last-Event-ID. */
  SEQ: "seq",
  /** Trace ID for distributed tracing. */
  TRACE_ID: "x-trace-id",
  /** Request ID for request correlation. */
  REQUEST_ID: "x-request-id",
} as const;

/** Maximum size of payload_json before truncation. Lark text fields cap around 100KB; leave headroom. */
export const MAX_PAYLOAD_BYTES = 8 * 1024;
