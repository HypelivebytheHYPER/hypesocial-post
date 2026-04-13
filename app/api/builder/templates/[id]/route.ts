import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

const LARK_BASE_URL = "https://lark-http-hype.hypelive.workers.dev";
const APP_TOKEN = "MJAvbeuwDaBqYjs4AMTlmlWLgng";
const TABLE_ID = "tblNNizHS84x3rRr";

function larkUrl(path: string) {
  return `${LARK_BASE_URL}${path}`;
}

interface LarkRecord {
  record_id: string;
  fields: {
    Text?: string;
    Name?: string;
    "Blocks JSON"?: string;
    "Theme JSON"?: string;
    "Created At"?: number;
    "Updated At"?: number;
  };
}

function mapRecordToTemplate(record: LarkRecord) {
  const f = record.fields;
  return {
    id: record.record_id,
    name: f.Name || f.Text || "Untitled",
    blocks: f["Blocks JSON"] ? JSON.parse(f["Blocks JSON"]) : [],
    theme: f["Theme JSON"]
      ? JSON.parse(f["Theme JSON"])
      : { primaryColor: "#2563eb", borderRadius: 8, fontFamily: "Inter" },
    createdAt: f["Created At"] || 0,
    updatedAt: f["Updated At"] || 0,
  };
}

/** PATCH /api/builder/templates/:id */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Partial<{
      name: string;
      blocks: unknown[];
      theme: Record<string, unknown>;
      updatedAt: number;
    }>;

    const fields: Record<string, unknown> = {};
    if (body.name !== undefined) fields.Name = body.name;
    if (body.blocks !== undefined) fields["Blocks JSON"] = JSON.stringify(body.blocks);
    if (body.theme !== undefined) fields["Theme JSON"] = JSON.stringify(body.theme);
    if (body.updatedAt !== undefined) fields["Updated At"] = body.updatedAt;

    const res = await fetch(larkUrl(`/records/${APP_TOKEN}/${TABLE_ID}/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
    });
    const json = (await res.json()) as { data?: LarkRecord; error?: string };
    if (!res.ok) {
      return NextResponse.json({ error: json.error || "Lark update failed" }, { status: res.status });
    }

    revalidateTag("builder-templates", "default");
    return NextResponse.json({ data: mapRecordToTemplate(json.data!) });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/** DELETE /api/builder/templates/:id */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const res = await fetch(larkUrl(`/records/${APP_TOKEN}/${TABLE_ID}/${id}`), {
      method: "DELETE",
    });
    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      return NextResponse.json({ error: json.error || "Lark delete failed" }, { status: res.status });
    }

    revalidateTag("builder-templates", "default");
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
