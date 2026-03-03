import { NextRequest, NextResponse } from "next/server";
import { pfm } from "@/lib/post-for-me";
import { APIError } from "post-for-me";
import { parseQuery, validateId } from "@/lib/validations";
import { ListFeedQuerySchema } from "@/lib/validations/account-feeds";

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
    const idError = validateId(accountId, "feed");
    if (idError) return idError;
    const { searchParams } = new URL(request.url);

    const q = parseQuery(ListFeedQuerySchema, {
      limit: searchParams.get("limit") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
      expand: searchParams.get("expand") === "metrics" ? "metrics" : undefined,
      external_post_id: searchParams.getAll("external_post_id").length > 0 ? searchParams.getAll("external_post_id") : undefined,
      social_post_id: searchParams.getAll("social_post_id").length > 0 ? searchParams.getAll("social_post_id") : undefined,
      platform_post_id: searchParams.getAll("platform_post_id").length > 0 ? searchParams.getAll("platform_post_id") : undefined,
    });
    if (!q.success) return q.response;

    const data = await pfm.socialAccountFeeds.list(accountId, {
      ...q.data,
      expand: q.data.expand ? [q.data.expand] : undefined,
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
