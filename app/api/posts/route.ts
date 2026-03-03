import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pfm } from "@/lib/post-for-me";
import { APIError } from "post-for-me";
import type { PostForMeError } from "@/types/post-for-me";

// Allowed media storage domains - ONLY Post For Me storage
const ALLOWED_MEDIA_DOMAINS = [
  "data.postforme.dev",
  "cjsgitiiwhrsfolwmtby.supabase.co",
];

// Zod schemas for validation
const MediaItemSchema = z.object({
  url: z.string().url(),
});

const CreatePostSchema = z.object({
  caption: z.string(),
  social_accounts: z.array(z.string()),
  media: z.array(MediaItemSchema).optional(),
  scheduled_at: z.string().datetime().optional(),
  isDraft: z.boolean().optional(),
  platform_configurations: z.record(z.any()).optional(),
  account_configurations: z.array(z.object({
    social_account_id: z.string(),
    configuration: z.record(z.any()),
  })).optional(),
  external_id: z.string().optional(),
});

const ListPostsQuerySchema = z.object({
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.array(z.enum(["draft", "scheduled", "processing", "processed"])).optional(),
  platform: z.array(z.enum(["facebook", "instagram", "tiktok", "youtube", "x", "bluesky", "linkedin", "pinterest", "threads"])).optional(),
  external_id: z.array(z.string()).optional(),
  social_account_id: z.array(z.string()).optional(),
});

function validateMediaUrls(
  media?: { url: string }[],
): { valid: true } | { valid: false; error: string } {
  if (!media || media.length === 0) return { valid: true };

  for (const item of media) {
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

    const queryResult = ListPostsQuerySchema.safeParse({
      offset: searchParams.get("offset") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      status: searchParams.getAll("status"),
      platform: searchParams.getAll("platform"),
      external_id: searchParams.getAll("external_id"),
      social_account_id: searchParams.getAll("social_account_id"),
    });

    if (!queryResult.success) {
      const issues = queryResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
      return NextResponse.json<PostForMeError>(
        {
          error: "Validation Error",
          message: `Invalid query parameters: ${issues.join(", ")}`,
          statusCode: 400,
        },
        { status: 400 },
      );
    }

    const data = await pfm.socialPosts.list(queryResult.data);

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
    let jsonBody: unknown;

    try {
      jsonBody = await request.json();
    } catch {
      return NextResponse.json<PostForMeError>(
        { error: "Bad Request", message: "Invalid JSON in request body", statusCode: 400 },
        { status: 400 },
      );
    }

    // Validate with Zod
    const parseResult = CreatePostSchema.safeParse(jsonBody);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
      return NextResponse.json<PostForMeError>(
        {
          error: "Validation Error",
          message: issues.join("; "),
          statusCode: 400,
          details: { fields: issues }
        },
        { status: 400 },
      );
    }

    const body = parseResult.data;

    // Validate required fields (skip for drafts)
    if (!body.isDraft) {
      const errors: string[] = [];
      if (!body.caption || body.caption.trim() === "") {
        errors.push("caption is required and must be a non-empty string");
      }
      if (!body.social_accounts || body.social_accounts.length === 0) {
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

    // Validate scheduled_at is in the future (skip for drafts)
    if (body.scheduled_at && !body.isDraft) {
      const scheduledDate = new Date(body.scheduled_at);
      if (scheduledDate < new Date()) {
        return NextResponse.json<PostForMeError>(
          { error: "Validation Error", message: "scheduled_at must be in the future", statusCode: 400 },
          { status: 400 },
        );
      }
    }

    const data = await pfm.socialPosts.create({
      ...body,
      caption: body.caption || "",
      social_accounts: body.social_accounts || [],
    });

    console.log("[API] POST /posts", { id: data.id, status: data.status, accounts: body.social_accounts?.length ?? 0 });
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
