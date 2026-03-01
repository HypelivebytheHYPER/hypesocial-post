import { NextRequest, NextResponse } from "next/server";
import {
  larkSearchRecords,
  larkUpdateRecords,
  larkDeleteRecords,
  filterAnd,
  eq,
  toLarkUrl,
} from "@/lib/lark";

const TABLE_ID = process.env.LARK_MOODBOARD_ITEMS_TABLE_ID!;

async function findItem(itemId: string) {
  const data = await larkSearchRecords(
    TABLE_ID,
    filterAnd(eq("item_id", itemId)),
    1,
  );
  return data.items?.[0] ?? null;
}

/**
 * PATCH /api/moodboard/items/[itemId]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    const { itemId } = await params;
    const record = await findItem(itemId);

    if (!record) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const fields: Record<string, unknown> = {
      updated_at: Date.now(),
    };

    const textFields = [
      "column_date",
      "sort_order",
      "content",
      "author",
      "likes",
      "comments",
      "linked_post_id",
    ];

    for (const field of textFields) {
      if (body[field] !== undefined) fields[field] = body[field];
    }

    // URL field requires {text, link} object format
    if (body.media_url !== undefined) {
      const url = toLarkUrl(body.media_url);
      if (url) fields.media_url = url;
    }

    // SingleSelect fields
    if (body.platform !== undefined) fields.platform = body.platform;
    if (body.video_ratio !== undefined) fields.video_ratio = body.video_ratio;

    if (body.tags !== undefined) {
      fields.tags = JSON.stringify(body.tags);
    }

    await larkUpdateRecords(TABLE_ID, [
      { record_id: record.record_id, fields },
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Update item error:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/moodboard/items/[itemId]
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    const { itemId } = await params;
    const record = await findItem(itemId);

    if (!record) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 },
      );
    }

    await larkDeleteRecords(TABLE_ID, [record.record_id]);

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[API] Delete item error:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 },
    );
  }
}
