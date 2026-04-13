import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pfm } from "@/lib/post-for-me-client";
import { PAGINATION, PLATFORM_LIMITS } from "@/lib/constants";
import {
  handleApiError,
  parseJsonBody,
  buildValidationError,
  sendErrorResponse,
} from "@/lib/api-errors";

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
  caption: z.string().max(PLATFORM_LIMITS.MAX_CAPTION_LENGTH),
  social_accounts: z.array(z.string()),
  media: z.array(MediaItemSchema).max(PLATFORM_LIMITS.MAX_MEDIA_PER_POST).optional(),
  scheduled_at: z.string().datetime().optional(),
  isDraft: z.boolean().optional(),
  platform_configurations: z.record(z.any()).optional(),
  account_configurations: z
    .array(
      z.object({
        social_account_id: z.string(),
        configuration: z.record(z.any()),
      }),
    )
    .optional(),
  external_id: z.string().optional(),
});

const ListPostsQuerySchema = z.object({
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(PAGINATION.MAX_PAGE_SIZE).default(PAGINATION.DEFAULT_LIMIT),
  status: z
    .array(z.enum(["draft", "scheduled", "processing", "processed"]))
    .optional(),
  platform: z
    .array(
      z.enum([
        "facebook",
        "instagram",
        "tiktok",
        "youtube",
        "x",
        "bluesky",
        "linkedin",
        "pinterest",
        "threads",
      ]),
    )
    .optional(),
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
      const issues = queryResult.error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`,
      );
      return sendErrorResponse(
        buildValidationError(`Invalid query parameters: ${issues.join(", ")}`, issues),
        400,
      );
    }

    const data = await pfm.socialPosts.list(queryResult.data);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, { context: "fetching posts" });
  }
}

/**
 * POST /api/posts
 * Official API: POST /v1/social-posts
 */
export async function POST(request: NextRequest) {
  try {
    const bodyResult = await parseJsonBody(request, CreatePostSchema);
    if (!bodyResult.success) {
      return bodyResult.response;
    }

    const body = bodyResult.data;

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
        return sendErrorResponse(buildValidationError(errors.join("; "), errors), 400);
      }
    }

    // Validate media URLs
    const mediaValidation = validateMediaUrls(body.media);
    if (!mediaValidation.valid) {
      return sendErrorResponse(
        buildValidationError(mediaValidation.error || "Invalid media URL", [
          mediaValidation.error || "Invalid media URL",
        ]),
        400,
      );
    }

    // Validate TikTok privacy_status is explicitly set
    const pc = body.platform_configurations;
    if (pc) {
      for (const key of ["tiktok", "tiktok_business"] as const) {
        const cfg = pc[key];
        if (
          cfg &&
          (!cfg.privacy_status || !["public", "private"].includes(cfg.privacy_status))
        ) {
          return sendErrorResponse(
            buildValidationError(
              `${key}.privacy_status must be "public" or "private"`,
              [`${key}.privacy_status must be "public" or "private"`],
            ),
            400,
          );
        }
      }
    }

    // Validate scheduled_at is in the future (skip for drafts)
    if (body.scheduled_at && !body.isDraft) {
      const scheduledDate = new Date(body.scheduled_at);
      if (scheduledDate < new Date()) {
        return sendErrorResponse(
          buildValidationError("scheduled_at must be in the future", [
            "scheduled_at must be in the future",
          ]),
          400,
        );
      }
    }

    const data = await pfm.socialPosts.create({
      ...body,
      caption: body.caption || "",
      social_accounts: body.social_accounts || [],
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleApiError(error, { context: "creating post" });
  }
}
