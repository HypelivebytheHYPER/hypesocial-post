/**
 * Media Processing Utilities
 * Canvas-based image resizing, cropping, and format conversion
 * for platform-specific requirements
 */

export interface ProcessedMedia {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}

export interface ProcessingOptions {
  /** Target width (max width if maintainAspect is true) */
  maxWidth?: number;
  /** Target height (max height if maintainAspect is true) */
  maxHeight?: number;
  /** Force exact dimensions (will crop if needed) */
  exactDimensions?: { width: number; height: number };
  /** Output format */
  format?: "image/jpeg" | "image/png" | "image/webp";
  /** JPEG quality (0-1) */
  quality?: number;
  /** Maintain aspect ratio (default: true) */
  maintainAspect?: boolean;
  /** Crop mode when exactDimensions provided */
  cropMode?: "cover" | "contain" | "center";
}

/**
 * Process an image file with canvas-based transformations
 */
export async function processImage(
  file: File,
  options: ProcessingOptions = {}
): Promise<ProcessedMedia> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    exactDimensions,
    format = "image/jpeg",
    quality = 0.92,
    maintainAspect = true,
    cropMode = "cover",
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const originalWidth = img.naturalWidth;
      const originalHeight = img.naturalHeight;

      let targetWidth = originalWidth;
      let targetHeight = originalHeight;

      // Calculate dimensions
      if (exactDimensions) {
        targetWidth = exactDimensions.width;
        targetHeight = exactDimensions.height;
      } else if (maintainAspect) {
        // Scale down to fit within max dimensions
        const scale = Math.min(
          maxWidth / originalWidth,
          maxHeight / originalHeight,
          1
        );
        targetWidth = Math.round(originalWidth * scale);
        targetHeight = Math.round(originalHeight * scale);
      } else {
        targetWidth = maxWidth;
        targetHeight = maxHeight;
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Fill background for transparent images
      if (format === "image/jpeg") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      // Calculate source and destination rectangles for cropping
      let sx = 0,
        sy = 0,
        sWidth = originalWidth,
        sHeight = originalHeight;
      let dx = 0,
        dy = 0,
        dWidth = targetWidth,
        dHeight = targetHeight;

      if (exactDimensions && cropMode === "cover") {
        // Cover: crop to fill exact dimensions
        const targetRatio = exactDimensions!.width / exactDimensions!.height;
        const sourceRatio = originalWidth / originalHeight;

        if (sourceRatio > targetRatio) {
          // Source is wider - crop width
          sWidth = originalHeight * targetRatio;
          sx = (originalWidth - sWidth) / 2;
        } else {
          // Source is taller - crop height
          sHeight = originalWidth / targetRatio;
          sy = (originalHeight - sHeight) / 2;
        }
      } else if (exactDimensions && cropMode === "contain") {
        // Contain: scale to fit with letterboxing
        const scale = Math.min(
          exactDimensions!.width / originalWidth,
          exactDimensions!.height / originalHeight
        );
        dWidth = originalWidth * scale;
        dHeight = originalHeight * scale;
        dx = (exactDimensions!.width - dWidth) / 2;
        dy = (exactDimensions!.height - dHeight) / 2;
      }

      // Apply image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Draw image
      ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);

      // Export to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to create blob"));
            return;
          }
          const processedUrl = URL.createObjectURL(blob);
          resolve({
            blob,
            url: processedUrl,
            width: targetWidth,
            height: targetHeight,
            originalWidth,
            originalHeight,
          });
        },
        format,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

/**
 * Platform-specific processing presets
 */
export const PLATFORM_PRESETS: Record<
  string,
  Partial<ProcessingOptions>
> = {
  // Instagram Feed - 4:5 aspect ratio recommended
  instagram: {
    maxWidth: 1440,
    maxHeight: 1800,
    format: "image/jpeg",
    quality: 0.95,
  },
  // Instagram Reels/Stories - 9:16
  "instagram:reels": {
    exactDimensions: { width: 1080, height: 1920 },
    format: "image/jpeg",
    quality: 0.95,
    cropMode: "cover",
  },
  // Facebook - flexible
  facebook: {
    maxWidth: 2048,
    maxHeight: 2048,
    format: "image/jpeg",
    quality: 0.92,
  },
  // X/Twitter - 2:1 or 1:1 recommended
  x: {
    maxWidth: 1600,
    maxHeight: 1600,
    format: "image/jpeg",
    quality: 0.90,
  },
  // Pinterest - 2:3 aspect ratio
  pinterest: {
    exactDimensions: { width: 1000, height: 1500 },
    format: "image/jpeg",
    quality: 0.95,
    cropMode: "cover",
  },
  // LinkedIn - 1.91:1 or 1:1
  linkedin: {
    maxWidth: 1920,
    maxHeight: 1080,
    format: "image/jpeg",
    quality: 0.92,
  },
  // General/default
  default: {
    maxWidth: 1920,
    maxHeight: 1920,
    format: "image/jpeg",
    quality: 0.92,
  },
};

/**
 * Process image for specific platform
 */
export async function processImageForPlatform(
  file: File,
  platform: string,
  placement?: string
): Promise<ProcessedMedia> {
  const key = placement ? `${platform}:${placement}` : platform;
  const preset = PLATFORM_PRESETS[key] || PLATFORM_PRESETS[platform] || PLATFORM_PRESETS.default;
  
  return processImage(file, preset);
}

/**
 * Check if file needs processing (is too large or wrong format)
 */
export function needsProcessing(
  file: File,
  options: { maxWidth?: number; maxHeight?: number; maxSizeMB?: number } = {}
): boolean {
  const { maxWidth = 1920, maxHeight = 1920, maxSizeMB = 8 } = options;
  
  // Check file size
  if (file.size > maxSizeMB * 1024 * 1024) return true;
  
  // Note: For dimensions, we'd need to load the image first
  // This is a quick check only
  return false;
}

/**
 * Get image dimensions without full processing
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    
    img.src = url;
  });
}
