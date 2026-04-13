"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ImageIcon, X, Upload, Search, Wand2, Loader2, Expand, Paintbrush } from "lucide-react";
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

function getAspectDimensions(srcWidth: number, srcHeight: number, targetRatio: number) {
  const srcRatio = srcWidth / srcHeight;
  let width = srcWidth;
  let height = srcHeight;
  if (targetRatio > srcRatio) {
    width = Math.round(srcHeight * targetRatio);
  } else {
    height = Math.round(srcWidth / targetRatio);
  }
  return { width, height };
}

function MaskEditor({
  imageUrl,
  onDone,
  onCancel,
}: {
  imageUrl: string;
  onDone: (maskBase64: string) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const maxWidth = 600;
      const scale = Math.min(1, maxWidth / img.naturalWidth);
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  function getPos(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function startDraw(e: React.MouseEvent<HTMLCanvasElement>) {
    setIsDrawing(true);
    draw(e);
  }

  function endDraw() {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.beginPath();
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { x, y } = getPos(e);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function clearMask() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = imageUrl;
  }

  function submitMask() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const mctx = maskCanvas.getContext("2d");
    if (!mctx) return;

    const imgData = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
    const maskData = mctx.createImageData(canvas.width, canvas.height);

    for (let i = 0; i < imgData.data.length; i += 4) {
      const r = imgData.data[i] ?? 0;
      const g = imgData.data[i + 1] ?? 0;
      const b = imgData.data[i + 2] ?? 0;
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      const diff = Math.abs(r - gray) + Math.abs(g - gray) + Math.abs(b - gray);
      const isOriginal = diff < 30 && gray > 200;
      maskData.data[i] = isOriginal ? 255 : 0;
      maskData.data[i + 1] = isOriginal ? 255 : 0;
      maskData.data[i + 2] = isOriginal ? 255 : 0;
      maskData.data[i + 3] = 255;
    }

    mctx.putImageData(maskData, 0, 0);
    onDone(maskCanvas.toDataURL("image/png"));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Brush size</span>
          <input
            type="range"
            min={5}
            max={80}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-xs text-muted-foreground">{brushSize}px</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={clearMask}>
            Clear
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={submitMask} disabled={!loaded}>
            Apply Mask
          </Button>
        </div>
      </div>
      <div className="rounded-md border border-border bg-black/5 p-1">
        <canvas
          ref={canvasRef}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          className="cursor-crosshair rounded"
        />
      </div>
      <p className="text-[10px] text-muted-foreground">
        Draw with black over the areas you want to edit. The original image shows underneath as guidance.
      </p>
    </div>
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

  // Expand tab state
  const [expandLoading, setExpandLoading] = useState(false);
  const [expandError, setExpandError] = useState<string | null>(null);
  const [expandTaskId, setExpandTaskId] = useState<string | null>(null);
  const [expandModel, setExpandModel] = useState("flux-pro");

  // Inpaint state
  const [inpaintPrompt, setInpaintPrompt] = useState("");
  const [inpaintLoading, setInpaintLoading] = useState(false);
  const [inpaintError, setInpaintError] = useState<string | null>(null);
  const [inpaintTaskId, setInpaintTaskId] = useState<string | null>(null);
  const [showMaskEditor, setShowMaskEditor] = useState(false);
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);

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

  async function handleExpand(targetRatioName: string) {
    if (!value) return;
    setExpandLoading(true);
    setExpandError(null);
    setExpandTaskId(null);
    try {
      const ratioMap: Record<string, number> = {
        square: 1,
        video: 16 / 9,
        portrait: 3 / 4,
      };
      const targetRatio = ratioMap[targetRatioName] || 16 / 9;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = async () => {
        const { width, height } = getAspectDimensions(img.naturalWidth, img.naturalHeight, targetRatio);
        const res = await fetch("/api/freepik/expand", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: value, width, height, model: expandModel }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Expand failed");
        }
        const tid = data.data?.task_id;
        if (!tid) {
          throw new Error("No task ID received");
        }
        setExpandTaskId(tid);
      };
      img.onerror = () => {
        setExpandError("Failed to load image for expand");
        setExpandLoading(false);
      };
      img.src = value;
    } catch (err) {
      setExpandError(err instanceof Error ? err.message : "Expand failed");
      setExpandLoading(false);
    }
  }

  const pollExpand = useCallback(
    async (tid: string) => {
      try {
        const res = await fetch(`/api/freepik/expand-status?taskId=${tid}&model=${expandModel}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Status check failed");
        }
        const status = data.data?.status;
        if (status === "COMPLETED") {
          const url = data.data?.generated_image?.url || data.data?.image?.url;
          if (url) {
            onChange(url);
          } else {
            setExpandError("No image URL in completed task");
          }
          setExpandLoading(false);
          setExpandTaskId(null);
        } else if (status === "FAILED" || status === "CANCELLED") {
          setExpandError(`Task ${status.toLowerCase()}`);
          setExpandLoading(false);
          setExpandTaskId(null);
        }
      } catch (err) {
        setExpandError(err instanceof Error ? err.message : "Status check failed");
        setExpandLoading(false);
        setExpandTaskId(null);
      }
    },
    [expandModel, onChange]
  );

  useEffect(() => {
    if (!expandTaskId) return;
    const interval = setInterval(() => {
      pollExpand(expandTaskId);
    }, 3000);
    return () => clearInterval(interval);
  }, [expandTaskId, pollExpand]);

  async function handleInpaint() {
    if (!value || !maskDataUrl || !inpaintPrompt.trim()) return;
    setInpaintLoading(true);
    setInpaintError(null);
    setInpaintTaskId(null);
    try {
      const res = await fetch("/api/freepik/inpaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: value, mask: maskDataUrl, prompt: inpaintPrompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Inpainting failed");
      }
      const tid = data.data?.task_id;
      if (!tid) {
        throw new Error("No task ID received");
      }
      setInpaintTaskId(tid);
    } catch (err) {
      setInpaintError(err instanceof Error ? err.message : "Inpainting failed");
      setInpaintLoading(false);
    }
  }

  const pollInpaint = useCallback(
    async (tid: string) => {
      try {
        const res = await fetch(`/api/freepik/inpaint-status?taskId=${tid}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Status check failed");
        }
        const status = data.data?.status;
        if (status === "COMPLETED") {
          const url = data.data?.generated_image?.url || data.data?.image?.url;
          if (url) {
            onChange(url);
            setMaskDataUrl(null);
          } else {
            setInpaintError("No image URL in completed task");
          }
          setInpaintLoading(false);
          setInpaintTaskId(null);
        } else if (status === "FAILED" || status === "CANCELLED") {
          setInpaintError(`Task ${status.toLowerCase()}`);
          setInpaintLoading(false);
          setInpaintTaskId(null);
        }
      } catch (err) {
        setInpaintError(err instanceof Error ? err.message : "Status check failed");
        setInpaintLoading(false);
        setInpaintTaskId(null);
      }
    },
    [onChange]
  );

  useEffect(() => {
    if (!inpaintTaskId) return;
    const interval = setInterval(() => {
      pollInpaint(inpaintTaskId);
    }, 3000);
    return () => clearInterval(interval);
  }, [inpaintTaskId, pollInpaint]);

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
        <TabsList className="grid h-8 w-full grid-cols-6">
          <TabsTrigger value="upload" className="text-[10px]">
            <Upload className="mr-1 h-3 w-3" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="url" className="text-[10px]">
            URL
          </TabsTrigger>
          <TabsTrigger value="search" className="text-[10px]">
            Search
          </TabsTrigger>
          <TabsTrigger value="generate" className="text-[10px]">
            AI
          </TabsTrigger>
          <TabsTrigger value="expand" className="text-[10px]" disabled={!value}>
            <Expand className="mr-1 h-3 w-3" />
            Expand
          </TabsTrigger>
          <TabsTrigger value="inpaint" className="text-[10px]" disabled={!value}>
            <Paintbrush className="mr-1 h-3 w-3" />
            Edit
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

        {/* Expand Tab */}
        <TabsContent value="expand" className="space-y-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <select
                value={expandModel}
                onChange={(e) => setExpandModel(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="flux-pro">Flux Pro</option>
                <option value="seedream-v4-5">SeeDream v4.5</option>
              </select>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {[
                { label: "Square", value: "square" },
                { label: "Video 16:9", value: "video" },
                { label: "Portrait 3:4", value: "portrait" },
              ].map((opt) => (
                <Button
                  key={opt.value}
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px]"
                  onClick={() => handleExpand(opt.value)}
                  disabled={expandLoading}
                >
                  {expandLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Expand className="mr-1 h-3 w-3" />}
                  {opt.label}
                </Button>
              ))}
            </div>
            {expandError && <p className="text-[10px] text-destructive">{expandError}</p>}
            {expandTaskId && <p className="text-[10px] text-muted-foreground">Expanding... please wait</p>}
          </div>
        </TabsContent>

        {/* Inpaint Tab */}
        <TabsContent value="inpaint" className="space-y-2">
          <div className="space-y-2">
            {!showMaskEditor && !maskDataUrl && (
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs"
                onClick={() => setShowMaskEditor(true)}
              >
                <Paintbrush className="mr-1 h-3.5 w-3.5" />
                Draw Mask
              </Button>
            )}

            {showMaskEditor && value && (
              <MaskEditor
                imageUrl={value}
                onDone={(mask) => {
                  setMaskDataUrl(mask);
                  setShowMaskEditor(false);
                }}
                onCancel={() => setShowMaskEditor(false)}
              />
            )}

            {maskDataUrl && !showMaskEditor && (
              <>
                <p className="text-[10px] text-muted-foreground">Mask ready. Describe what to generate in the masked area:</p>
                <Input
                  placeholder="e.g. add a red car here"
                  value={inpaintPrompt}
                  onChange={(e) => setInpaintPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInpaint()}
                  className="h-8 text-xs"
                />
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => {
                      setMaskDataUrl(null);
                      setInpaintPrompt("");
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={handleInpaint}
                    disabled={inpaintLoading || !inpaintPrompt.trim()}
                  >
                    {inpaintLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Wand2 className="mr-1 h-3 w-3" />}
                    Apply Edit
                  </Button>
                </div>
              </>
            )}

            {inpaintError && <p className="text-[10px] text-destructive">{inpaintError}</p>}
            {inpaintTaskId && <p className="text-[10px] text-muted-foreground">Editing... please wait</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
