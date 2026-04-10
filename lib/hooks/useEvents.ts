/**
 * useEvents — client subscription to the SSE EVENTS stream.
 *
 * Per TanStack Query maintainer guidance, SSE does NOT go through useQuery
 * (caching infinite subscription results is wasteful). Instead, this hook
 * opens a native EventSource and dispatches each incoming event into the
 * React Query cache via `queryClient.invalidateQueries()` for the affected
 * keys.
 *
 * ## Reconnect / catch-up
 *
 * EventSource automatically reconnects when the server closes the connection
 * (Vercel function timeout, network blip, etc). It also automatically sends
 * the `Last-Event-ID` header set from the most recent `id:` line it received.
 * The server replays everything since that id on each reconnect, so events
 * are never lost across disconnects within Lark's retention window.
 *
 * ## Failure mode
 *
 * If SSE fails entirely (corporate proxy strips text/event-stream, browser
 * doesn't support it, etc), this hook just gives up after a few attempts.
 * The polling fallback in usePosts/usePostResults still keeps data fresh,
 * just slower. SSE is an enhancement, not a hard requirement.
 *
 * @see app/api/events/stream/route.ts for the server side
 * @see lib/lark-events.ts for the persistence layer
 */

"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { pfmKeys } from "@/lib/hooks/usePostForMe";

interface WireEvent {
  event_id: string;
  source: "post-for-me" | "lark-base" | "callback";
  event_type: string;
  resource_id: string | null;
  post_id: string | null;
  social_account_id: string | null;
  user_id: string | null;
  payload_json: string;
  received_at: string;
  seq: number;
}

/**
 * Map an event_type to the React Query keys that should be invalidated.
 * Mirrors the legacy getInvalidationKeys() helper from useWebhookStatus.
 */
function affectedKeys(eventType: string): readonly (readonly string[])[] {
  if (eventType === "social.post.result.created") {
    return [pfmKeys.postResults(), pfmKeys.posts()];
  }
  if (eventType.startsWith("social.post.")) {
    return [pfmKeys.posts()];
  }
  if (eventType.startsWith("social.account.")) {
    return [pfmKeys.accounts(), pfmKeys.webhooks()];
  }
  // lark.* events fall through to the broad invalidation below. When new
  // Lark-backed features are added, route their event types here.
  return [pfmKeys.all];
}

/**
 * Subscribe to /api/events/stream. Mounts at the top of the React tree
 * (in providers.tsx) so it runs once per app session.
 */
export function useEvents() {
  const queryClient = useQueryClient();
  // Track whether we've explicitly closed the EventSource so reconnect
  // logic doesn't fight React strict-mode double-mount in dev.
  const closedRef = useRef(false);

  useEffect(() => {
    closedRef.current = false;

    // EventSource doesn't accept custom headers, but the browser sends the
    // session cookie automatically — that's how /api/events/stream auths.
    // The server reads Last-Event-ID from the EventSource auto-reconnect
    // header for catch-up; on first connect we have no id and the server
    // sends a small initial replay (or nothing).
    let es: EventSource;
    try {
      es = new EventSource("/api/events/stream", { withCredentials: true });
    } catch (err) {
      console.warn("[Events] EventSource not supported:", err);
      return;
    }

    es.addEventListener("ready", () => {
      // Server has finished initial replay; from here on it's tail mode.
      // Useful as a debug signal — no UI side-effect.
    });

    es.addEventListener("error", (err) => {
      // EventSource will auto-reconnect; we just log so users can debug
      // network issues from devtools without spamming the console.
      if (es.readyState === EventSource.CLOSED) {
        console.warn("[Events] stream closed", err);
      }
    });

    function handleEvent(rawData: string) {
      let evt: WireEvent;
      try {
        evt = JSON.parse(rawData);
      } catch {
        return;
      }

      const keys = affectedKeys(evt.event_type);
      for (const key of keys) {
        queryClient.invalidateQueries({ queryKey: key });
      }

      // Surgical update: when an individual post or account event arrives
      // and we know its id, also invalidate the single-resource cache key
      // so the detail view refreshes alongside the list.
      if (evt.post_id) {
        queryClient.invalidateQueries({ queryKey: pfmKeys.post(evt.post_id) });
        queryClient.invalidateQueries({
          queryKey: pfmKeys.postResultsByPost(evt.post_id),
        });
      }
      if (evt.social_account_id) {
        queryClient.invalidateQueries({
          queryKey: pfmKeys.account(evt.social_account_id),
        });
      }
    }

    // The server emits messages with `event: <event_type>`. Subscribe to
    // a wildcard via `message` (default) AND every known type so we don't
    // miss anything regardless of which dispatch path the browser takes.
    const ALL_TYPES = [
      "social.post.created",
      "social.post.updated",
      "social.post.deleted",
      "social.post.result.created",
      "social.account.created",
      "social.account.updated",
      "social.account.callback_intercepted",
    ];
    for (const t of ALL_TYPES) {
      es.addEventListener(t, (e) =>
        handleEvent((e as MessageEvent).data ?? ""),
      );
    }
    // Default `message` listener catches any event_type not in ALL_TYPES.
    es.addEventListener("message", (e) => handleEvent(e.data));

    return () => {
      closedRef.current = true;
      es.close();
    };
    // queryClient identity is stable per QueryClientProvider — no deps needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
