import { NextRequest, NextResponse } from "next/server";
import { appendEvent, syntheticEventId } from "@/lib/lark-events";
import {
  LarkBitableRecordChangedPayloadSchema,
  normalizeLarkRecordAction,
} from "@/lib/validations/webhook-schemas";
import {
  createRequestContext,
  formatRequestLog,
  TRACE_HEADERS,
  runWithContext,
} from "@/lib/request-context";

/**
 * POST /api/webhooks/lark-base
 *
 * Receives webhook events from Lark Open Platform when Lark Base records
 * change. Persists each event to the EVENTS table for streaming replay.
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
  // Create request context for tracing
  const ctx = createRequestContext(request.headers, {
    operation: "receive_lark_webhook",
    source: "lark-base",
  });

  return runWithContext(ctx, async () => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      console.warn(JSON.stringify(formatRequestLog(ctx, "POST", "/api/webhooks/lark-base", 400, {
        error: "Invalid JSON",
      })));

      return NextResponse.json(
        { 
          error: "Bad Request", 
          message: "Invalid JSON",
          request_id: ctx.requestId,
          trace_id: ctx.traceId,
        },
        { 
          status: 400,
          headers: {
            [TRACE_HEADERS.REQUEST_ID]: ctx.requestId,
            [TRACE_HEADERS.TRACE_ID]: ctx.traceId,
          },
        },
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
      }, {
        headers: {
          [TRACE_HEADERS.REQUEST_ID]: ctx.requestId,
          [TRACE_HEADERS.TRACE_ID]: ctx.traceId,
        },
      });
    }

    const payload = body as Record<string, unknown>;

    // ── Specialised handler: drive.file.bitable_record_changed_v1 ─────────────
    const headerEventType =
      typeof payload.header === "object" && payload.header !== null
        ? (payload.header as Record<string, unknown>).event_type
        : undefined;

    if (headerEventType === "drive.file.bitable_record_changed_v1") {
      const parsed = LarkBitableRecordChangedPayloadSchema.safeParse(payload);
      if (!parsed.success) {
        console.error(
          JSON.stringify(formatRequestLog(ctx, "POST", "/api/webhooks/lark-base", 400, {
            error: "Invalid bitable_record_changed_v1 payload",
            schema_errors: parsed.error.format(),
          })),
        );
        return NextResponse.json(
          {
            error: "Bad Request",
            message: "Invalid bitable_record_changed_v1 payload",
            request_id: ctx.requestId,
            trace_id: ctx.traceId,
          },
          { 
            status: 400,
            headers: {
              [TRACE_HEADERS.REQUEST_ID]: ctx.requestId,
              [TRACE_HEADERS.TRACE_ID]: ctx.traceId,
            },
          },
        );
      }

      const baseEventId = parsed.data.header.event_id;
      const tableId = parsed.data.event.table_id ?? null;
      const fileToken = parsed.data.event.file_token ?? null;
      const actions = parsed.data.event.action_list ?? [];

      ctx.metadata.event_type = "lark.record.changed";
      ctx.metadata.table_id = tableId;
      ctx.metadata.lark_event_id = baseEventId;

      if (actions.length === 0) {
        // Lark sometimes sends an empty action_list as a heartbeat
        try {
          const { inserted } = await appendEvent({
            event_id: baseEventId,
            source: "lark-base",
            event_type: "lark.record.changed",
            resource_id: tableId,
            table_id: tableId,
            action_type: "none",
            payload,
            trace_id: ctx.traceId,
            request_id: ctx.requestId,
          }, { [TRACE_HEADERS.TRACE_ID]: ctx.traceId, [TRACE_HEADERS.REQUEST_ID]: ctx.requestId });

          console.log(JSON.stringify(formatRequestLog(ctx, "POST", "/api/webhooks/lark-base", 200, {
            event_type: "lark.record.changed",
            actions_processed: 0,
            inserted,
          })));

          return NextResponse.json({
            success: true,
            event_id: baseEventId,
            event_type: "lark.record.changed",
            inserted,
            actions_processed: 0,
            request_id: ctx.requestId,
            trace_id: ctx.traceId,
          }, {
            headers: {
              [TRACE_HEADERS.REQUEST_ID]: ctx.requestId,
              [TRACE_HEADERS.TRACE_ID]: ctx.traceId,
            },
          });
        } catch (error) {
          console.error(JSON.stringify(formatRequestLog(ctx, "POST", "/api/webhooks/lark-base", 500, {
            error: "Failed to persist event",
            details: error instanceof Error ? error.message : "Unknown",
          })));

          return NextResponse.json(
            { 
              error: "Internal Server Error", 
              message: "Failed to persist event",
              request_id: ctx.requestId,
              trace_id: ctx.traceId,
            },
            { 
              status: 500,
              headers: {
                [TRACE_HEADERS.REQUEST_ID]: ctx.requestId,
                [TRACE_HEADERS.TRACE_ID]: ctx.traceId,
              },
            },
          );
        }
      }

      // Persist one EVENTS row per action
      const results: Array<{
        event_id: string;
        event_type: string;
        action_type: string;
        record_id: string;
        inserted: boolean;
      }> = [];

      try {
        const traceHeaders = { [TRACE_HEADERS.TRACE_ID]: ctx.traceId, [TRACE_HEADERS.REQUEST_ID]: ctx.requestId };

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
            trace_id: ctx.traceId,
            request_id: ctx.requestId,
          }, traceHeaders);
          results.push({
            event_id: perActionId,
            event_type: norm.event_type,
            action_type: norm.action_type,
            record_id: action.record_id,
            inserted,
          });
        }

        const inserted_count = results.filter((r) => r.inserted).length;
        console.log(JSON.stringify(formatRequestLog(ctx, "POST", "/api/webhooks/lark-base", 200, {
          table_id: tableId,
          actions_count: actions.length,
          inserted_count,
          results: results.map(r => ({ event_id: r.event_id, inserted: r.inserted })),
        })));

        return NextResponse.json({
          success: true,
          event_id: baseEventId,
          file_token: fileToken,
          table_id: tableId,
          actions_processed: actions.length,
          inserted_count,
          results,
          request_id: ctx.requestId,
          trace_id: ctx.traceId,
        }, {
          headers: {
            [TRACE_HEADERS.REQUEST_ID]: ctx.requestId,
            [TRACE_HEADERS.TRACE_ID]: ctx.traceId,
          },
        });
      } catch (error) {
        console.error(JSON.stringify(formatRequestLog(ctx, "POST", "/api/webhooks/lark-base", 500, {
          error: "Failed to persist events",
          details: error instanceof Error ? error.message : "Unknown",
        })));

        return NextResponse.json(
          { 
            error: "Internal Server Error", 
            message: "Failed to persist event",
            request_id: ctx.requestId,
            trace_id: ctx.traceId,
          },
          { 
            status: 500,
            headers: {
              [TRACE_HEADERS.REQUEST_ID]: ctx.requestId,
              [TRACE_HEADERS.TRACE_ID]: ctx.traceId,
            },
          },
        );
      }
    }

    // ── Generic v1.0 / v2.0 / custom-relay handler ────────────────────────────
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
        console.error(JSON.stringify(formatRequestLog(ctx, "POST", "/api/webhooks/lark-base", 400, {
          error: "Missing table_id or record_id",
          table_id,
          resource_id,
        })));

        return NextResponse.json(
          { 
            error: "Bad Request", 
            message: "Missing table_id or record_id",
            request_id: ctx.requestId,
            trace_id: ctx.traceId,
          },
          { 
            status: 400,
            headers: {
              [TRACE_HEADERS.REQUEST_ID]: ctx.requestId,
              [TRACE_HEADERS.TRACE_ID]: ctx.traceId,
            },
          },
        );
      }
      event_id = syntheticEventId([event_type, table_id, resource_id]);
    }

    if (!event_id) {
      console.warn(JSON.stringify(formatRequestLog(ctx, "POST", "/api/webhooks/lark-base", 400, {
        error: "Missing event_id / uuid",
      })));

      return NextResponse.json(
        { 
          error: "Bad Request", 
          message: "Missing event_id / uuid",
          request_id: ctx.requestId,
          trace_id: ctx.traceId,
        },
        { 
          status: 400,
          headers: {
            [TRACE_HEADERS.REQUEST_ID]: ctx.requestId,
            [TRACE_HEADERS.TRACE_ID]: ctx.traceId,
          },
        },
      );
    }

    ctx.metadata.event_type = event_type;
    ctx.metadata.resource_id = resource_id;

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
        trace_id: ctx.traceId,
        request_id: ctx.requestId,
      }, { [TRACE_HEADERS.TRACE_ID]: ctx.traceId, [TRACE_HEADERS.REQUEST_ID]: ctx.requestId });

      console.log(JSON.stringify(formatRequestLog(ctx, "POST", "/api/webhooks/lark-base", 200, {
        event_type,
        resource_id,
        inserted,
      })));

      return NextResponse.json({
        success: true,
        event_id,
        event_type,
        inserted,
        request_id: ctx.requestId,
        trace_id: ctx.traceId,
      }, {
        headers: {
          [TRACE_HEADERS.REQUEST_ID]: ctx.requestId,
          [TRACE_HEADERS.TRACE_ID]: ctx.traceId,
        },
      });
    } catch (error) {
      console.error(JSON.stringify(formatRequestLog(ctx, "POST", "/api/webhooks/lark-base", 500, {
        error: "EVENTS persistence failed",
        details: error instanceof Error ? error.message : "Unknown",
      })));

      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "Failed to persist event",
          request_id: ctx.requestId,
          trace_id: ctx.traceId,
        },
        { 
          status: 500,
          headers: {
            [TRACE_HEADERS.REQUEST_ID]: ctx.requestId,
            [TRACE_HEADERS.TRACE_ID]: ctx.traceId,
          },
        },
      );
    }
  });
}

/**
 * GET /api/webhooks/lark-base
 *
 * Health probe — returns the EVENTS table id and last-known seq
 */
export async function GET(request: NextRequest) {
  const ctx = createRequestContext(request.headers, {
    operation: "lark_webhook_health",
  });

  return NextResponse.json({
    status: "ok",
    endpoint: "/api/webhooks/lark-base",
    persisted_to: "lark-events-table",
    timestamp: Date.now(),
    request_id: ctx.requestId,
    trace_id: ctx.traceId,
  }, {
    headers: {
      [TRACE_HEADERS.REQUEST_ID]: ctx.requestId,
      [TRACE_HEADERS.TRACE_ID]: ctx.traceId,
    },
  });
}
