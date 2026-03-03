import { NextRequest, NextResponse } from "next/server";
import {
  larkSearchAllRecords,
  larkUpdateRecords,
  filterAnd,
  eq,
  larkText,
} from "@/lib/lark";
import { parseBody } from "@/lib/validations";
import { ReorderItemsSchema } from "@/lib/validations/moodboard";

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
    const jsonBody = await request.json().catch(() => null);

    const parsed = parseBody(ReorderItemsSchema, jsonBody);
    if (!parsed.success) return parsed.response;

    const reorderItems = parsed.data.items;

    // Fetch all items for this project, then match by item_id
    const records = await larkSearchAllRecords(
      TABLE_ID,
      filterAnd(eq("project_id", parsed.data.project_id)),
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
      { error: "Internal Server Error", message: "Failed to reorder items", statusCode: 500 },
      { status: 500 },
    );
  }
}
