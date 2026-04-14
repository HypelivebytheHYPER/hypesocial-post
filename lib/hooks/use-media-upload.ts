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
 *
 * // Batch upload
 * const batchUpload = useBatchUploadMedia();
 * const results = await batchUpload.mutateAsync({ files: [file1, file2] });
 * ```
 *
 * @see https://www.postforme.dev/resources/posting-media
 */

import { useMutation } from "@tanstack/react-query";
import { AsyncBatcher } from "@tanstack/pacer";
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

interface BatchUploadResult {
  results: Array<{
    filename: string;
    upload_url: string;
    media_url: string;
  }>;
}

interface UploadOptions {
  file: File;
}

interface BatchUploadOptions {
  files: File[];
}

interface UseUploadMediaOptions {
  /** Enable Lark Base logging (default: false) */
  logToLark?: boolean;
  /** Optional post ID to associate with the media */
  postId?: string;
}

interface LarkLogItem {
  url: string;
  file_name: string;
  content_type: string;
  size: number;
  post_id: string | null;
  source: string;
  uploaded_at: string;
}

/**
 * Singleton AsyncBatcher for Lark Base media logging.
 * Batches multiple log entries into a single batch_create call,
 * reducing back-and-forth with the Lark HTTP worker.
 */
const mediaLogBatcher = new AsyncBatcher<LarkLogItem>(
  async (items) => {
    if (!LARK_HTTP_WORKER || !LARK_APP_TOKEN) {
      console.debug("[MediaLogBatcher] Lark config missing, skipping", items.length, "logs");
      return { skipped: true };
    }

    const response = await fetch(`${LARK_HTTP_WORKER}/records/batch_create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_token: LARK_APP_TOKEN,
        table_id: MEDIA_LOG_TABLE_ID,
        records: items.map((fields) => ({ fields })),
      }),
    });

    if (!response.ok) {
      const error = await response.text().catch(() => "Unknown error");
      console.warn("[MediaLogBatcher] Lark API error:", error);
      throw new Error(`Lark API error: ${error}`);
    }

    console.debug("[MediaLogBatcher] Logged", items.length, "records to Lark Base");
    return { logged: items.length };
  },
  {
    maxSize: 10,
    wait: 2000,
    throwOnError: false,
    onError: (error, batch) => {
      console.warn("[MediaLogBatcher] Failed to log batch of", batch.length, "items:", error);
    },
  }
);

function queueLarkLog(media: UploadResult, postId?: string): void {
  if (!LARK_HTTP_WORKER || !LARK_APP_TOKEN) return;

  mediaLogBatcher.addItem({
    url: media.url,
    file_name: media.fileName,
    content_type: media.contentType,
    size: media.size,
    post_id: postId || null,
    source: "post_for_me",
    uploaded_at: new Date().toISOString(),
  }).catch(() => {
    // Errors handled by batcher onError
  });
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
        queueLarkLog(result, postId);
      }

      return result;
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });
}

/**
 * Batch upload multiple media files to Post For Me CDN
 *
 * Uses /api/media/batch to get all presigned URLs in one request,
 * then uploads files in parallel.
 */
export function useBatchUploadMedia(options: UseUploadMediaOptions = {}) {
  const { logToLark = false, postId } = options;

  return useMutation<UploadResult[], Error, BatchUploadOptions>({
    mutationFn: async ({ files }) => {
      // Step 1: Get all presigned upload URLs in one batch request
      const batchResult = await apiClient<BatchUploadResult>("/api/media/batch", {
        method: "POST",
        body: JSON.stringify({
          files: files.map((file) => ({
            filename: file.name,
            content_type: file.type,
            size: file.size,
          })),
        }),
      });

      // Step 2: Upload all files in parallel
      const uploadPromises = batchResult.results.map(async (item, index) => {
        const file = files[index];
        if (!file) {
          throw new Error(`Missing file for batch result at index ${index}`);
        }

        const response = await fetch(item.upload_url, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          throw new Error(
            `Upload failed for ${file.name}: ${response.status} ${errorText || response.statusText}`,
          );
        }

        const result: UploadResult = {
          url: item.media_url,
          fileName: file.name,
          contentType: file.type,
          size: file.size,
        };

        if (logToLark) {
          queueLarkLog(result, postId);
        }

        return result;
      });

      return Promise.all(uploadPromises);
    },
    onError: (error) => {
      toast.error(`Batch upload failed: ${error.message}`);
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
        queueLarkLog(result, postId);
      }

      return result;
    },
    onError: (error) => {
      toast.error(`Thumbnail upload failed: ${error.message}`);
    },
  });
}
