import { NextRequest, NextResponse } from "next/server";
import { pfm } from "@/lib/post-for-me";
import { APIError } from "post-for-me";

/**
 * GET /api/post-results
 * Official API: GET /v1/social-post-results
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const data = await pfm.socialPostResults.list({
      offset: Number(searchParams.get("offset") || 0),
      limit: Number(searchParams.get("limit") || 20),
      post_id: searchParams.getAll("post_id").length > 0 ? searchParams.getAll("post_id") : undefined,
      social_account_id: searchParams.getAll("social_account_id").length > 0 ? searchParams.getAll("social_account_id") : undefined,
      platform: searchParams.getAll("platform").length > 0 ? searchParams.getAll("platform") : undefined,
    });

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: "API Error", message: error.message, statusCode: error.status },
        { status: error.status || 500 },
      );
    }
    console.error("[API] Error fetching post results:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Unknown error occurred", statusCode: 500 },
      { status: 500 },
    );
  }
}
