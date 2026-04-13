"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { blockRegistry } from "./blocks/registry";
import { useBuilderStore } from "./store";
import { cn } from "@/lib/utils";
import { GripVertical, Trash2, Shuffle, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BuilderBlock } from "./blocks/types";

export function SortableBlock({ block, index }: { block: BuilderBlock; index: number }) {
  const { selectedBlockId, selectBlock, removeBlock, shuffleBlock } = useBuilderStore();
  const isSelected = selectedBlockId === block.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
    data: { block, index, isCanvas: true },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const registryEntry = blockRegistry[block.type];
  const BlockComponent = registryEntry.component;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-xl border-2 bg-background shadow-sm transition-all",
        isSelected
          ? "border-primary ring-1 ring-primary"
          : "border-transparent hover:border-border",
        isDragging && "z-50 opacity-60"
      )}
      onClick={(e) => {
        e.stopPropagation();
        selectBlock(block.id);
      }}
    >
      {/* Block Frame Header */}
      <div
        className={cn(
          "flex items-center justify-between rounded-t-xl border-b px-3 py-2",
          isSelected ? "border-primary/20 bg-primary/5" : "border-border/60 bg-muted/40"
        )}
      >
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="flex h-6 w-6 cursor-grab items-center justify-center rounded text-muted-foreground hover:text-foreground active:cursor-grabbing"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-medium text-foreground">{registryEntry.name}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              shuffleBlock(block.id);
            }}
            title="Shuffle variant"
          >
            <Shuffle className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              selectBlock(block.id);
            }}
            title="Edit properties"
          >
            <Settings2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              removeBlock(block.id);
            }}
            title="Delete block"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Block Content */}
      <div className="pointer-events-none overflow-hidden rounded-b-xl">
        <BlockComponent props={block.props} />
      </div>
    </div>
  );
}
