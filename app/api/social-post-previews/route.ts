import { NextRequest, NextResponse } from "next/server";
import { pfm } from "@/lib/post-for-me";
import { APIError } from "post-for-me";
import type { PostForMeError } from "@/types/post-for-me";
import { parseBody } from "@/lib/validations";
import { CreatePreviewSchema } from "@/lib/validations/social-post-previews";

/**
 * POST /api/social-post-previews
 * Generate preview of how posts will look on social platforms
 * Official API: POST /v1/social-post-previews
 */
export async function POST(request: NextRequest) {
  try {
    let jsonBody: unknown;

    try {
      jsonBody = await request.json();
    } catch {
      return NextResponse.json<PostForMeError>(
        { error: "Bad Request", message: "Invalid JSON in request body", statusCode: 400 },
        { status: 400 },
      );
    }

    const parsed = parseBody(CreatePreviewSchema, jsonBody);
    if (!parsed.success) return parsed.response;

    const data = await pfm.post("/v1/social-post-previews", { body: parsed.data });
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
