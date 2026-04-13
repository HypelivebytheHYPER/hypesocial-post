"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Search, 
  X, 
  Copy, 
  Edit2, 
  Trash2, 
  MoreHorizontal,
  Megaphone,
  Heart,
  GraduationCap,
  Bell,
  FolderOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PostTemplate, TemplateCategory } from "./types";

const categoryIcons: Record<TemplateCategory, typeof Sparkles> = {
  promotional: Megaphone,
  engagement: Heart,
  educational: GraduationCap,
  announcement: Bell,
  custom: FolderOpen,
};

const categoryColors: Record<TemplateCategory, string> = {
  promotional: "text-blue-500 bg-blue-50 dark:bg-blue-500/10",
  engagement: "text-pink-500 bg-pink-50 dark:bg-pink-500/10",
  educational: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10",
  announcement: "text-amber-500 bg-amber-50 dark:bg-amber-500/10",
  custom: "text-slate-500 bg-slate-50 dark:bg-slate-500/10",
};

interface TemplateSelectorProps {
  templates: PostTemplate[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: PostTemplate) => void;
  onCreate?: () => void;
  onEdit?: (template: PostTemplate) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

export function TemplateSelector({
  templates,
  isOpen,
  onClose,
  onSelect,
  onCreate,
  onEdit,
  onDelete,
  onDuplicate,
}: TemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | "all">("all");

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.category]) acc[template.category] = [];
    acc[template.category].push(template);
    return acc;
  }, {} as Record<TemplateCategory, PostTemplate[]>);

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
          className="w-full max-w-4xl h-[80vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Templates</h2>
                <p className="text-sm text-slate-500">{templates.length} templates available</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onCreate}>
                Create Template
              </Button>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-4 px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Tabs value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as typeof categoryFilter)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="promotional">Promo</TabsTrigger>
                <TabsTrigger value="engagement">Engage</TabsTrigger>
                <TabsTrigger value="educational">Edu</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Templates Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredTemplates.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <Sparkles className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No templates found</h3>
                <p className="text-slate-500 mb-4">Try adjusting your search or create a new template</p>
                <Button onClick={onCreate}>Create Template</Button>
              </div>
            ) : (
              <div className="space-y-8">
                {(Object.keys(groupedTemplates) as TemplateCategory[]).map(category => {
                  const Icon = categoryIcons[category];
                  const colorClass = categoryColors[category];
                  const categoryTemplates = groupedTemplates[category];

                  if (!categoryTemplates?.length) return null;

                  return (
                    <div key={category}>
                      <div className="flex items-center gap-2 mb-4">
                        <div className={cn("p-1.5 rounded-lg", colorClass)}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-white capitalize">
                          {category}
                        </h3>
                        <Badge variant="secondary" className="text-[10px]">
                          {categoryTemplates.length}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categoryTemplates.map(template => (
                          <motion.div
                            key={template.id}
                            layout
                            className="group relative bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                            onClick={() => onSelect(template)}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", colorClass)}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <button className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-opacity">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(template); }}>
                                    <Edit2 className="w-4 h-4 mr-2" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate?.(template.id); }}>
                                    <Copy className="w-4 h-4 mr-2" /> Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={(e) => { e.stopPropagation(); onDelete?.(template.id); }}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <h4 className="font-medium text-slate-900 dark:text-white mb-1 line-clamp-1">
                              {template.name}
                            </h4>
                            <p className="text-sm text-slate-500 mb-3 line-clamp-2">
                              {template.description}
                            </p>

                            <div className="flex items-center justify-between">
                              <div className="flex gap-1">
                                {template.tags.slice(0, 2).map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                                ))}
                              </div>
                              <span className="text-xs text-slate-400">
                                {template.usageCount} uses
                              </span>
                            </div>

                            {/* Preview on hover */}
                            <div className="absolute inset-x-0 -bottom-2 translate-y-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl p-3 border border-slate-200 dark:border-slate-700">
                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                                  {template.content}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
