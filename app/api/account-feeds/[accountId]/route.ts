import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.POST_FOR_ME_BASE_URL || "https://api.postforme.dev";
const API_KEY = process.env.POST_FOR_ME_API_KEY;

/**
 * GET /api/account-feeds/[accountId]
 * Get social account feed with posts and metrics
 * Official API: GET /v1/social-account-feeds/{accountId}
 *
 * Query Parameters:
 * - limit: Number of items to return (default: 50)
 * - cursor: Cursor for pagination
 * - expand: "metrics" to include analytics data
 * - external_post_id: Filter by external post ID
 * - social_post_id: Filter by social post ID
 * - platform_post_id: Filter by platform post ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> },
) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 },
      );
    }

    const { accountId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "50";
    const cursor = searchParams.get("cursor");
    const expand = searchParams.get("expand"); // e.g., "metrics"
    const externalPostId = searchParams.get("external_post_id");
    const socialPostId = searchParams.get("social_post_id");
    const platformPostId = searchParams.get("platform_post_id");

    // Build query string
    const queryParts = [`limit=${limit}`];
    if (cursor) queryParts.push(`cursor=${encodeURIComponent(cursor)}`);
    if (expand) queryParts.push(`expand=${expand}`);
    if (externalPostId)
      queryParts.push(`external_post_id=${encodeURIComponent(externalPostId)}`);
    if (socialPostId)
      queryParts.push(`social_post_id=${encodeURIComponent(socialPostId)}`);
    if (platformPostId)
      queryParts.push(`platform_post_id=${encodeURIComponent(platformPostId)}`);
    const query = queryParts.join("&");

    const response = await fetch(
      `${API_BASE}/v1/social-account-feeds/${accountId}?${query}`,
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
    console.error("[API] Error fetching account feed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
