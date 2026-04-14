"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBuilderStore } from "./store";
import { useTemplates, useDeleteTemplate, useRenameTemplate } from "./queries";
import { cn } from "@/lib/utils";
import { LayoutGrid, List, Search, LayoutTemplate, Trash2, Clock, MoreHorizontal, Loader2, Plus, Type, Image as ImageIcon, Square, MousePointer2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { socialTemplates } from "./social-templates";
import type { CanvasFormat, Layer } from "./types";
import { FORMATS } from "./types";

function getFormatBadge(format: CanvasFormat) {
  const spec = FORMATS.find((f) => f.id === format);
  return spec?.name || format;
}

function TemplateCard({
  template,
  onLoad,
}: {
  template: (typeof socialTemplates)[0];
  onLoad: () => void;
}) {
  return (
    <div className="group rounded-xl border border-border/60 bg-card p-3 transition-all hover:border-primary/40 hover:shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <LayoutTemplate className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{template.name}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {getFormatBadge(template.format)} · {template.layers.length} layers
          </p>
        </div>
      </div>
      <Button variant="secondary" size="sm" className="mt-3 h-7 w-full text-xs" onClick={onLoad}>
        Load Template
      </Button>
    </div>
  );
}

function PrimitiveCard({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 rounded-lg border border-border/60 bg-card p-3 transition-all hover:border-primary/40 hover:bg-accent/50"
    >
      <Icon className="h-5 w-5 text-muted-foreground" />
      <span className="text-[10px] font-medium text-foreground">{label}</span>
    </button>
  );
}

export function BlockSidebar() {
  const { searchQuery, viewMode, setSearchQuery, setViewMode, loadTemplate, addLayer, format, setFormat } = useBuilderStore();
  const [activeTab, setActiveTab] = useState<"templates" | "elements" | "saved">("templates");
  const { data: savedTemplates = [], isLoading: templatesLoading, isError, error } = useTemplates();
  const deleteMutation = useDeleteTemplate();
  const renameMutation = useRenameTemplate();

  const filteredTemplates = socialTemplates.filter((t) => {
    const q = searchQuery.toLowerCase();
    return t.name.toLowerCase().includes(q) || t.format.toLowerCase().includes(q);
  });

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-card">
      {/* Tabs */}
      <div className="relative flex items-center border-b border-border">
        {["templates", "elements", "saved"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={cn(
              "flex-1 px-3 py-2.5 text-xs font-medium capitalize transition-colors",
              activeTab === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
        <div
          className="absolute bottom-0 left-0 h-0.5 w-1/3 bg-primary transition-transform"
          style={{
            transform: `translateX(${activeTab === "templates" ? "0%" : activeTab === "elements" ? "100%" : "200%"})`,
          }}
        />
      </div>

      {/* Header */}
      <div className="space-y-2 border-b border-border p-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-7 text-xs"
            />
          </div>
          {activeTab === "templates" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              title="Toggle view"
            >
              {viewMode === "grid" ? <List className="h-3.5 w-3.5" /> : <LayoutGrid className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-3">
        {activeTab === "templates" && (
          <div className={cn("gap-2", viewMode === "grid" ? "grid grid-cols-1" : "flex flex-col")}>
            {filteredTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} onLoad={() => loadTemplate({
                id: template.id,
                name: template.name,
                format: template.format,
                layers: JSON.parse(JSON.stringify(template.layers)),
                theme: {
                  primaryColor: template.theme?.primaryColor || "#2563eb",
                  borderRadius: 8,
                  fontFamily: "Inter",
                  backgroundColor: template.theme?.backgroundColor || "#ffffff",
                },
                createdAt: Date.now(),
                updatedAt: Date.now(),
              })} />
            ))}
          </div>
        )}

        {activeTab === "elements" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase">Primitives</p>
              <div className="grid grid-cols-3 gap-2">
                <PrimitiveCard icon={Type} label="Text" onClick={() => addLayer({
                  type: "text", name: "Text", x: 10, y: 40, width: 80, height: 12,
                  rotation: 0, zIndex: 10, props: { text: "Double click to edit", fontSize: 20, fontWeight: 600, color: "#0f172a", align: "center" }
                })} />
                <PrimitiveCard icon={ImageIcon} label="Image" onClick={() => addLayer({
                  type: "image", name: "Image", x: 25, y: 25, width: 50, height: 50,
                  rotation: 0, zIndex: 10, props: { src: "", objectFit: "cover", rounded: true }
                })} />
                <PrimitiveCard icon={Square} label="Shape" onClick={() => addLayer({
                  type: "shape", name: "Shape", x: 35, y: 40, width: 30, height: 20,
                  rotation: 0, zIndex: 10, props: { shape: "rectangle", color: "#2563eb", text: "", textColor: "#ffffff" }
                })} />
                <PrimitiveCard icon={MousePointer2} label="Button" onClick={() => addLayer({
                  type: "button", name: "Button", x: 30, y: 80, width: 40, height: 8,
                  rotation: 0, zIndex: 10, props: { text: "Click me", rounded: true }
                })} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "saved" && (
          templatesLoading ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p>Loading templates...</p>
            </div>
          ) : isError ? (
            <div className="py-8 text-center text-xs text-destructive">
              <p>Failed to load templates</p>
              <p className="mt-1 text-muted-foreground">{error?.message || "Please try again later"}</p>
            </div>
          ) : savedTemplates.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              <p>No saved templates yet</p>
              <p className="mt-1">Save your design to reuse it</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedTemplates.map((template: any) => (
                <div key={template.id} className="group rounded-xl border border-border/60 bg-card p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <LayoutTemplate className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{template.name}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {template.layers?.length || 0} layers
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem onClick={() => renameMutation.mutate({ id: template.id, name: template.name })}>Rename</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => loadTemplate(template)}>Load</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteMutation.mutate(template.id)} className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Button variant="secondary" size="sm" className="mt-3 h-7 w-full text-xs" onClick={() => loadTemplate(template)}>
                    Load Template
                  </Button>
                </div>
              ))}
            </div>
          )
        )}
      </ScrollArea>
    </aside>
  );
}
