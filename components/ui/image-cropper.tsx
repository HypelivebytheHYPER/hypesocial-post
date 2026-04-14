"use client";

import { useState, useCallback, useRef } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  RotateCw,
  ZoomIn,
  ZoomOut,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Smartphone,
  Monitor,
} from "lucide-react";

// Platform-specific aspect ratios
export const ASPECT_RATIOS = {
  // Instagram
  "instagram-feed": { value: 1, label: "1:1 Instagram", icon: Square },
  "instagram-portrait": { value: 4 / 5, label: "4:5 Instagram", icon: RectangleVertical },
  "instagram-landscape": { value: 1.91, label: "1.91:1 Instagram", icon: RectangleHorizontal },
  "instagram-reels": { value: 9 / 16, label: "9:16 Reels/Stories", icon: Smartphone },
  // TikTok (photos & videos)
  "tiktok-vertical": { value: 9 / 16, label: "9:16 TikTok", icon: Smartphone },
  // YouTube
  "youtube-short": { value: 9 / 16, label: "9:16 Shorts", icon: Smartphone },
  "youtube-video": { value: 16 / 9, label: "16:9 YouTube", icon: Monitor },
  // General
  square: { value: 1, label: "1:1 Square", icon: Square },
  portrait: { value: 3 / 4, label: "3:4 Portrait", icon: RectangleVertical },
  landscape: { value: 16 / 9, label: "16:9 Landscape", icon: Monitor },
  widescreen: { value: 21 / 9, label: "21:9 Cinematic", icon: RectangleHorizontal },
  free: { value: undefined, label: "Freeform", icon: null },
} as const;

export type AspectRatioKey = keyof typeof ASPECT_RATIOS;

interface ImageCropperProps {
  /** Image URL to crop */
  image: string;
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog closes */
  onOpenChange: (open: boolean) => void;
  /** Callback with the cropped image blob */
  onCropComplete: (croppedBlob: Blob, croppedUrl: string) => void;
  /** Initial aspect ratio */
  defaultAspectRatio?: AspectRatioKey;
  /** Available aspect ratio presets */
  availableRatios?: AspectRatioKey[];
  /** Dialog title */
  title?: string;
}

/**
 * Image Cropper Dialog with platform-specific aspect ratios
 * 
 * @example
 * ```tsx
 * <ImageCropper
 *   image={uploadedImageUrl}
 *   open={isCropperOpen}
 *   onOpenChange={setIsCropperOpen}
 *   onCropComplete={(blob, url) => {
 *     // Upload the cropped blob
 *     uploadFile(blob);
 *   }}
 *   defaultAspectRatio="instagram-feed"
 *   availableRatios={["instagram-feed", "instagram-reels", "square"]}
 * />
 * ```
 */
export function ImageCropper({
  image,
  open,
  onOpenChange,
  onCropComplete,
  defaultAspectRatio = "square",
  availableRatios = ["square", "portrait", "landscape", "instagram-reels"],
  title = "Crop Image",
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioKey>(defaultAspectRatio);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const croppedAreaPixelsRef = useRef<Area | null>(null);

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteCallback = useCallback((_: Area, croppedAreaPixels: Area) => {
    croppedAreaPixelsRef.current = croppedAreaPixels;
  }, []);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handleCrop = useCallback(async () => {
    if (!croppedAreaPixelsRef.current) return;

    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(
        image,
        croppedAreaPixelsRef.current,
        rotation
      );
      const croppedUrl = URL.createObjectURL(croppedBlob);
      onCropComplete(croppedBlob, croppedUrl);
      onOpenChange(false);
    } catch (error) {
      console.error("Crop failed:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [image, rotation, onCropComplete, onOpenChange]);

  const currentAspect = ASPECT_RATIOS[aspectRatio].value;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Cropper Container */}
        <div className="relative w-full h-[400px] bg-slate-950">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={currentAspect}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
            showGrid={true}
            objectFit="contain"
            minZoom={0.5}
            maxZoom={3}
          />
        </div>

        {/* Controls */}
        <div className="p-6 space-y-4">
          {/* Aspect Ratio Presets */}
          <div className="flex flex-wrap gap-2">
            {availableRatios.map((ratioKey) => {
              const ratio = ASPECT_RATIOS[ratioKey];
              const Icon = ratio.icon;
              return (
                <Button
                  key={ratioKey}
                  type="button"
                  variant={aspectRatio === ratioKey ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAspectRatio(ratioKey)}
                  className="gap-2"
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {ratio.label}
                </Button>
              );
            })}
          </div>

          {/* Zoom Control */}
          <div className="flex items-center gap-4">
            <ZoomOut className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={[zoom]}
              onValueChange={([value]) => value && setZoom(value)}
              min={0.5}
              max={3}
              step={0.1}
              className="flex-1"
            />
            <ZoomIn className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground w-12 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRotate}
              className="gap-2"
            >
              <RotateCw className="w-4 h-4" />
              Rotate 90°
            </Button>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCrop}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Apply Crop"}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Crop an image using canvas
 * Based on react-easy-crop example
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  // Set canvas size to match the cropped area
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Apply rotation
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-canvas.width / 2, -canvas.height / 2);

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Canvas to Blob failed"));
      }
    }, "image/jpeg", 0.95);
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

