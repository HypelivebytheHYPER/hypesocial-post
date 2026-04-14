"use client";

import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  X,
  Plus,
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  uploadedUrl?: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
  width?: number;
  height?: number;
  duration?: number;
}

interface FileUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  onUpload?: (file: UploadedFile) => Promise<string>;
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: Record<string, string[]>;
  className?: string;
  disabled?: boolean;
}

const fileTypeIcons = {
  image: FileImage,
  video: FileVideo,
  audio: FileAudio,
  default: FileText,
};

function getFileIcon(type: string): React.ComponentType<{ className?: string }> {
  if (type.startsWith("image/")) return fileTypeIcons.image;
  if (type.startsWith("video/")) return fileTypeIcons.video;
  if (type.startsWith("audio/")) return fileTypeIcons.audio;
  return fileTypeIcons.default;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function FileUpload({
  files,
  onFilesChange,
  onUpload,
  maxFiles = 10,
  maxSize = 100 * 1024 * 1024, // 100MB default
  accept = {
    "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    "video/*": [".mp4", ".mov", ".avi", ".webm"],
  },
  className,
  disabled = false,
}: FileUploadProps) {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview: file.type.startsWith("image/") || file.type.startsWith("video/")
          ? URL.createObjectURL(file)
          : undefined,
        status: onUpload ? "uploading" : "pending",
        progress: 0,
      }));

      if (onUpload) {
        // Upload files one by one
        onFilesChange([...files, ...newFiles].slice(0, maxFiles));
        
        for (const file of newFiles) {
          try {
            const url = await onUpload(file);
            onFilesChange(
              files.map((f) =>
                f.id === file.id
                  ? { ...f, uploadedUrl: url, status: "success", progress: 100 }
                  : f
              )
            );
          } catch (error) {
            onFilesChange(
              files.map((f) =>
                f.id === file.id
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
      } else {
        onFilesChange([...files, ...newFiles].slice(0, maxFiles));
      }
    },
    [files, maxFiles, onFilesChange, onUpload]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    maxFiles: maxFiles - files.length,
    maxSize,
    accept,
    disabled: disabled || files.length >= maxFiles,
  });

  const removeFile = useCallback((id: string) => {
    const file = files.find((f) => f.id === id);
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
    onFilesChange(files.filter((f) => f.id !== id));
  }, [files, onFilesChange]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer",
          "hover:border-slate-400 hover:bg-slate-50/50",
          "dark:hover:border-slate-600 dark:hover:bg-slate-800/50",
          isDragActive && "border-primary bg-primary/5 scale-[1.02]",
          files.length >= maxFiles && "opacity-50 cursor-not-allowed",
          "p-8 text-center"
        )}
      >
        <input {...getInputProps()} />

        <motion.div
          initial={false}
          animate={isDragActive ? { y: -4 } : { y: 0 }}
          className="flex flex-col items-center gap-3"
        >
          <div
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors",
              isDragActive
                ? "bg-primary text-primary-foreground"
                : "bg-slate-100 text-slate-400 dark:bg-slate-800"
            )}
          >
            <Upload className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {isDragActive ? "Drop files here" : "Drop files or click to upload"}
            </p>
            <p className="text-xs text-slate-400">
              {Object.values(accept)
                .flat()
                .join(", ")}{" "}
              up to {formatFileSize(maxSize)}
            </p>
          </div>

          {files.length > 0 && (
            <p className="text-xs text-slate-500">
              {files.length} of {maxFiles} files
            </p>
          )}
        </motion.div>
      </div>

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
                <div key={index} className="text-red-600 dark:text-red-400">
                  <span className="font-medium">{file.name}</span>:{" "}
                  {errors.map((e) => e.message).join(", ")}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* File List */}
      <AnimatePresence mode="popLayout">
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {files.map((file, index) => (
              <FileItem
                key={file.id}
                file={file}
                index={index}
                onRemove={() => removeFile(file.id)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface FileItemProps {
  file: UploadedFile;
  index: number;
  onRemove: () => void;
}

function FileItem({ file, onRemove }: FileItemProps) {
  const Icon = getFileIcon(file.file.type);
  const isImage = file.file.type.startsWith("image/");
  const isVideo = file.file.type.startsWith("video/");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        "group relative flex items-center gap-3 p-3 rounded-xl",
        "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700",
        "hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
      )}
    >
      {/* Thumbnail or Icon */}
      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 flex-shrink-0">
        {file.preview && (isImage || isVideo) ? (
          <>
            {isVideo ? (
              <video
                src={file.preview}
                className="w-full h-full object-cover"
                muted
              />
            ) : (
              <img
                src={file.preview}
                alt={file.file.name}
                className="w-full h-full object-cover"
              />
            )}
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[6px] border-l-slate-900 border-y-[4px] border-y-transparent ml-0.5" />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon className="w-6 h-6 text-slate-400" />
          </div>
        )}

        {/* Status Overlay */}
        {file.status === "uploading" && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
          {file.file.name}
        </p>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>{formatFileSize(file.file.size)}</span>
          {file.width && file.height && (
            <>
              <span>•</span>
              <span>
                {file.width}×{file.height}
              </span>
            </>
          )}
        </div>

        {/* Progress Bar */}
        {file.status === "uploading" && (
          <div className="mt-2 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${file.progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        {/* Error Message */}
        {file.status === "error" && file.error && (
          <p className="mt-1 text-xs text-red-500">{file.error}</p>
        )}
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-2">
        {file.status === "success" && (
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        )}
        {file.status === "error" && (
          <AlertCircle className="w-5 h-5 text-red-500" />
        )}

        {/* Remove Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
        </Button>
      </div>
    </motion.div>
  );
}

// Compact version for smaller spaces
interface FileUploadCompactProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  onUpload?: (file: UploadedFile) => Promise<string>;
  maxFiles?: number;
  accept?: Record<string, string[]>;
  className?: string;
}

export function FileUploadCompact({
  files,
  onFilesChange,
  onUpload,
  maxFiles = 4,
  accept = { "image/*": [], "video/*": [] },
  className,
}: FileUploadCompactProps) {
  const [localFiles, setLocalFiles] = useState<UploadedFile[]>(files);
  
  // Sync with parent
  useEffect(() => {
    setLocalFiles(files);
  }, [files]);
  
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

      const updatedFiles = [...localFiles, ...newFiles].slice(0, maxFiles);
      setLocalFiles(updatedFiles);
      onFilesChange(updatedFiles);

      if (onUpload) {
        for (const file of newFiles) {
          try {
            const url = await onUpload(file);
            const successFiles = updatedFiles.map((f) =>
              f.id === file.id
                ? { ...f, uploadedUrl: url, status: "success" as const, progress: 100 }
                : f
            );
            setLocalFiles(successFiles);
            onFilesChange(successFiles);
          } catch (error) {
            const errorFiles = updatedFiles.map((f) =>
              f.id === file.id
                ? {
                    ...f,
                    status: "error" as const,
                    error:
                      error instanceof Error ? error.message : "Upload failed",
                  }
                : f
            );
            setLocalFiles(errorFiles);
            onFilesChange(errorFiles);
          }
        }
      }
    },
    [localFiles, maxFiles, onFilesChange, onUpload]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    maxFiles: maxFiles - localFiles.length,
    accept,
    disabled: localFiles.length >= maxFiles,
  });

  const removeFile = (id: string) => {
    const file = localFiles.find((f) => f.id === id);
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
    const updated = localFiles.filter((f) => f.id !== id);
    setLocalFiles(updated);
    onFilesChange(updated);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Thumbnail Grid */}
      {localFiles.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {localFiles.map((file) => (
            <div
              key={file.id}
              className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 group"
            >
              {file.preview ? (
                <img
                  src={file.preview}
                  alt={file.file.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {(() => {
                    const Icon = getFileIcon(file.file.type);
                    return <Icon className="w-6 h-6 text-slate-400" />;
                  })()}
                </div>
              )}

              {/* Remove Button */}
              <button
                onClick={() => removeFile(file.id)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>

              {/* Status */}
              {file.status === "uploading" && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
            </div>
          ))}

          {/* Add More Button */}
          {localFiles.length < maxFiles && (
            <div
              {...getRootProps()}
              className="aspect-square rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
            >
              <input {...getInputProps()} />
              <Plus className="w-5 h-5 text-slate-400" />
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {localFiles.length === 0 && (
        <div
          {...getRootProps()}
          className="aspect-video rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
        >
          <input {...getInputProps()} />
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
            <Upload className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm text-slate-500">Drop or click to upload</p>
        </div>
      )}
    </div>
  );
}
