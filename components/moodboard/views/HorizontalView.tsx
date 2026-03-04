"use client";

import { DndContext, DragOverlay, closestCorners } from "@dnd-kit/core";
import { Video, FileText, Link as LinkIcon, ImageIcon } from "lucide-react";

import { DayColumn } from "@/components/moodboard/DayColumn";
import type { MoodboardItem, DayColumnType } from "@/lib/hooks/useMoodboard";
import { useMoodboardDnD } from "@/lib/hooks/useMoodboardDnD";

interface HorizontalViewProps {
  columns: DayColumnType[];
  onDeleteItem: (id: string) => void;
  onAddItem: (columnId: string, type: MoodboardItem["type"]) => void;
  onUpdateItem: (id: string, updates: Partial<MoodboardItem>) => void;
  onFileDrop: (columnId: string, files: File[]) => void;
  onReorder: (columns: DayColumnType[]) => void;
}

export function HorizontalView({
  columns,
  onDeleteItem,
  onAddItem,
  onUpdateItem,
  onFileDrop,
  onReorder,
}: HorizontalViewProps) {
  const {
    sensors,
    displayColumns,
    activeItem,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    dropAnimation,
  } = useMoodboardDnD(columns, onReorder);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
        {displayColumns.map((column) => (
          <div key={column.id} className="group">
            <DayColumn
              column={column}
              onDeleteItem={onDeleteItem}
              onAddItem={onAddItem}
              onUpdateItem={onUpdateItem}
              onFileDrop={onFileDrop}
            />
          </div>
        ))}
      </div>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeItem ? (
          <div className="opacity-90 rotate-2 scale-105">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden">
              {activeItem.type === "image" && (
                <div className="aspect-[4/5] bg-slate-100 flex items-center justify-center">
                  {activeItem.media_url ? (
                    <img
                      src={activeItem.media_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                  )}
                </div>
              )}
              {activeItem.type === "video" && (
                <div
                  className={`${activeItem.video_ratio === "9:16" ? "aspect-[9/16]" : "aspect-video"} bg-slate-800 flex items-center justify-center`}
                >
                  <Video className="w-8 h-8 text-white/50" />
                </div>
              )}
              {activeItem.type === "note" && (
                <div className="p-3 bg-amber-50">
                  <FileText className="w-4 h-4 text-amber-400" />
                </div>
              )}
              {activeItem.type === "tweet" && (
                <div className="p-3">
                  <p className="text-[10px] text-slate-700 line-clamp-3">
                    {activeItem.content}
                  </p>
                </div>
              )}
              {activeItem.type === "link" && (
                <div className="p-3 bg-blue-50">
                  <LinkIcon className="w-4 h-4 text-blue-500" />
                </div>
              )}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
