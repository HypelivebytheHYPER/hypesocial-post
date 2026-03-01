"use client";

import { useState, useRef, useEffect } from "react";
import { cn, proxyMediaUrl } from "@/lib/utils";
import { Loader2, Play, Volume2, VolumeX } from "lucide-react";

interface LazyVideoProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  preload?: "none" | "metadata" | "auto";
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Lazy Video Component with Intersection Observer
 * Only loads video when it enters the viewport
 * Shows loading state and handles errors gracefully
 */
export function LazyVideo({
  src,
  poster,
  className,
  autoPlay = false,
  muted = true,
  loop = false,
  controls = true,
  preload = "metadata",
  onLoad,
  onError,
}: LazyVideoProps) {
  const [isInView, setIsInView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "50px", // Start loading 50px before visible
        threshold: 0.1,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoadedData = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.(new Error(`Failed to load video: ${src}`));
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Validate URL is from Post For Me storage or already proxied
  const isValidUrl = src.includes("data.postforme.dev") ||
    src.includes("cjsgitiiwhrsfolwmtby.supabase.co") ||
    src.startsWith("/api/media/proxy");

  if (!isValidUrl) {
    return (
      <div
        ref={containerRef}
        className={cn(
          "relative bg-slate-100 rounded-xl flex items-center justify-center",
          className
        )}
      >
        <div className="text-center p-4">
          <p className="text-sm text-red-500 font-medium">Invalid Video URL</p>
          <p className="text-xs text-slate-400 mt-1">
            Only Post For Me storage allowed
          </p>
        </div>
      </div>
    );
  }

  // Use proxy for media URLs
  const proxiedSrc = proxyMediaUrl(src);
  const proxiedPoster = poster ? proxyMediaUrl(poster) : undefined;

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden rounded-xl bg-slate-900", className)}
    >
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 z-10">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
          <div className="text-center p-4">
            <p className="text-sm text-red-400 font-medium">Failed to load video</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-xs text-white/70 hover:text-white underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Video Element - only render when in view */}
      {isInView && (
        <video
          ref={videoRef}
          src={proxiedSrc}
          poster={proxiedPoster}
          className="w-full h-full object-cover"
          autoPlay={autoPlay}
          muted={isMuted}
          loop={loop}
          controls={controls}
          preload={preload}
          playsInline
          onLoadedData={handleLoadedData}
          onError={handleError}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}

      {/* Custom Controls Overlay (when controls=false) */}
      {!controls && isInView && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              <Play className="w-4 h-4" fill={isPlaying ? "currentColor" : "none"} />
            </button>
            <button
              onClick={toggleMute}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Placeholder before load */}
      {!isInView && proxiedPoster && (
        <img
          src={proxiedPoster}
          alt="Video thumbnail"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}
    </div>
  );
}

/**
 * Video Grid Component with lazy loading
 * Efficiently handles multiple videos in a grid layout
 */
interface VideoGridProps {
  videos: {
    id: string;
    src: string;
    poster?: string;
  }[];
  className?: string;
}

export function VideoGrid({ videos, className }: VideoGridProps) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 gap-4", className)}>
      {videos.map((video) => (
        <LazyVideo
          key={video.id}
          src={video.src}
          poster={video.poster}
          className="aspect-square"
          controls={false}
          preload="none"
        />
      ))}
    </div>
  );
}
