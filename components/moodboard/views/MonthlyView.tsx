"use client";

import { memo, useMemo } from "react";
import { DndContext, DragOverlay, closestCorners } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { isSameMonth, isToday } from "date-fns";
import { Plus } from "lucide-react";

import { CompactMoodboardCard } from "@/components/moodboard/CompactMoodboardCard";
import type { MoodboardItem, DayColumnType } from "@/lib/hooks/useMoodboard";
import { useMoodboardDnD } from "@/lib/hooks/useMoodboardDnD";

const MAX_VISIBLE = 3;
const DAY_HEADERS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

interface MonthlyViewProps {
  columns: DayColumnType[];
  monthAnchor: Date;
  onDeleteItem: (id: string) => void;
  onAddItem: (columnId: string, type: MoodboardItem["type"]) => void;
  onUpdateItem: (id: string, updates: Partial<MoodboardItem>) => void;
  onFileDrop: (columnId: string, files: File[]) => void;
  onReorder: (columns: DayColumnType[]) => void;
}

const MonthCell = memo(function MonthCell({
  column,
  isCurrentMonth,
  onDeleteItem,
  onAddItem,
}: {
  column: DayColumnType;
  isCurrentMonth: boolean;
  onDeleteItem: (id: string) => void;
  onAddItem: (columnId: string, type: MoodboardItem["type"]) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { column },
  });

  const itemIds = column.items.map((i) => i.id);
  const visibleItems = column.items.slice(0, MAX_VISIBLE);
  const overflowCount = column.items.length - MAX_VISIBLE;
  const todayCell = isToday(new Date(column.isoDate));

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[80px] lg:min-h-[120px] border border-slate-100 rounded-lg p-1 transition-colors flex flex-col ${
        isOver ? "bg-slate-100/50 ring-2 ring-slate-200" : ""
      } ${!isCurrentMonth ? "opacity-40" : ""} ${todayCell ? "bg-blue-50/40 ring-1 ring-blue-200" : ""}`}
    >
      {/* Date number */}
      <div className="flex items-center justify-between px-1 mb-0.5">
        <span
          className={`text-[11px] font-medium ${
            todayCell
              ? "text-blue-600 bg-blue-100 rounded-full w-5 h-5 flex items-center justify-center"
              : "text-slate-500"
          }`}
        >
          {column.date}
        </span>
        {isCurrentMonth && (
          <button
            onClick={() => onAddItem(column.id, "note")}
            className="w-4 h-4 rounded flex items-center justify-center opacity-0 group-hover/cell:opacity-100 hover:bg-slate-200 transition-opacity"
          >
            <Plus className="w-3 h-3 text-slate-400" />
          </button>
        )}
      </div>

      {/* Compact cards */}
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-0">
          {visibleItems.map((item) => (
            <CompactMoodboardCard
              key={item.id}
              item={item}
              onDelete={onDeleteItem}
            />
          ))}
        </div>
      </SortableContext>

      {overflowCount > 0 && (
        <span className="text-[9px] text-slate-400 px-1">
          +{overflowCount} more
        </span>
      )}
    </div>
  );
});

export function MonthlyView({
  columns,
  monthAnchor,
  onDeleteItem,
  onAddItem,
  onReorder,
}: MonthlyViewProps) {
  const {
    sensors,
    displayColumns,
    activeItem,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    dropAnimation,
  } = useMoodboardDnD(columns, onReorder);

  // Split columns into weeks (rows of 7)
  const weeks = useMemo(() => {
    const result: DayColumnType[][] = [];
    for (let i = 0; i < displayColumns.length; i += 7) {
      result.push(displayColumns.slice(i, i + 7));
    }
    return result;
  }, [displayColumns]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* Responsive wrapper — horizontal scroll on mobile */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="min-w-[500px] sm:min-w-0">
          {/* Day-of-week header */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_HEADERS.map((day) => (
              <div
                key={day}
                className="text-center text-[10px] font-medium text-slate-400 py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="space-y-1">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="grid grid-cols-7 gap-1">
                {week.map((column) => (
                  <div key={column.id} className="group/cell">
                    <MonthCell
                      column={column}
                      isCurrentMonth={isSameMonth(
                        new Date(column.isoDate),
                        monthAnchor,
                      )}
                      onDeleteItem={onDeleteItem}
                      onAddItem={onAddItem}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeItem ? (
          <div className="opacity-90 rotate-1 scale-105">
            <div className="bg-white rounded-md shadow-lg border border-slate-200 px-2 py-1 flex items-center gap-1.5">
              <span className="text-[10px] text-slate-700 truncate max-w-[120px]">
                {activeItem.content}
              </span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
