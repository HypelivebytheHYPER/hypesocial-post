"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImageIcon, X, Upload, Search, Wand2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImagePickerProps {
  value: string;
  onChange: (val: string) => void;
}

interface FreepikItem {
  id: string | number;
  title?: string;
  preview?: { url?: string };
  image?: { source?: { url?: string } };
  thumbnail_url?: string;
}

function getThumbnailUrl(item: FreepikItem): string | undefined {
  return (
    item.preview?.url ||
    item.image?.source?.url ||
    item.thumbnail_url ||
    undefined
  );
}

export function ImagePicker({ value, onChange }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Search tab state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"resources" | "icons">("resources");
  const [searchResults, setSearchResults] = useState<FreepikItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Generate tab state
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      onChange(String(reader.result));
      setIsUploading(false);
    };
    reader.onerror = () => setIsUploading(false);
    reader.readAsDataURL(file);
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `/api/freepik/search?query=${encodeURIComponent(searchQuery)}&type=${searchType}&limit=12&page=1`
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Search failed");
      }
      const items = data.data || [];
      setSearchResults(items);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Search failed");
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleGenerate() {
    if (!generatePrompt.trim()) return;
    setGenerateLoading(true);
    setGenerateError(null);
    setGeneratedUrl(null);
    setTaskId(null);
    try {
      const res = await fetch("/api/freepik/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: generatePrompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }
      const tid = data.data?.task_id;
      if (!tid) {
        throw new Error("No task ID received");
      }
      setTaskId(tid);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Generation failed");
      setGenerateLoading(false);
    }
  }

  const pollTask = useCallback(
    async (tid: string) => {
      try {
        const res = await fetch(`/api/freepik/generate-status?taskId=${tid}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Status check failed");
        }
        const status = data.data?.status;
        if (status === "COMPLETED") {
          const url = data.data?.generated_image?.url || data.data?.image?.url;
          if (url) {
            setGeneratedUrl(url);
            onChange(url);
          } else {
            setGenerateError("No image URL in completed task");
          }
          setGenerateLoading(false);
          setTaskId(null);
        } else if (status === "FAILED" || status === "CANCELLED") {
          setGenerateError(`Task ${status.toLowerCase()}`);
          setGenerateLoading(false);
          setTaskId(null);
        }
        // else: still in progress, polling continues
      } catch (err) {
        setGenerateError(err instanceof Error ? err.message : "Status check failed");
        setGenerateLoading(false);
        setTaskId(null);
      }
    },
    [onChange]
  );

  useEffect(() => {
    if (!taskId) return;
    const interval = setInterval(() => {
      pollTask(taskId);
    }, 3000);
    return () => clearInterval(interval);
  }, [taskId, pollTask]);

  const preview = value ? (
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
  ) : null;

  return (
    <div className="space-y-2">
      {preview}

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid h-8 w-full grid-cols-4">
          <TabsTrigger value="upload" className="text-[10px]">
            <Upload className="mr-1 h-3 w-3" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="url" className="text-[10px]">
            <ImageIcon className="mr-1 h-3 w-3" />
            URL
          </TabsTrigger>
          <TabsTrigger value="search" className="text-[10px]">
            <Search className="mr-1 h-3 w-3" />
            Search
          </TabsTrigger>
          <TabsTrigger value="generate" className="text-[10px]">
            <Wand2 className="mr-1 h-3 w-3" />
            AI
          </TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-2">
          <div
            onClick={() => inputRef.current?.click()}
            className="flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-muted/40 text-muted-foreground hover:bg-muted/60"
          >
            <ImageIcon className="h-6 w-6" />
            <span className="text-xs">Click to upload image</span>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </TabsContent>

        {/* URL Tab */}
        <TabsContent value="url" className="space-y-2">
          <Input
            placeholder="https://..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 text-xs"
          />
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-2">
          <div className="flex gap-1">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as "resources" | "icons")}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="resources">Photos/Vectors</option>
              <option value="icons">Icons</option>
            </select>
            <Input
              placeholder="Search Freepik..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="h-8 flex-1 text-xs"
            />
            <Button
              size="icon"
              className="h-8 w-8"
              onClick={handleSearch}
              disabled={searchLoading || !searchQuery.trim()}
            >
              {searchLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            </Button>
          </div>

          {searchError && <p className="text-[10px] text-destructive">{searchError}</p>}

          <ScrollArea className="h-40 rounded-md border border-border bg-muted/20">
            {searchResults.length === 0 && !searchLoading && !searchError && (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                No results yet
              </div>
            )}
            <div className="grid grid-cols-3 gap-1 p-1">
              {searchResults.map((item) => {
                const thumb = getThumbnailUrl(item);
                return (
                  <button
                    key={item.id}
                    onClick={() => thumb && onChange(thumb)}
                    className={cn(
                      "group relative aspect-square overflow-hidden rounded-md border border-border bg-muted",
                      !thumb && "pointer-events-none opacity-50"
                    )}
                    title={item.title || "Freepik image"}
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={item.title || ""}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                        No preview
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-2">
          <div className="space-y-1">
            <Input
              placeholder="Describe the image you want to generate..."
              value={generatePrompt}
              onChange={(e) => setGeneratePrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              className="h-8 text-xs"
            />
            <Button
              size="sm"
              className="w-full text-xs"
              onClick={handleGenerate}
              disabled={generateLoading || !generatePrompt.trim()}
            >
              {generateLoading ? (
                <>
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-1 h-3.5 w-3.5" />
                  Generate with Mystic
                </>
              )}
            </Button>
          </div>

          {generateError && <p className="text-[10px] text-destructive">{generateError}</p>}

          {generatedUrl && (
            <div className="relative overflow-hidden rounded-md border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={generatedUrl} alt="Generated" className="h-24 w-full object-cover" />
              <Button
                variant="secondary"
                size="sm"
                className="absolute bottom-1 right-1 h-6 text-[10px]"
                onClick={() => generatedUrl && onChange(generatedUrl)}
              >
                Use
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
