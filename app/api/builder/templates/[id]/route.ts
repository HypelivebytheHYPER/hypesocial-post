import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { larkUpdateRecords, larkDeleteRecords } from "@/lib/lark";
import { BUILDER_TEMPLATE_FIELD } from "@/lib/validations/builder-templates";
import type { BuilderTemplateV2, Page } from "@/components/builder/types";

const CACHE_TAG = "builder-templates";

/**
 * Per-template routes. See `../route.ts` for the "Lark as the database"
 * rationale — this file uses the same shared client from `lib/lark.ts`.
 */
function getTableId(): string {
  const id = process.env.LARK_BUILDER_TEMPLATES_TABLE_ID;
  if (!id) {
    throw new Error("LARK_BUILDER_TEMPLATES_TABLE_ID is not set");
  }
  return id;
}

/** PATCH /api/builder/templates/:id */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Partial<{
      name: string;
      blocks:
        | unknown[]
        | {
            format?: BuilderTemplateV2["format"];
            pages?: Page[];
            layers?: unknown[];
            canvasBackground?: { color?: string; image?: string };
          };
      theme: BuilderTemplateV2["theme"];
      updatedAt: number;
    }>;

    const fields: Record<string, unknown> = {};
    if (body.name !== undefined) {
      fields[BUILDER_TEMPLATE_FIELD.NAME] = body.name;
    }
    if (body.blocks !== undefined) {
      fields[BUILDER_TEMPLATE_FIELD.BLOCKS_JSON] = JSON.stringify(body.blocks);
    }
    if (body.theme !== undefined) {
      fields[BUILDER_TEMPLATE_FIELD.THEME_JSON] = JSON.stringify(body.theme);
    }
    if (body.updatedAt !== undefined) {
      fields[BUILDER_TEMPLATE_FIELD.UPDATED_AT] = body.updatedAt;
    }

    if (Object.keys(fields).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    const tableId = getTableId();
    await larkUpdateRecords(tableId, [{ record_id: id, fields }]);

    revalidateTag(CACHE_TAG, "default");

    // Client invalidates queries on success and refetches the full list, so
    // returning a minimal ack here is sufficient.
    return NextResponse.json({
      data: { id, ...fields },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/** DELETE /api/builder/templates/:id */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const tableId = getTableId();
    await larkDeleteRecords(tableId, [id]);

    revalidateTag(CACHE_TAG, "default");

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
