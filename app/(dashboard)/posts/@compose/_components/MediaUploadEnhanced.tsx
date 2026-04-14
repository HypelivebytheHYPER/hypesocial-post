"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import {
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Film,
  Crop,
  ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

import type { UploadedFile } from "@/components/ui/file-upload";
import { ImageCropper, AspectRatioKey } from "@/components/ui/image-cropper";
import { UPLOAD, PLATFORM_LIMITS } from "@/lib/constants";

interface MediaUploadEnhancedProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  onUpload?: (file: UploadedFile) => Promise<string>;
  maxFiles?: number;
  maxSize?: number;
  /** Enable image cropping */
  enableCropping?: boolean;
  /** Available aspect ratios for cropping */
  cropAspectRatios?: AspectRatioKey[];
  /** Default aspect ratio */
  defaultAspectRatio?: AspectRatioKey;
}

export function MediaUploadEnhanced({
  files,
  onFilesChange,
  onUpload,
  maxFiles = PLATFORM_LIMITS.MAX_MEDIA_PER_POST,
  maxSize = UPLOAD.MAX_FILE_SIZE,
  enableCropping = true,
  cropAspectRatios = [
    "square",
    "portrait",
    "landscape",
    "instagram-reels",
    "tiktok-vertical",
    "youtube-video",
  ],
  defaultAspectRatio = "square",
}: MediaUploadEnhancedProps) {
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropTarget, setCropTarget] = useState<UploadedFile | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview:
          file.type.startsWith("image/") || file.type.startsWith("video/")
            ? URL.createObjectURL(file)
            : undefined,
        status: onUpload ? "uploading" : "pending",
        progress: 0,
      }));

      const updatedFiles = [...files, ...newFiles].slice(0, maxFiles);
      onFilesChange(updatedFiles);

      if (onUpload) {
        for (const file of newFiles) {
          try {
            const url = await onUpload(file);
            onFilesChange(
              updatedFiles.map((f) =>
                f.id === file.id
                  ? { ...f, uploadedUrl: url, status: "success", progress: 100 }
                  : f
              )
            );
          } catch (error) {
            onFilesChange(
              updatedFiles.map((f) =>
                f.id === file.id
                  ? {
                      ...f,
                      status: "error",
                      error:
                        error instanceof Error
                          ? error.message
                          : "Upload failed",
                    }
                  : f
              )
            );
          }
        }
      }
    },
    [files, maxFiles, onFilesChange, onUpload]
  );

  const { getRootProps, getInputProps, isDragActive: dropzoneActive, fileRejections } =
    useDropzone({
      onDrop,
      maxFiles: maxFiles - files.length,
      maxSize,
      accept: {
        "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
        "video/*": [".mp4", ".mov", ".avi", ".webm"],
      },
      disabled: files.length >= maxFiles,
    });

  const removeFile = (id: string) => {
    const file = files.find((f) => f.id === id);
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
    onFilesChange(files.filter((f) => f.id !== id));
  };

  const handleCrop = useCallback((file: UploadedFile) => {
    setCropTarget(file);
    setCropperOpen(true);
  }, []);

  const handleCropComplete = useCallback(async (croppedBlob: Blob, croppedUrl: string) => {
    if (!cropTarget) return;

    // Create a new File from the cropped blob
    const croppedFile = new File([croppedBlob], cropTarget.file.name, {
      type: "image/jpeg",
    });

    // Create updated file object
    const updatedFile: UploadedFile = {
      ...cropTarget,
      file: croppedFile,
      preview: croppedUrl,
      status: onUpload ? "uploading" : "pending",
      progress: 0,
    };

    // Update files array
    const updatedFiles = files.map((f) =>
      f.id === cropTarget.id ? updatedFile : f
    );
    onFilesChange(updatedFiles);

    // Upload if handler provided
    if (onUpload) {
      try {
        const url = await onUpload(updatedFile);
        onFilesChange(
          updatedFiles.map((f) =>
            f.id === cropTarget.id
              ? { ...f, uploadedUrl: url, status: "success", progress: 100 }
              : f
          )
        );
      } catch (error) {
        onFilesChange(
          updatedFiles.map((f) =>
            f.id === cropTarget.id
              ? {
                  ...f,
                  status: "error",
                  error: error instanceof Error ? error.message : "Upload failed",
                }
              : f
          )
        );
      }
    }

    setCropTarget(null);
  }, [cropTarget, files, onFilesChange, onUpload]);

  const imageCount = files.filter((f) => f.file.type.startsWith("image/")).length;
  const videoCount = files.filter((f) => f.file.type.startsWith("video/")).length;

  return (
    <div className="space-y-3">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600">
            Media
          </span>
          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded-full text-slate-500">
            {files.length}/{maxFiles}
          </span>
        </div>
        {files.length > 0 && (
          <div className="flex items-center gap-2">
            {imageCount > 0 && (
              <span className="text-[10px] text-slate-400">
                {imageCount} img
              </span>
            )}
            {videoCount > 0 && (
              <span className="text-[10px] text-slate-400">
                {videoCount} vid
              </span>
            )}
          </div>
        )}
      </div>

      {/* Media Grid */}
      {files.length > 0 ? (
        <div className="grid grid-cols-5 gap-1.5">
          {files.map((file, index) => (
            <MediaThumbnail
              key={file.id}
              file={file}
              index={index}
              onRemove={() => removeFile(file.id)}
              onCrop={enableCropping && file.file.type.startsWith("image/") ? () => handleCrop(file) : undefined}
            />
          ))}

          {/* Add More Button - Compact */}
          {files.length < maxFiles && (
            <div
              {...getRootProps()}
              className={cn(
                "aspect-square rounded-lg border border-dashed border-slate-300 bg-slate-50/50",
                "flex items-center justify-center cursor-pointer",
                "hover:border-blue-300 hover:bg-slate-100 transition-all"
              )}
            >
              <input {...getInputProps()} />
              <Plus className="w-4 h-4 text-slate-400" />
            </div>
          )}
        </div>
      ) : (
        /* Minimal Empty State */
        <div
          {...getRootProps()}
          className={cn(
            "rounded-lg border border-dashed border-slate-300 transition-all cursor-pointer",
            "bg-slate-50/50 hover:bg-slate-50 hover:border-blue-300",
            dropzoneActive && "border-blue-400 bg-blue-50/30",
            "py-4 px-3 flex items-center justify-center gap-2"
          )}
        >
          <input {...getInputProps()} />
          <ImageIcon className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500">
            {dropzoneActive ? "Drop here" : "Add media"}
          </span>
        </div>
      )}

      {/* Error Messages */}
      {fileRejections.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
            <div className="space-y-1">
              {fileRejections.map(({ file, errors }, index) => (
                <div key={index} className="text-red-600 dark:text-red-400 text-xs">
                  <span className="font-medium">{file.name}</span>:{" "}
                  {errors.map((e) => e.message).join(", ")}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Cropper Dialog */}
      {cropTarget?.preview && (
        <ImageCropper
          image={cropTarget.preview}
          open={cropperOpen}
          onOpenChange={setCropperOpen}
          onCropComplete={handleCropComplete}
          availableRatios={cropAspectRatios}
          defaultAspectRatio={defaultAspectRatio}
          title="Crop Image"
        />
      )}
    </div>
  );
}

function MediaThumbnail({
  file,
  onRemove,
  onCrop,
}: {
  file: UploadedFile;
  index: number;
  onRemove: () => void;
  onCrop?: () => void;
}) {
  const isImage = file.file.type.startsWith("image/");
  const isVideo = file.file.type.startsWith("video/");
  const isUploading = file.status === "uploading";
  const isError = file.status === "error";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="group relative aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800"
    >
      {/* Preview */}
      {file.preview && (isImage || isVideo) ? (
        <>
          {isVideo ? (
            <video
              src={file.preview}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
          ) : (
            <img
              src={file.preview}
              alt={file.file.name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          )}

          {/* Video Indicator */}
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <div className="w-5 h-5 rounded-full bg-white/90 flex items-center justify-center">
                <div className="w-0 h-0 border-l-[5px] border-l-slate-900 border-y-[3px] border-y-transparent ml-0.5" />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {isImage ? (
            <ImageIcon className="w-5 h-5 text-slate-400" />
          ) : (
            <Film className="w-5 h-5 text-slate-400" />
          )}
        </div>
      )}

      {/* Status Overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <Loader2 className="w-4 h-4 text-white animate-spin" />
        </div>
      )}

      {isError && (
        <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
          <AlertCircle className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Hover Actions - Minimal */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
        {onCrop && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCrop();
            }}
            className="p-1 rounded bg-white/90 hover:bg-white transition-colors"
            title="Crop"
          >
            <Crop className="w-3 h-3 text-slate-700" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1 rounded bg-red-500/90 hover:bg-red-500 transition-colors"
        >
          <Trash2 className="w-3 h-3 text-white" />
        </button>
      </div>
    </motion.div>
  );
}
