import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.POST_FOR_ME_API_KEY;
  const apiBase = process.env.POST_FOR_ME_BASE_URL || "https://api.postforme.dev";

  try {
    const response = await fetch(`${apiBase}/v1/social-accounts`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    const responseText = await response.text();

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseText.substring(0, 500),
      apiKeyUsed: apiKey?.substring(0, 15) + "...",
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      apiKeyPrefix: apiKey?.substring(0, 15),
    }, { status: 500 });
  }
}
