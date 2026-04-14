"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FORMATS, type CanvasFormat } from "./types";

interface FormatSelectorProps {
  value: CanvasFormat;
  onChange: (value: CanvasFormat) => void;
}

export function FormatSelector({ value, onChange }: FormatSelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as CanvasFormat)}>
      <SelectTrigger className="h-8 w-44 text-xs">
        <SelectValue placeholder="Select format" />
      </SelectTrigger>
      <SelectContent>
        {FORMATS.map((f) => (
          <SelectItem key={f.id} value={f.id} className="text-xs">
            <span className="flex items-center gap-2">
              <span
                className="inline-block rounded border border-border bg-muted"
                style={{
                  width: f.ratio >= 1 ? 16 : 10,
                  height: f.ratio >= 1 ? 10 : 16,
                }}
              />
              {f.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
