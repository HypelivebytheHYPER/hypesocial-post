"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Download,
  Image as ImageIcon,
  Trash2,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Sparkles,
  Wand2,
  Move,
  ZoomIn,
  ZoomOut,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ==================== Social Size Presets ====================

export interface SocialPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  icon: React.ElementType;
  color: string;
}

const PRESETS: SocialPreset[] = [
  { id: "ig-post", name: "Instagram Post", width: 1080, height: 1080, icon: Instagram, color: "#E4405F" },
  { id: "ig-story", name: "Instagram Story", width: 1080, height: 1920, icon: Instagram, color: "#E4405F" },
  { id: "fb-post", name: "Facebook Post", width: 1200, height: 630, icon: Facebook, color: "#1877F2" },
  { id: "linkedin", name: "LinkedIn Post", width: 1200, height: 627, icon: Linkedin, color: "#0A66C2" },
  { id: "twitter", name: "X / Twitter", width: 1600, height: 900, icon: Twitter, color: "#000000" },
  { id: "pinterest", name: "Pinterest Pin", width: 1000, height: 1500, icon: ImageIcon, color: "#BD081C" },
];

// ==================== Utils ====================

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith("data:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ==================== Canvas Preview ====================

interface PreviewState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

function CanvasPreview({
  src,
  preset,
  previewState,
  containerWidth,
  className,
}: {
  src: string;
  preset: SocialPreset;
  previewState: PreviewState;
  containerWidth: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerHeight = containerWidth * (preset.height / preset.width);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cancelled = false;
    loadImage(src).then((img) => {
      if (cancelled) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = containerWidth * dpr;
      canvas.height = containerHeight * dpr;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, containerWidth, containerHeight);

      // Fill background
      ctx.fillStyle = "#0f0f0f";
      ctx.fillRect(0, 0, containerWidth, containerHeight);

      const imgAspect = img.width / img.height;
      const containerAspect = containerWidth / containerHeight;

      // Base scale to cover the container
      const baseScale = imgAspect > containerAspect ? containerHeight / img.height : containerWidth / img.width;
      const finalScale = baseScale * previewState.scale;

      const drawW = img.width * finalScale;
      const drawH = img.height * finalScale;
      const drawX = (containerWidth - drawW) / 2 + previewState.offsetX;
      const drawY = (containerHeight - drawH) / 2 + previewState.offsetY;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    });

    return () => {
      cancelled = true;
    };
  }, [src, preset, previewState, containerWidth, containerHeight]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("block h-full w-full rounded-lg", className)}
      style={{ width: containerWidth, height: containerHeight }}
    />
  );
}

// ==================== Page ====================

