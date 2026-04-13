import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pfm } from "@/lib/post-for-me-client";
import {
  handleApiError,
  buildValidationError,
  sendErrorResponse,
} from "@/lib/api-errors";

const AuthUrlSchema = z.object({
  platform: z.string(),
  redirect_url: z.string().url().optional(),
  permissions: z.array(z.enum(["posts", "feeds"])).optional(),
  platform_data: z.record(z.any()).optional(),
  // Use webhook callback instead of browser redirect
  use_webhook_callback: z.boolean().optional().default(false),
});

// Quickstart Projects: Don't use redirect_url_override
// Set this to true if using your own OAuth credentials (White Label)
const IS_WHITELABEL_PROJECT = !!process.env.POST_FOR_ME_REDIRECT_URI;

/**
 * POST /api/accounts/auth-url
 * Official API: POST /v1/social-accounts/auth-url
 *
 * Get OAuth URL for connecting a social account.
 * Supports both standard and intercepted OAuth flows.
 */
export async function POST(request: NextRequest) {
  try {
    let jsonBody: unknown;
    try {
      jsonBody = await request.json();
    } catch {
      return sendErrorResponse(
        buildValidationError("Invalid JSON in request body", ["Invalid JSON"]),
        400,
      );
    }

    const parseResult = AuthUrlSchema.safeParse(jsonBody);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`,
      );
      return sendErrorResponse(
        buildValidationError(issues.join("; "), issues),
        400,
      );
    }

    const { platform, redirect_url, permissions, platform_data, use_webhook_callback } = parseResult.data;

    // Build params - only use redirect_url_override for White Label projects
    // Quickstart Projects: Let Post For Me handle the redirect
    const params: { 
      platform: string; 
      redirect_url_override?: string;
      permissions?: ("posts" | "feeds")[];
      platform_data?: Record<string, unknown>;
    } = { platform };
    
    // Use webhook callback endpoint instead of browser redirect
    if (use_webhook_callback) {
      // Get base URL from env var or Vercel deployment URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
        "https://hypesocial-post.vercel.app";
      params.redirect_url_override = `${baseUrl}/api/webhooks/oauth-callback`;
    } else if (IS_WHITELABEL_PROJECT && redirect_url) {
      params.redirect_url_override = redirect_url;
    }
    
    if (permissions) {
      params.permissions = permissions as ("posts" | "feeds")[];
    }
    
    if (platform_data) {
      params.platform_data = platform_data;
    }

    const data = await pfm.socialAccounts.createAuthURL(params);

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, { context: "creating auth URL" });
  }
}
