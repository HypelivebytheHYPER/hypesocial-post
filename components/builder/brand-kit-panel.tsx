"use client";

import { useBuilderStore } from "./store";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Type, X, Plus } from "lucide-react";

const presetColors = [
  "#2563eb",
  "#0891b2",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#16a34a",
  "#dc2626",
  "#171717",
  "#f59e0b",
  "#0f172a",
];

const fontOptions = [
  { label: "Inter", value: "Inter" },
  { label: "Geist", value: "Geist" },
  { label: "Manrope", value: "Manrope" },
  { label: "DM Sans", value: "DM Sans" },
  { label: "Space Grotesk", value: "Space Grotesk" },
  { label: "Poppins", value: "Poppins" },
  { label: "Playfair Display", value: "Playfair Display" },
  { label: "Roboto", value: "Roboto" },
];

export function BrandKitPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    brandKit,
    addBrandColor,
    removeBrandColor,
    addBrandFont,
    removeBrandFont,
    theme,
    setTheme,
  } = useBuilderStore();

  if (!open) return null;

  return (
    <div className="flex w-72 shrink-0 flex-col border-l border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-3">
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Brand Kit</h2>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onClose}>
          Close
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {/* Saved Colors */}
          <div className="space-y-2">
            <Label className="text-xs">Saved Colors</Label>
            <div className="grid grid-cols-5 gap-2">
              {brandKit.colors.map((c) => (
                <div key={c} className="group relative">
                  <button
                    onClick={() => setTheme({ primaryColor: c })}
                    className={`h-8 w-full rounded-md border transition-all ${
                      theme.primaryColor === c ? "ring-2 ring-primary ring-offset-1" : ""
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Use color ${c}`}
                    title={c}
                  />
                  <button
                    onClick={() => removeBrandColor(c)}
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[8px] text-white opacity-0 transition-opacity group-hover:opacity-100"
                    title="Remove color"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="color"
                defaultValue="#2563eb"
                onChange={(e) => addBrandColor(e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
              />
              <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => addBrandColor("#2563eb")}>
                <Plus className="h-3.5 w-3.5" />
                Add Current
              </Button>
            </div>
            <div className="grid grid-cols-5 gap-2 pt-1">
              {presetColors
                .filter((c) => !brandKit.colors.includes(c))
                .map((c) => (
                  <button
                    key={c}
                    onClick={() => addBrandColor(c)}
                    className="flex h-8 w-full items-center justify-center rounded-md border border-dashed border-muted-foreground/40 text-[10px] text-muted-foreground hover:border-primary hover:text-foreground"
                    style={{ backgroundColor: `${c}20` }}
                    title={`Add ${c}`}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                ))}
            </div>
          </div>

          {/* Saved Fonts */}
          <div className="space-y-2">
            <Label className="text-xs">Saved Fonts</Label>
            <div className="space-y-1">
              {brandKit.fonts.map((f) => (
                <div
                  key={f}
                  className={`flex items-center justify-between rounded-md border px-2 py-1.5 text-xs ${
                    theme.fontFamily === f
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <button onClick={() => setTheme({ fontFamily: f })} className="flex-1 text-left" style={{ fontFamily: f }}>
                    {f}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-muted-foreground hover:text-destructive"
                    onClick={() => removeBrandFont(f)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-1 pt-1">
              {fontOptions
                .filter((f) => !brandKit.fonts.includes(f.value))
                .map((f) => (
                  <button
                    key={f.value}
                    onClick={() => addBrandFont(f.value)}
                    className="flex items-center justify-between rounded-md border border-dashed border-muted-foreground/40 px-2 py-1.5 text-left text-xs text-muted-foreground hover:border-primary hover:text-foreground"
                    style={{ fontFamily: f.value }}
                  >
                    <span>{f.label}</span>
                    <Plus className="h-3 w-3" />
                  </button>
                ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
