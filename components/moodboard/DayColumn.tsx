"use client";

import { useCallback, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDropzone } from "react-dropzone";
import {
  ImageIcon,
  Video,
  FileText,
  Link as LinkIcon,
  Upload,
  Plus,
} from "lucide-react";
import { SortableMoodboardCard } from "./SortableMoodboardCard";
import type { MoodboardItem, DayColumnType } from "@/lib/hooks/useMoodboard";

export function DayColumn({
  column,
  onDeleteItem,
  onAddItem,
  onUpdateItem,
  onFileDrop,
}: {
  column: DayColumnType;
  onDeleteItem: (id: string) => void;
  onAddItem: (columnId: string, type: MoodboardItem["type"]) => void;
  onUpdateItem: (id: string, updates: Partial<MoodboardItem>) => void;
  onFileDrop?: (columnId: string, files: File[]) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { column },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const itemIds = column.items.map((item) => item.id);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFileDrop?.(column.id, acceptedFiles);
    },
    [column.id, onFileDrop],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp", ".heic", ".heif"],
      "video/*": [".mp4", ".mov", ".webm"],
    },
    noClick: true,
    noKeyboard: true,
  });

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileDrop?.(column.id, Array.from(files));
    }
    // Reset so the same file can be re-selected
    e.target.value = "";
  };

  return (
    <div
      ref={setNodeRef}
      className={`group/col flex flex-col min-h-[400px] rounded-3xl transition-colors ${
        isOver ? "bg-slate-100/50 ring-2 ring-slate-200" : ""
      }`}
    >
      {/* Day Header */}
      <div className="flex flex-col items-center mb-4">
        <span className="text-xs font-medium text-slate-400">
          {column.date}
        </span>
        <span className="text-lg font-semibold text-slate-800">
          {column.day}
        </span>
      </div>

      {/* Sortable Items + File Drop Zone */}
      <div {...getRootProps()} className="flex-1 relative">
        <input {...getInputProps()} />
        {/* Hidden file input for click-to-upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        {isDragActive && (
          <div className="absolute inset-0 bg-blue-50/80 border-2 border-dashed border-blue-300 rounded-2xl flex items-center justify-center z-30">
            <div className="text-center">
              <Upload className="w-6 h-6 text-blue-400 mx-auto mb-1" />
              <p className="text-xs text-blue-500 font-medium">Drop files</p>
            </div>
          </div>
        )}
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-3 p-2">
            {column.items.map((item) => (
              <SortableMoodboardCard
                key={item.id}
                item={item}
                onDelete={onDeleteItem}
                onUpdate={onUpdateItem}
              />
            ))}
          </div>
        </SortableContext>

        {/* Empty state — click to upload */}
        {column.items.length === 0 && !isDragActive && (
          <button
            onClick={handleUploadClick}
            className="w-full p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center hover:border-slate-300 hover:bg-slate-50/50 transition-colors"
          >
            <Upload className="w-6 h-6 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">
              Tap to upload
            </p>
          </button>
        )}
      </div>

      {/* Add buttons — always visible */}
      <div className="flex items-center justify-center gap-2 p-2">
        <button
          onClick={handleUploadClick}
          className="w-10 h-10 rounded-full bg-slate-100 hover:bg-blue-100 flex items-center justify-center transition-colors"
          title="Upload image or video"
        >
          <Upload className="w-4 h-4 text-slate-500" />
        </button>
        <button
          onClick={() => onAddItem(column.id, "note")}
          className="w-10 h-10 rounded-full bg-slate-100 hover:bg-amber-100 flex items-center justify-center transition-colors"
          title="Add note"
        >
          <FileText className="w-4 h-4 text-slate-500" />
        </button>
        <button
          onClick={() => onAddItem(column.id, "link")}
          className="w-10 h-10 rounded-full bg-slate-100 hover:bg-blue-100 flex items-center justify-center transition-colors"
          title="Add link"
        >
          <LinkIcon className="w-4 h-4 text-slate-500" />
        </button>
      </div>
    </div>
  );
}
