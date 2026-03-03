import { NextResponse } from "next/server";
import { getLastEvent } from "@/lib/webhook-event-store";

/**
 * GET /api/webhooks/post-for-me/status
 *
 * Lightweight endpoint polled by the client every 10s (~80 bytes).
 * Returns the last webhook event stored in memory by the webhook handler.
 *
 * No auth needed — response contains no sensitive data (just a timestamp,
 * event type, and opaque resource ID).
 *
 * Returns `null` when the Vercel instance is cold or no events have arrived.
 */
export async function GET() {
  return NextResponse.json(
    { last_event: getLastEvent() },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
