import { NextRequest, NextResponse } from "next/server";
import {
  SocialPost,
  UpdateSocialPostDto,
  PostForMeError,
} from "@/types/post-for-me";

const API_BASE = process.env.POSTFORME_API_URL || "https://api.postforme.dev";
const API_KEY = process.env.POST_FOR_ME_API_KEY;

/**
 * GET /api/posts/[id]
 * Get a single social post by ID
 * Official API: GET /v1/social-posts/{id}
 *
 * Path Parameters:
 * - id: string (required) - The post ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!API_KEY) {
      return NextResponse.json<PostForMeError>(
        {
          error: "Configuration Error",
          message: "API key not configured",
          statusCode: 500,
        },
        { status: 500 },
      );
    }

    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json<PostForMeError>(
        {
          error: "Validation Error",
          message: "Post ID is required",
          statusCode: 400,
        },
        { status: 400 },
      );
    }

    const response = await fetch(`${API_BASE}/v1/social-posts/${id}`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: Partial<PostForMeError>;

      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      if (response.status === 404) {
        return NextResponse.json<PostForMeError>(
          {
            error: "Not Found",
            message: `Post with ID '${id}' not found`,
            statusCode: 404,
          },
          { status: 404 },
        );
      }

      return NextResponse.json<PostForMeError>(
        {
          error: errorData.error || "API Error",
          message:
            errorData.message || `Failed to fetch post: ${response.status}`,
          statusCode: response.status,
          details: errorData.details,
        },
        { status: response.status },
      );
    }

    const data: SocialPost = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Error fetching post:", error);
    return NextResponse.json<PostForMeError>(
      {
        error: "Internal Server Error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        statusCode: 500,
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/posts/[id]
 * Update a social post
 * Official API: PUT /v1/social-posts/{id}
 *
 * Path Parameters:
 * - id: string (required) - The post ID
 *
 * Body Fields (all optional):
 * - caption: string
 * - social_accounts: string[]
 * - media: { url: string }[]
 * - scheduled_at: string (ISO 8601 datetime)
 * - isDraft: boolean
 * - platform_configurations: Record<string, PlatformConfig>
 * - account_configurations: AccountConfig[]
 *
 * Note: Can only update posts that are in 'draft' or 'scheduled' status
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!API_KEY) {
      return NextResponse.json<PostForMeError>(
        {
          error: "Configuration Error",
          message: "API key not configured",
          statusCode: 500,
        },
        { status: 500 },
      );
    }

    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json<PostForMeError>(
        {
          error: "Validation Error",
          message: "Post ID is required",
          statusCode: 400,
        },
        { status: 400 },
      );
    }

    let body: Partial<UpdateSocialPostDto>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json<PostForMeError>(
        {
          error: "Bad Request",
          message: "Invalid JSON in request body",
          statusCode: 400,
        },
        { status: 400 },
      );
    }

    // Validate media URLs if provided
    if (body.media && !Array.isArray(body.media)) {
      return NextResponse.json<PostForMeError>(
        {
          error: "Validation Error",
          message: "media must be an array of { url: string } objects",
          statusCode: 400,
        },
        { status: 400 },
      );
    }

    // Validate scheduled_at format if provided
    if (body.scheduled_at) {
      const scheduledDate = new Date(body.scheduled_at);
      if (isNaN(scheduledDate.getTime())) {
        return NextResponse.json<PostForMeError>(
          {
            error: "Validation Error",
            message: "scheduled_at must be a valid ISO 8601 datetime string",
            statusCode: 400,
          },
          { status: 400 },
        );
      }

      // Check if scheduled time is in the future (unless it's a draft)
      if (!body.isDraft && scheduledDate < new Date()) {
        return NextResponse.json<PostForMeError>(
          {
            error: "Validation Error",
            message: "scheduled_at must be in the future",
            statusCode: 400,
          },
          { status: 400 },
        );
      }
    }

    const response = await fetch(`${API_BASE}/v1/social-posts/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: Partial<PostForMeError>;

      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      if (response.status === 404) {
        return NextResponse.json<PostForMeError>(
          {
            error: "Not Found",
            message: `Post with ID '${id}' not found`,
            statusCode: 404,
          },
          { status: 404 },
        );
      }

      if (response.status === 409) {
        return NextResponse.json<PostForMeError>(
          {
            error: "Conflict",
            message:
              "Cannot update post that has already been published or is being processed",
            statusCode: 409,
          },
          { status: 409 },
        );
      }

      return NextResponse.json<PostForMeError>(
        {
          error: errorData.error || "API Error",
          message:
            errorData.message || `Failed to update post: ${response.status}`,
          statusCode: response.status,
          details: errorData.details,
        },
        { status: response.status },
      );
    }

    const data: SocialPost = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Error updating post:", error);
    return NextResponse.json<PostForMeError>(
      {
        error: "Internal Server Error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        statusCode: 500,
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/posts/[id]
 * Delete a social post
 * Official API: DELETE /v1/social-posts/{id}
 *
 * Path Parameters:
 * - id: string (required) - The post ID
 *
 * Note: Can only delete posts that are in 'draft' or 'scheduled' status
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!API_KEY) {
      return NextResponse.json<PostForMeError>(
        {
          error: "Configuration Error",
          message: "API key not configured",
          statusCode: 500,
        },
        { status: 500 },
      );
    }

    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json<PostForMeError>(
        {
          error: "Validation Error",
          message: "Post ID is required",
          statusCode: 400,
        },
        { status: 400 },
      );
    }

    const response = await fetch(`${API_BASE}/v1/social-posts/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: Partial<PostForMeError>;

      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      if (response.status === 404) {
        return NextResponse.json<PostForMeError>(
          {
            error: "Not Found",
            message: `Post with ID '${id}' not found`,
            statusCode: 404,
          },
          { status: 404 },
        );
      }

      if (response.status === 409) {
        return NextResponse.json<PostForMeError>(
          {
            error: "Conflict",
            message:
              "Cannot delete post that has already been published or is being processed",
            statusCode: 409,
          },
          { status: 409 },
        );
      }

      return NextResponse.json<PostForMeError>(
        {
          error: errorData.error || "API Error",
          message:
            errorData.message || `Failed to delete post: ${response.status}`,
          statusCode: response.status,
          details: errorData.details,
        },
        { status: response.status },
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("[API] Error deleting post:", error);
    return NextResponse.json<PostForMeError>(
      {
        error: "Internal Server Error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        statusCode: 500,
      },
      { status: 500 },
    );
  }
}
