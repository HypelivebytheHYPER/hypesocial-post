import { NextRequest, NextResponse } from "next/server";
import { larkSearchRecords, filterAnd, eq } from "@/lib/lark";
import { EVENT_FIELD } from "@/lib/validations/events";

/**
 * GET /api/events/verify?event_id=evt_xxx
 * 
 * Verify that a webhook event was actually persisted to Lark Base.
 * Use this to confirm delivery after receiving a 200 response.
 */
export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get("event_id");
  
  if (!eventId) {
    return NextResponse.json(
      { error: "Missing event_id parameter" },
      { status: 400 }
    );
  }

  const tableId = process.env.LARK_EVENTS_TABLE_ID;
  if (!tableId) {
    return NextResponse.json(
      { error: "LARK_EVENTS_TABLE_ID not configured" },
      { status: 500 }
    );
  }

  try {
    const result = await larkSearchRecords(
      tableId,
      filterAnd(eq(EVENT_FIELD.EVENT_ID, eventId)),
      1
    );

    const found = result.items.length > 0;

    const record = found && result.items[0] ? result.items[0] : null;

    return NextResponse.json({
      event_id: eventId,
      found,
      record: record ? {
        seq: record.fields[EVENT_FIELD.SEQ],
        event_type: record.fields[EVENT_FIELD.EVENT_TYPE],
        source: record.fields[EVENT_FIELD.SOURCE],
        resource_id: record.fields[EVENT_FIELD.RESOURCE_ID],
        received_at: record.fields[EVENT_FIELD.RECEIVED_AT],
      } : null,
    });
  } catch (error) {
    console.error("[Verify] Failed to query EVENTS table:", error);
    return NextResponse.json(
      { error: "Failed to verify event", event_id: eventId },
      { status: 500 }
    );
  }
}
