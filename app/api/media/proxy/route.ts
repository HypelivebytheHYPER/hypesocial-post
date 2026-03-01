import { NextRequest } from "next/server";

const R2_DOMAINS = [
  "pub-9ab23e78dd0d43e496a590537ce7e4f1.r2.dev", // static assets (logo etc.)
  "pub-483f816788534334817c49941fb59b23.r2.dev", // moodboard media uploads
];

const ALLOWED_DOMAINS = [
  "data.postforme.dev",
  "cjsgitiiwhrsfolwmtby.supabase.co",
  ...R2_DOMAINS,
];

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return new Response(JSON.stringify({ error: "Missing url parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid URL" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!ALLOWED_DOMAINS.includes(parsed.hostname)) {
    return new Response(JSON.stringify({ error: "Domain not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const upstream = await fetch(url);

    if (!upstream.ok) {
      return new Response(
        JSON.stringify({ error: `Upstream returned ${upstream.status}` }),
        {
          status: upstream.status,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const headers = new Headers();
    const contentType = upstream.headers.get("Content-Type");
    if (contentType) headers.set("Content-Type", contentType);
    const contentLength = upstream.headers.get("Content-Length");
    if (contentLength) headers.set("Content-Length", contentLength);
    // R2 media: immutable (files never change). Others: short cache.
    if (R2_DOMAINS.includes(parsed.hostname)) {
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
    } else {
      headers.set("Cache-Control", "public, max-age=300, s-maxage=3600");
    }

    const data = await upstream.arrayBuffer();
    return new Response(data, { status: 200, headers });
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to fetch upstream resource" }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }
}
