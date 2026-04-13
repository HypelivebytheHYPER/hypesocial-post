"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageIcon, X, Upload } from "lucide-react";

interface ImagePickerProps {
  value: string;
  onChange: (val: string) => void;
}

export function ImagePicker({ value, onChange }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      onChange(String(reader.result));
      setIsLoading(false);
    };
    reader.onerror = () => setIsLoading(false);
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative overflow-hidden rounded-md border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Preview" className="h-32 w-full object-cover" />
          <Button
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={() => onChange("")}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/40 text-muted-foreground hover:bg-muted/60"
        >
          <ImageIcon className="h-8 w-8" />
          <span className="text-xs">Click to upload or paste URL below</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input
          placeholder="https://..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 flex-1 text-xs"
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => inputRef.current?.click()}
          disabled={isLoading}
        >
          <Upload className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
