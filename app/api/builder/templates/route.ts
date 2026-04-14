import { NextRequest, NextResponse } from "next/server";
import { unstable_cache, revalidateTag } from "next/cache";

import {
  larkSearchRecords,
  larkCreateRecords,
  larkText,
  larkNumber,
} from "@/lib/lark";
import { PAGINATION } from "@/lib/constants";
import { BUILDER_TEMPLATE_FIELD } from "@/lib/validations/builder-templates";
import type { BuilderTemplateV2, Page } from "@/components/builder/types";

const CACHE_TAG = "builder-templates";

/**
 * Builder templates are stored in a Lark Base table — the same "Lark as the
 * database" pattern used by events, accounts, and everything else in this
 * project. All table access routes through `lib/lark.ts` (SSOT Lark client)
 * so credentials live in env, filters/pagination stay consistent, and the
 * worker endpoint can be swapped without touching consumers.
 */
function getTableId(): string {
  const id = process.env.LARK_BUILDER_TEMPLATES_TABLE_ID;
  if (!id) {
    throw new Error("LARK_BUILDER_TEMPLATES_TABLE_ID is not set");
  }
  return id;
}

interface LarkTemplateFields {
  [BUILDER_TEMPLATE_FIELD.TEXT_LEGACY]?: unknown;
  [BUILDER_TEMPLATE_FIELD.NAME]?: unknown;
  [BUILDER_TEMPLATE_FIELD.BLOCKS_JSON]?: unknown;
  [BUILDER_TEMPLATE_FIELD.THEME_JSON]?: unknown;
  [BUILDER_TEMPLATE_FIELD.CREATED_AT]?: unknown;
  [BUILDER_TEMPLATE_FIELD.UPDATED_AT]?: unknown;
}

function mapRecordToTemplate(
  record_id: string,
  fields: LarkTemplateFields,
): BuilderTemplateV2 {
  const blocksText = larkText(fields[BUILDER_TEMPLATE_FIELD.BLOCKS_JSON]);
  const blocksRaw = blocksText ? safeJsonParse(blocksText) : null;

  // Backward compatibility:
  // - old format stored blocks as array of layers
  // - v2 stored { format, layers, canvasBackground }
  // - v3 stores { format, pages }
  let format: BuilderTemplateV2["format"] = "ig-post";
  let pages: Page[] = [];

  if (Array.isArray(blocksRaw)) {
    pages = [
      {
        id: "page-1",
        name: "Page 1",
        layers: blocksRaw as Page["layers"],
        canvasBackground: { color: "#ffffff", image: "" },
      },
    ];
  } else if (blocksRaw && typeof blocksRaw === "object") {
    const b = blocksRaw as {
      format?: BuilderTemplateV2["format"];
      pages?: Page[];
      layers?: unknown;
      canvasBackground?: { color?: string; image?: string };
    };
    format = b.format ?? "ig-post";
    if (Array.isArray(b.pages)) {
      pages = b.pages;
    } else {
      pages = [
        {
          id: "page-1",
          name: "Page 1",
          layers: (b.layers ?? []) as Page["layers"],
          canvasBackground: {
            color: b.canvasBackground?.color ?? "#ffffff",
            image: b.canvasBackground?.image ?? "",
          },
        },
      ];
    }
  }

  const themeText = larkText(fields[BUILDER_TEMPLATE_FIELD.THEME_JSON]);
  const theme = themeText
    ? (safeJsonParse(themeText) as BuilderTemplateV2["theme"]) ??
      defaultTheme()
    : defaultTheme();

  return {
    id: record_id,
    name:
      larkText(fields[BUILDER_TEMPLATE_FIELD.NAME]) ??
      larkText(fields[BUILDER_TEMPLATE_FIELD.TEXT_LEGACY]) ??
      "Untitled",
    format,
    pages,
    theme,
    createdAt: larkNumber(fields[BUILDER_TEMPLATE_FIELD.CREATED_AT]),
    updatedAt: larkNumber(fields[BUILDER_TEMPLATE_FIELD.UPDATED_AT]),
  };
}

function defaultTheme(): BuilderTemplateV2["theme"] {
  return {
    primaryColor: "#2563eb",
    borderRadius: 8,
    fontFamily: "Inter",
    backgroundColor: "#ffffff",
  };
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const fetchTemplates = unstable_cache(
  async () => {
    const tableId = getTableId();
    const { items } = await larkSearchRecords(
      tableId,
      undefined,
      PAGINATION.MAX_LIMIT,
    );
    return items.map((item) =>
      mapRecordToTemplate(item.record_id, item.fields as LarkTemplateFields),
    );
  },
  ["builder-templates"],
  { revalidate: 300, tags: [CACHE_TAG] },
);

/** GET /api/builder/templates */
export async function GET() {
  try {
    const templates = await fetchTemplates();
    return NextResponse.json({ data: templates });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/** POST /api/builder/templates */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name: string;
      format: BuilderTemplateV2["format"];
      pages?: Page[];
      layers?: unknown[];
      theme: BuilderTemplateV2["theme"];
      canvasBackground?: { color?: string; image?: string };
      createdAt: number;
      updatedAt: number;
    };

    const fallbackPage: Page = {
      id: "page-1",
      name: "Page 1",
      layers: (body.layers ?? []) as Page["layers"],
      canvasBackground: {
        color: body.canvasBackground?.color ?? "#ffffff",
        image: body.canvasBackground?.image ?? "",
      },
    };
    const pages: Page[] = body.pages ?? [fallbackPage];

    const fields = {
      [BUILDER_TEMPLATE_FIELD.NAME]: body.name,
      [BUILDER_TEMPLATE_FIELD.BLOCKS_JSON]: JSON.stringify({
        format: body.format,
        pages,
      }),
      [BUILDER_TEMPLATE_FIELD.THEME_JSON]: JSON.stringify(body.theme),
      [BUILDER_TEMPLATE_FIELD.CREATED_AT]: body.createdAt,
      [BUILDER_TEMPLATE_FIELD.UPDATED_AT]: body.updatedAt,
    };

    const tableId = getTableId();
    const { record_ids } = await larkCreateRecords(tableId, [fields]);
    const record_id = record_ids[0];
    if (!record_id) {
      return NextResponse.json(
        { error: "Lark create returned no record id" },
        { status: 502 },
      );
    }

    revalidateTag(CACHE_TAG, "default");

    // Assemble the response from what we just sent; client invalidates and
    // refetches on success, so server-truth wins within a round trip.
    return NextResponse.json({
      data: mapRecordToTemplate(record_id, fields),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
