import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const IMAGE_GEN_API_URL = process.env.IMAGE_GEN_API_URL;
const IMAGE_GEN_API_KEY = process.env.IMAGE_GEN_API_KEY;

export async function POST(request: NextRequest) {
  let body: { prompt?: string; size?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { prompt, size = "1024x1024" } = body;
  if (!prompt) {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

  // Path 1: OpenAI DALL-E 3 via ai-sdk
  if (OPENAI_API_KEY) {
    try {
      const { generateImage } = await import("ai");
      const { openai } = await import("@ai-sdk/openai");
      const result = await generateImage({
        model: openai.image("dall-e-3"),
        prompt,
        size: size as "1024x1024" | "1792x1024" | "1024x1792",
      });
      // ai-sdk v6 returns image as GeneratedFile with base64 property
      const generated = result as unknown as { image?: { base64?: string; uint8Array?: Uint8Array } };
      let base64 = generated.image?.base64;
      if (!base64 && generated.image?.uint8Array) {
        base64 = Buffer.from(generated.image.uint8Array).toString("base64");
      }
      if (!base64) {
        return NextResponse.json({ error: "No image generated" }, { status: 502 });
      }
      return NextResponse.json({
        success: true,
        url: base64.startsWith("data:") ? base64 : `data:image/png;base64,${base64}`,
        provider: "openai",
      });
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || "OpenAI generation failed" }, { status: 502 });
    }
  }

  // Path 2: Generic OpenAI-compatible image generation proxy
  if (IMAGE_GEN_API_URL && IMAGE_GEN_API_KEY) {
    try {
      const res = await fetch(IMAGE_GEN_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${IMAGE_GEN_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.IMAGE_GEN_MODEL || "dall-e-3",
          prompt,
          n: 1,
          size,
          response_format: "b64_json",
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "Unknown error");
        return NextResponse.json({ error: "Image generation failed", details: text }, { status: 502 });
      }

      const data = (await res.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
      const first = data?.data?.[0];
      const base64 = first?.b64_json;
      const url = first?.url;

      if (url) {
        return NextResponse.json({ success: true, url, provider: "generic" });
      }
      if (base64) {
        return NextResponse.json({
          success: true,
          url: `data:image/png;base64,${base64}`,
          provider: "generic",
        });
      }
      return NextResponse.json({ error: "No image in response" }, { status: 502 });
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || "Generic generation failed" }, { status: 502 });
    }
  }

  return NextResponse.json(
    { error: "No image generation provider configured. Set OPENAI_API_KEY or IMAGE_GEN_API_URL + IMAGE_GEN_API_KEY." },
    { status: 503 }
  );
}
