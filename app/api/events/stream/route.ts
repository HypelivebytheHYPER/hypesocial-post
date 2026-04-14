import { NextRequest } from "next/server";

import { getEventsSince, type WireEvent } from "@/lib/lark-events";

/**
 * GET /api/events/stream
 *
 * HTTP server-push streaming endpoint that delivers EVENTS rows to authenticated
 * browsers in near-real-time. The client opens an EventSource connection and 
 * stays connected; the server replays missed events on (re)connect using
 * Last-Event-ID, then tails the EVENTS table for new rows.
 *
 * ## Why HTTP streaming instead of WebSockets
 *
 * Per Vercel + Mar 2026 HTTP streaming production guide:
 * - One-way server→client matches our pattern (we never push from browser)
 * - Standard HTTP — works through CDNs, proxies, corporate firewalls
 * - Native EventSource API in browsers, ~zero client code
 * - Auto-reconnect with Last-Event-ID built into the EventSource spec
 * - Lower per-connection memory than WebSockets
 *
 * ## Required headers (Vercel-specific)
 *
 * - `X-Accel-Buffering: no` — without this Vercel may buffer the response
 *   and clients see chunks delayed by minutes. **Do not remove.**
 * - `Content-Type: text/event-stream` — defines the streaming wire format
 * - `Cache-Control: no-cache, no-transform` — prevents intermediate caching
 * - `Connection: keep-alive` — explicit, even though HTTP/2 ignores it
 *
 * ## Catch-up protocol
 *
 * 1. Browser opens `/api/events/stream`. EventSource sends `Last-Event-ID`
 *    header automatically if it has one from a previous connection.
 * 2. Server reads `Last-Event-ID`, queries Lark EVENTS table for all rows
 *    with `seq > Last-Event-ID`, replays them in order. Each streaming message
 *    has its own `id:` field set to the event seq, so the EventSource
 *    automatically tracks the new high-water mark.
 * 3. After replay, the server polls EVENTS every 3s for new rows and
 *    streams them. This keeps Lark Base load bounded
 *    (~20 req/min/connection — well under their rate limits even with
 *    dozens of concurrent users).
 * 4. Heartbeat comment frame every 25s prevents intermediate proxies from
 *    closing the connection as idle.
 *
 * ## Function timeout
 *
 * Vercel Hobby plan: 60s max. Vercel Pro: 300s. The client EventSource
 * automatically reconnects when the function times out, sending the latest
 * Last-Event-ID — so no events are lost. We declare maxDuration = 300 to
 * use the full Pro budget (override to 60 if you're on Hobby).
 *
 * @see lib/hooks/useEvents.ts for the matching client subscription hook
 * @see lib/lark-events.ts for the event persistence layer
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const HEARTBEAT_MS = 25_000;
const POLL_INTERVAL_MS = 3_000;
const REPLAY_BATCH_SIZE = 100;

function sseMessage(event: WireEvent): string {
  // HTTP streaming wire format (Server-Sent Events spec): id, event, data, blank line
  // The `id:` line lets EventSource auto-track Last-Event-ID for reconnects.
  return (
    `id: ${event.seq}\n` +
    `event: ${event.event_type}\n` +
    `data: ${JSON.stringify(event)}\n\n`
  );
}

function heartbeat(seq: number): string {
  // Comment line — ignored by EventSource but keeps the TCP connection
  // alive against intermediate idle-timeouts.
  return `: heartbeat ${Date.now()} seq=${seq}\n\n`;
}

export async function GET(request: NextRequest) {
  // EventSource sets Last-Event-ID automatically on reconnect. Allow URL
  // override for first-connect cases where the client wants to start at a
  // specific seq (used by the diagnostics page).
  const lastEventIdHeader = request.headers.get("last-event-id");
  const lastEventIdParam = request.nextUrl.searchParams.get("last_event_id");
  const initialSeq = Number(lastEventIdHeader ?? lastEventIdParam ?? "0") || 0;

  // NOTE: We deliberately do NOT filter by user yet — see lib/lark-events.ts
  // header re multi-tenant filtering. The filtering happens at write time
  // once POSTS table tracks owner. Until then, streaming broadcasts all events
  // to all authenticated sessions. Authentication still gates access to
  // the channel; only logged-in users can subscribe.

  const encoder = new TextEncoder();
  let cursorSeq = initialSeq;
  let closed = false;
  let pollTimer: ReturnType<typeof setTimeout> | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      function send(chunk: string) {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          closed = true;
        }
      }

      // 1. Initial replay — flush everything since lastEventId in batches
      try {
        // Loop in case there are >REPLAY_BATCH_SIZE pending events
         
        while (true) {
          const batch = await getEventsSince(cursorSeq, {
            limit: REPLAY_BATCH_SIZE,
          });
          if (batch.length === 0) break;
          for (const evt of batch) {
            send(sseMessage(evt));
            cursorSeq = Math.max(cursorSeq, evt.seq);
          }
          if (batch.length < REPLAY_BATCH_SIZE) break;
        }
      } catch (err) {
        send(
          `event: error\ndata: ${JSON.stringify({
            message: "replay failed",
            detail: String(err),
          })}\n\n`,
        );
      }

      // 2. Send a "ready" frame so the client knows initial replay is done
      send(`event: ready\ndata: ${JSON.stringify({ seq: cursorSeq })}\n\n`);

      // 3. Heartbeat loop — separate from poll loop so heartbeats keep
      //    flowing even if a poll cycle is slow
      heartbeatTimer = setInterval(() => {
        send(heartbeat(cursorSeq));
      }, HEARTBEAT_MS);

      // 4. Tail loop — poll Lark EVENTS for new rows. Uses setTimeout chain
      //    so a slow Lark response doesn't pile up overlapping requests.
      const tail = async () => {
        if (closed) return;
        try {
          const batch = await getEventsSince(cursorSeq, {
            limit: REPLAY_BATCH_SIZE,
          });
          for (const evt of batch) {
            send(sseMessage(evt));
            cursorSeq = Math.max(cursorSeq, evt.seq);
          }
        } catch (err) {
          // Don't tear down on transient Lark errors — log and continue
          send(
            `: poll-error ${String(err).slice(0, 80).replace(/\n/g, " ")}\n\n`,
          );
        }
        if (!closed) {
          pollTimer = setTimeout(tail, POLL_INTERVAL_MS);
        }
      };
      pollTimer = setTimeout(tail, POLL_INTERVAL_MS);
    },

    cancel() {
      closed = true;
      if (pollTimer) clearTimeout(pollTimer);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // CRITICAL: Vercel-specific. Without this, responses are buffered and
      // Streaming silently appears broken. Required per Mar 2026 streaming guide.
      "X-Accel-Buffering": "no",
    },
  });
}
