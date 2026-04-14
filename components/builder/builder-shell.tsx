"use client";

import { useHotkey } from "@tanstack/react-hotkeys";
import { BlockSidebar } from "./block-sidebar";
import { PropertiesPanel } from "./properties-sheet";
import { FigmaPanel } from "./figma-panel";
import { PenpotPanel } from "./penpot-panel";
import { CanvaPanel, CanvaIcon } from "./canva-panel";
import { ThemePanel } from "./theme-panel";
import { BrandKitPanel } from "./brand-kit-panel";
import { LayersPanel } from "./layers-panel";
import { useBuilderStore } from "./store";
import { hexToHsl } from "./lib/theme";
import { Button } from "@/components/ui/button";
import {
  Code,
  Trash2,
  Eye,
  Figma,
  Palette,
  Save,
  ExternalLink,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  ShieldAlert,
  ShieldCheck,
  FilePlus,
  Copy,
  FileX,
  Type,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useStore } from "zustand";

import { SaveTemplateDialog } from "./save-template-dialog";
import { SocialCanvas } from "./social-canvas";
import { SocialDndProvider } from "./social-dnd-provider";
import { FormatSelector } from "./format-selector";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FORMATS } from "./types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function BuilderShell() {
  const {
    layers,
    pages,
    activePageIndex,
    clearCanvas,
    theme,
    selectedLayerId,
    format,
    setFormat,
    canvasBackground,
    removeLayer,
    selectLayer,
    moveLayer,
    addPage,
    removePage,
    duplicatePage,
    setActivePage,
    showSafeZones,
    setShowSafeZones,
    zoomIn,
    zoomOut,
    resetViewport,
    viewport,
    resizeToFormat,
  } = useBuilderStore();
  const temporal = useStore(useBuilderStore.temporal);

  const [figmaOpen, setFigmaOpen] = useState(false);
  const [penpotOpen, setPenpotOpen] = useState(false);
  const [canvaOpen, setCanvaOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [brandKitOpen, setBrandKitOpen] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [magicResizeOpen, setMagicResizeOpen] = useState(false);

  async function openPreview() {
    const node = document.getElementById("social-artboard");
    if (!node) {
      toast.error("Canvas not found");
      return;
    }
    const previousSelection = selectedLayerId;
    selectLayer(null);
    await new Promise((resolve) => setTimeout(resolve, 300));
    try {
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: canvasBackground.color || theme.backgroundColor,
      });
      setPreviewUrl(dataUrl);
      setPreviewOpen(true);
    } catch {
      toast.error("Failed to generate preview");
    } finally {
      setTimeout(() => selectLayer(previousSelection), 100);
    }
  }

  async function handleExportPng() {
    const node = document.getElementById("social-artboard");
    if (!node) {
      toast.error("Canvas not found");
      return;
    }
    const previousSelection = selectedLayerId;
    selectLayer(null);
    await new Promise((resolve) => setTimeout(resolve, 300));
    try {
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: canvasBackground.color || theme.backgroundColor,
      });
      const link = document.createElement("a");
      link.download = `hype-social-design-${format}-page-${activePageIndex + 1}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("PNG exported successfully");
    } catch {
      toast.error("Failed to export PNG");
    } finally {
      setTimeout(() => selectLayer(previousSelection), 100);
    }
  }

  // Hotkeys
  useHotkey(
    "Delete",
    () => {
      if (selectedLayerId) removeLayer(selectedLayerId);
    },
    { enabled: !!selectedLayerId }
  );

  useHotkey(
    "Backspace",
    () => {
      if (selectedLayerId) removeLayer(selectedLayerId);
    },
    { enabled: !!selectedLayerId }
  );

  useHotkey("Escape", () => {
    if (figmaOpen || penpotOpen || canvaOpen || themeOpen || brandKitOpen) {
      setFigmaOpen(false);
      setPenpotOpen(false);
      setCanvaOpen(false);
      setThemeOpen(false);
      setBrandKitOpen(false);
    } else if (selectedLayerId) {
      selectLayer(null);
    } else if (previewOpen) {
      setPreviewOpen(false);
      setPreviewUrl(null);
    }
  });

  useHotkey(
    "ArrowUp",
    () => {
      if (selectedLayerId) {
        const layer = layers.find((l) => l.id === selectedLayerId);
        if (layer) moveLayer(selectedLayerId, layer.x, layer.y - 0.5);
      }
    },
    { enabled: !!selectedLayerId }
  );

  useHotkey(
    "ArrowDown",
    () => {
      if (selectedLayerId) {
        const layer = layers.find((l) => l.id === selectedLayerId);
        if (layer) moveLayer(selectedLayerId, layer.x, layer.y + 0.5);
      }
    },
    { enabled: !!selectedLayerId }
  );

  useHotkey(
    "ArrowLeft",
    () => {
      if (selectedLayerId) {
        const layer = layers.find((l) => l.id === selectedLayerId);
        if (layer) moveLayer(selectedLayerId, layer.x - 0.5, layer.y);
      }
    },
    { enabled: !!selectedLayerId }
  );

  useHotkey(
    "ArrowRight",
    () => {
      if (selectedLayerId) {
        const layer = layers.find((l) => l.id === selectedLayerId);
        if (layer) moveLayer(selectedLayerId, layer.x + 0.5, layer.y);
      }
    },
    { enabled: !!selectedLayerId }
  );

  useHotkey("Mod+Z", () => {
    useBuilderStore.temporal.getState().undo();
  }, { preventDefault: true });

  useHotkey("Mod+Shift+Z", () => {
    useBuilderStore.temporal.getState().redo();
  }, { preventDefault: true });

  useHotkey("Mod+Y", () => {
    useBuilderStore.temporal.getState().redo();
  }, { preventDefault: true });

  useHotkey(
    "Mod+E",
    () => {
      if (layers.length > 0) handleExportPng();
    },
    { enabled: layers.length > 0 }
  );

  useHotkey(
    "Mod+S",
    () => {
      if (layers.length > 0) setSaveTemplateOpen(true);
    },
    { enabled: layers.length > 0, preventDefault: true }
  );

  useHotkey(
    "Mod+Shift+C",
    () => {
      if (layers.length > 0) clearCanvas();
    },
    { enabled: layers.length > 0 }
  );

  // Zoom hotkeys — parity with shadcn/designer + Figma/Canva
  // Mod+= fires on the physical "=" key with Cmd/Ctrl held (the user types
  // Cmd+Shift+= on US keyboards, which is how every editor spells "zoom in").
  useHotkey("Mod+=", () => zoomIn(), { preventDefault: true });
  useHotkey("Mod+-", () => zoomOut(), { preventDefault: true });
  useHotkey("Mod+0", () => resetViewport(), { preventDefault: true });

  const rightPanel = figmaOpen ? (
    <FigmaPanel open={figmaOpen} onClose={() => setFigmaOpen(false)} />
  ) : penpotOpen ? (
    <PenpotPanel open={penpotOpen} onClose={() => setPenpotOpen(false)} />
  ) : canvaOpen ? (
    <CanvaPanel open={canvaOpen} onClose={() => setCanvaOpen(false)} />
  ) : themeOpen ? (
    <ThemePanel open={themeOpen} onClose={() => setThemeOpen(false)} />
  ) : brandKitOpen ? (
    <BrandKitPanel open={brandKitOpen} onClose={() => setBrandKitOpen(false)} />
  ) : selectedLayerId ? (
    <PropertiesPanel />
  ) : (
    <LayersPanel />
  );

  const formatSpec = FORMATS.find((f) => f.id === format)!;
  const hasSafeZones = !!formatSpec.safeZones;

  return (
    <div
      className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden"
      style={{
        ["--primary" as string]: (() => {
          const { h, s, l } = hexToHsl(theme.primaryColor);
          return `${h} ${s}% ${l}%`;
        })(),
        ["--radius" as string]: `${theme.borderRadius / 16}rem`,
        fontFamily: theme.fontFamily,
      }}
    >
      {/* Top Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
        <div className="flex items-center gap-3">
          <FormatSelector
            value={format}
            onChange={(f) => {
              if (f !== format) {
                resizeToFormat(f);
                setFormat(f);
              }
            }}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Magic Resize
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {FORMATS.filter((f) => f.id !== format).map((f) => (
                <DropdownMenuItem
                  key={f.id}
                  onClick={() => {
                    resizeToFormat(f.id);
                    setFormat(f.id);
                  }}
                >
                  <span
                    className="mr-2 inline-block rounded border border-border bg-muted"
                    style={{
                      width: f.ratio >= 1 ? 12 : 8,
                      height: f.ratio >= 1 ? 8 : 12,
                    }}
                  />
                  {f.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-4 w-px bg-border" />

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => temporal.undo()}
              disabled={temporal.pastStates.length === 0}
              title="Undo (Cmd+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => temporal.redo()}
              disabled={temporal.futureStates.length === 0}
              title="Redo (Cmd+Shift+Z)"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-4 w-px bg-border" />

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>
              {pages.length} page{pages.length !== 1 ? "s" : ""}
            </span>
            <span className="text-border">·</span>
            <span>
              {layers.length} layer{layers.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={figmaOpen ? "secondary" : "outline"}
            size="sm"
            onClick={() => {
              setFigmaOpen(!figmaOpen);
              if (!figmaOpen) {
                setThemeOpen(false);
                setPenpotOpen(false);
                setCanvaOpen(false);
                setBrandKitOpen(false);
              }
            }}
            className="gap-1.5"
          >
            <Figma className="h-3.5 w-3.5" />
            Figma
          </Button>
          <Button
            variant={penpotOpen ? "secondary" : "outline"}
            size="sm"
            onClick={() => {
              setPenpotOpen(!penpotOpen);
              if (!penpotOpen) {
                setFigmaOpen(false);
                setThemeOpen(false);
                setCanvaOpen(false);
                setBrandKitOpen(false);
              }
            }}
            className="gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Penpot
          </Button>
          <Button
            variant={canvaOpen ? "secondary" : "outline"}
            size="sm"
            onClick={() => {
              setCanvaOpen(!canvaOpen);
              if (!canvaOpen) {
                setFigmaOpen(false);
                setPenpotOpen(false);
                setThemeOpen(false);
                setBrandKitOpen(false);
              }
            }}
            className="gap-2"
          >
            <CanvaIcon className="h-4 w-4 text-[#00C4CC]" />
            Canva
          </Button>
          <Button
            variant={themeOpen ? "secondary" : "outline"}
            size="sm"
            onClick={() => {
              setThemeOpen(!themeOpen);
              if (!themeOpen) {
                setFigmaOpen(false);
                setPenpotOpen(false);
                setCanvaOpen(false);
                setBrandKitOpen(false);
              }
            }}
            className="gap-1.5"
          >
            <Palette className="h-3.5 w-3.5" />
            Theme
          </Button>
          <Button
            variant={brandKitOpen ? "secondary" : "outline"}
            size="sm"
            onClick={() => {
              setBrandKitOpen(!brandKitOpen);
              if (!brandKitOpen) {
                setFigmaOpen(false);
                setPenpotOpen(false);
                setCanvaOpen(false);
                setThemeOpen(false);
              }
            }}
            className="gap-1.5"
          >
            <Type className="h-3.5 w-3.5" />
            Brand Kit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSaveTemplateOpen(true)}
            disabled={layers.length === 0}
            className="gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            Save Template
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearCanvas}
            disabled={layers.length === 0}
            className="gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={layers.length === 0}
            onClick={openPreview}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Button>
          <Button
            variant="default"
            size="sm"
            className="gap-1.5"
            onClick={handleExportPng}
            disabled={layers.length === 0}
          >
            <Code className="h-3.5 w-3.5" />
            Export PNG
          </Button>
        </div>
      </div>

      {/* Main Workspace */}
      <SocialDndProvider>
        <div className="flex flex-1 overflow-hidden">
          <BlockSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Page strip */}
            <div className="flex items-center gap-2 border-b border-border bg-card px-3 py-2">
              <div className="flex items-center gap-1 overflow-x-auto">
                {pages.map((page, idx) => (
                  <button
                    key={page.id}
                    onClick={() => setActivePage(idx)}
                    className={cn(
                      "flex h-7 items-center gap-2 rounded-md border px-2 text-xs transition-colors",
                      activePageIndex === idx
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/30"
                    )}
                  >
                    <span className="truncate max-w-[6rem]">{page.name}</span>
                    {pages.length > 1 && (
                      <span
                        className="text-[10px] text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePage(idx);
                        }}
                        title="Remove page"
                      >
                        ×
                      </span>
                    )}
                  </button>
                ))}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => addPage()}
                  title="Add page"
                >
                  <FilePlus className="h-4 w-4" />
                </Button>
              </div>

              <div className="ml-auto flex items-center gap-2">
                {hasSafeZones && (
                  <Button
                    variant={showSafeZones ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={() => setShowSafeZones(!showSafeZones)}
                    title="Toggle safe zones"
                  >
                    {showSafeZones ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                    Safe Zones
                  </Button>
                )}

                <div className="flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={zoomOut} title="Zoom out (Cmd+-)">
                    <ZoomOut className="h-3.5 w-3.5" />
                  </Button>
                  <span className="min-w-[3ch] px-1 text-center text-[10px] text-muted-foreground">
                    {Math.round(viewport.zoom * 100)}%
                  </span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={zoomIn} title="Zoom in (Cmd+=)">
                    <ZoomIn className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={resetViewport} title="Reset view (Cmd+0)">
                    <Maximize className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                      <Copy className="h-3.5 w-3.5" />
                      Page
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => duplicatePage(activePageIndex)}>
                      <Copy className="mr-2 h-3.5 w-3.5" />
                      Duplicate page
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => removePage(activePageIndex)}
                      disabled={pages.length <= 1}
                      className="text-destructive focus:text-destructive"
                    >
                      <FileX className="mr-2 h-3.5 w-3.5" />
                      Delete page
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <SocialCanvas />
          </div>
          {rightPanel}
        </div>
      </SocialDndProvider>

      <SaveTemplateDialog open={saveTemplateOpen} onOpenChange={setSaveTemplateOpen} />

      {/* Preview Modal */}
      {previewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => {
            setPreviewOpen(false);
            setPreviewUrl(null);
          }}
        >
          <div className="relative max-h-full max-w-full overflow-auto rounded-lg bg-background p-2 shadow-2xl">
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 z-10"
              onClick={() => setPreviewOpen(false)}
            >
              Close
            </Button>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-[80vh] max-w-[80vw] rounded object-contain"
              />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center text-muted-foreground">
                Generating preview...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Magic Resize Confirmation */}
      <Dialog open={magicResizeOpen} onOpenChange={setMagicResizeOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Magic Resize</DialogTitle>
            <DialogDescription>
              Switching formats will keep your layers and attempt to fit them into the new canvas dimensions. Some manual adjustments may be needed.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setMagicResizeOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                // noop here; actual resize triggered via dropdown items
                setMagicResizeOpen(false);
              }}
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
