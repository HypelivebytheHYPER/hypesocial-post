"use client";

import { useHotkey } from "@tanstack/react-hotkeys";
import { BlockSidebar } from "./block-sidebar";
import { PropertiesPanel } from "./properties-sheet";

import { FigmaPanel } from "./figma-panel";
import { PenpotPanel } from "./penpot-panel";
import { CanvaPanel, CanvaIcon } from "./canva-panel";
import { ThemePanel } from "./theme-panel";
import { LayersPanel } from "./layers-panel";
import { useBuilderStore } from "./store";
import { hexToHsl } from "./lib/theme";
import { Button } from "@/components/ui/button";
import { Code, Trash2, Eye, Figma, Palette, Save, ExternalLink } from "lucide-react";
import { useState } from "react";

import { SaveTemplateDialog } from "./save-template-dialog";
import { SocialCanvas } from "./social-canvas";
import { SocialDndProvider } from "./social-dnd-provider";
import { FormatSelector } from "./format-selector";
import { toPng } from "html-to-image";
import { toast } from "sonner";

export function BuilderShell() {
  const { layers, clearCanvas, theme, selectedLayerId, format, setFormat, canvasBackground, removeLayer, selectLayer, moveLayer } = useBuilderStore();

  const [figmaOpen, setFigmaOpen] = useState(false);
  const [penpotOpen, setPenpotOpen] = useState(false);
  const [canvaOpen, setCanvaOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function openPreview() {
    const node = document.getElementById("social-artboard");
    if (!node) {
      toast.error("Canvas not found");
      return;
    }
    const previousSelection = selectedLayerId;
    // Deselect to hide selection rings before capturing
    selectLayer(null);
    // Allow React to render deselected state
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
      // Restore selection after a short delay so the PNG is already set
      setTimeout(() => selectLayer(previousSelection), 100);
    }
  }

  // Hotkeys
  useHotkey("Delete", () => {
    if (selectedLayerId) removeLayer(selectedLayerId);
  }, { enabled: !!selectedLayerId });

  useHotkey("Backspace", () => {
    if (selectedLayerId) removeLayer(selectedLayerId);
  }, { enabled: !!selectedLayerId });

  useHotkey("Escape", () => {
    if (figmaOpen || penpotOpen || canvaOpen || themeOpen) {
      setFigmaOpen(false);
      setPenpotOpen(false);
      setCanvaOpen(false);
      setThemeOpen(false);
    } else if (selectedLayerId) {
      selectLayer(null);
    } else if (previewOpen) {
      setPreviewOpen(false);
      setPreviewUrl(null);
    }
  });

  useHotkey("ArrowUp", () => {
    if (selectedLayerId) {
      const layer = layers.find((l) => l.id === selectedLayerId);
      if (layer) moveLayer(selectedLayerId, layer.x, layer.y - 0.5);
    }
  }, { enabled: !!selectedLayerId });

  useHotkey("ArrowDown", () => {
    if (selectedLayerId) {
      const layer = layers.find((l) => l.id === selectedLayerId);
      if (layer) moveLayer(selectedLayerId, layer.x, layer.y + 0.5);
    }
  }, { enabled: !!selectedLayerId });

  useHotkey("ArrowLeft", () => {
    if (selectedLayerId) {
      const layer = layers.find((l) => l.id === selectedLayerId);
      if (layer) moveLayer(selectedLayerId, layer.x - 0.5, layer.y);
    }
  }, { enabled: !!selectedLayerId });

  useHotkey("ArrowRight", () => {
    if (selectedLayerId) {
      const layer = layers.find((l) => l.id === selectedLayerId);
      if (layer) moveLayer(selectedLayerId, layer.x + 0.5, layer.y);
    }
  }, { enabled: !!selectedLayerId });

  useHotkey("Mod+Z", () => {
    useBuilderStore.temporal.getState().undo();
  }, { preventDefault: true });

  useHotkey("Mod+Shift+Z", () => {
    useBuilderStore.temporal.getState().redo();
  }, { preventDefault: true });

  useHotkey("Mod+Y", () => {
    useBuilderStore.temporal.getState().redo();
  }, { preventDefault: true });

  useHotkey("Mod+E", () => {
    if (layers.length > 0) handleExportPng();
  }, { enabled: layers.length > 0 });

  useHotkey("Mod+S", () => {
    if (layers.length > 0) setSaveTemplateOpen(true);
  }, { enabled: layers.length > 0, preventDefault: true });

  useHotkey("Mod+Shift+C", () => {
    if (layers.length > 0) clearCanvas();
  }, { enabled: layers.length > 0 });

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
      link.download = `hype-social-design-${format}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("PNG exported successfully");
    } catch {
      toast.error("Failed to export PNG");
    } finally {
      setTimeout(() => selectLayer(previousSelection), 100);
    }
  }

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
        <div className="flex items-center gap-4">
          <FormatSelector value={format} onChange={setFormat} />

          <div className="h-4 w-px bg-border" />

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
              }
            }}
            className="gap-1.5"
          >
            <Palette className="h-3.5 w-3.5" />
            Theme
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
          <div className="min-w-0 flex-1 flex flex-col">
            <SocialCanvas />
          </div>
          {figmaOpen ? (
            <FigmaPanel open={figmaOpen} onClose={() => setFigmaOpen(false)} />
          ) : penpotOpen ? (
            <PenpotPanel open={penpotOpen} onClose={() => setPenpotOpen(false)} />
          ) : canvaOpen ? (
            <CanvaPanel open={canvaOpen} onClose={() => setCanvaOpen(false)} />
          ) : themeOpen ? (
            <ThemePanel open={themeOpen} onClose={() => setThemeOpen(false)} />
          ) : selectedLayerId ? (
            <PropertiesPanel />
          ) : (
            <LayersPanel />
          )}
        </div>
      </SocialDndProvider>

      <SaveTemplateDialog open={saveTemplateOpen} onOpenChange={setSaveTemplateOpen} />

      {/* Preview Modal */}
      {previewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => { setPreviewOpen(false); setPreviewUrl(null); }}
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
              <img src={previewUrl} alt="Preview" className="max-h-[80vh] max-w-[80vw] rounded object-contain" />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center text-muted-foreground">
                Generating preview...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
