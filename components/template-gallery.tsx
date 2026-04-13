"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  MessageCircle, 
  ShoppingBag, 
  Lightbulb, 
  Users, 
  Calendar,
  Check,
  Copy,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { POST_TEMPLATES, TEMPLATE_CATEGORIES, type PostTemplate } from "@/lib/templates/social-templates";

interface TemplateGalleryProps {
  onSelectTemplate: (template: PostTemplate) => void;
  selectedPlatform?: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  engagement: <MessageCircle className="w-4 h-4" />,
  promotional: <ShoppingBag className="w-4 h-4" />,
  educational: <Lightbulb className="w-4 h-4" />,
  "behind-the-scenes": <Users className="w-4 h-4" />,
  seasonal: <Calendar className="w-4 h-4" />,
};

export function TemplateGallery({ onSelectTemplate, selectedPlatform }: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [previewTemplate, setPreviewTemplate] = useState<PostTemplate | null>(null);
  const [copied, setCopied] = useState(false);

  // Filter templates
  const filteredTemplates = POST_TEMPLATES.filter((template) => {
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    const matchesPlatform = !selectedPlatform || template.platforms.includes(selectedPlatform.toLowerCase());
    return matchesCategory && matchesPlatform;
  });

  const handleCopyCaption = (caption: string) => {
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Templates</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ready-to-use content ideas
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory("all")}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
            selectedCategory === "all"
              ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
          )}
        >
          All
        </button>
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5",
              selectedCategory === cat.id
                ? "text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
            )}
            style={{
              backgroundColor: selectedCategory === cat.id ? cat.color : undefined,
            }}
          >
            {categoryIcons[cat.id]}
            {cat.name}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AnimatePresence mode="popLayout">
          {filteredTemplates.map((template) => (
            <motion.button
              key={template.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => setPreviewTemplate(template)}
              className="text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-shadow duration-150 group"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{template.icon}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {template.name}
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {template.platforms.slice(0, 3).map((platform) => (
                      <span
                        key={platform}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 capitalize"
                      >
                        {platform}
                      </span>
                    ))}
                    {template.mediaType && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {template.mediaType}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <p>No templates found for this platform.</p>
          <button
            onClick={() => setSelectedCategory("all")}
            className="text-blue-600 hover:underline mt-2"
          >
            Show all templates
          </button>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{previewTemplate?.icon}</span>
              {previewTemplate?.name}
            </DialogTitle>
          </DialogHeader>

          {previewTemplate && (
            <div className="space-y-4">
              {/* Caption Preview */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-500 uppercase">
                    Caption
                  </span>
                  <button
                    onClick={() => handleCopyCaption(previewTemplate.caption)}
                    className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                  {previewTemplate.caption}
                </p>
              </div>

              {/* Hashtags */}
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase">
                  Suggested Hashtags
                </span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {previewTemplate.hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="text-sm px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tips */}
              {previewTemplate.tips && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase">
                    Pro Tips
                  </span>
                  <ul className="mt-2 space-y-1">
                    {previewTemplate.tips.map((tip, i) => (
                      <li key={i} className="text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
                        <span className="text-amber-500">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Best Time */}
              {previewTemplate.bestTime && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar className="w-4 h-4" />
                  Best time to post: <span className="font-medium capitalize">{previewTemplate.bestTime}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => {
                    onSelectTemplate(previewTemplate);
                    setPreviewTemplate(null);
                  }}
                  className="flex-1"
                >
                  Use Template
                </Button>
                <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
