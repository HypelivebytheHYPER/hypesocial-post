import { NextRequest, NextResponse } from "next/server";
import {
  SocialAccount,
  SocialAccountListResponse,
  CreateAuthUrlDto,
  AuthUrlResponse,
  PostForMeError,
} from "@/types/post-for-me";

const API_BASE = process.env.POSTFORME_API_URL || "https://api.postforme.dev";
const API_KEY = process.env.POSTFORME_API_KEY;

/**
 * GET /api/accounts
 * List all connected social accounts with pagination and filters
 * Official API: GET /v1/social-accounts
 *
 * Query Parameters:
 * - offset: number (default: 0)
 * - limit: number (default: 20, max: 100)
 * - platform: string[] (facebook, instagram, tiktok, x, linkedin, youtube, etc.)
 * - status: string[] (connected, disconnected)
 * - username: string[]
 * - external_id: string[]
 * - id: string[]
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
    const platform = searchParams.getAll("platform");
    platform.forEach((p) => queryParts.push(`platform=${p}`));

    const status = searchParams.getAll("status");
    status.forEach((s) => queryParts.push(`status=${s}`));

    const username = searchParams.getAll("username");
    username.forEach((u) => queryParts.push(`username=${u}`));

    const externalId = searchParams.getAll("external_id");
    externalId.forEach((id) => queryParts.push(`external_id=${id}`));

    const id = searchParams.getAll("id");
    id.forEach((i) => queryParts.push(`id=${i}`));

    const query = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

    const response = await fetch(`${API_BASE}/v1/social-accounts${query}`, {
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

    const data: SocialAccountListResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Error fetching accounts:", error);
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
 * POST /api/accounts
 * Initiate OAuth flow for connecting a new social account
 * Official API: POST /v1/social-accounts/auth-url
 *
 * Required Body Fields:
 * - platform: string (e.g., "facebook", "instagram", "tiktok", "x", "linkedin", "youtube")
 *
 * Optional Body Fields:
 * - external_id: string
 * - permissions: string[] (e.g., ["posts", "feeds"])
 * - redirect_url: string - Standard callback (Post For Me handles OAuth)
 * - redirect_url_override: string - White-label interception (you handle OAuth callback)
 *
 * OAuth Interception (White Label) Requirements:
 * - Must use your own credentials (NOT Quickstart)
 * - Your domain must be in social platform's authorized redirect domains
 * - Set Project Redirect URL in Post For Me dashboard
 * Docs: https://www.postforme.dev/resources/intercepting-the-oauth-flow
 *
 * Returns:
 * - url: string - The OAuth URL to redirect the user to
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

    let body: Partial<CreateAuthUrlDto>;

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

    // Validate required fields
    if (!body.platform || typeof body.platform !== "string") {
      return NextResponse.json<PostForMeError>(
        {
          error: "Validation Error",
          message:
            "platform is required and must be a string (e.g., 'facebook', 'instagram', 'tiktok')",
          statusCode: 400,
        },
        { status: 400 },
      );
    }

    // Validate platform value
    // tiktok = Standard TikTok API (basic posting, simple metrics)
    // tiktok_business = TikTok Business API (advanced analytics, custom thumbnails)
    const validPlatforms = [
      "facebook",
      "instagram",
      "tiktok",
      "tiktok_business",
      "x",
      "twitter",
      "linkedin",
      "youtube",
      "pinterest",
      "threads",
      "bluesky",
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

    // Build request body
    const authBody: CreateAuthUrlDto = {
      platform: body.platform.toLowerCase(),
    };

    if (body.external_id) {
      authBody.external_id = body.external_id;
    }

    if (body.permissions && Array.isArray(body.permissions)) {
      authBody.permissions = body.permissions;
    }

    // Support white-label OAuth interception via redirect_url_override
    // This redirects users to YOUR app instead of Post For Me servers
    // Requires your domain in social platform's authorized redirect domains
    if (body.redirect_url_override) {
      authBody.redirect_url_override = body.redirect_url_override;
    } else {
      // Standard OAuth flow - Post For Me handles callback
      authBody.redirect_url =
        body.redirect_url ||
        `${process.env.NEXT_PUBLIC_APP_URL}/accounts/callback` ||
        "http://localhost:3000/accounts/callback";
    }

    const response = await fetch(`${API_BASE}/v1/social-accounts/auth-url`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(authBody),
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
            errorData.message ||
            `Failed to create auth URL: ${response.status}`,
          statusCode: response.status,
          details: errorData.details,
        },
        { status: response.status },
      );
    }

    const data: AuthUrlResponse = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("[API] Error creating auth URL:", error);
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
