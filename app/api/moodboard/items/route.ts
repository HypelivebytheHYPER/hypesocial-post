import { NextRequest, NextResponse } from "next/server";
import {
  larkSearchAllRecords,
  larkCreateRecords,
  filterAnd,
  eq,
  larkDateToISO,
  larkText,
  larkNumber,
  larkUrl,
  toLarkUrl,
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
    const allRecords = await larkSearchAllRecords(
      TABLE_ID,
      filterAnd(eq("project_id", projectId)),
    );

    // Filter by date range in code if provided
    const records =
      startDate && endDate
        ? allRecords.filter((r) => {
            const date = larkText(r.fields.column_date);
            return date >= startDate && date <= endDate;
          })
        : allRecords;

    const items = records.map((r) => ({
      id: larkText(r.fields.item_id),
      record_id: r.record_id,
      project_id: larkText(r.fields.project_id),
      column_date: larkText(r.fields.column_date),
      sort_order: larkNumber(r.fields.sort_order),
      type: larkText(r.fields.type),
      content: larkText(r.fields.content),
      media_url: larkUrl(r.fields.media_url),
      platform: larkText(r.fields.platform),
      video_ratio: larkText(r.fields.video_ratio),
      author: larkText(r.fields.author),
      tags: (() => {
        const raw = larkText(r.fields.tags);
        try {
          return raw ? JSON.parse(raw) : [];
        } catch {
          return [];
        }
      })(),
      likes: larkText(r.fields.likes),
      comments: larkText(r.fields.comments),
      linked_post_id: larkText(r.fields.linked_post_id),
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
      author: body.author || "",
      tags: body.tags ? JSON.stringify(body.tags) : "[]",
      likes: body.likes || "",
      comments: body.comments || "",
      linked_post_id: body.linked_post_id || "",
      created_at: now,
      updated_at: now,
    };

    // URL field requires {text, link} object format
    const mediaUrl = toLarkUrl(body.media_url || "");
    if (mediaUrl) fields.media_url = mediaUrl;

    // SingleSelect fields: only set if truthy (avoids empty string errors)
    if (body.platform) fields.platform = body.platform;
    if (body.video_ratio) fields.video_ratio = body.video_ratio;

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
