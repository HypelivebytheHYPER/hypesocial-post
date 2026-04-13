"use client";

import { useBuilderStore } from "./store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RangeInput } from "./range-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Palette, RotateCcw, Type } from "lucide-react";

const fontOptions = [
  { label: "Inter", value: "Inter" },
  { label: "Geist", value: "Geist" },
  { label: "Manrope", value: "Manrope" },
  { label: "DM Sans", value: "DM Sans" },
  { label: "Space Grotesk", value: "Space Grotesk" },
];

const presetColors = [
  "#2563eb",
  "#0891b2",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#16a34a",
  "#dc2626",
  "#171717",
];

export function ThemePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, setTheme, resetTheme } = useBuilderStore();

  if (!open) return null;

  return (
    <div className="flex w-72 shrink-0 flex-col border-l border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-3">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Theme</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetTheme} title="Reset theme">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {/* Primary Color */}
          <div className="space-y-2">
            <Label className="text-xs">Primary Color</Label>
            <div className="grid grid-cols-4 gap-2">
              {presetColors.map((c) => (
                <button
                  key={c}
                  onClick={() => setTheme({ primaryColor: c })}
                  className={`h-8 w-full rounded-md border transition-all ${
                    theme.primaryColor === c ? "ring-2 ring-primary ring-offset-1" : ""
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Set primary color ${c}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="color"
                value={theme.primaryColor}
                onChange={(e) => setTheme({ primaryColor: e.target.value })}
                className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
              />
              <Input
                value={theme.primaryColor}
                onChange={(e) => setTheme({ primaryColor: e.target.value })}
                className="h-8 flex-1 text-xs font-mono uppercase"
              />
            </div>
          </div>

          {/* Border Radius */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Border Radius</Label>
              <span className="text-xs text-muted-foreground">{theme.borderRadius}px</span>
            </div>
            <RangeInput
              value={theme.borderRadius}
              onChange={(v) => setTheme({ borderRadius: v })}
              min={0}
              max={24}
              step={2}
            />
            <div className="flex justify-center">
              <div
                className="h-12 w-12 border-2 border-primary bg-primary/10"
                style={{ borderRadius: theme.borderRadius }}
              />
            </div>
          </div>

          {/* Font Family */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Type className="h-3.5 w-3.5 text-muted-foreground" />
              <Label className="text-xs">Font Family</Label>
            </div>
            <div className="grid grid-cols-1 gap-1">
              {fontOptions.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setTheme({ fontFamily: f.value })}
                  className={`rounded-md px-3 py-2 text-left text-xs transition-colors ${
                    theme.fontFamily === f.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-accent"
                  }`}
                  style={{ fontFamily: f.value }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
