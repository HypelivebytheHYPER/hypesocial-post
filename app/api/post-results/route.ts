import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.POSTFORME_API_URL || "https://api.postforme.dev";
const API_KEY = process.env.POST_FOR_ME_API_KEY;

/**
 * GET /api/post-results
 * List social post results with filters
 * Official API: GET /v1/social-post-results
 */
export async function GET(request: NextRequest) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(request.url);
    const offset = searchParams.get("offset") || "0";
    const limit = searchParams.get("limit") || "20";
    const post_id = searchParams.get("post_id");
    const social_account_id = searchParams.get("social_account_id");
    const platform = searchParams.get("platform");

    // Build query string
    const queryParts = [`offset=${offset}`, `limit=${limit}`];
    if (post_id) queryParts.push(`post_id=${encodeURIComponent(post_id)}`);
    if (social_account_id)
      queryParts.push(
        `social_account_id=${encodeURIComponent(social_account_id)}`,
      );
    if (platform) queryParts.push(`platform=${encodeURIComponent(platform)}`);
    const query = queryParts.join("&");

    const response = await fetch(
      `${API_BASE}/v1/social-post-results?${query}`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        next: { revalidate: 0 },
      },
    );

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Post For Me API error: ${error}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Error fetching post results:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
