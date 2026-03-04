import {
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
import { useState, useCallback, useEffect } from "react";

import type { MoodboardItem, DayColumnType } from "@/lib/hooks/useMoodboard";

// Module-level constant — no state dependency, never changes.
const DROP_ANIMATION: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.5" } },
  }),
};

/** Build O(1) lookup: itemId → columnId */
function buildItemIndex(cols: DayColumnType[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const col of cols) {
    for (const item of col.items) {
      map.set(item.id, col.id);
    }
  }
  return map;
}

/** Build O(1) lookup: columnId → column */
function buildColumnIndex(cols: DayColumnType[]): Map<string, DayColumnType> {
  const map = new Map<string, DayColumnType>();
  for (const col of cols) {
    map.set(col.id, col);
  }
  return map;
}

/** Resolve which column an overId belongs to (could be column ID or item ID) */
function resolveContainer(
  overId: string,
  colIndex: Map<string, DayColumnType>,
  itemIndex: Map<string, string>,
): string | undefined {
  if (colIndex.has(overId)) return overId;
  return itemIndex.get(overId);
}

export function useMoodboardDnD(
  columns: DayColumnType[],
  onReorder: (cols: DayColumnType[]) => void,
) {
  const [activeItem, setActiveItem] = useState<MoodboardItem | null>(null);
  const [localColumns, setLocalColumns] = useState<DayColumnType[] | null>(
    null,
  );
  const displayColumns = localColumns || columns;

  // Jitter fix: clear localColumns only after server state catches up
  // (columns prop updates from optimistic onMutate in useReorderItems)
  useEffect(() => {
    if (localColumns) setLocalColumns(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
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

      // O(1) lookups instead of repeated find() scans
      const itemIndex = buildItemIndex(prev);
      const colIndex = buildColumnIndex(prev);

      const activeContainerId = itemIndex.get(activeId);
      const overContainerId = resolveContainer(overId, colIndex, itemIndex);

      if (
        !activeContainerId ||
        !overContainerId ||
        activeContainerId === overContainerId
      )
        return prev;

      const activeCol = colIndex.get(activeContainerId)!;
      const overCol = colIndex.get(overContainerId)!;
      const activeIndex = activeCol.items.findIndex((i) => i.id === activeId);
      const overIndex = overCol.items.findIndex((i) => i.id === overId);
      const item = activeCol.items[activeIndex]!;

      let newIndex;
      if (colIndex.has(overId)) {
        // Dropped onto a column directly — append
        newIndex = overCol.items.length;
      } else {
        const isBelowOverItem =
          active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height;
        newIndex =
          overIndex >= 0
            ? overIndex + (isBelowOverItem ? 1 : 0)
            : overCol.items.length;
      }

      return prev.map((col) => {
        if (col.id === activeContainerId) {
          return { ...col, items: col.items.filter((i) => i.id !== activeId) };
        }
        if (col.id === overContainerId) {
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

      // O(1) lookups
      const itemIndex = buildItemIndex(localColumns);
      const colIndex = buildColumnIndex(localColumns);

      const activeContainerId = itemIndex.get(activeId);
      const overContainerId = resolveContainer(overId, colIndex, itemIndex);

      let finalColumns = localColumns;

      // Handle same-column reorder
      if (activeContainerId && overContainerId && activeContainerId === overContainerId) {
        const col = colIndex.get(activeContainerId)!;
        const activeIndex = col.items.findIndex((i) => i.id === activeId);
        const overIndex = col.items.findIndex((i) => i.id === overId);

        if (activeIndex !== overIndex && overIndex >= 0) {
          finalColumns = localColumns.map((c) => {
            if (c.id === activeContainerId) {
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
      // Don't clear localColumns here — the useEffect will clear it
      // when the columns prop updates from the optimistic reorder
    },
    [localColumns, onReorder],
  );

  return {
    sensors,
    displayColumns,
    activeItem,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    dropAnimation: DROP_ANIMATION,
  };
}
