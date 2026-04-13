import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pfm } from "@/lib/post-for-me-client";
import { UPLOAD } from "@/lib/constants";
import {
  handleApiError,
  buildValidationError,
  sendErrorResponse,
} from "@/lib/api-errors";

const CreateUploadUrlSchema = z.object({
  filename: z.string().min(1),
  content_type: z.string().min(1),
  size: z.number().int().positive().max(UPLOAD.MAX_FILE_SIZE),
});

/**
 * POST /api/media
 * Official API: POST /v1/media/create-upload-url
 *
 * Get a signed upload URL for media.
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

    const parseResult = CreateUploadUrlSchema.safeParse(jsonBody);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`,
      );
      return sendErrorResponse(
        buildValidationError(issues.join("; "), issues),
        400,
      );
    }

    const { filename, content_type, size } = parseResult.data;

    // Validate file type
    const isImage = UPLOAD.ALLOWED_IMAGE_TYPES.includes(content_type as typeof UPLOAD.ALLOWED_IMAGE_TYPES[number]);
    const isVideo = UPLOAD.ALLOWED_VIDEO_TYPES.includes(content_type as typeof UPLOAD.ALLOWED_VIDEO_TYPES[number]);

    if (!isImage && !isVideo) {
      return sendErrorResponse(
        buildValidationError(
          `Unsupported file type: ${content_type}. Allowed types: images (${UPLOAD.ALLOWED_IMAGE_TYPES.join(", ")}), videos (${UPLOAD.ALLOWED_VIDEO_TYPES.join(", ")})`,
          [`content_type: Unsupported file type ${content_type}`],
        ),
        400,
      );
    }

    // Validate file size
    const maxSize = isVideo ? UPLOAD.MAX_VIDEO_SIZE : UPLOAD.MAX_IMAGE_SIZE;
    if (size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      const actualSizeMB = (size / (1024 * 1024)).toFixed(2);
      return sendErrorResponse(
        buildValidationError(
          `File too large: ${actualSizeMB}MB. Maximum allowed: ${maxSizeMB}MB for ${isVideo ? "videos" : "images"}`,
          [`size: File exceeds maximum size of ${maxSizeMB}MB`],
        ),
        400,
      );
    }

    const data = await pfm.media.createUploadURL();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, { context: "creating upload URL" });
  }
}
