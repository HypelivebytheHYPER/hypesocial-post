"use client";

import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { useBuilderStore } from "./store";
import { useRef } from "react";

export function SocialDndProvider({ children }: { children: React.ReactNode }) {
  const { moveLayer } = useBuilderStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, delta } = event;
    const layerId = active.id as string;
    const artboard = document.getElementById("social-artboard");
    if (!artboard) return;

    const rect = artboard.getBoundingClientRect();
    const data = active.data.current;
    const layer = data?.layer;
    if (!layer) return;

    // Convert pixel delta to percentage
    const deltaXPercent = (delta.x / rect.width) * 100;
    const deltaYPercent = (delta.y / rect.height) * 100;

    const newX = Math.max(0, Math.min(100 - layer.width, layer.x + deltaXPercent));
    const newY = Math.max(0, Math.min(100 - layer.height, layer.y + deltaYPercent));

    moveLayer(layerId, newX, newY);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div ref={containerRef} className="contents">
        {children}
      </div>
    </DndContext>
  );
}
