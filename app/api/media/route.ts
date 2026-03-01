import { NextRequest, NextResponse } from "next/server";
import { pfm } from "@/lib/post-for-me";
import { APIError } from "post-for-me";
import type { PostForMeError } from "@/types/post-for-me";

// Maximum file sizes per platform (in bytes)
const MAX_FILE_SIZES: Record<string, number> = {
  image: 8 * 1024 * 1024, // 8MB for images
  video: 512 * 1024 * 1024, // 512MB for videos
  default: 8 * 1024 * 1024, // 8MB default
};

// Allowed content types
const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

/**
 * POST /api/media
 * Get presigned URL for media upload
 * Official API: POST /v1/media/create-upload-url
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

    // Validate required fields
    const errors: string[] = [];

    if (!body.filename || typeof body.filename !== "string") {
      errors.push("filename is required and must be a string");
    } else {
      const hasExtension = /\.[^.]+$/.test(body.filename);
      if (!hasExtension) {
        errors.push("filename must include a file extension");
      }
    }

    if (!body.content_type || typeof body.content_type !== "string") {
      errors.push("content_type is required and must be a string (e.g., 'image/jpeg', 'video/mp4')");
    }

    if (errors.length > 0) {
      return NextResponse.json<PostForMeError>(
        { error: "Validation Error", message: errors.join("; "), statusCode: 400, details: { fields: errors } },
        { status: 400 },
      );
    }

    // Validate content type
    const contentType = body.content_type!.toLowerCase();
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return NextResponse.json<PostForMeError>(
        {
          error: "Validation Error",
          message: `Invalid content_type '${contentType}'. Allowed types: ${ALLOWED_CONTENT_TYPES.join(", ")}`,
          statusCode: 400,
          details: { allowed_types: ALLOWED_CONTENT_TYPES },
        },
        { status: 400 },
      );
    }

    // Validate file size if provided
    if (body.size !== undefined) {
      if (typeof body.size !== "number" || body.size < 0) {
        return NextResponse.json<PostForMeError>(
          { error: "Validation Error", message: "size must be a positive number (in bytes)", statusCode: 400 },
          { status: 400 },
        );
      }

      const maxSize = contentType.startsWith("video/")
        ? MAX_FILE_SIZES.video
        : MAX_FILE_SIZES.image;

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
