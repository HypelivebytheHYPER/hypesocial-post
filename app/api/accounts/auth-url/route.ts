import { NextRequest, NextResponse } from "next/server";
import { pfm } from "@/lib/post-for-me";
import { APIError } from "post-for-me";
import type { PostForMeError } from "@/types/post-for-me";
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
        { error: "Bad Request", message: "Invalid JSON in request body", statusCode: 400 },
        { status: 400 },
      );
    }

    const parsed = parseBody(AuthUrlSchema, jsonBody);
    if (!parsed.success) return parsed.response;

    const body = parsed.data;

    // Build auth URL params
    const params: Record<string, any> = {
      platform: body.platform,
    };

    if (body.external_id) params.external_id = body.external_id;
    if (body.permissions) params.permissions = body.permissions;
    if (body.platform_data) params.platform_data = body.platform_data;

    // Auto-inject required platform_data for platforms that need it
    const platform = params.platform;
    if (platform === "instagram" && !params.platform_data?.instagram?.connection_type) {
      params.platform_data = {
        ...params.platform_data,
        instagram: { connection_type: body.connection_type || "instagram", ...params.platform_data?.instagram },
      };
    }
    if (platform === "linkedin" && !params.platform_data?.linkedin?.connection_type) {
      params.platform_data = {
        ...params.platform_data,
        linkedin: { connection_type: body.connection_type || "personal", ...params.platform_data?.linkedin },
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

    const data = await pfm.socialAccounts.createAuthURL(params as any);
    console.log("[API] POST /accounts/auth-url", { platform: params.platform });
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
