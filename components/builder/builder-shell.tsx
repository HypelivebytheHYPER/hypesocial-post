"use client";

import { BlockSidebar } from "./block-sidebar";
import { Canvas } from "./canvas";
import { LayersPanel } from "./layers-panel";
import { PropertiesPanel } from "./properties-sheet";
import { ExportDialog } from "./export-dialog";
import { FigmaPanel } from "./figma-panel";
import { PenpotPanel } from "./penpot-panel";
import { ThemePanel } from "./theme-panel";
import { useBuilderStore } from "./store";
import { hexToHsl } from "./lib/theme";
import { Button } from "@/components/ui/button";
import { Code, Trash2, Eye, Plus, Figma, Palette, Save, ExternalLink } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { SaveTemplateDialog } from "./save-template-dialog";
import { BuilderDndProvider } from "./dnd-provider";

export function BuilderShell() {
  const { blocks, clearCanvas, theme, selectedBlockId } = useBuilderStore();
  const [exportOpen, setExportOpen] = useState(false);
  const [figmaOpen, setFigmaOpen] = useState(false);
  const [penpotOpen, setPenpotOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [activePage, setActivePage] = useState("Page 1");

  const pages = ["Page 1"];

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
          {/* Page Tabs */}
          <div className="flex items-center gap-1">
            {pages.map((page) => (
              <button
                key={page}
                onClick={() => setActivePage(page)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  activePage === page
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {page}
              </button>
            ))}
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Add page">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="h-4 w-px bg-border" />

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{blocks.length} block{blocks.length !== 1 ? "s" : ""}</span>
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
              }
            }}
            className="gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Penpot
          </Button>
          <Button
            variant={themeOpen ? "secondary" : "outline"}
            size="sm"
            onClick={() => {
              setThemeOpen(!themeOpen);
              if (!themeOpen) {
                setFigmaOpen(false);
                setPenpotOpen(false);
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
            disabled={blocks.length === 0}
            className="gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            Save Template
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearCanvas}
            disabled={blocks.length === 0}
            className="gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={blocks.length === 0}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Button>
          <Button
            variant="default"
            size="sm"
            className="gap-1.5"
            onClick={() => setExportOpen(true)}
            disabled={blocks.length === 0}
          >
            <Code className="h-3.5 w-3.5" />
            Export Code
          </Button>
        </div>
      </div>

      {/* Main Workspace */}
      <BuilderDndProvider>
        <div className="flex flex-1 overflow-hidden">
          <BlockSidebar />
          <div className="min-w-0 flex-1">
            <Canvas />
          </div>
          {figmaOpen ? (
            <FigmaPanel open={figmaOpen} onClose={() => setFigmaOpen(false)} />
          ) : penpotOpen ? (
            <PenpotPanel open={penpotOpen} onClose={() => setPenpotOpen(false)} />
          ) : themeOpen ? (
            <ThemePanel open={themeOpen} onClose={() => setThemeOpen(false)} />
          ) : selectedBlockId ? (
            <PropertiesPanel />
          ) : (
            <LayersPanel />
          )}
        </div>
      </BuilderDndProvider>

      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
      <SaveTemplateDialog open={saveTemplateOpen} onOpenChange={setSaveTemplateOpen} />
    </div>
  );
}