export default function StudioPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [generated, setGenerated] = useState<Record<string, string>>({});
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [previewStates, setPreviewStates] = useState<Record<string, PreviewState>>(() => {
    const initial: Record<string, PreviewState> = {};
    PRESETS.forEach((p) => {
      initial[p.id] = { scale: 1, offsetX: 0, offsetY: 0 };
    });
    return initial;
  });

  // Drag and drop handlers
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }
  function handleDragLeave() {
    setIsDragging(false);
  }
  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const url = await readFileAsDataURL(file);
      setImageSrc(url);
      resetPreviews();
    }
  }
  async function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const url = await readFileAsDataURL(file);
      setImageSrc(url);
      resetPreviews();
    }
  }

  function resetPreviews() {
    const initial: Record<string, PreviewState> = {};
    PRESETS.forEach((p) => {
      initial[p.id] = { scale: 1, offsetX: 0, offsetY: 0 };
    });
    setPreviewStates(initial);
    setGenerated({});
    setSelectedPresetId(null);
  }

  function updatePreviewState(id: string, updater: (prev: PreviewState) => PreviewState) {
    setPreviewStates((prev) => ({ ...prev, [id]: updater(prev[id] || { scale: 1, offsetX: 0, offsetY: 0 }) }));
  }

  async function handleExportPreset(preset: SocialPreset) {
    if (!imageSrc) return;
    setProcessing(true);
    try {
      const img = await loadImage(imageSrc);
      const canvas = document.createElement("canvas");
      canvas.width = preset.width;
      canvas.height = preset.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const state = previewStates[preset.id] || { scale: 1, offsetX: 0, offsetY: 0 };
      const containerWidth = 300; // same reference width used in preview
      const containerHeight = containerWidth * (preset.height / preset.width);

      const imgAspect = img.width / img.height;
      const containerAspect = containerWidth / containerHeight;
      const baseScale = imgAspect > containerAspect ? containerHeight / img.height : containerWidth / img.width;
      const finalScale = baseScale * state.scale;

      const drawW = img.width * finalScale * (preset.width / containerWidth);
      const drawH = img.height * finalScale * (preset.height / containerHeight);
      const drawX = (preset.width - drawW) / 2 + state.offsetX * (preset.width / containerWidth);
      const drawY = (preset.height - drawH) / 2 + state.offsetY * (preset.height / containerHeight);

      ctx.fillStyle = "#0f0f0f";
      ctx.fillRect(0, 0, preset.width, preset.height);
      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Export failed"))), "image/png");
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${preset.id}.png`;
      a.click();
      URL.revokeObjectURL(url);

      setGenerated((prev) => ({ ...prev, [preset.id]: url }));
      toast.success(`Exported ${preset.name}`);
    } catch {
      toast.error("Export failed");
    } finally {
      setProcessing(false);
    }
  }

  async function handleExportAll() {
    if (!imageSrc) return;
    for (const preset of PRESETS) {
      await handleExportPreset(preset);
    }
    toast.success("All sizes exported!");
  }

  const selectedPreset = useMemo(() => PRESETS.find((p) => p.id === selectedPresetId) || null, [selectedPresetId]);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-6xl px-4 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Social Resize Studio</h1>
            <p className="text-sm text-slate-500">Drop an image. Preview every social size. Export instantly.</p>
          </div>
          {imageSrc && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setImageSrc(null); resetPreviews(); }}>
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </Button>
              <Button size="sm" className="gap-1.5" onClick={handleExportAll} disabled={processing}>
                {processing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                Export All
              </Button>
            </div>
          )}
        </div>

        {/* Drop Zone */}
        <AnimatePresence mode="wait">
          {!imageSrc ? (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "relative flex h-80 flex-col items-center justify-center rounded-3xl border-2 border-dashed transition-all",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
              )}
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-900">
                <Upload className="h-7 w-7 text-slate-500" />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Drag and drop an image here</p>
              <p className="mt-1 text-xs text-slate-400">or click to browse</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </motion.div>
          ) : (
            <motion.div
              key="studio"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              {/* Preset Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const isDone = !!generated[preset.id];
                  return (
                    <motion.button
                      layout
                      key={preset.id}
                      onClick={() => setSelectedPresetId(preset.id)}
                      className={cn(
                        "group relative overflow-hidden rounded-2xl border bg-white p-3 text-left transition-all dark:bg-slate-950",
                        selectedPresetId === preset.id
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-slate-200 hover:border-primary/40 dark:border-slate-800"
                      )}
                    >
                      {/* Header */}
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="flex h-7 w-7 items-center justify-center rounded-md text-white"
                            style={{ backgroundColor: preset.color }}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{preset.name}</p>
                            <p className="text-[10px] text-slate-400">
                              {preset.width} × {preset.height}
                            </p>
                          </div>
                        </div>
                        {isDone && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      </div>

                      {/* Preview */}
                      <div
                        className="relative mx-auto overflow-hidden rounded-lg border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                        style={{ width: 300, height: 300 * (preset.height / preset.width) }}
                      >
                        <CanvasPreview
                          src={imageSrc}
                          preset={preset}
                          previewState={previewStates[preset.id] || { scale: 1, offsetX: 0, offsetY: 0 }}
                          containerWidth={300}
                        />
                        <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-black/5" />
                      </div>

                      {/* Hover action */}
                      <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center gap-2 bg-gradient-to-t from-white/90 to-transparent p-3 transition-transform group-hover:translate-y-0 dark:from-slate-950/90">
                        <Button size="sm" className="h-8 gap-1 text-xs" onClick={(e) => { e.stopPropagation(); handleExportPreset(preset); }} disabled={processing}>
                          <Download className="h-3 w-3" /> Export
                        </Button>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedPreset && imageSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPresetId(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-md text-white"
                    style={{ backgroundColor: selectedPreset.color }}
                  >
                    <selectedPreset.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{selectedPreset.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {selectedPreset.width} × {selectedPreset.height}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => setSelectedPresetId(null)}>
                    Close
                  </Button>
                  <Button size="sm" className="h-8 gap-1 text-xs" onClick={() => handleExportPreset(selectedPreset)} disabled={processing}>
                    {processing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                    Export
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-4 p-5 sm:flex-row">
                {/* Preview */}
                <div className="flex flex-1 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div
                    className="overflow-hidden rounded-lg border border-slate-200 shadow-sm dark:border-slate-700"
                    style={{ width: 320, height: 320 * (selectedPreset.height / selectedPreset.width) }}
                  >
                    <CanvasPreview
                      src={imageSrc}
                      preset={selectedPreset}
                      previewState={previewStates[selectedPreset.id] || { scale: 1, offsetX: 0, offsetY: 0 }}
                      containerWidth={320}
                    />
                  </div>
                </div>

                {/* Controls */}
                <div className="w-full shrink-0 space-y-4 sm:w-56">
                  <div className="space-y-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Position</p>
                    <div className="grid grid-cols-3 gap-1">
                      {[-20, 0, 20].map((x) =>
                        [-20, 0, 20].map((y) => (
                          <button
                            key={`${x}-${y}`}
                            onClick={() =>
                              updatePreviewState(selectedPreset.id, (prev) => ({ ...prev, offsetX: x * 2, offsetY: y * 2 }))
                            }
                            className={cn(
                              "flex h-8 items-center justify-center rounded-md border text-[10px] transition-colors",
                              previewStates[selectedPreset.id]?.offsetX === x * 2 && previewStates[selectedPreset.id]?.offsetY === y * 2
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-slate-200 hover:bg-slate-50 dark:border-slate-700"
                            )}
                          >
                            <Move className="h-3 w-3" />
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Zoom</p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updatePreviewState(selectedPreset.id, (prev) => ({ ...prev, scale: Math.max(0.5, prev.scale - 0.1) }))}
                      >
                        <ZoomOut className="h-3.5 w-3.5" />
                      </Button>
                      <div className="flex-1 text-center text-xs text-slate-500">
                        {Math.round((previewStates[selectedPreset.id]?.scale || 1) * 100)}%
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updatePreviewState(selectedPreset.id, (prev) => ({ ...prev, scale: Math.min(3, prev.scale + 0.1) }))}
                      >
                        <ZoomIn className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={3}
                      step={0.05}
                      value={previewStates[selectedPreset.id]?.scale || 1}
                      onChange={(e) =>
                        updatePreviewState(selectedPreset.id, (prev) => ({ ...prev, scale: parseFloat(e.target.value) }))
                      }
                      className="w-full accent-primary"
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => updatePreviewState(selectedPreset.id, () => ({ scale: 1, offsetX: 0, offsetY: 0 }))}
                  >
                    <RefreshCw className="mr-1 h-3 w-3" /> Reset
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
