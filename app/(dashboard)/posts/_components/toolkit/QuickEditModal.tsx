"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Save, 
  Calendar, 
  Image as ImageIcon,
  AlignLeft,
  Hash,
  Globe,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SocialPost } from "@/types/post-for-me-types";

interface QuickEditModalProps {
  post: SocialPost | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<SocialPost>) => void;
  platforms: { id: string; name: string; icon: string }[];
}

export function QuickEditModal({
  post,
  isOpen,
  onClose,
  onSave,
  platforms,
}: QuickEditModalProps) {
  const [caption, setCaption] = useState("");
  const [scheduledFor, setScheduledFor] = useState<string>("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (post) {
      setCaption(post.caption || "");
      setScheduledFor(post.scheduled_at ? new Date(post.scheduled_at).toISOString().slice(0, 16) : "");
      setSelectedPlatforms(post.social_accounts?.map(a => a.platform) || []);
      // Tags are not directly available on SocialPost, would need to extract from caption or metadata
      setTags([]);
      setHasChanges(false);
    }
  }, [post]);

  const handleCaptionChange = (value: string) => {
    setCaption(value);
    setHasChanges(true);
  };

  const handleScheduleChange = (value: string) => {
    setScheduledFor(value);
    setHasChanges(true);
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
    setHasChanges(true);
  };

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag("");
      setHasChanges(true);
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave({
      caption,
      scheduled_at: scheduledFor ? new Date(scheduledFor).toISOString() : null,
      // social_accounts would need proper mapping
    });
    onClose();
  };

  const characterCount = caption.length;
  const maxCharacters = 280;

  if (!isOpen || !post) return null;

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
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Quick Edit</h2>
              <p className="text-sm text-slate-500">{post.id.slice(0, 8)}...</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={!hasChanges}
                className={cn(
                  "transition-all",
                  hasChanges && "bg-gradient-to-r from-blue-500 to-violet-500"
                )}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg ml-2">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Content Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <AlignLeft className="w-4 h-4 text-slate-500" />
                    Caption
                  </Label>
                  <span className={cn(
                    "text-xs",
                    characterCount > maxCharacters ? "text-red-500" : "text-slate-500"
                  )}>
                    {characterCount}/{maxCharacters}
                  </span>
                </div>
                <Textarea
                  value={caption}
                  onChange={(e) => handleCaptionChange(e.target.value)}
                  placeholder="What's on your mind?"
                  className="min-h-[120px] resize-none"
                />
                {characterCount > maxCharacters && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Content exceeds character limit
                  </p>
                )}
              </div>

              {/* Media Preview */}
              {post.media && post.media.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-slate-500" />
                    Media ({post.media.length})
                  </Label>
                  <div className="flex gap-2 flex-wrap">
                    {post.media.map((item, i) => (
                      <div key={i} className="w-20 h-20 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <img src={item.url} alt="Post media" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Schedule */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  Schedule
                </Label>
                <Input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => handleScheduleChange(e.target.value)}
                  className="max-w-xs"
                />
              </div>

              {/* Platforms */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-500" />
                  Platforms
                </Label>
                <div className="flex flex-wrap gap-2">
                  {platforms.map(platform => (
                    <button
                      key={platform.id}
                      onClick={() => togglePlatform(platform.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                        selectedPlatforms.includes(platform.id)
                          ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100"
                      )}
                    >
                      <img src={platform.icon} alt="" className="w-4 h-4" />
                      <span className="text-sm font-medium">{platform.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-slate-500" />
                  Tags
                </Label>
                <div className="flex gap-2 flex-wrap">
                  {tags.map(tag => (
                    <Badge 
                      key={tag} 
                      variant="secondary"
                      className="cursor-pointer hover:bg-red-100 dark:hover:bg-red-500/20"
                      onClick={() => removeTag(tag)}
                    >
                      #{tag} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addTag()}
                      placeholder="Add tag..."
                      className="w-32 h-7 text-sm"
                    />
                    <Button size="sm" variant="ghost" onClick={addTag}>Add</Button>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4 text-slate-500">
                <span>Status: <span className={cn(
                  "font-medium capitalize",
                  post.status === "processed" && "text-emerald-600",
                  post.status === "scheduled" && "text-blue-600",
                  post.status === "draft" && "text-slate-600",

                  post.status === "processing" && "text-amber-600",
                )}>{post.status}</span></span>
                <span>Created: {new Date(post.created_at).toLocaleDateString()}</span>
              </div>
              {hasChanges && (
                <span className="text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Unsaved changes
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
