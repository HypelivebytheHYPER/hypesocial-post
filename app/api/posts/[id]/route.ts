import { NextRequest, NextResponse } from "next/server";
import { pfm } from "@/lib/post-for-me";
import { APIError } from "post-for-me";
import type { PostForMeError } from "@/types/post-for-me";
import { parseBody, validateId } from "@/lib/validations";
import { UpdatePostSchema } from "@/lib/validations/posts";

/**
 * GET /api/posts/[id]
 * Official API: GET /v1/social-posts/{id}
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const idError = validateId(id, "post");
    if (idError) return idError;
    const data = await pfm.socialPosts.retrieve(id);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: "API Error", message: error.message, statusCode: error.status },
        { status: error.status || 500 },
      );
    }
    console.error("[API] Error fetching post:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Unknown error occurred", statusCode: 500 },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/posts/[id]
 * Official API: PUT /v1/social-posts/{id}
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const idError = validateId(id, "post");
    if (idError) return idError;

    let jsonBody: unknown;
    try {
      jsonBody = await request.json();
    } catch {
      return NextResponse.json<PostForMeError>(
        { error: "Bad Request", message: "Invalid JSON in request body", statusCode: 400 },
        { status: 400 },
      );
    }

    const parsed = parseBody(UpdatePostSchema, jsonBody);
    if (!parsed.success) return parsed.response;

    const body = parsed.data;

    // Validate scheduled_at is in the future (skip for drafts)
    if (body.scheduled_at && !body.isDraft) {
      const scheduledDate = new Date(body.scheduled_at);
      if (scheduledDate < new Date()) {
        return NextResponse.json<PostForMeError>(
          { error: "Validation Error", message: "scheduled_at must be in the future", statusCode: 400 },
          { status: 400 },
        );
      }
    }

    const data = await pfm.socialPosts.update(id, body as any);
    console.log("[API] PUT /posts", { id });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: "API Error", message: error.message, statusCode: error.status },
        { status: error.status || 500 },
      );
    }
    console.error("[API] Error updating post:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Unknown error occurred", statusCode: 500 },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/posts/[id]
 * Official API: DELETE /v1/social-posts/{id}
 * Returns: 204 No Content
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const idError = validateId(id, "post");
    if (idError) return idError;
    await pfm.socialPosts.delete(id);
    console.log("[API] DELETE /posts", { id });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: "API Error", message: error.message, statusCode: error.status },
        { status: error.status || 500 },
      );
    }
    console.error("[API] Error deleting post:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Unknown error occurred", statusCode: 500 },
      { status: 500 },
    );
  }
}
