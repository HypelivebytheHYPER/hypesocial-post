import { NextRequest, NextResponse } from "next/server";

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;

/**
 * GET /api/media/transform?url=<image_url>&w=800&h=800&c=fill&g=auto&f=auto
 *
 * Proxies/transforms an image via Cloudinary's fetch mode.
 * If no Cloudinary cloud name is configured, returns the original image URL.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  if (!CLOUDINARY_CLOUD_NAME) {
    // Graceful fallback: just redirect to original URL
    return NextResponse.redirect(url);
  }

  const w = searchParams.get("w");
  const h = searchParams.get("h");
  const c = searchParams.get("c") || "fill";
  const g = searchParams.get("g") || "auto";
  const f = searchParams.get("f") || "auto";
  const q = searchParams.get("q") || "auto";

  const transforms: string[] = [];
  if (c) transforms.push(`c_${c}`);
  if (g) transforms.push(`g_${g}`);
  if (w) transforms.push(`w_${w}`);
  if (h) transforms.push(`h_${h}`);
  if (f) transforms.push(`f_${f}`);
  if (q) transforms.push(`q_${q}`);

  const transformString = transforms.join(",");
  const encodedUrl = encodeURIComponent(url);
  const cloudinaryUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/fetch/${transformString}/${encodedUrl}`;

  // Proxy the transformed image so the client never sees Cloudinary URLs directly
  try {
    const upstream = await fetch(cloudinaryUrl);
    if (!upstream.ok) {
      return NextResponse.json({ error: "Transform failed", status: upstream.status }, { status: 502 });
    }
    const headers = new Headers();
    const contentType = upstream.headers.get("Content-Type");
    if (contentType) headers.set("Content-Type", contentType);
    headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
    const data = await upstream.arrayBuffer();
    return new Response(data, { status: 200, headers });
  } catch (err) {
    return NextResponse.json({ error: "Internal error", details: String(err) }, { status: 500 });
  }
}
