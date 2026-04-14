import { NextRequest, NextResponse } from "next/server";

const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY;

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  if (!REMOVE_BG_API_KEY) {
    return NextResponse.json({ error: "REMOVE_BG_API_KEY not configured" }, { status: 503 });
  }

  try {
    // Download the source image so we can send it to remove.bg
    const imageRes = await fetch(url);
    if (!imageRes.ok) {
      return NextResponse.json({ error: `Failed to fetch image: ${imageRes.status}` }, { status: 502 });
    }
    const imageBlob = await imageRes.blob();

    const formData = new FormData();
    formData.append("image_file", new File([imageBlob], "image.png", { type: imageBlob.type || "image/png" }));
    formData.append("size", "auto");

    const removeRes = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": REMOVE_BG_API_KEY,
      },
      body: formData,
    });

    if (!removeRes.ok) {
      const text = await removeRes.text().catch(() => "Unknown error");
      return NextResponse.json({ error: "remove.bg failed", details: text }, { status: 502 });
    }

    const resultBlob = await removeRes.blob();
    const buffer = Buffer.from(await resultBlob.arrayBuffer());
    const base64 = buffer.toString("base64");

    return NextResponse.json({
      success: true,
      url: `data:image/png;base64,${base64}`,
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal error", details: String(err) }, { status: 500 });
  }
}
