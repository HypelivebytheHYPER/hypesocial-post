"use client";

import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useBuilderStore } from "./store";
import { blockRegistry } from "./blocks/registry";
import type { BlockType, BuilderBlock } from "./blocks/types";
import { useState } from "react";

export function BuilderDndProvider({ children }: { children: React.ReactNode }) {
  const { blocks, addBlock, moveBlock } = useBuilderStore();
  const [activeDragBlock, setActiveDragBlock] = useState<BuilderBlock | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current;
    if (data && data.isCanvas && data.block) {
      setActiveDragBlock(data.block as BuilderBlock);
    } else if (data && data.isSidebar && data.type) {
      const type = data.type as BlockType;
      const registryEntry = blockRegistry[type];
      setActiveDragBlock({
        id: `ghost-${type}`,
        type,
        props: { ...registryEntry.defaultProps },
      });
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragBlock(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Reordering within canvas
    if (activeData && activeData.isCanvas) {
      const activeIndex = activeData.index as number;
      let overIndex: number;

      if (overData && overData.isCanvas) {
        overIndex = overData.index as number;
      } else if (over.id === "canvas-drop-zone") {
        overIndex = blocks.length - 1;
      } else {
        return;
      }

      if (activeIndex !== overIndex) {
        moveBlock(activeIndex, overIndex);
      }
      return;
    }

    // Dropping from sidebar
    if (activeData && activeData.isSidebar) {
      const type = activeData.type as BlockType;

      if (over.id === "canvas-drop-zone") {
        addBlock(type);
        return;
      }

      if (overData && overData.isCanvas) {
        const overIndex = overData.index as number;
        addBlock(type, overIndex);
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay
        dropAnimation={{
          duration: 150,
          easing: "cubic-bezier(0.18, 0.67, 0.32, 0.95)",
        }}
      >
        {activeDragBlock ? (
          <div className="rounded-lg border-2 border-primary bg-background/90 p-1 shadow-xl">
            {(() => {
              const Entry = blockRegistry[activeDragBlock.type];
              const Component = Entry.component;
              return <Component props={activeDragBlock.props} />;
            })()}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
