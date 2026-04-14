"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { ImageIcon, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface VideoThumbnailPickerProps {
  videoUrl: string;
  initialTimestampMs?: number;
  onThumbnailSelect: (timestampMs: number, thumbnailBlob: Blob) => void;
  onCancel: () => void;
  className?: string;
}

export function VideoThumbnailPicker({
  videoUrl,
  initialTimestampMs = 0,
  onThumbnailSelect,
  onCancel,
  className,
}: VideoThumbnailPickerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(initialTimestampMs / 1000);
  const [isLoading, setIsLoading] = useState(true);
  const [isExtracting, setIsExtracting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Update preview when currentTime changes
  const updatePreview = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match video (max 720px width for performance)
    const scale = Math.min(1, 720 / video.videoWidth);
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;

    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Update preview URL
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setPreviewUrl(dataUrl);
  }, []);

  // Initialize video and get duration
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
      // Seek to initial position
      video.currentTime = initialTimestampMs / 1000;
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      updatePreview();
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [initialTimestampMs, updatePreview]);

  // Handle slider change
  const handleSliderChange = useCallback((value: number[]) => {
    const newTime = value[0] ?? 0;
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  }, []);

  // Extract frame and create blob
  const handleConfirm = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsExtracting(true);
    try {
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error("Failed to create thumbnail blob"));
          },
          "image/jpeg",
          0.92
        );
      });

      onThumbnailSelect(Math.round(currentTime * 1000), blob);
    } catch (error) {
      console.error("Failed to extract thumbnail:", error);
    } finally {
      setIsExtracting(false);
    }
  }, [currentTime, onThumbnailSelect]);

  // Format time display (MM:SS.ms)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-indigo-500" />
          <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Select Thumbnail Frame
          </h4>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Scrub through the video to choose the perfect thumbnail moment
        </p>
      </div>

      {/* Preview Area */}
      <div className="p-4 space-y-4">
        {/* Hidden video element for frame extraction */}
        <video
          ref={videoRef}
          src={videoUrl}
          className="hidden"
          crossOrigin="anonymous"
          preload="metadata"
        />

        {/* Hidden canvas for frame extraction */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Preview Image */}
        <div className="relative aspect-video bg-slate-950 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
          ) : previewUrl ? (
            <img
              src={previewUrl}
              alt="Thumbnail preview"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500">
              <ImageIcon className="w-12 h-12 opacity-50" />
            </div>
          )}

          {/* Time overlay */}
          <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/70 rounded text-xs text-white font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Scrubber */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>0:00</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400">
              {formatTime(currentTime)}
            </span>
            <span>{formatTime(duration)}</span>
          </div>
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 1}
            step={0.1}
            onValueChange={handleSliderChange}
            disabled={isLoading || duration === 0}
            className="w-full"
          />
        </div>

        {/* Quick select buttons */}
        <div className="flex gap-2">
          {[0, 0.25, 0.5, 0.75].map((percent) => (
            <Button
              key={percent}
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 text-xs h-8"
              disabled={isLoading || !duration}
              onClick={() => {
                const newTime = (duration || 0) * percent;
                setCurrentTime(newTime);
                if (videoRef.current) {
                  videoRef.current.currentTime = newTime;
                }
              }}
            >
              {percent === 0 ? "Start" : `${Math.round(percent * 100)}%`}
            </Button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isExtracting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleConfirm}
          disabled={isLoading || isExtracting}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {isExtracting ? (
            <>
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              Extracting...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-1.5" />
              Use This Frame
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
