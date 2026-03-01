import { NextRequest, NextResponse } from "next/server";
import {
  CreateUploadUrlDto,
  CreateUploadUrlResponse,
  PostForMeError,
} from "@/types/post-for-me";

const API_BASE = process.env.POSTFORME_API_URL || "https://api.postforme.dev";
const API_KEY = process.env.POST_FOR_ME_API_KEY;

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
 *
 * Required Body Fields:
 * - filename: string - The name of the file
 * - content_type: string - MIME type (image/jpeg, video/mp4, etc.)
 *
 * Optional Body Fields:
 * - size: number - File size in bytes
 *
 * Returns:
 * - upload_url: string - Signed URL to upload the file to
 * - media_url: string - Public URL of the file after upload
 *
 * Notes:
 * - Upload the file directly to the upload_url using PUT method
 * - The upload_url is signed and expires after a short time
 * - Maximum file sizes: Images 8MB, Videos 512MB
 */
export async function POST(request: NextRequest) {
  try {
    if (!API_KEY) {
      return NextResponse.json<PostForMeError>(
        {
          error: "Configuration Error",
          message: "API key not configured",
          statusCode: 500,
        },
        { status: 500 },
      );
    }

    let body: Partial<CreateUploadUrlDto>;

    try {
      body = await request.json();
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

    // Validate required fields
    const errors: string[] = [];

    if (!body.filename || typeof body.filename !== "string") {
      errors.push("filename is required and must be a string");
    } else {
      // Validate filename has extension
      const hasExtension = /\.[^.]+$/.test(body.filename);
      if (!hasExtension) {
        errors.push("filename must include a file extension");
      }
    }

    if (!body.content_type || typeof body.content_type !== "string") {
      errors.push(
        "content_type is required and must be a string (e.g., 'image/jpeg', 'video/mp4')",
      );
    }

    if (errors.length > 0) {
      return NextResponse.json<PostForMeError>(
        {
          error: "Validation Error",
          message: errors.join("; "),
          statusCode: 400,
          details: { fields: errors },
        },
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
          {
            error: "Validation Error",
            message: "size must be a positive number (in bytes)",
            statusCode: 400,
          },
          { status: 400 },
        );
      }

      // Determine max size based on content type
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
            details: {
              max_size_bytes: maxSize,
              max_size_mb: maxSizeMB,
              provided_size_bytes: body.size,
            },
          },
          { status: 400 },
        );
      }
    }

    // Get presigned URL from Post For Me API
    const response = await fetch(`${API_BASE}/v1/media/create-upload-url`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename: body.filename,
        content_type: contentType,
        size: body.size,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: Partial<PostForMeError>;

      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      return NextResponse.json<PostForMeError>(
        {
          error: errorData.error || "API Error",
          message:
            errorData.message || `Failed to get upload URL: ${response.status}`,
          statusCode: response.status,
          details: errorData.details,
        },
        { status: response.status },
      );
    }

    const data: CreateUploadUrlResponse = await response.json();

    // Return with additional metadata
    return NextResponse.json(
      {
        ...data,
        _meta: {
          upload_instructions:
            "Upload the file using PUT request to the upload_url. Do not include the Authorization header when uploading to the signed URL.",
          expires_in:
            "The upload_url expires after a short time (typically 15 minutes)",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[API] Error getting upload URL:", error);
    return NextResponse.json<PostForMeError>(
      {
        error: "Internal Server Error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        statusCode: 500,
      },
      { status: 500 },
    );
  }
}
