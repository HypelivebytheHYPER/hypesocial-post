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
  const query = searchParams.get("query") || "";
  const type = searchParams.get("type") || "resources";
  const limit = searchParams.get("limit") || "12";
  const page = searchParams.get("page") || "1";

  if (!query.trim()) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const endpoint = type === "icons" ? "/v1/icons" : "/v1/resources";
  const params = new URLSearchParams();
  params.set("term", query);
  params.set("page", page);
  if (type === "icons") {
    params.set("per_page", limit);
  } else {
    params.set("limit", limit);
  }

  try {
    const res = await fetch(`${FREEPIK_BASE_URL}${endpoint}?${params.toString()}`, {
      headers: {
        "x-freepik-api-key": FREEPIK_API_KEY,
        "Accept-Language": "en-US",
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
