import { NextRequest, NextResponse } from "next/server";
import { appendEvent, syntheticEventId } from "@/lib/lark-events";
import {
  LarkBitableRecordChangedPayloadSchema,
  normalizeLarkRecordAction,
} from "@/lib/validations/webhook-schemas";

/**
 * POST /api/webhooks/lark-base
 *
 * Receives webhook events from Lark Open Platform when Lark Base records
 * change. Persists each event to the EVENTS table for SSE replay.
 *
 * Per Lark Open Platform spec:
 * - Must respond HTTP 200 within 3 seconds or Lark counts it as a failure
 *   and retries up to 4 times (15s, 5min, 1h, 6h — total ~7.1h window).
 * - Events are deduplicated by `header.event_id` (v2.0) or `uuid` (v1.0).
 * - URL verification challenge: respond { challenge } verbatim.
 *
 * Schema versions handled:
 * - v2.0: { schema, header: { event_id, event_type, ... }, event: {...} }
 * - v1.0: { uuid, type, event: {...} }
 * - Custom worker relay: { event_type, table_id, record_id, fields }
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid JSON" },
      { status: 400 },
    );
  }

  // Lark URL-verification challenge (must echo back synchronously)
  if (
    typeof body === "object" &&
    body !== null &&
    "challenge" in body &&
    typeof (body as { challenge: unknown }).challenge === "string"
  ) {
    return NextResponse.json({
      challenge: (body as { challenge: string }).challenge,
    });
  }

  const payload = body as Record<string, unknown>;

  // ── Specialised handler: drive.file.bitable_record_changed_v1 ─────────────
  //
  // This is THE event type hype-social subscribes to (per the cleanup audit).
  // The payload contains an `action_list` of 1+ record changes batched together
  // by Lark, so we expand into ONE EVENTS row PER action with a normalised
  // event_type (lark.record.created/updated/deleted) for clean downstream filtering.
  //
  // Idempotency: we synthesise a per-action event_id from
  // (header.event_id, action_index, record_id) so re-deliveries collapse to
  // the same row even though the original event_id is shared by all actions.
  const headerEventType =
    typeof payload.header === "object" && payload.header !== null
      ? (payload.header as Record<string, unknown>).event_type
      : undefined;

  if (headerEventType === "drive.file.bitable_record_changed_v1") {
    const parsed = LarkBitableRecordChangedPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      console.error(
        "[Lark Webhook] Bitable schema mismatch:",
        parsed.error.format(),
      );
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Invalid bitable_record_changed_v1 payload",
        },
        { status: 400 },
      );
    }

    const baseEventId = parsed.data.header.event_id;
    const tableId = parsed.data.event.table_id ?? null;
    const fileToken = parsed.data.event.file_token ?? null;
    const actions = parsed.data.event.action_list ?? [];

    if (actions.length === 0) {
      // Lark sometimes sends an empty action_list as a heartbeat. Persist
      // one row so we can audit it, but mark action_type as "none".
      try {
        const { inserted } = await appendEvent({
          event_id: baseEventId,
          source: "lark-base",
          event_type: "lark.record.changed",
          resource_id: tableId,
          table_id: tableId,
          action_type: "none",
          payload,
        });
        return NextResponse.json({
          success: true,
          event_id: baseEventId,
          event_type: "lark.record.changed",
          inserted,
          actions_processed: 0,
        });
      } catch (error) {
        console.error("[Lark Webhook] empty-action persist failed:", error);
        return NextResponse.json(
          { error: "Internal Server Error", message: "Failed to persist event" },
          { status: 500 },
        );
      }
    }

    // Persist one EVENTS row per action. Each gets a deterministic id derived
    // from the original event_id + action index + record_id so retries dedupe.
    const results: Array<{
      event_id: string;
      event_type: string;
      action_type: string;
      record_id: string;
      inserted: boolean;
    }> = [];

    try {
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        if (!action) continue;
        const norm = normalizeLarkRecordAction(action.action);
        const perActionId = syntheticEventId([
          baseEventId,
          String(i),
          action.record_id,
        ]);
        const { inserted } = await appendEvent({
          event_id: perActionId,
          source: "lark-base",
          event_type: norm.event_type,
          resource_id: action.record_id,
          table_id: tableId,
          action_type: norm.action_type,
          payload: { ...payload, __action_index: i, __action: action },
        });
        results.push({
          event_id: perActionId,
          event_type: norm.event_type,
          action_type: norm.action_type,
          record_id: action.record_id,
          inserted,
        });
      }

      const inserted_count = results.filter((r) => r.inserted).length;
      console.log(
        `[Lark Webhook] bitable_record_changed table=${tableId ?? "?"} actions=${actions.length} inserted=${inserted_count}`,
      );

      return NextResponse.json({
        success: true,
        event_id: baseEventId,
        file_token: fileToken,
        table_id: tableId,
        actions_processed: actions.length,
        inserted_count,
        results,
      });
    } catch (error) {
      console.error("[Lark Webhook] bitable persist failed:", error);
      return NextResponse.json(
        { error: "Internal Server Error", message: "Failed to persist event" },
        { status: 500 },
      );
    }
  }

  // ── Generic v1.0 / v2.0 / custom-relay handler ────────────────────────────
  //
  // Fallback for other Lark event types (in case we ever subscribe to more)
  // and for the lark-http-hype worker's custom relay shape.
  let event_id: string;
  let event_type: string;
  let resource_id: string | null = null;

  if (typeof payload.schema === "string" && payload.schema.startsWith("2.")) {
    // v2.0 envelope
    const header = (payload.header ?? {}) as Record<string, unknown>;
    event_id = String(header.event_id ?? "");
    event_type = String(header.event_type ?? "lark.unknown");
    const event = (payload.event ?? {}) as Record<string, unknown>;
    resource_id =
      (event.record_id as string | undefined) ??
      (event.resource_id as string | undefined) ??
      null;
  } else if (typeof payload.uuid === "string") {
    // v1.0 envelope
    event_id = payload.uuid as string;
    event_type = String(payload.type ?? "lark.unknown");
    const event = (payload.event ?? {}) as Record<string, unknown>;
    resource_id =
      (event.record_id as string | undefined) ??
      (event.chat_id as string | undefined) ??
      null;
  } else {
    // Custom relay shape used by lark-http-hype worker
    event_type = String(
      payload.event_type ?? payload.type ?? "lark.record.unknown",
    );
    resource_id =
      (payload.record_id as string | undefined) ??
      (payload.recordId as string | undefined) ??
      (payload.id as string | undefined) ??
      null;
    const table_id =
      (payload.table_id as string | undefined) ??
      (payload.tableId as string | undefined) ??
      "";
    if (!resource_id || !table_id) {
      console.error("[Lark Webhook] Missing table_id or record_id:", {
        table_id,
        resource_id,
      });
      return NextResponse.json(
        { error: "Bad Request", message: "Missing table_id or record_id" },
        { status: 400 },
      );
    }
    event_id = syntheticEventId([event_type, table_id, resource_id]);
  }

  if (!event_id) {
    return NextResponse.json(
      { error: "Bad Request", message: "Missing event_id / uuid" },
      { status: 400 },
    );
  }

  try {
    const { inserted } = await appendEvent({
      event_id,
      source: "lark-base",
      event_type,
      resource_id,
      post_id: null,
      social_account_id: null,
      user_id: null,
      payload,
    });

    console.log(
      `[Lark Webhook] ${inserted ? "OK" : "DUP"} ${event_type} ${resource_id ?? "-"}`,
    );

    return NextResponse.json({
      success: true,
      event_id,
      event_type,
      inserted,
    });
  } catch (error) {
    console.error("[Lark Webhook] EVENTS persistence failed:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to persist event",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/webhooks/lark-base
 *
 * Health probe — returns the EVENTS table id and last-known seq if the
 * client is curious. Does NOT return event content (use /api/events/stream
 * for that).
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/webhooks/lark-base",
    persisted_to: "lark-events-table",
    timestamp: Date.now(),
  });
}
