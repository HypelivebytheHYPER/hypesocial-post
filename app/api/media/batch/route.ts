import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pfm } from "@/lib/post-for-me-client";
import { UPLOAD, PLATFORM_LIMITS } from "@/lib/constants";
import {
  handleApiError,
  buildValidationError,
  sendErrorResponse,
} from "@/lib/api-errors";
import { AsyncQueuer } from "@tanstack/pacer";

const BatchCreateUploadUrlSchema = z.object({
  files: z.array(
    z.object({
      filename: z.string().min(1),
      content_type: z.string().min(1),
      size: z.number().int().positive().max(UPLOAD.MAX_FILE_SIZE),
    })
  ).min(1).max(PLATFORM_LIMITS.MAX_MEDIA_PER_POST),
});

interface FileItem {
  filename: string;
  content_type: string;
  size: number;
}

interface UploadResultItem {
  filename: string;
  upload_url: string;
  media_url: string;
}

interface QueueTask {
  file: FileItem;
  resolve: (result: UploadResultItem) => void;
  reject: (error: Error) => void;
}

/**
 * AsyncQueuer for batch media upload URL creation.
 * Concurrency of 5 allows parallel requests without overwhelming Post For Me.
 */
const uploadUrlQueue = new AsyncQueuer<QueueTask>(
  async (task) => {
    const data = await pfm.media.createUploadURL();
    const result: UploadResultItem = {
      filename: task.file.filename,
      upload_url: data.upload_url,
      media_url: data.media_url,
    };
    task.resolve(result);
    return result;
  },
  {
    concurrency: 5,
    wait: 0,
    started: true,
    throwOnError: false,
    onError: (error, task) => {
      console.error("[MediaBatchQueue] createUploadURL failed:", error);
      task.reject(error instanceof Error ? error : new Error(String(error)));
    },
  }
);

function validateFile(file: FileItem): { valid: true } | { valid: false; error: string } {
  const isImage = UPLOAD.ALLOWED_IMAGE_TYPES.includes(
    file.content_type as (typeof UPLOAD.ALLOWED_IMAGE_TYPES)[number]
  );
  const isVideo = UPLOAD.ALLOWED_VIDEO_TYPES.includes(
    file.content_type as (typeof UPLOAD.ALLOWED_VIDEO_TYPES)[number]
  );

  if (!isImage && !isVideo) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.content_type}. Allowed types: images (${UPLOAD.ALLOWED_IMAGE_TYPES.join(", ")}), videos (${UPLOAD.ALLOWED_VIDEO_TYPES.join(", ")})`,
    };
  }

  const maxSize = isVideo ? UPLOAD.MAX_VIDEO_SIZE : UPLOAD.MAX_IMAGE_SIZE;
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    const actualSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File too large: ${actualSizeMB}MB. Maximum allowed: ${maxSizeMB}MB for ${isVideo ? "videos" : "images"}`,
    };
  }

  return { valid: true };
}

/**
 * POST /api/media/batch
 * Get signed upload URLs for multiple media files in one request.
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

    const parseResult = BatchCreateUploadUrlSchema.safeParse(jsonBody);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`,
      );
      return sendErrorResponse(
        buildValidationError(issues.join("; "), issues),
        400,
      );
    }

    const { files } = parseResult.data;

    // Validate each file
    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        return sendErrorResponse(
          buildValidationError(validation.error, [validation.error]),
          400,
        );
      }
    }

    // Queue all uploads with controlled concurrency
    const pending = files.map((file) =>
      new Promise<UploadResultItem>((resolve, reject) => {
        const added = uploadUrlQueue.addItem({ file, resolve, reject });
        if (!added) {
          reject(new Error("[MediaBatchQueue] Task rejected: queue is full"));
        }
      })
    );

    const results = await Promise.all(pending);

    return NextResponse.json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error) {
    return handleApiError(error, { context: "creating batch upload URLs" });
  }
}
