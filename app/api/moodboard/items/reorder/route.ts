import { NextRequest, NextResponse } from "next/server";
import {
  larkSearchAllRecords,
  larkUpdateRecords,
  filterAnd,
  eq,
  larkText,
} from "@/lib/lark";

const TABLE_ID = process.env.LARK_MOODBOARD_ITEMS_TABLE_ID!;

interface ReorderItem {
  item_id: string;
  column_date: string;
  sort_order: number;
}

/**
 * POST /api/moodboard/items/reorder
 * Batch reorder items after drag-and-drop.
 * Accepts { project_id: string, items: [{ item_id, column_date, sort_order }] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body?.project_id || !body?.items?.length) {
      return NextResponse.json(
        { error: "project_id and items array are required" },
        { status: 400 },
      );
    }

    const reorderItems = body.items as ReorderItem[];

    // Fetch all items for this project, then match by item_id
    const records = await larkSearchAllRecords(
      TABLE_ID,
      filterAnd(eq("project_id", body.project_id)),
    );

    // Map item_id -> record_id
    const idMap = new Map<string, string>();
    for (const r of records) {
      idMap.set(larkText(r.fields.item_id), r.record_id);
    }

    const now = Date.now();
    const updates = reorderItems
      .filter((item) => idMap.has(item.item_id))
      .map((item) => ({
        record_id: idMap.get(item.item_id)!,
        fields: {
          column_date: item.column_date,
          sort_order: item.sort_order,
          updated_at: now,
        },
      }));

    if (updates.length > 0) {
      await larkUpdateRecords(TABLE_ID, updates);
    }

    return NextResponse.json({ success: true, updated: updates.length });
  } catch (error) {
    console.error("[API] Reorder items error:", error);
    return NextResponse.json(
      { error: "Failed to reorder items" },
      { status: 500 },
    );
  }
}
