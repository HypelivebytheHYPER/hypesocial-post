import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pfm } from "@/lib/post-for-me";
import { APIError } from "post-for-me";
import type { PostForMeError } from "@/types/post-for-me";
import { ALLOWED_CONTENT_TYPES, getMaxFileSize } from "@/lib/media-constants";

// Create a typed array from allowed content types for Zod enum
const ALLOWED_CONTENT_TYPES_ARRAY = [...ALLOWED_CONTENT_TYPES] as [string, ...string[]];

// Zod schema for media upload request
const MediaUploadSchema = z.object({
  filename: z.string().regex(/\.[^.]+$/, "filename must include a file extension"),
  content_type: z.enum(ALLOWED_CONTENT_TYPES_ARRAY).transform(val => val.toLowerCase() as typeof val),
  size: z.number().int().positive().optional(),
});

/**
 * POST /api/media
 * Get presigned URL for media upload
 * Official API: POST /v1/media/create-upload-url
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
    const parseResult = MediaUploadSchema.safeParse(jsonBody);
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
    const contentType = body.content_type.toLowerCase();

    // Validate file size if provided
    if (body.size !== undefined) {
      const maxSize = getMaxFileSize(contentType);

      if (body.size > maxSize) {
        const maxSizeMB = maxSize / (1024 * 1024);
        const actualSizeMB = (body.size / (1024 * 1024)).toFixed(2);
        return NextResponse.json<PostForMeError>(
          {
            error: "Validation Error",
            message: `File size ${actualSizeMB}MB exceeds maximum allowed ${maxSizeMB}MB for ${contentType.startsWith("video/") ? "videos" : "images"}`,
            statusCode: 400,
            details: { max_size_bytes: maxSize, max_size_mb: maxSizeMB, provided_size_bytes: body.size },
          },
          { status: 400 },
        );
      }
    }

    const data = await pfm.media.createUploadURL();

    return NextResponse.json(
      {
        ...data,
        _meta: {
          upload_instructions:
            "Upload the file using PUT request to the upload_url. Do not include the Authorization header when uploading to the signed URL.",
          expires_in: "The upload_url expires after a short time (typically 15 minutes)",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: "API Error", message: error.message, statusCode: error.status },
        { status: error.status || 500 },
      );
    }
    console.error("[API] Error getting upload URL:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Unknown error occurred", statusCode: 500 },
      { status: 500 },
    );
  }
}
