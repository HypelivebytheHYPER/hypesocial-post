/**
 * Shared media upload constants
 * Used by /api/media (Post For Me uploads) and /api/moodboard/upload (R2 uploads)
 */

export const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

export const MAX_FILE_SIZES: Record<string, number> = {
  image: 8 * 1024 * 1024, // 8MB for images
  video: 512 * 1024 * 1024, // 512MB for videos
};

export function getMaxFileSize(contentType: string): number {
  return contentType.startsWith("video/")
    ? MAX_FILE_SIZES.video ?? 0
    : MAX_FILE_SIZES.image ?? 0;
}
