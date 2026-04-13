import { NextRequest, NextResponse } from "next/server";

const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY;
const FREEPIK_BASE_URL = "https://api.freepik.com";

export async function GET(request: NextRequest) {
  if (!FREEPIK_API_KEY) {
    return NextResponse.json(
      { error: "FREEPIK_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const taskId = searchParams.get("taskId");
  const model = searchParams.get("model") || "flux-pro";

  if (!taskId) {
    return NextResponse.json({ error: "taskId is required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${FREEPIK_BASE_URL}/v1/ai/image-expand/${model}/${taskId}`, {
      headers: {
        "x-freepik-api-key": FREEPIK_API_KEY,
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "Unknown error");
      return NextResponse.json(
        { error: "Freepik API error", details: text },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
