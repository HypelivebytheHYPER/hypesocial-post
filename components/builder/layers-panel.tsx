"use client";

import { useBuilderStore } from "./store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Trash2, Layers, Eye, Type, Image as ImageIcon, Square, MousePointer2 } from "lucide-react";
import type { Layer } from "./types";

function getLayerIcon(type: Layer["type"]) {
  switch (type) {
    case "text":
      return Type;
    case "image":
      return ImageIcon;
    case "shape":
      return Square;
    case "button":
      return MousePointer2;
    default:
      return Eye;
  }
}

function LayerItem({ layer }: { layer: Layer }) {
  const { selectedLayerId, selectLayer, removeLayer, bringToFront, sendToBack } = useBuilderStore();
  const isSelected = selectedLayerId === layer.id;
  const Icon = getLayerIcon(layer.type);

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-lg border px-2 py-2 transition-colors",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-primary/30"
      )}
      onClick={() => selectLayer(layer.id)}
    >
      <div className="flex h-6 w-6 items-center justify-center rounded bg-muted text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-foreground">{layer.name}</p>
        <p className="truncate text-[10px] text-muted-foreground capitalize">{layer.type}</p>
      </div>

      <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            bringToFront(layer.id);
          }}
          title="Bring to front"
        >
          Front
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            sendToBack(layer.id);
          }}
          title="Send to back"
        >
          Back
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            removeLayer(layer.id);
          }}
          title="Delete layer"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function LayersPanel() {
  const { layers, clearCanvas } = useBuilderStore();

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Layers</h2>
          <span className="text-xs text-muted-foreground">{layers.length}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-destructive"
          onClick={clearCanvas}
          disabled={layers.length === 0}
        >
          Clear All
        </Button>
      </div>

      <ScrollArea className="flex-1 p-3">
        {layers.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            <p>No layers yet</p>
            <p className="mt-1">Pick a template to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {layers
              .slice()
              .sort((a, b) => b.zIndex - a.zIndex)
              .map((layer) => (
                <LayerItem key={layer.id} layer={layer} />
              ))}
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}
