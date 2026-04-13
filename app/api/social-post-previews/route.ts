import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pfm } from "@/lib/post-for-me-client";
import {
  handleApiError,
  buildValidationError,
  sendErrorResponse,
} from "@/lib/api-errors";
import type { SocialPostPreview, SocialPostPreviewRequest } from "@/types/post-for-me-types";

const PreviewSchema = z.object({
  caption: z.string(),
  preview_social_accounts: z.array(
    z.object({
      id: z.string(),
      platform: z.string(),
      username: z.string().optional(),
    }),
  ),
  media: z
    .array(
      z.object({
        url: z.string().url(),
        thumbnail_url: z.string().url().optional(),
        thumbnail_timestamp_ms: z.number().optional(),
        tags: z.array(z.object({
          id: z.string(),
          type: z.enum(["user", "product"]),
          platform: z.enum(["facebook", "instagram"]),
          x: z.number().optional(),
          y: z.number().optional(),
        })).optional(),
        skip_processing: z.boolean().optional(),
      }),
    )
    .optional(),
  platform_configurations: z.record(z.any()).optional(),
  account_configurations: z
    .array(
      z.object({
        social_account_id: z.string(),
        configuration: z.record(z.any()),
      }),
    )
    .optional(),
});

/**
 * POST /api/social-post-previews
 * Official API: POST /v1/social-post-previews
 *
 * Generate previews for a post across different platforms.
 * Returns: SocialPostPreview[] (array of previews, one per platform/account)
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

    const parseResult = PreviewSchema.safeParse(jsonBody);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`,
      );
      return sendErrorResponse(
        buildValidationError(issues.join("; "), issues),
        400,
      );
    }

    // API returns array directly, not wrapped in { data: [...] }
    const data = await pfm.post<SocialPostPreview[]>("/v1/social-post-previews", { 
      body: parseResult.data as SocialPostPreviewRequest 
    });
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, { context: "generating post preview" });
  }
}
