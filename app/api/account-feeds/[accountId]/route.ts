import { NextRequest, NextResponse } from "next/server";
import { pfm } from "@/lib/post-for-me";
import { APIError } from "post-for-me";

/**
 * GET /api/account-feeds/[accountId]
 * Get social account feed with posts and metrics
 * Official API: GET /v1/social-account-feeds/{accountId}
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> },
) {
  try {
    const { accountId } = await params;
    const { searchParams } = new URL(request.url);

    const data = await pfm.socialAccountFeeds.list(accountId, {
      limit: Number(searchParams.get("limit") || 50),
      cursor: searchParams.get("cursor") || undefined,
      expand: searchParams.get("expand") === "metrics" ? ["metrics"] : undefined,
      external_post_id: searchParams.getAll("external_post_id").length > 0 ? searchParams.getAll("external_post_id") : undefined,
      social_post_id: searchParams.getAll("social_post_id").length > 0 ? searchParams.getAll("social_post_id") : undefined,
      platform_post_id: searchParams.getAll("platform_post_id").length > 0 ? searchParams.getAll("platform_post_id") : undefined,
    });

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: "API Error", message: error.message, statusCode: error.status },
        { status: error.status || 500 },
      );
    }
    console.error("[API] Error fetching account feed:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Unknown error occurred", statusCode: 500 },
      { status: 500 },
    );
  }
}
