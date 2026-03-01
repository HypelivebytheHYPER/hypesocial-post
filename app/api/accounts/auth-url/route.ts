import { NextRequest, NextResponse } from "next/server";
import { pfm } from "@/lib/post-for-me";
import { APIError } from "post-for-me";
import type { PostForMeError } from "@/types/post-for-me";

/**
 * POST /api/accounts/auth-url
 * Generate OAuth URL for connecting a social account
 * Official API: POST /v1/social-accounts/auth-url
 */
export async function POST(request: NextRequest) {
  try {
    let body: Record<string, any>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json<PostForMeError>(
        { error: "Bad Request", message: "Invalid JSON in request body", statusCode: 400 },
        { status: 400 },
      );
    }

    if (!body.platform || typeof body.platform !== "string") {
      return NextResponse.json<PostForMeError>(
        {
          error: "Validation Error",
          message: "platform is required (e.g., 'facebook', 'instagram', 'tiktok')",
          statusCode: 400,
        },
        { status: 400 },
      );
    }

    const validPlatforms = [
      "facebook", "instagram", "tiktok", "tiktok_business",
      "x", "twitter", "linkedin", "youtube", "pinterest", "threads", "bluesky",
    ];

    if (!validPlatforms.includes(body.platform.toLowerCase())) {
      return NextResponse.json<PostForMeError>(
        {
          error: "Validation Error",
          message: `Invalid platform '${body.platform}'. Must be one of: ${validPlatforms.join(", ")}`,
          statusCode: 400,
        },
        { status: 400 },
      );
    }

    // Build auth URL params
    const params: Record<string, any> = {
      platform: body.platform.toLowerCase(),
    };

    if (body.external_id) params.external_id = body.external_id;
    if (body.permissions) params.permissions = body.permissions;
    if (body.platform_data) params.platform_data = body.platform_data;

    if (body.redirect_url_override) {
      params.redirect_url_override = body.redirect_url_override;
    }

    const data = await pfm.socialAccounts.createAuthURL(params as any);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: "API Error", message: error.message, statusCode: error.status },
        { status: error.status || 500 },
      );
    }
    console.error("[API] Error creating auth URL:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Unknown error occurred", statusCode: 500 },
      { status: 500 },
    );
  }
}
