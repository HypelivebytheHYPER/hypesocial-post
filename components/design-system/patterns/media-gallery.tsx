/**
 * Media Gallery Component
 * Displays single or multiple media items with carousel navigation
 * Supports mixed video/image content with platform-specific aspect ratios
 */

"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Play, Pause, X, ChevronLeft, ChevronRight, Film } from "lucide-react";
import { AspectRatio } from "@/components/design-system/primitives/aspect-ratio";
import { Surface } from "@/components/design-system/foundation/surface";

/* ==================== TYPES ==================== */

export interface GalleryMedia {
  id: string;
  url: string;
  type: "image" | "video";
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
  alt?: string;
}

export interface MediaGalleryProps {
  media: GalleryMedia[];
  aspectRatio?: "1:1" | "4:5" | "9:16" | "16:9" | "2:3" | "auto";
  showNavigation?: boolean;
  showIndicators?: boolean;
  onRemove?: (id: string) => void;
  onMediaClick?: (media: GalleryMedia, index: number) => void;
  platform?: string;
  compact?: boolean;
  className?: string;
}

/* ==================== SINGLE MEDIA ITEM ==================== */

export interface MediaItemProps {
  media: GalleryMedia;
  aspectRatio?: "1:1" | "4:5" | "9:16" | "16:9" | "2:3" | "auto";
  onClick?: () => void;
  compact?: boolean;
}

function MediaItem({ media, aspectRatio = "1:1", onClick, compact }: MediaItemProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const isVideo = media.type === "video";

  return (
    <AspectRatio
      ratio={aspectRatio === "auto" ? undefined : aspectRatio}
      customRatio={aspectRatio === "auto" && media.width && media.height
        ? media.width / media.height
        : undefined
      }
      fit="cover"
      rounded={compact ? "lg" : "xl"}
      className="group bg-slate-100 dark:bg-slate-800"
    >
      {isVideo ? (
        <>
          <video
            src={media.url}
            poster={media.thumbnailUrl}
            className="w-full h-full object-cover"
            onClick={onClick}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            playsInline
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              const video = e.currentTarget.parentElement?.querySelector("video");
              if (video) isPlaying ? video.pause() : video.play();
            }}
            className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
              {isPlaying ? (
                <Pause className="w-5 h-5 text-slate-900" />
              ) : (
                <Play className="w-5 h-5 text-slate-900 ml-0.5" />
              )}
            </div>
          </button>
          {media.duration && (
            <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 rounded text-[10px] text-white font-medium">
              {formatDuration(media.duration)}
            </div>
          )}
          <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/40 flex items-center justify-center">
            <Film className="w-3 h-3 text-white" />
          </div>
        </>
      ) : (
        <>
          <img
            src={media.url}
            alt={media.alt || "Media"}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setIsLoaded(true)}
            onClick={onClick}
          />
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
            </div>
          )}
        </>
      )}
    </AspectRatio>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/* ==================== CAROUSEL GALLERY ==================== */

export function MediaGallery({
  media,
  aspectRatio = "1:1",
  showNavigation = true,
  showIndicators = true,
  onRemove,
  onMediaClick,
  platform,
  compact = false,
  className,
}: MediaGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const goTo = useCallback((index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(Math.max(0, Math.min(index, media.length - 1)));
  }, [currentIndex, media.length]);

  const goNext = useCallback(() => {
    if (currentIndex < media.length - 1) goTo(currentIndex + 1);
  }, [currentIndex, goTo, media.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) goTo(currentIndex - 1);
  }, [currentIndex, goTo]);

  const effectiveRatio = platform
    ? getPlatformAspectRatio(platform, aspectRatio)
    : aspectRatio;

  const currentMedia = media[currentIndex];
  if (media.length === 0 || !currentMedia) return null;

  // Single media
  if (media.length === 1) {
    return (
      <div className={cn("relative", className)}>
        <MediaItem
          media={currentMedia}
          aspectRatio={effectiveRatio}
          onClick={() => onMediaClick?.(currentMedia, 0)}
          compact={compact}
        />
        {onRemove && currentMedia && <RemoveButton onClick={() => onRemove(currentMedia.id)} />}
      </div>
    );
  }

  // Carousel
  return (
    <Surface elevation={1} padding="none" className={cn("relative overflow-hidden group", className)}>
      <div className="relative">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ x: direction > 0 ? "100%" : "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction > 0 ? "-100%" : "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative"
          >
            {currentMedia && (
              <MediaItem
                media={currentMedia}
                aspectRatio={effectiveRatio}
                onClick={() => onMediaClick?.(currentMedia, currentIndex)}
                compact={compact}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {onRemove && <RemoveButton onClick={() => onRemove(currentMedia.id)} />}

        {showNavigation && media.length > 1 && (
          <>
            <NavButton direction="left" onClick={goPrev} disabled={currentIndex === 0} />
            <NavButton direction="right" onClick={goNext} disabled={currentIndex === media.length - 1} />
          </>
        )}

        <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 rounded-full text-[10px] text-white font-medium">
          {currentIndex + 1} / {media.length}
        </div>
      </div>

      {showIndicators && media.length > 1 && (
        <div className="flex justify-center gap-1.5 p-3">
          {media.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                idx === currentIndex ? "bg-blue-500 w-4" : "bg-slate-300 dark:bg-slate-600 hover:bg-slate-400"
              )}
            />
          ))}
        </div>
      )}

      {media.length >= 3 && !compact && (
        <div className="flex gap-2 p-3 pt-0 overflow-x-auto scrollbar-hide">
          {media.map((m, idx) => (
            <button
              key={m.id}
              onClick={() => goTo(idx)}
              className={cn(
                "flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                idx === currentIndex
                  ? "border-blue-500 ring-2 ring-blue-500/20"
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              {m.type === "video" ? (
                <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                  <Film className="w-4 h-4 text-slate-400" />
                </div>
              ) : (
                <img src={m.url} alt="" className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </Surface>
  );
}

/* ==================== HELPER COMPONENTS ==================== */

function NavButton({ direction, onClick, disabled }: { direction: "left" | "right"; onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full",
        "bg-white/90 dark:bg-slate-900/90 shadow-md flex items-center justify-center",
        "transition-all",
        direction === "left" ? "left-2" : "right-2",
        disabled ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100"
      )}
    >
      {direction === "left" ? (
        <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-200" />
      ) : (
        <ChevronRight className="w-5 h-5 text-slate-700 dark:text-slate-200" />
      )}
    </button>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 dark:bg-slate-900/90 shadow-sm flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors"
    >
      <X className="w-4 h-4" />
    </button>
  );
}

function getPlatformAspectRatio(platform: string, fallback: MediaGalleryProps["aspectRatio"]): MediaGalleryProps["aspectRatio"] {
  const platformLower = platform.toLowerCase();
  switch (platformLower) {
    case "tiktok":
    case "tiktok_business":
      return "9:16";
    case "youtube":
      return "16:9";
    case "pinterest":
      return "2:3";
    case "instagram":
      return fallback === "auto" ? "1:1" : fallback;
    default:
      return fallback;
  }
}

export { MediaItem };
