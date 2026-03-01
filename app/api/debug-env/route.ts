import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const apiKey = process.env.POST_FOR_ME_API_KEY;
  const apiBase = process.env.POST_FOR_ME_BASE_URL;

  return NextResponse.json({
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
    apiKeyPrefix: apiKey?.substring(0, 15) || null,
    apiBase: apiBase || "not set",
    nodeEnv: process.env.NODE_ENV,
  });
}
