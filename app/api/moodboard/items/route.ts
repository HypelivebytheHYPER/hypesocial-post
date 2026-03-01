import { NextRequest, NextResponse } from "next/server";
import {
  larkSearchAllRecords,
  larkCreateRecords,
  filterAnd,
  eq,
  larkDateToISO,
} from "@/lib/lark";
import { randomUUID } from "crypto";

const TABLE_ID = process.env.LARK_MOODBOARD_ITEMS_TABLE_ID!;

/**
 * GET /api/moodboard/items?project_id=xxx&start_date=2026-03-02&end_date=2026-03-08
 * List items for a project within a date range.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const projectId = searchParams.get("project_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    if (!projectId) {
      return NextResponse.json(
        { error: "project_id is required" },
        { status: 400 },
      );
    }

    // Fetch all items for this project, then filter by date in code
    // (column_date is a Text field, so Lark comparison operators may not work reliably)
    const allRecords = await larkSearchAllRecords(
      TABLE_ID,
      filterAnd(eq("project_id", projectId)),
    );

    // Filter by date range in code if provided
    const records =
      startDate && endDate
        ? allRecords.filter((r) => {
            const date = r.fields.column_date as string;
            return date >= startDate && date <= endDate;
          })
        : allRecords;

    const items = records.map((r) => ({
      id: r.fields.item_id as string,
      record_id: r.record_id,
      project_id: r.fields.project_id as string,
      column_date: r.fields.column_date as string,
      sort_order: (r.fields.sort_order as number) ?? 0,
      type: r.fields.type as string,
      content: (r.fields.content as string) || "",
      media_url: (r.fields.media_url as string) || "",
      platform: (r.fields.platform as string) || "",
      video_ratio: (r.fields.video_ratio as string) || "",
      author: (r.fields.author as string) || "",
      tags: r.fields.tags ? JSON.parse(r.fields.tags as string) : [],
      likes: (r.fields.likes as string) || "",
      comments: (r.fields.comments as string) || "",
      linked_post_id: (r.fields.linked_post_id as string) || "",
      created_at: larkDateToISO(r.fields.created_at),
      updated_at: larkDateToISO(r.fields.updated_at),
    }));

    // Sort by sort_order
    items.sort((a, b) => a.sort_order - b.sort_order);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[API] List items error:", error);
    return NextResponse.json(
      { error: "Failed to list items" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/moodboard/items
 * Create a new moodboard item.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body?.project_id || !body?.column_date || !body?.type) {
      return NextResponse.json(
        { error: "project_id, column_date, and type are required" },
        { status: 400 },
      );
    }

    const now = Date.now();
    const itemId = randomUUID();

    const fields: Record<string, unknown> = {
      item_id: itemId,
      project_id: body.project_id,
      column_date: body.column_date,
      sort_order: body.sort_order ?? 0,
      type: body.type,
      content: body.content || "",
      media_url: body.media_url || "",
      platform: body.platform || "",
      video_ratio: body.video_ratio || "",
      author: body.author || "",
      tags: body.tags ? JSON.stringify(body.tags) : "[]",
      likes: body.likes || "",
      comments: body.comments || "",
      linked_post_id: body.linked_post_id || "",
      created_at: now,
      updated_at: now,
    };

    const records = await larkCreateRecords(TABLE_ID, [fields]);

    return NextResponse.json(
      {
        id: itemId,
        record_id: records[0]?.record_id,
        ...body,
        created_at: new Date(now).toISOString(),
        updated_at: new Date(now).toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[API] Create item error:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 },
    );
  }
}
