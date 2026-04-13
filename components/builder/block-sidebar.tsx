"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { blockRegistry, allBlockTypes, getBlockIcon } from "./blocks/registry";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBuilderStore, type BuilderTemplate } from "./store";
import { useTemplates, useDeleteTemplate, useRenameTemplate } from "./queries";
import type { BlockType } from "./blocks/types";
import { cn } from "@/lib/utils";
import { LayoutGrid, List, Search, LayoutTemplate, Trash2, Clock, MoreHorizontal, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function SidebarBlockItem({ type, viewMode, onAdd }: { type: BlockType; viewMode: "grid" | "list"; onAdd: () => void }) {
  const entry = blockRegistry[type];
  const Icon = getBlockIcon(entry.iconName);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sidebar-block-${type}`,
    data: { type, isSidebar: true },
  });

  const isGrid = viewMode === "grid";

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onAdd}
      className={cn(
        "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50"
      )}
    >
      <Card
        className={cn(
          "group overflow-hidden border-border/60 bg-card transition-all hover:border-primary/40 hover:shadow-sm",
          isGrid ? "p-0" : "flex items-center gap-3 p-3"
        )}
      >
        {/* Thumbnail / Icon area */}
        <div
          className={cn(
            "flex shrink-0 items-center justify-center bg-muted/50 text-muted-foreground transition-colors group-hover:text-primary",
            isGrid ? "h-24 w-full border-b border-border/60" : "h-10 w-10 rounded-md bg-primary/10"
          )}
        >
          <Icon className={cn(isGrid ? "h-8 w-8" : "h-4 w-4")} />
        </div>

        {/* Text */}
        <div className="min-w-0 p-2 pt-0">
          <p className="text-sm font-medium text-foreground">{entry.name}</p>
          <p className={cn("text-muted-foreground", isGrid ? "text-xs" : "text-xs")}>{entry.description}</p>
        </div>
      </Card>
    </div>
  );
}

function TemplateCard({
  template,
  onLoad,
  onDelete,
  onRename,
}: {
  template: BuilderTemplate;
  onLoad: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(template.name);

  function commitRename() {
    onRename(editName.trim() || template.name);
    setIsEditing(false);
  }

  return (
    <div className="group rounded-xl border border-border/60 bg-card p-3 transition-all hover:border-primary/40 hover:shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <LayoutTemplate className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <Input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") {
                  setEditName(template.name);
                  setIsEditing(false);
                }
              }}
              className="h-7 text-xs"
            />
          ) : (
            <p className="truncate text-sm font-medium text-foreground">{template.name}</p>
          )}
          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>{template.blocks.length} blocks</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {(() => {
                const ts = typeof template.updatedAt === "string" ? parseInt(template.updatedAt, 10) : template.updatedAt;
                const date = new Date(ts || 0);
                return isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
              })()}
            </span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => setIsEditing(true)}>Rename</DropdownMenuItem>
            <DropdownMenuItem onClick={onLoad}>Load</DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Button variant="secondary" size="sm" className="mt-3 h-7 w-full text-xs" onClick={onLoad}>
        Load Template
      </Button>
    </div>
  );
}

export function BlockSidebar() {
  const { searchQuery, viewMode, setSearchQuery, setViewMode, addBlock, loadTemplate } = useBuilderStore();
  const [activeTab, setActiveTab] = useState<"blocks" | "templates">("blocks");
  const { data: templates = [], isLoading: templatesLoading, isError, error } = useTemplates();
  const deleteMutation = useDeleteTemplate();
  const renameMutation = useRenameTemplate();

  const filteredTypes = allBlockTypes.filter((type) => {
    const entry = blockRegistry[type];
    const q = searchQuery.toLowerCase();
    return entry.name.toLowerCase().includes(q) || entry.description.toLowerCase().includes(q);
  });

  const filteredTemplates = templates.filter((t) => {
    const q = searchQuery.toLowerCase();
    return t.name.toLowerCase().includes(q);
  });

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-card">
      {/* Tabs */}
      <div className="relative flex items-center border-b border-border">
        <button
          onClick={() => setActiveTab("blocks")}
          className={cn(
            "flex-1 px-3 py-2.5 text-xs font-medium transition-colors",
            activeTab === "blocks"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Blocks
          <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{allBlockTypes.length}</span>
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={cn(
            "flex-1 px-3 py-2.5 text-xs font-medium transition-colors",
            activeTab === "templates"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Templates
          <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{templates.length}</span>
        </button>
        <div className="absolute bottom-0 left-0 h-0.5 w-1/2 bg-primary transition-transform" style={{ transform: activeTab === "templates" ? "translateX(100%)" : "translateX(0)" }} />
      </div>

      {/* Header */}
      <div className="space-y-2 border-b border-border p-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={activeTab === "blocks" ? "Search blocks..." : "Search templates..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-7 text-xs"
            />
          </div>
          {activeTab === "blocks" && (
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
        {activeTab === "blocks" ? (
          filteredTypes.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">No blocks found</div>
          ) : (
            <div
              className={cn(
                "gap-2",
                viewMode === "grid" ? "grid grid-cols-2" : "flex flex-col"
              )}
            >
              {filteredTypes.map((type) => (
                <SidebarBlockItem key={type} type={type} viewMode={viewMode} onAdd={() => addBlock(type)} />
              ))}
            </div>
          )
        ) : templatesLoading ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p>Loading templates...</p>
          </div>
        ) : isError ? (
          <div className="py-8 text-center text-xs text-destructive">
            <p>Failed to load templates</p>
            <p className="mt-1 text-muted-foreground">{error?.message || "Please try again later"}</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            <p>No templates yet</p>
            <p className="mt-1">Save your canvas as a template to reuse it</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onLoad={() => loadTemplate(template)}
                onDelete={() => deleteMutation.mutate(template.id)}
                onRename={(name) => renameMutation.mutate({ id: template.id, name })}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}
