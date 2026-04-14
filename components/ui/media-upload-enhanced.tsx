"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import Cropper, { Area } from "react-easy-crop";
import { 
  Upload, 
  X, 
  ImageIcon, 
  Video, 
  Crop, 
  ZoomIn, 
  ZoomOut,
  RotateCw,
  Check,
  Plus,
  AlertCircle
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface MediaFile {
  id: string;
  file: File;
  preview: string;
  croppedUrl?: string;
  type: "image" | "video";
  status: "uploading" | "processing" | "ready" | "error";
  progress: number;
  dimensions?: { width: number; height: number };
}

interface MediaUploadEnhancedProps {
  files: MediaFile[];
  onFilesChange: (files: MediaFile[]) => void;
  maxFiles?: number;
  maxSize?: number;
  onUpload?: (file: MediaFile) => Promise<string>;
  aspectRatios?: Array<{ value: number; label: string }>;
}

const DEFAULT_ASPECT_RATIOS = [
  { value: 1, label: "1:1 Square" },
  { value: 4/5, label: "4:5 Portrait" },
  { value: 16/9, label: "16:9 Landscape" },
  { value: 9/16, label: "9:16 Stories" },
];

export function MediaUploadEnhanced({
  files,
  onFilesChange,
  maxFiles = 10,
  maxSize = 500 * 1024 * 1024,
  onUpload,
  aspectRatios = DEFAULT_ASPECT_RATIOS,
}: MediaUploadEnhancedProps) {
  const [editingFile, setEditingFile] = useState<MediaFile | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newFiles: MediaFile[] = acceptedFiles.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
        type: file.type.startsWith("video/") ? "video" : "image",
        status: onUpload ? "uploading" : "ready",
        progress: 0,
      }));

      const updatedFiles = [...files, ...newFiles].slice(0, maxFiles);
      onFilesChange(updatedFiles);

      // Auto-upload if handler provided
      if (onUpload) {
        for (const file of newFiles) {
          try {
            const url = await onUpload(file);
            onFilesChange(
              updatedFiles.map((f) =>
                f.id === file.id
                  ? { ...f, croppedUrl: url, status: "ready", progress: 100 }
                  : f
              )
            );
          } catch {
            onFilesChange(
              updatedFiles.map((f) =>
                f.id === file.id
                  ? { ...f, status: "error", progress: 0 }
                  : f
              )
            );
          }
        }
      }
    },
    [files, maxFiles, onFilesChange, onUpload]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
      "video/*": [".mp4", ".mov", ".webm"],
    },
    maxFiles: maxFiles - files.length,
    maxSize,
    disabled: files.length >= maxFiles,
  });

  const removeFile = (id: string) => {
    const file = files.find((f) => f.id === id);
    if (file?.preview) URL.revokeObjectURL(file.preview);
    onFilesChange(files.filter((f) => f.id !== id));
  };

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    if (!editingFile || !croppedAreaPixels) return;

    try {
      const croppedImage = await getCroppedImg(
        editingFile.preview,
        croppedAreaPixels,
        rotation
      );

      // Create new file from cropped blob
      const croppedFile = new File(
        [croppedImage],
        editingFile.file.name,
        { type: "image/jpeg" }
      );

      const croppedUrl = URL.createObjectURL(croppedImage);

      onFilesChange(
        files.map((f) =>
          f.id === editingFile.id
            ? {
                ...f,
                file: croppedFile,
                croppedUrl,
                preview: croppedUrl,
              }
            : f
        )
      );

      setEditingFile(null);
      setRotation(0);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    } catch (e) {
      console.error("Crop failed:", e);
    }
  };

  const imageCount = files.filter((f) => f.type === "image").length;
  const videoCount = files.filter((f) => f.type === "video").length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      {files.length > 0 && (
        <div className="flex items-center gap-4 text-sm text-slate-500">
          {imageCount > 0 && (
            <span className="flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4" />
              {imageCount} images
            </span>
          )}
          {videoCount > 0 && (
            <span className="flex items-center gap-1.5">
              <Video className="w-4 h-4" />
              {videoCount} videos
            </span>
          )}
          <span className="ml-auto">{files.length}/{maxFiles}</span>
        </div>
      )}

      {/* Upload Area */}
      {files.length === 0 ? (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all",
            isDragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-slate-300 dark:border-slate-700 hover:border-slate-400"
          )}
        >
          <input {...getInputProps()} />
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <Upload className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-900 dark:text-slate-100 font-medium">
            {isDragActive ? "Drop files here" : "Drag & drop or click to upload"}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Photos & videos up to 500MB
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {files.map((file) => (
            <motion.div
              key={file.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800"
            >
              {/* Preview */}
              {file.type === "video" ? (
                <video
                  src={file.croppedUrl || file.preview}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={file.croppedUrl || file.preview}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}

              {/* Video Badge */}
              {file.type === "video" && (
                <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/60 text-white text-xs">
                  VIDEO
                </div>
              )}

              {/* Hover Actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {file.type === "image" && (
                  <button
                    onClick={() => setEditingFile(file)}
                    className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors"
                    title="Crop image"
                  >
                    <Crop className="w-4 h-4 text-slate-700" />
                  </button>
                )}
                <button
                  onClick={() => removeFile(file.id)}
                  className="p-2 rounded-full bg-red-500/90 hover:bg-red-500 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Status */}
              {file.status === "uploading" && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </motion.div>
          ))}

          {/* Add More Button */}
          {files.length < maxFiles && (
            <div
              {...getRootProps()}
              className="aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-slate-400 transition-colors"
            >
              <input {...getInputProps()} />
              <Plus className="w-6 h-6 text-slate-400 mb-1" />
              <span className="text-xs text-slate-400">Add</span>
            </div>
          )}
        </div>
      )}

      {/* Crop Dialog */}
      <Dialog open={!!editingFile} onOpenChange={() => setEditingFile(null)}>
        <DialogContent className="max-w-3xl p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Crop className="w-5 h-5" />
              Crop Image
            </DialogTitle>
          </DialogHeader>

          {editingFile && (
            <div className="p-4 space-y-4">
              {/* Cropper */}
              <div className="relative h-[400px] bg-slate-900 rounded-lg overflow-hidden">
                <Cropper
                  image={editingFile.preview}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={aspect}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>

              {/* Controls */}
              <div className="space-y-4">
                {/* Aspect Ratios */}
                <div className="flex gap-2">
                  {aspectRatios.map((ratio) => (
                    <button
                      key={ratio.value}
                      onClick={() => setAspect(ratio.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm transition-colors",
                        aspect === ratio.value
                          ? "bg-blue-500 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600"
                      )}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>

                {/* Zoom */}
                <div className="flex items-center gap-3">
                  <ZoomOut className="w-4 h-4 text-slate-400" />
                  <Slider
                    value={[zoom]}
                    onValueChange={([v]) => v !== undefined && setZoom(v)}
                    min={1}
                    max={3}
                    step={0.1}
                    className="flex-1"
                  />
                  <ZoomIn className="w-4 h-4 text-slate-400" />
                </div>

                {/* Rotation */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRotation((r) => r - 90)}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-slate-500">{rotation}°</span>
                  <button
                    onClick={() => setRotation((r) => r + 90)}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button onClick={handleCropSave} className="flex-1">
                  <Check className="w-4 h-4 mr-2" />
                  Apply Crop
                </Button>
                <Button variant="outline" onClick={() => setEditingFile(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Errors */}
      {fileRejections.length > 0 && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
            <div>
              {fileRejections.map(({ file, errors }, i) => (
                <p key={i} className="text-red-600 dark:text-red-400">
                  {file.name}: {errors.map((e) => e.message).join(", ")}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to crop image
async function getCroppedImg(
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

  // Set canvas size to match the desired crop size
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

