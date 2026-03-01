import { NextRequest, NextResponse } from "next/server";
import {
  SocialPost,
  SocialPostListResponse,
  CreateSocialPostDto,
  PostForMeError,
} from "@/types/post-for-me";

const API_BASE = process.env.POSTFORME_API_URL || "https://api.postforme.dev";
const API_KEY = process.env.POST_FOR_ME_API_KEY;

/**
 * GET /api/posts
 * List all social posts with pagination and filters
 * Official API: GET /v1/social-posts
 *
 * Query Parameters:
 * - offset: number (default: 0)
 * - limit: number (default: 20, max: 100)
 * - status: string[] (draft, scheduled, processing, processed, failed)
 * - platform: string[] (facebook, instagram, tiktok, etc.)
 * - external_id: string[]
 * - social_account_id: string[]
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);

    // Build query parameters
    const queryParts: string[] = [];

    // Pagination
    const offset = searchParams.get("offset");
    if (offset) queryParts.push(`offset=${offset}`);

    const limit = searchParams.get("limit");
    if (limit) queryParts.push(`limit=${limit}`);

    // Filters (can be array)
    const status = searchParams.getAll("status");
    status.forEach((s) => queryParts.push(`status=${s}`));

    const platform = searchParams.getAll("platform");
    platform.forEach((p) => queryParts.push(`platform=${p}`));

    const externalId = searchParams.getAll("external_id");
    externalId.forEach((id) => queryParts.push(`external_id=${id}`));

    const socialAccountId = searchParams.getAll("social_account_id");
    socialAccountId.forEach((id) => queryParts.push(`social_account_id=${id}`));

    const query = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

    const response = await fetch(`${API_BASE}/v1/social-posts${query}`, {
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

      return NextResponse.json<PostForMeError>(
        {
          error: errorData.error || "API Error",
          message:
            errorData.message || `Post For Me API error: ${response.status}`,
          statusCode: response.status,
          details: errorData.details,
        },
        { status: response.status },
      );
    }

    const data: SocialPostListResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Error fetching posts:", error);
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
 * POST /api/posts
 * Create a new social post
 * Official API: POST /v1/social-posts
 *
 * Required Body Fields:
 * - caption: string
 * - social_accounts: string[] (array of account IDs)
 *
 * Optional Body Fields:
 * - media: { url: string }[]
 * - scheduled_at: string (ISO 8601 datetime)
 * - isDraft: boolean
 * - platform_configurations: Record<string, PlatformConfig>
 * - account_configurations: AccountConfig[]
 * - external_id: string
 */
export async function POST(request: NextRequest) {
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

    let body: Partial<CreateSocialPostDto>;

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

    // Validate required fields (skip for drafts)
    const errors: string[] = [];

    if (!body.isDraft) {
      if (
        !body.caption ||
        typeof body.caption !== "string" ||
        body.caption.trim() === ""
      ) {
        errors.push("caption is required and must be a non-empty string");
      }

      if (
        !body.social_accounts ||
        !Array.isArray(body.social_accounts) ||
        body.social_accounts.length === 0
      ) {
        errors.push(
          "social_accounts is required and must be a non-empty array",
        );
      }
    }

    if (errors.length > 0) {
      return NextResponse.json<PostForMeError>(
        {
          error: "Validation Error",
          message: errors.join("; "),
          statusCode: 400,
          details: { fields: errors },
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

    // Prepare request body - provide defaults for drafts if needed
    const requestBody: CreateSocialPostDto = {
      caption: body.caption || "",
      social_accounts: body.social_accounts || [],
      ...body,
    };

    const response = await fetch(`${API_BASE}/v1/social-posts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: Partial<PostForMeError>;

      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      return NextResponse.json<PostForMeError>(
        {
          error: errorData.error || "API Error",
          message:
            errorData.message || `Failed to create post: ${response.status}`,
          statusCode: response.status,
          details: errorData.details,
        },
        { status: response.status },
      );
    }

    const data: SocialPost = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("[API] Error creating post:", error);
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
