"use client";

import { useBuilderStore } from "./store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImagePicker } from "./image-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

export function PropertiesPanel() {
  const { selectedLayerId, layers, updateLayer, selectLayer, removeLayer } = useBuilderStore();
  const layer = layers.find((l) => l.id === selectedLayerId);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);

  if (!layer) return null;

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-3">
        <h2 className="text-sm font-semibold capitalize">{layer.name}</h2>
        <Button variant="ghost" size="sm" onClick={() => selectLayer(null)}>
          Done
        </Button>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4">
          {/* Common: Position & Size */}
          {layer.type !== "background" && (
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Position & Size</Label>
              <div className="grid grid-cols-2 gap-2">
                <NumberField
                  label="X %"
                  value={layer.x}
                  onChange={(v) => updateLayer(layer.id, { x: v })}
                />
                <NumberField
                  label="Y %"
                  value={layer.y}
                  onChange={(v) => updateLayer(layer.id, { y: v })}
                />
                <NumberField
                  label="W %"
                  value={layer.width}
                  onChange={(v) => updateLayer(layer.id, { width: v })}
                />
                <NumberField
                  label="H %"
                  value={layer.height}
                  onChange={(v) => updateLayer(layer.id, { height: v })}
                />
              </div>
            </div>
          )}

          {/* Type-specific fields */}
          {layer.type === "text" && (
            <TextProperties layer={layer} onChange={(props) => updateLayer(layer.id, { props })} />
          )}

          {layer.type === "image" && (
            <ImageProperties
              layer={layer}
              onChange={(props) => updateLayer(layer.id, { props })}
              onOpenPicker={() => setImagePickerOpen(true)}
            />
          )}

          {layer.type === "shape" && (
            <ShapeProperties layer={layer} onChange={(props) => updateLayer(layer.id, { props })} />
          )}

          {layer.type === "button" && (
            <ButtonProperties layer={layer} onChange={(props) => updateLayer(layer.id, { props })} />
          )}

          {layer.type === "background" && (
            <BackgroundProperties layer={layer} onChange={(props) => updateLayer(layer.id, { props })} />
          )}

          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => removeLayer(layer.id)}
          >
            Delete Layer
          </Button>
        </div>
      </ScrollArea>

      <Dialog open={imagePickerOpen} onOpenChange={setImagePickerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Choose Image</DialogTitle>
          </DialogHeader>
          <ImagePicker
            value={(layer.props.src as string) || ""}
            onChange={(src) => {
              updateLayer(layer.id, { props: { ...layer.props, src } });
              setImagePickerOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </aside>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px]">{label}</Label>
      <Input
        type="number"
        step={1}
        value={Math.round(value)}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="h-7 text-xs"
      />
    </div>
  );
}

function TextProperties({ layer, onChange }: { layer: any; onChange: (p: any) => void }) {
  const p = layer.props;
  return (
    <div className="space-y-3">
      <Label className="text-xs text-muted-foreground">Text</Label>
      <Input
        value={(p.text as string) || ""}
        onChange={(e) => onChange({ ...p, text: e.target.value })}
        className="h-8 text-xs"
      />
      <div className="grid grid-cols-2 gap-2">
        <NumberField label="Size" value={p.fontSize || 16} onChange={(v) => onChange({ ...p, fontSize: v })} />
        <NumberField label="Weight" value={p.fontWeight || 400} onChange={(v) => onChange({ ...p, fontWeight: v })} />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={p.color || "#000000"}
          onChange={(e) => onChange({ ...p, color: e.target.value })}
          className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
        />
        <Input
          value={p.color || "#000000"}
          onChange={(e) => onChange({ ...p, color: e.target.value })}
          className="h-8 flex-1 text-xs font-mono uppercase"
        />
      </div>
      <select
        value={(p.align as string) || "left"}
        onChange={(e) => onChange({ ...p, align: e.target.value })}
        className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
      >
        <option value="left">Left</option>
        <option value="center">Center</option>
        <option value="right">Right</option>
      </select>
    </div>
  );
}

function ImageProperties({
  layer,
  onChange,
  onOpenPicker,
}: {
  layer: any;
  onChange: (p: any) => void;
  onOpenPicker: () => void;
}) {
  const p = layer.props;
  return (
    <div className="space-y-3">
      <Label className="text-xs text-muted-foreground">Image</Label>
      <Button variant="secondary" size="sm" className="w-full" onClick={onOpenPicker}>
        Replace Image
      </Button>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="rounded"
          checked={!!p.rounded}
          onChange={(e) => onChange({ ...p, rounded: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="rounded" className="text-xs">
          Rounded corners
        </Label>
      </div>
    </div>
  );
}

function ShapeProperties({ layer, onChange }: { layer: any; onChange: (p: any) => void }) {
  const p = layer.props;
  return (
    <div className="space-y-3">
      <Label className="text-xs text-muted-foreground">Shape</Label>
      <Input
        value={(p.text as string) || ""}
        onChange={(e) => onChange({ ...p, text: e.target.value })}
        placeholder="Label"
        className="h-8 text-xs"
      />
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={p.color || "#cccccc"}
          onChange={(e) => onChange({ ...p, color: e.target.value })}
          className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
        />
        <Input value={p.color || "#cccccc"} onChange={(e) => onChange({ ...p, color: e.target.value })} className="h-8 flex-1 text-xs font-mono uppercase" />
      </div>
      <select
        value={(p.shape as string) || "rectangle"}
        onChange={(e) => onChange({ ...p, shape: e.target.value })}
        className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
      >
        <option value="rectangle">Rectangle</option>
        <option value="pill">Pill</option>
        <option value="circle">Circle</option>
      </select>
    </div>
  );
}

function ButtonProperties({ layer, onChange }: { layer: any; onChange: (p: any) => void }) {
  const p = layer.props;
  return (
    <div className="space-y-3">
      <Label className="text-xs text-muted-foreground">Button</Label>
      <Input
        value={(p.text as string) || ""}
        onChange={(e) => onChange({ ...p, text: e.target.value })}
        className="h-8 text-xs"
      />
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="btn-rounded"
          checked={p.rounded !== false}
          onChange={(e) => onChange({ ...p, rounded: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="btn-rounded" className="text-xs">
          Rounded
        </Label>
      </div>
    </div>
  );
}

function BackgroundProperties({ layer, onChange }: { layer: any; onChange: (p: any) => void }) {
  const p = layer.props;
  return (
    <div className="space-y-3">
      <Label className="text-xs text-muted-foreground">Background Color</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={p.color || "#ffffff"}
          onChange={(e) => onChange({ ...p, color: e.target.value })}
          className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
        />
        <Input value={p.color || "#ffffff"} onChange={(e) => onChange({ ...p, color: e.target.value })} className="h-8 flex-1 text-xs font-mono uppercase" />
      </div>
    </div>
  );
}
