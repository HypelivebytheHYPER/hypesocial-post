import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.POST_FOR_ME_BASE_URL || "https://api.postforme.dev";
const API_KEY = process.env.POST_FOR_ME_API_KEY;

/**
 * POST /api/social-post-previews
 * Generate preview of how posts will look on social platforms
 * Official API: POST /v1/social-post-previews
 *
 * Request Body:
 * - caption: string (required) - Caption text for the post
 * - preview_social_accounts: array (required) - Array of social accounts to preview
 * - platform_configurations: object (optional) - Platform-specific configurations
 * - account_configurations: array (optional) - Account-specific configurations
 * - media: array (optional) - Array of media URLs
 */
export async function POST(request: NextRequest) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 },
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.caption) {
      return NextResponse.json(
        { error: "Caption is required" },
        { status: 400 },
      );
    }

    if (
      !body.preview_social_accounts ||
      !Array.isArray(body.preview_social_accounts)
    ) {
      return NextResponse.json(
        { error: "preview_social_accounts array is required" },
        { status: 400 },
      );
    }

    const response = await fetch(`${API_BASE}/v1/social-post-previews`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Post For Me API error: ${error}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Error generating post preview:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