/**
 * Get recommended aspect ratios for a platform
 */
export function getPlatformAspectRatios(platform: string): AspectRatioKey[] {
  const p = platform.toLowerCase();

  if (p.includes("instagram")) {
    return ["instagram-feed", "instagram-portrait", "instagram-reels"];
  }
  if (p.includes("tiktok")) {
    // TikTok supports both photos (9:16 carousel) and videos (9:16)
    return ["tiktok-vertical"];
  }
  if (p.includes("youtube")) {
    return ["youtube-video", "youtube-short"]; // 16:9 or 9:16 for Shorts
  }
  if (p.includes("twitter") || p.includes("x")) {
    return ["landscape", "square", "portrait"];
  }
  if (p.includes("facebook")) {
    return ["square", "landscape", "portrait"];
  }
  if (p.includes("linkedin")) {
    return ["landscape", "square"];
  }
  if (p.includes("pinterest")) {
    return ["portrait", "square"];
  }
  if (p.includes("bluesky")) {
    return ["square", "landscape"];
  }
  if (p.includes("threads")) {
    return ["square", "portrait", "landscape"];
  }

  return ["square", "landscape", "portrait"];
}

/**
 * Get default aspect ratio for a platform
 */
export function getDefaultAspectRatio(platform: string): AspectRatioKey {
  const p = platform.toLowerCase();

  if (p.includes("instagram")) return "instagram-feed";
  if (p.includes("tiktok")) return "tiktok-vertical"; // TikTok uses 9:16 for both photos & videos
  if (p.includes("youtube")) return "youtube-video";
  if (p.includes("pinterest")) return "portrait";
  if (p.includes("linkedin")) return "landscape";

  return "square";
}

/**
 * Get the best common aspect ratios for multiple platforms
 * Returns ratios that work for all selected platforms
 */
export function getAspectRatiosForPlatforms(platforms: string[]): {
  ratios: AspectRatioKey[];
  defaultRatio: AspectRatioKey;
  recommendedRatio: AspectRatioKey;
} {
  if (platforms.length === 0) {
    return {
      ratios: ["square", "landscape", "portrait"],
      defaultRatio: "square",
      recommendedRatio: "square",
    };
  }

  // Get all ratio sets for selected platforms
  const allRatios = platforms.map(getPlatformAspectRatios);
  
  // Find common ratios (intersection)
  const commonRatios = allRatios.reduce((acc, ratios) => {
    return acc.filter((r) => ratios.includes(r));
  }, allRatios[0] || []);

  // If no common ratios, return all unique ratios from all platforms
  const uniqueRatios = [...new Set(allRatios.flat())];
  
  // Determine best default based on platform types
  const hasInstagram = platforms.some((p) => p.includes("instagram"));
  const hasTikTok = platforms.some((p) => p.includes("tiktok"));
  const hasYouTube = platforms.some((p) => p.includes("youtube"));
  
  let recommendedRatio: AspectRatioKey = "square";
  
  if (hasInstagram && hasTikTok) {
    // Both support 9:16 (Reels/TikTok)
    recommendedRatio = "instagram-reels";
  } else if (hasTikTok) {
    recommendedRatio = "tiktok-vertical";
  } else if (hasInstagram) {
    recommendedRatio = "instagram-feed";
  } else if (hasYouTube) {
    recommendedRatio = "youtube-video";
  }

  return {
    ratios: commonRatios.length > 0 ? commonRatios : uniqueRatios,
    defaultRatio: commonRatios[0] || uniqueRatios[0] || "square",
    recommendedRatio,
  };
}

/**
 * Get a human-readable label for selected platforms' image requirements
 */
export function getPlatformsImageRequirements(platforms: string[]): string {
  if (platforms.length === 0) return "";
  
  const hasTikTok = platforms.some((p) => p.includes("tiktok"));
  const hasInstagram = platforms.some((p) => p.includes("instagram"));
  
  if (hasTikTok && hasInstagram) {
    return "TikTok photos & Instagram: Use 9:16 vertical format, up to 35 images";
  }
  if (hasTikTok) {
    return "TikTok: 9:16 vertical photos (up to 35 images) or videos";
  }
  if (hasInstagram) {
    return "Instagram: 1:1, 4:5, or 9:16 formats supported";
  }
  
  return `${platforms.length} platform${platforms.length > 1 ? "s" : ""} selected`;
}
