import { NextRequest, NextResponse } from "next/server";
import { pfm } from "@/lib/post-for-me";
import { APIError } from "post-for-me";
import type { PostForMeError } from "@/types/post-for-me";

// Allowed media storage domains - ONLY Post For Me storage
const ALLOWED_MEDIA_DOMAINS = [
  "data.postforme.dev",
  "cjsgitiiwhrsfolwmtby.supabase.co",
];

function validateMediaUrls(
  media?: { url: string }[],
): { valid: true } | { valid: false; error: string } {
  if (!media || media.length === 0) return { valid: true };

  for (const item of media) {
    if (!item.url || typeof item.url !== "string") {
      return { valid: false, error: "Media item must have a valid URL string" };
    }
    try {
      const url = new URL(item.url);
      const isAllowed = ALLOWED_MEDIA_DOMAINS.some(
        (domain) =>
          url.hostname === domain || url.hostname.endsWith(`.${domain}`),
      );
      if (!isAllowed) {
        return {
          valid: false,
          error: `Invalid media URL: ${url.hostname}. Only Post For Me storage URLs are allowed. Please upload via /api/media first.`,
        };
      }
    } catch {
      return { valid: false, error: `Invalid URL format: ${item.url}` };
    }
  }
  return { valid: true };
}

/**
 * GET /api/posts
 * Official API: GET /v1/social-posts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const data = await pfm.socialPosts.list({
      offset: Number(searchParams.get("offset") || 0),
      limit: Number(searchParams.get("limit") || 20),
      status: searchParams.getAll("status") as any,
      platform: searchParams.getAll("platform") as any,
      external_id: searchParams.getAll("external_id"),
      social_account_id: searchParams.getAll("social_account_id"),
    });

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: "API Error", message: error.message, statusCode: error.status },
        { status: error.status || 500 },
      );
    }
    console.error("[API] Error fetching posts:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Unknown error occurred", statusCode: 500 },
      { status: 500 },
    );
  }
}

/**
 * POST /api/posts
 * Official API: POST /v1/social-posts
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

    // Validate required fields (skip for drafts)
    if (!body.isDraft) {
      const errors: string[] = [];
      if (!body.caption || typeof body.caption !== "string" || body.caption.trim() === "") {
        errors.push("caption is required and must be a non-empty string");
      }
      if (!body.social_accounts || !Array.isArray(body.social_accounts) || body.social_accounts.length === 0) {
        errors.push("social_accounts is required and must be a non-empty array");
      }
      if (errors.length > 0) {
        return NextResponse.json<PostForMeError>(
          { error: "Validation Error", message: errors.join("; "), statusCode: 400, details: { fields: errors } },
          { status: 400 },
        );
      }
    }

    // Validate media URLs
    if (body.media && !Array.isArray(body.media)) {
      return NextResponse.json<PostForMeError>(
        { error: "Validation Error", message: "media must be an array of { url: string } objects", statusCode: 400 },
        { status: 400 },
      );
    }

    const mediaValidation = validateMediaUrls(body.media);
    if (!mediaValidation.valid) {
      return NextResponse.json<PostForMeError>(
        {
          error: "Validation Error",
          message: mediaValidation.error || "Invalid media URL",
          statusCode: 400,
          details: { allowed_domains: ALLOWED_MEDIA_DOMAINS, instruction: "Upload media via POST /api/media to get valid URLs" },
        },
        { status: 400 },
      );
    }

    // Validate scheduled_at
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

    const data = await pfm.socialPosts.create({
      caption: body.caption || "",
      social_accounts: body.social_accounts || [],
      ...body,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: "API Error", message: error.message, statusCode: error.status },
        { status: error.status || 500 },
      );
    }
    console.error("[API] Error creating post:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Unknown error occurred", statusCode: 500 },
      { status: 500 },
    );
  }
}
