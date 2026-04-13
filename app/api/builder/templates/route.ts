import { NextRequest, NextResponse } from "next/server";
import { unstable_cache, revalidateTag } from "next/cache";

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

const fetchTemplates = unstable_cache(
  async () => {
    const res = await fetch(larkUrl(`/records/${APP_TOKEN}/${TABLE_ID}?page_size=500`));
    const json = (await res.json()) as { data?: LarkRecord[]; error?: string };
    if (!res.ok) {
      throw new Error(json.error || "Lark fetch failed");
    }
    return (json.data || []).map(mapRecordToTemplate);
  },
  ["builder-templates", APP_TOKEN, TABLE_ID],
  { revalidate: 300, tags: ["builder-templates"] }
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
      blocks: unknown[];
      theme: Record<string, unknown>;
      createdAt: number;
      updatedAt: number;
    };

    const fields = {
      Name: body.name,
      "Blocks JSON": JSON.stringify(body.blocks),
      "Theme JSON": JSON.stringify(body.theme),
      "Created At": body.createdAt,
      "Updated At": body.updatedAt,
    };

    const res = await fetch(larkUrl(`/records/${APP_TOKEN}/${TABLE_ID}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
    });
    const json = (await res.json()) as { data?: LarkRecord; error?: string };
    if (!res.ok) {
      return NextResponse.json({ error: json.error || "Lark create failed" }, { status: res.status });
    }

    revalidateTag("builder-templates", "default");
    return NextResponse.json({ data: mapRecordToTemplate(json.data!) });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
