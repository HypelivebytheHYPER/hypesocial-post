"use client";

import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { format, isSameMonth, isToday } from "date-fns";
import { Plus } from "lucide-react";

import { CompactMoodboardCard } from "@/components/moodboard/CompactMoodboardCard";
import type { MoodboardItem, DayColumnType } from "@/lib/hooks/useMoodboard";

const MAX_VISIBLE = 3;

interface MonthlyViewProps {
  columns: DayColumnType[];
  monthAnchor: Date;
  onDeleteItem: (id: string) => void;
  onAddItem: (columnId: string, type: MoodboardItem["type"]) => void;
  onUpdateItem: (id: string, updates: Partial<MoodboardItem>) => void;
  onFileDrop: (columnId: string, files: File[]) => void;
  onReorder: (columns: DayColumnType[]) => void;
}

function MonthCell({
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
}

export function MonthlyView({
  columns,
  monthAnchor,
  onDeleteItem,
  onAddItem,
  onReorder,
}: MonthlyViewProps) {
  const [activeItem, setActiveItem] = useState<MoodboardItem | null>(null);
  const [localColumns, setLocalColumns] = useState<DayColumnType[] | null>(null);
  const displayColumns = localColumns || columns;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Split columns into weeks (rows of 7)
  const weeks = useMemo(() => {
    const result: DayColumnType[][] = [];
    for (let i = 0; i < displayColumns.length; i += 7) {
      result.push(displayColumns.slice(i, i + 7));
    }
    return result;
  }, [displayColumns]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = event.active.id as string;
      for (const col of columns) {
        const item = col.items.find((i) => i.id === id);
        if (item) {
          setActiveItem(item);
          break;
        }
      }
      setLocalColumns(columns);
    },
    [columns],
  );

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    setLocalColumns((prev) => {
      if (!prev) return prev;

      const activeContainer = prev.find((col) =>
        col.items.some((item) => item.id === activeId),
      )?.id;
      const overContainer =
        prev.find((col) => col.id === overId)?.id ||
        prev.find((col) => col.items.some((item) => item.id === overId))?.id;

      if (
        !activeContainer ||
        !overContainer ||
        activeContainer === overContainer
      )
        return prev;

      const activeCol = prev.find((c) => c.id === activeContainer)!;
      const overCol = prev.find((c) => c.id === overContainer)!;
      const activeIndex = activeCol.items.findIndex((i) => i.id === activeId);
      const overIndex = overCol.items.findIndex((i) => i.id === overId);
      const item = activeCol.items[activeIndex]!;

      let newIndex;
      if (prev.find((col) => col.id === overId)) {
        newIndex = overCol.items.length;
      } else {
        const isBelowOverItem =
          over &&
          active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height;
        newIndex =
          overIndex >= 0
            ? overIndex + (isBelowOverItem ? 1 : 0)
            : overCol.items.length;
      }

      return prev.map((col) => {
        if (col.id === activeContainer) {
          return { ...col, items: col.items.filter((i) => i.id !== activeId) };
        }
        if (col.id === overContainer) {
          const newItems = [...col.items];
          newItems.splice(newIndex, 0, {
            ...item,
            column_date: col.isoDate,
          });
          return { ...col, items: newItems };
        }
        return col;
      });
    });
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveItem(null);

      if (!over || !localColumns) {
        setLocalColumns(null);
        return;
      }

      const activeId = active.id as string;
      const overId = over.id as string;

      let finalColumns = localColumns;

      const activeContainer = localColumns.find((col) =>
        col.items.some((item) => item.id === activeId),
      )?.id;
      const overContainer =
        localColumns.find((col) => col.id === overId)?.id ||
        localColumns.find((col) =>
          col.items.some((item) => item.id === overId),
        )?.id;

      if (activeContainer && overContainer && activeContainer === overContainer) {
        const col = localColumns.find((c) => c.id === activeContainer)!;
        const activeIndex = col.items.findIndex((i) => i.id === activeId);
        const overIndex = col.items.findIndex((i) => i.id === overId);

        if (activeIndex !== overIndex && overIndex >= 0) {
          finalColumns = localColumns.map((c) => {
            if (c.id === activeContainer) {
              return {
                ...c,
                items: arrayMove(c.items, activeIndex, overIndex),
              };
            }
            return c;
          });
        }
      }

      onReorder(finalColumns);
      setLocalColumns(null);
    },
    [localColumns, onReorder],
  );

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: "0.5" } },
    }),
  };

  const DAY_HEADERS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
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
