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

  let body: { image?: string; mask?: string; prompt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { image, mask, prompt } = body;
  if (!image?.trim() || !mask?.trim() || !prompt?.trim()) {
    return NextResponse.json(
      { error: "Image, mask, and prompt are required" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${FREEPIK_BASE_URL}/v1/ai/ideogram-image-edit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-freepik-api-key": FREEPIK_API_KEY,
      },
      body: JSON.stringify({
        image,
        mask,
        prompt,
        rendering_speed: "DEFAULT",
        magic_prompt: "AUTO",
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "Unknown error");
      return NextResponse.json(
        { error: "Freepik inpainting failed", details: text },
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
