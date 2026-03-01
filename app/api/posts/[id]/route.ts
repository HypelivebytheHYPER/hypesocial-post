import { NextRequest, NextResponse } from "next/server";
import { pfm } from "@/lib/post-for-me";
import { APIError } from "post-for-me";
import type { PostForMeError } from "@/types/post-for-me";

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

    let body: Record<string, any>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json<PostForMeError>(
        { error: "Bad Request", message: "Invalid JSON in request body", statusCode: 400 },
        { status: 400 },
      );
    }

    if (body.scheduled_at) {
      const scheduledDate = new Date(body.scheduled_at);
      if (isNaN(scheduledDate.getTime())) {
        return NextResponse.json<PostForMeError>(
          { error: "Validation Error", message: "scheduled_at must be a valid ISO 8601 datetime string", statusCode: 400 },
          { status: 400 },
        );
      }
      if (!body.isDraft && scheduledDate < new Date()) {
        return NextResponse.json<PostForMeError>(
          { error: "Validation Error", message: "scheduled_at must be in the future", statusCode: 400 },
          { status: 400 },
        );
      }
    }

    const data = await pfm.socialPosts.update(id, body as any);
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
    await pfm.socialPosts.delete(id);
    return new NextResponse(null, { status: 204 });
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
