import { NextRequest, NextResponse } from "next/server";

const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY;
const FREEPIK_BASE_URL = "https://api.freepik.com";

export async function POST(request: NextRequest) {
  if (!FREEPIK_API_KEY) {
    return NextResponse.json(
      { error: "FREEPIK_API_KEY is not configured" },
      { status: 500 }
    );
  }

  let body: { image?: string; width?: number; height?: number; model?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { image, width, height, model = "flux-pro" } = body;
  if (!image?.trim()) {
    return NextResponse.json({ error: "Image is required" }, { status: 400 });
  }
  if (!width || !height) {
    return NextResponse.json({ error: "Width and height are required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${FREEPIK_BASE_URL}/v1/ai/image-expand/${model}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-freepik-api-key": FREEPIK_API_KEY,
      },
      body: JSON.stringify({
        image,
        width,
        height,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "Unknown error");
      return NextResponse.json(
        { error: "Freepik expand failed", details: text },
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
