import { NextResponse } from "next/server";

export async function POST() {
  const start = Date.now();
  try {
    const res = await fetch("https://mcp-post-for-me.hypelive.workers.dev/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "debug", version: "1.0.0" }
        }
      }),
    });
    const body = await res.text();
    return NextResponse.json({ ok: res.ok, status: res.status, duration: Date.now() - start, body: body.slice(0, 200) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, duration: Date.now() - start });
  }
}
