import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let body: {
    baseUrl?: string;
    token?: string;
    fileId?: string;
    command?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { baseUrl, token, fileId, command = "get-file" } = body;

  if (!baseUrl?.trim()) {
    return NextResponse.json({ error: "baseUrl is required" }, { status: 400 });
  }
  if (!fileId?.trim()) {
    return NextResponse.json({ error: "fileId is required" }, { status: 400 });
  }

  const url = `${baseUrl.replace(/\/$/, "")}/api/rpc/command/${command}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) {
    headers["X-Access-Token"] = token;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        id: fileId,
        features: "layout/grid/v2,styles/v2,components/v2",
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "Unknown error");
      return NextResponse.json(
        { error: "Penpot API error", details: text },
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
