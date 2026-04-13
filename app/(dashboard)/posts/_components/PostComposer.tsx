"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ImageIcon, X, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PLATFORM_CHARACTER_LIMITS, getMostRestrictiveLimit } from "@/types/post-for-me-types";

interface PostComposerProps {
  content: string;
  onContentChange: (content: string) => void;
  selectedPlatforms: string[];
  onSubmit: () => void;
  isSubmitting?: boolean;
  disabled?: boolean;
  mediaPreview?: string[];
  onMediaSelect?: () => void;
  onMediaRemove?: (index: number) => void;
}

// Auto-growing textarea component
function AutoGrowingTextarea({
  value,
  onChange,
  placeholder,
  maxLength,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
        handleInput();
      }}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={maxLength}
      rows={1}
      className={cn(
        "w-full resize-none overflow-hidden bg-transparent",
        "text-base leading-relaxed placeholder:text-slate-400",
        "focus:outline-none focus:ring-0",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "min-h-[24px] max-h-[300px]"
      )}
      style={{ height: "auto" }}
    />
  );
}

// Character counter with platform colors
function CharacterCounter({
  current,
  max,
  platforms,
}: {
  current: number;
  max: number;
  platforms: string[];
}) {
  const percentage = Math.min((current / max) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isOverLimit = current > max;

  const getStatusColor = () => {
    if (isOverLimit) return "text-red-500 bg-red-50";
    if (isNearLimit) return "text-amber-500 bg-amber-50";
    return "text-slate-500 bg-slate-100";
  };

  return (
    <div className="flex items-center gap-2">
      {platforms.length > 0 && (
        <div className="flex -space-x-1">
          {platforms.slice(0, 3).map((platform) => (
            <div
              key={platform}
              className={cn(
                "w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold uppercase",
                platform === "twitter" && "bg-black text-white",
                platform === "instagram" && "bg-gradient-to-br from-purple-500 to-pink-500 text-white",
                platform === "facebook" && "bg-blue-600 text-white",
                platform === "linkedin" && "bg-blue-700 text-white",
                platform === "tiktok" && "bg-black text-white",
                platform === "youtube" && "bg-red-600 text-white"
              )}
            >
              {platform[0]}
            </div>
          ))}
        </div>
      )}
      <div
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors",
          getStatusColor()
        )}
      >
        <span className={cn(isOverLimit && "text-red-600 font-bold")}>
          {current.toLocaleString()}
        </span>
        <span className="text-slate-400">/</span>
        <span>{max.toLocaleString()}</span>
        {isOverLimit && (
          <span className="text-red-600 font-bold ml-1">
            +{(current - max).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}

// Media preview grid
function MediaPreviewGrid({
  previews,
  onRemove,
  disabled,
}: {
  previews: string[];
  onRemove?: (index: number) => void;
  disabled?: boolean;
}) {
  if (previews.length === 0) return null;

  return (
    <AnimatePresence>
      <div className={cn(
        "grid gap-2 mt-3",
        previews.length === 1 ? "grid-cols-1" :
        previews.length === 2 ? "grid-cols-2" :
        "grid-cols-3"
      )}>
        {previews.map((preview, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
              "relative rounded-xl overflow-hidden bg-slate-100",
              previews.length === 1 ? "aspect-video" : "aspect-square"
            )}
          >
            <img
              src={preview}
              alt={`Media ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {!disabled && onRemove && (
              <button
                onClick={() => onRemove(index)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
}

export function PostComposer({
  content,
  onContentChange,
  selectedPlatforms,
  onSubmit,
  isSubmitting,
  disabled,
  mediaPreview = [],
  onMediaSelect,
  onMediaRemove,
}: PostComposerProps) {
  const [isFocused, setIsFocused] = useState(false);
  
  // Calculate character limit based on selected platforms
  const characterLimit = getMostRestrictiveLimit(selectedPlatforms);
  const isOverLimit = content.length > characterLimit;

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white dark:bg-slate-900 transition-all duration-200",
        isFocused
          ? "border-blue-400 shadow-lg shadow-blue-500/10"
          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Create Post
          </span>
        </div>
        {selectedPlatforms.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4">
        <div
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        >
          <AutoGrowingTextarea
            value={content}
            onChange={onContentChange}
            placeholder="What's on your mind?"
            disabled={disabled}
            maxLength={characterLimit * 1.5} // Allow typing over limit but show warning
          />
        </div>

        {/* Media Preview */}
        <MediaPreviewGrid
          previews={mediaPreview}
          onRemove={onMediaRemove}
          disabled={disabled}
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Media Upload Button */}
          {onMediaSelect && (
            <button
              onClick={onMediaSelect}
              disabled={disabled || mediaPreview.length >= 4}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <ImageIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Media</span>
              {mediaPreview.length > 0 && (
                <span className="text-xs text-slate-400">
                  {mediaPreview.length}/4
                </span>
              )}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Character Counter */}
          {selectedPlatforms.length > 0 && (
            <CharacterCounter
              current={content.length}
              max={characterLimit}
              platforms={selectedPlatforms}
            />
          )}

          {/* Submit Button */}
          <Button
            onClick={onSubmit}
            disabled={disabled || isSubmitting || !content.trim() || isOverLimit}
            className={cn(
              "rounded-full px-6 transition-all",
              isOverLimit && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Post
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
