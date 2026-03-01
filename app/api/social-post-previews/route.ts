import { NextRequest, NextResponse } from "next/server";
import { pfm } from "@/lib/post-for-me";
import { APIError } from "post-for-me";
import type { PostForMeError } from "@/types/post-for-me";

/**
 * POST /api/social-post-previews
 * Generate preview of how posts will look on social platforms
 * Official API: POST /v1/social-post-previews
 */
export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json<PostForMeError>(
        { error: "Bad Request", message: "Invalid JSON in request body", statusCode: 400 },
        { status: 400 },
      );
    }

    // Validate required fields
    if (!body.caption || typeof body.caption !== "string") {
      return NextResponse.json<PostForMeError>(
        { error: "Validation Error", message: "caption is required and must be a string", statusCode: 400 },
        { status: 400 },
      );
    }

    if (
      !body.preview_social_accounts ||
      !Array.isArray(body.preview_social_accounts) ||
      body.preview_social_accounts.length === 0
    ) {
      return NextResponse.json<PostForMeError>(
        {
          error: "Validation Error",
          message: "preview_social_accounts is required and must be a non-empty array",
          statusCode: 400,
        },
        { status: 400 },
      );
    }

    const data = await pfm.post("/v1/social-post-previews", { body });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: "API Error", message: error.message, statusCode: error.status },
        { status: error.status || 500 },
      );
    }
    console.error("[API] Error generating post preview:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Unknown error occurred", statusCode: 500 },
      { status: 500 },
    );
  }
}
