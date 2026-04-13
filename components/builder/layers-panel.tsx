"use client";

import { useBuilderStore } from "./store";
import { blockRegistry, getBlockIcon } from "./blocks/registry";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Trash2, Shuffle, Layers } from "lucide-react";
import type { BuilderBlock } from "./blocks/types";

function LayerItem({ block }: { block: BuilderBlock }) {
  const { selectedBlockId, selectBlock, removeBlock, shuffleBlock } = useBuilderStore();
  const isSelected = selectedBlockId === block.id;

  const registryEntry = blockRegistry[block.type];
  const Icon = getBlockIcon(registryEntry.iconName);

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-lg border px-2 py-2 transition-colors",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-primary/30"
      )}
      onClick={() => selectBlock(block.id)}
    >
      <div className="flex h-6 w-6 items-center justify-center rounded bg-muted text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-foreground">{registryEntry.name}</p>
        <p className="truncate text-[10px] text-muted-foreground">{registryEntry.description}</p>
      </div>

      <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
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
  );
}

export function LayersPanel() {
  const { blocks, clearCanvas } = useBuilderStore();

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Layers</h2>
          <span className="text-xs text-muted-foreground">{blocks.length}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-destructive"
          onClick={clearCanvas}
          disabled={blocks.length === 0}
        >
          Clear All
        </Button>
      </div>

      <ScrollArea className="flex-1 p-3">
        {blocks.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            <p>No blocks yet</p>
            <p className="mt-1">Add blocks from the left panel</p>
          </div>
        ) : (
          <div className="space-y-2">
            {blocks.map((block) => (
              <LayerItem key={block.id} block={block} />
            ))}
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}
