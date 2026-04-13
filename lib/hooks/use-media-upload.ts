/**
 * Media Upload Hook with Optional Lark Base Logging
 * @module lib/hooks/use-media-upload
 *
 * Uploads media files via Post For Me CDN.
 * Optionally logs metadata to Lark Base for history/backup (fire-and-forget).
 *
 * @example
 * ```tsx
 * // Basic usage (no logging)
 * const upload = useUploadMedia();
 * const { url } = await upload.mutateAsync({ file: imageFile });
 *
 * // With Lark Base logging
 * const upload = useUploadMedia({ logToLark: true, postId: "post_123" });
 * const { url } = await upload.mutateAsync({ file: imageFile });
 * ```
 *
 * @see https://www.postforme.dev/resources/posting-media
 */

import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

// Lark HTTP Worker endpoint (optional - logging disabled if not set)
const LARK_HTTP_WORKER = process.env.NEXT_PUBLIC_LARK_HTTP_WORKER_URL;

// Table ID for media history log
const MEDIA_LOG_TABLE_ID = process.env.NEXT_PUBLIC_LARK_MEDIA_LOG_TABLE_ID || "tbl_media_log";

// Get Lark app token
const LARK_APP_TOKEN = process.env.NEXT_PUBLIC_LARK_APP_TOKEN;

interface UploadResult {
  url: string;
  fileName: string;
  contentType: string;
  size: number;
}

interface UploadOptions {
  file: File;
}

interface UseUploadMediaOptions {
  /** Enable Lark Base logging (default: false) */
  logToLark?: boolean;
  /** Optional post ID to associate with the media */
  postId?: string;
}

/**
 * Upload media file to Post For Me CDN
 *
 * 2-step process:
 * 1. Get presigned upload URL from API
 * 2. Upload file directly to Post For Me storage
 *
 * Optionally logs metadata to Lark Base in background (doesn't block).
 */
export function useUploadMedia(options: UseUploadMediaOptions = {}) {
  const { logToLark = false, postId } = options;

  return useMutation<UploadResult, Error, UploadOptions>({
    mutationFn: async ({ file }) => {
      // Step 1: Get presigned upload URL and public media URL from Post For Me
      const { upload_url, media_url } = await apiClient<{
        upload_url: string;
        media_url: string;
      }>("/api/media", {
        method: "POST",
        body: JSON.stringify({
          filename: file.name,
          content_type: file.type,
          size: file.size,
        }),
      });

      // Step 2: Upload file to presigned URL (Post For Me storage)
      const response = await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(
          `Upload failed: ${response.status} ${errorText || response.statusText}`,
        );
      }

      const result: UploadResult = {
        url: media_url,
        fileName: file.name,
        contentType: file.type,
        size: file.size,
      };

      // Step 3: Fire-and-forget log to Lark Base (if enabled)
      if (logToLark) {
        logMediaToLark(result, postId).catch((err) => {
          console.warn("[MediaLog] Failed to log to Lark Base:", err);
        });
      }

      return result;
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });
}

/**
 * Upload thumbnail image from data URL
 *
 * Used for video thumbnails on Facebook, Instagram, TikTok Business, YouTube.
 * Converts data URL to blob, then uploads via presigned URL.
 */
export function useUploadThumbnail(options: UseUploadMediaOptions = {}) {
  const { logToLark = false, postId } = options;

  return useMutation<
    UploadResult,
    Error,
    { dataUrl: string; filename?: string }
  >({
    mutationFn: async ({ dataUrl, filename = "thumbnail.jpg" }) => {
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      if (!response.ok) {
        throw new Error("Failed to convert thumbnail data URL to blob");
      }
      const blob = await response.blob();

      // Create a File from the blob
      const file = new File([blob], filename, { type: "image/jpeg" });

      // Step 1: Get presigned upload URL
      const { upload_url, media_url } = await apiClient<{
        upload_url: string;
        media_url: string;
      }>("/api/media", {
        method: "POST",
        body: JSON.stringify({
          filename: file.name,
          content_type: file.type,
          size: file.size,
        }),
      });

      // Step 2: Upload file
      const uploadResponse = await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text().catch(() => "");
        throw new Error(
          `Thumbnail upload failed: ${uploadResponse.status} ${errorText || uploadResponse.statusText}`,
        );
      }

      const result: UploadResult = {
        url: media_url,
        fileName: file.name,
        contentType: file.type,
        size: file.size,
      };

      // Step 3: Fire-and-forget log to Lark Base (if enabled)
      if (logToLark) {
        logMediaToLark(result, postId).catch((err) => {
          console.warn("[MediaLog] Failed to log to Lark Base:", err);
        });
      }

      return result;
    },
    onError: (error) => {
      toast.error(`Thumbnail upload failed: ${error.message}`);
    },
  });
}

/**
 * Background logger to Lark Base - fire and forget
 * Does NOT throw errors - logging is best effort
 */
async function logMediaToLark(
  media: UploadResult,
  postId?: string
): Promise<void> {
  // Skip if no Lark config
  if (!LARK_HTTP_WORKER) {
    console.debug("[MediaLog] NEXT_PUBLIC_LARK_HTTP_WORKER_URL not set, skipping log");
    return;
  }
  if (!LARK_APP_TOKEN) {
    console.debug("[MediaLog] LARK_APP_TOKEN not set, skipping log");
    return;
  }

  const logData = {
    url: media.url,
    file_name: media.fileName,
    content_type: media.contentType,
    size: media.size,
    post_id: postId || null,
    source: "post_for_me",
    uploaded_at: new Date().toISOString(),
  };

  try {
    const response = await fetch(`${LARK_HTTP_WORKER}/records/batch_create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_token: LARK_APP_TOKEN,
        table_id: MEDIA_LOG_TABLE_ID,
        records: [{ fields: logData }],
      }),
    });

    if (!response.ok) {
      const error = await response.text().catch(() => "Unknown error");
      console.warn("[MediaLog] Lark API error:", error);
      return;
    }

    console.debug("[MediaLog] Logged to Lark Base:", media.fileName);
  } catch (error) {
    // Silent fail - logging is best effort, don't break user flow
    console.warn("[MediaLog] Network error:", error);
  }
}
