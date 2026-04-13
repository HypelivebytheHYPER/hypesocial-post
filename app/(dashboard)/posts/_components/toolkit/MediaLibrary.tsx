"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  X, 
  Image as ImageIcon, 
  Video, 
  Filter, 
  Grid3X3, 
  List,
  Upload,
  Trash2,
  Check,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MediaAsset } from "./types";

interface MediaLibraryProps {
  assets: MediaAsset[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (assets: MediaAsset[]) => void;
  onUpload?: (files: FileList) => void;
  onDelete?: (ids: string[]) => void;
  maxSelection?: number;
  selectionMode?: "single" | "multiple";
}

export function MediaLibrary({
  assets,
  isOpen,
  onClose,
  onSelect,
  onUpload,
  onDelete,
  maxSelection = 10,
  selectionMode = "multiple",
}: MediaLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = typeFilter === "all" || asset.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [assets, searchQuery, typeFilter]);

  const toggleSelection = (id: string) => {
    if (selectionMode === "single") {
      setSelectedIds(new Set([id]));
      return;
    }

    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < maxSelection) {
        next.add(id);
      }
      return next;
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      onUpload?.(e.dataTransfer.files);
    }
  };

  const handleConfirm = () => {
    const selected = assets.filter(a => selectedIds.has(a.id));
    onSelect(selected);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-5xl h-[80vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Media Library</h2>
              <p className="text-sm text-slate-500">{assets.length} assets</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => document.getElementById("media-upload")?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
              <input 
                id="media-upload" 
                type="file" 
                multiple 
                accept="image/*,video/*" 
                className="hidden"
                onChange={(e) => e.target.files && onUpload?.(e.target.files)}
              />
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-4 px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search media..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="image">Images</TabsTrigger>
                <TabsTrigger value="video">Videos</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* View Mode */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={cn("p-2 rounded-md", viewMode === "grid" && "bg-white dark:bg-slate-700 shadow-sm")}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn("p-2 rounded-md", viewMode === "list" && "bg-white dark:bg-slate-700 shadow-sm")}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "flex-1 relative",
              isDragging && "bg-blue-50/50 dark:bg-blue-500/10"
            )}
          >
            {/* Drop Indicator */}
            {isDragging && (
              <div className="absolute inset-4 border-2 border-dashed border-blue-400 rounded-xl flex items-center justify-center z-10 bg-blue-50/50 dark:bg-blue-500/10">
                <p className="text-blue-600 font-medium">Drop files to upload</p>
              </div>
            )}

            <ScrollArea className="h-full">
              {viewMode === "grid" ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 p-6">
                  {filteredAssets.map((asset) => (
                    <motion.div
                      key={asset.id}
                      layout
                      onClick={() => toggleSelection(asset.id)}
                      className={cn(
                        "relative aspect-square rounded-xl overflow-hidden cursor-pointer group",
                        "border-2 transition-all",
                        selectedIds.has(asset.id) 
                          ? "border-blue-500 ring-2 ring-blue-500/20" 
                          : "border-transparent hover:border-slate-300"
                      )}
                    >
                      {asset.type === "image" ? (
                        <img src={asset.url} alt={asset.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <Video className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                      
                      {/* Selection Overlay */}
                      {selectedIds.has(asset.id) && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      )}

                      {/* Type Badge */}
                      <div className="absolute top-2 left-2">
                        {asset.type === "video" && (
                          <Badge variant="secondary" className="text-[10px]">
                            {Math.round(asset.duration || 0)}s
                          </Badge>
                        )}
                      </div>

                      {/* Hover Actions */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDelete?.([asset.id]); }}
                          className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredAssets.map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() => toggleSelection(asset.id)}
                      className={cn(
                        "flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer",
                        selectedIds.has(asset.id) && "bg-blue-50/50 dark:bg-blue-500/5"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center",
                        selectedIds.has(asset.id) 
                          ? "bg-blue-500 border-blue-500" 
                          : "border-slate-300"
                      )}>
                        {selectedIds.has(asset.id) && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      
                      <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                        {asset.type === "image" ? (
                          <img src={asset.url} alt={asset.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="w-6 h-6 text-slate-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white truncate">{asset.name}</p>
                        <p className="text-sm text-slate-500">
                          {(asset.size / 1024 / 1024).toFixed(2)} MB • {asset.usedInPosts} posts
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {asset.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-500">
              {selectedIds.size} selected {maxSelection > 1 && `(max ${maxSelection})`}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleConfirm} disabled={selectedIds.size === 0}>
                Select {selectedIds.size > 0 && `(${selectedIds.size})`}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
