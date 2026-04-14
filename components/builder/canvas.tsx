"use client";

import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useBuilderStore } from "./store";
import { SortableBlock } from "./sortable-block";
import { cn } from "@/lib/utils";
import { LayoutTemplate } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import type { BuilderBlock } from "./blocks/types";

function EmptyState() {
  return (
    <div className="flex h-full min-w-0 flex-col items-center justify-center px-6 text-center text-muted-foreground">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <LayoutTemplate className="h-8 w-8" />
      </div>
      <p className="text-sm font-medium">Your canvas is empty</p>
      <p className="text-xs">Drag blocks from the sidebar to get started</p>
    </div>
  );
}

function CanvasDropZone({
  blocks,
  onDeselect,
}: {
  blocks: BuilderBlock[];
  onDeselect: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: "canvas-drop-zone",
  });

  return (
    <div
      ref={setNodeRef}
      onClick={onDeselect}
      className={cn(
        "flex flex-1 flex-col overflow-y-auto bg-muted/30 p-6",
        isOver && "bg-muted/60"
      )}
    >
      {blocks.length === 0 ? (
        <EmptyState />
      ) : (
        <SortableContext
          items={blocks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="mx-auto w-full max-w-5xl space-y-6">
            {blocks.map((block, index) => (
              <SortableBlock key={block.id} block={block} index={index} />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
}

export function Canvas() {
  const { blocks, selectBlock } = useBuilderStore();
  return <CanvasDropZone blocks={blocks} onDeselect={() => selectBlock(null)} />;
}
