"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBuilderStore } from "./store";
import { useSaveTemplate } from "./queries";

export function SaveTemplateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (val: boolean) => void;
}) {
  const { layers, theme, format, canvasBackground } = useBuilderStore();
  const [name, setName] = useState("");
  const saveMutation = useSaveTemplate();

  async function handleSave() {
    await saveMutation.mutateAsync({
      name: name.trim() || "Untitled Template",
      format,
      layers: JSON.parse(JSON.stringify(layers)),
      theme: { ...theme },
      canvasBackground: { ...canvasBackground },
    });
    setName("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>Save your current design, format, and theme for reuse later.</DialogDescription>
        </DialogHeader>
        <div className="mt-2 space-y-4">
          <Input
            placeholder="Template name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={layers.length === 0 || saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save Template"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
