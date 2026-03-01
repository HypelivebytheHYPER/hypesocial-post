"use client";

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
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useState, useCallback } from "react";
import { CalendarCheck } from "lucide-react";

import { DayColumn } from "@/components/moodboard/DayColumn";
import type { MoodboardItem, DayColumnType } from "@/lib/hooks/useMoodboard";

interface ScheduleViewProps {
  columns: DayColumnType[];
  onDeleteItem: (id: string) => void;
  onAddItem: (columnId: string, type: MoodboardItem["type"]) => void;
  onUpdateItem: (id: string, updates: Partial<MoodboardItem>) => void;
  onFileDrop: (columnId: string, files: File[]) => void;
  onReorder: (columns: DayColumnType[]) => void;
}

export function ScheduleView({
  columns,
  onDeleteItem,
  onAddItem,
  onUpdateItem,
  onFileDrop,
  onReorder,
}: ScheduleViewProps) {
  const [activeItem, setActiveItem] = useState<MoodboardItem | null>(null);
  const [localColumns, setLocalColumns] = useState<DayColumnType[] | null>(
    null,
  );
  const displayColumns = localColumns || columns;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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
      const item = activeCol.items[activeIndex];

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

  // Count items with linked posts
  const scheduledCount = columns.reduce(
    (acc, col) =>
      acc + col.items.filter((item) => item.linked_post_id).length,
    0,
  );
  const totalCount = columns.reduce((acc, col) => acc + col.items.length, 0);

  return (
    <div className="space-y-4">
      {/* Schedule summary */}
      <div className="flex items-center gap-2 px-1">
        <CalendarCheck className="w-4 h-4 text-emerald-500" />
        <span className="text-sm text-slate-600">
          <span className="font-medium">{scheduledCount}</span> of{" "}
          <span className="font-medium">{totalCount}</span> items scheduled
        </span>
      </div>

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
              <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden p-3">
                <p className="text-xs text-slate-700 line-clamp-2">
                  {activeItem.content}
                </p>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
