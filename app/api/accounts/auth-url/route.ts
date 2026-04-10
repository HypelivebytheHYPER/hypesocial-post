import { NextRequest, NextResponse } from "next/server";
import { pfm } from "@/lib/post-for-me-client";
import { APIError } from "post-for-me";
import type { SocialAccounts } from "post-for-me/resources/social-accounts";
import type { PostForMeError } from "@/types/post-for-me-types";
import { parseBody } from "@/lib/validations";
import { AuthUrlSchema } from "@/lib/validations/accounts";

/**
 * POST /api/accounts/auth-url
 * Generate OAuth URL for connecting a social account
 * Official API: POST /v1/social-accounts/auth-url
 */
export async function POST(request: NextRequest) {
  try {
    let jsonBody: unknown;

    try {
      jsonBody = await request.json();
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

    const parsed = parseBody(AuthUrlSchema, jsonBody);
    if (!parsed.success) return parsed.response;

    const body = parsed.data;

    // Build auth URL params
    const platform = body.platform;
    const params: SocialAccounts.SocialAccountCreateAuthURLParams = {
      platform,
      ...(body.external_id && { external_id: body.external_id }),
      ...(body.permissions && { permissions: body.permissions }),
      ...(body.platform_data && { platform_data: body.platform_data }),
    };

    // Auto-inject required platform_data for platforms that need it
    if (
      platform === "instagram" &&
      !params.platform_data?.instagram?.connection_type
    ) {
      params.platform_data = {
        ...params.platform_data,
        instagram: {
          connection_type:
            (body.connection_type as "instagram" | "facebook") || "instagram",
          ...params.platform_data?.instagram,
        },
      };
    }
    if (
      platform === "linkedin" &&
      !params.platform_data?.linkedin?.connection_type
    ) {
      // Per docs: MUST use "organization" for Community Management API (supports both personal + company pages)
      params.platform_data = {
        ...params.platform_data,
        linkedin: {
          connection_type:
            (body.connection_type as "personal" | "organization") ||
            "organization",
          ...params.platform_data?.linkedin,
        },
      };
    }

    // Auto-inject redirect_url_override for forwarded account connection
    const pfmRedirectUri = process.env.POST_FOR_ME_REDIRECT_URI;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (pfmRedirectUri && appUrl && !body.redirect_url_override) {
      params.redirect_url_override = `${appUrl}/api/accounts/callback/${platform}`;
    }

    if (body.redirect_url_override) {
      params.redirect_url_override = body.redirect_url_override;
    }

    const data = await pfm.socialAccounts.createAuthURL(params);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        {
          error: "API Error",
          message: error.message,
          statusCode: error.status,
        },
        { status: error.status || 500 },
      );
    }
    console.error("[API] Error creating auth URL:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Unknown error occurred",
        statusCode: 500,
      },
      { status: 500 },
    );
  }
}
