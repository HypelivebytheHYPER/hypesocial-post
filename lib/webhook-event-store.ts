/**
 * In-memory webhook event store.
 *
 * Shared between the webhook handler and the status endpoint within the same
 * Vercel warm instance. When the instance is cold or a different instance
 * handles the status request, `getLastEvent()` returns `null` — the client
 * treats this as "no new events" and falls back to `refetchOnWindowFocus`.
 *
 * TTL: Events older than EVENT_TTL_MS are discarded to avoid returning
 * stale data from long-lived warm instances.
 */

/** Events expire after 60 seconds */
const EVENT_TTL_MS = 60_000;

export interface WebhookEvent {
  /** Unix ms timestamp of when the event was stored */
  ts: number;
  event_type: string;
  resource_id: string;
  post_id?: string;
}

let lastEvent: WebhookEvent | null = null;

export function setLastEvent(event: Omit<WebhookEvent, "ts">) {
  lastEvent = { ...event, ts: Date.now() };
}

export function getLastEvent(): WebhookEvent | null {
  if (lastEvent && Date.now() - lastEvent.ts > EVENT_TTL_MS) {
    lastEvent = null;
  }
  return lastEvent;
}
