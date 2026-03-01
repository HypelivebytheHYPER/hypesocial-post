"use client";

import { useCallback } from "react";
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
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
      "video/*": [".mp4", ".mov", ".webm"],
    },
    noClick: true,
    noKeyboard: true,
  });

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
      </div>

      {/* Add buttons */}
      <div className="flex items-center justify-center gap-1 p-2 opacity-0 group-hover/col:opacity-100 transition-opacity">
        <button
          onClick={() => onAddItem(column.id, "image")}
          className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
        >
          <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
        </button>
        <button
          onClick={() => onAddItem(column.id, "video")}
          className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
        >
          <Video className="w-3.5 h-3.5 text-slate-500" />
        </button>
        <button
          onClick={() => onAddItem(column.id, "note")}
          className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
        >
          <FileText className="w-3.5 h-3.5 text-slate-500" />
        </button>
        <button
          onClick={() => onAddItem(column.id, "link")}
          className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
        >
          <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
        </button>
      </div>
    </div>
  );
}
