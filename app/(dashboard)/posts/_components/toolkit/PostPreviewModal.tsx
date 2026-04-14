"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Smartphone, Monitor, Instagram, Facebook, Twitter, Linkedin, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import type { SocialPost } from "@/types/post-for-me-types";

interface PostPreviewModalProps {
  post: SocialPost | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

const platforms = [
  { id: "instagram", name: "Instagram", icon: Instagram, color: "text-pink-500" },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "text-blue-600" },
  { id: "x", name: "X (Twitter)", icon: Twitter, color: "text-slate-900 dark:text-white" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-blue-700" },
];

export function PostPreviewModal({ post, isOpen, onClose, onEdit }: PostPreviewModalProps) {
  const [viewMode, setViewMode] = useState<"mobile" | "desktop">("mobile");
  const [activePlatform, setActivePlatform] = useState("instagram");

  if (!post) return null;


  const characterCount = post.caption?.length || 0;
  const characterLimit = activePlatform === "x" ? 280 : 2200;
  const isOverLimit = characterCount > characterLimit;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-10 lg:inset-20 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Post Preview</h2>
                
                {/* Platform Selector */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                  {platforms.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setActivePlatform(p.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all",
                        activePlatform === p.id
                          ? "bg-white dark:bg-slate-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      <p.icon className={cn("w-4 h-4", p.color)} />
                      <span className="hidden sm:inline">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* View Toggle */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("mobile")}
                    className={cn(
                      "p-2 rounded-md transition-all",
                      viewMode === "mobile" ? "bg-white dark:bg-slate-700 shadow-sm" : "text-slate-500"
                    )}
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("desktop")}
                    className={cn(
                      "p-2 rounded-md transition-all",
                      viewMode === "desktop" ? "bg-white dark:bg-slate-700 shadow-sm" : "text-slate-500"
                    )}
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                </div>

                <Button variant="outline" size="sm" onClick={onEdit}>
                  Edit Post
                </Button>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex">
              {/* Preview Area */}
              <div className="flex-1 bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-8 overflow-auto">
                <motion.div
                  animate={{ 
                    width: viewMode === "mobile" ? 375 : 600,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className={cn(
                    "bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden",
                    viewMode === "mobile" ? "max-h-[800px]" : "max-h-full"
                  )}
                >
                  {/* Platform Header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
                    <div>
                      <p className="font-semibold text-sm text-slate-900 dark:text-white">Your Account</p>
                      <p className="text-xs text-slate-500">Just now</p>
                    </div>
                  </div>

                  {/* Media */}
                  {post.media && post.media.length > 0 && (
                    <div className={cn(
                      "bg-slate-100 dark:bg-slate-800",
                      viewMode === "mobile" ? "aspect-square" : "aspect-video"
                    )}>
                      <img
                        src={post.media?.[0]?.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Caption */}
                  <div className="p-4">
                    <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                      {post.caption || "No caption"}
                    </p>
                    
                    {/* Character Count Warning */}
                    {isOverLimit && (
                      <div className="flex items-center gap-2 mt-3 p-2 bg-red-50 dark:bg-red-500/10 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-xs text-red-600">
                          {characterCount - characterLimit} characters over limit
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Engagement Bar */}
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-500">❤️ 0 likes</span>
                      <span className="text-xs text-slate-500">💬 0 comments</span>
                    </div>
                    <span className="text-xs text-slate-500">↗️ Share</span>
                  </div>
                </motion.div>
              </div>

              {/* Details Sidebar */}
              <div className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 overflow-auto">
                <div className="space-y-6">
                  {/* Status */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Status</label>
                    <span className="mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">{post.status}</span>
                  </div>

                  {/* Platforms */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Platforms</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {post.social_accounts?.map((sa) => (
                        <Badge key={sa.id} variant="secondary" className="text-xs">
                          {sa.platform}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Schedule */}
                  {post.scheduled_at && (
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase">Scheduled</label>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                        {new Date(post.scheduled_at).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* Character Stats */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Character Count</label>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className={cn(isOverLimit && "text-red-500")}>{characterCount}</span>
                        <span className="text-slate-400">/ {characterLimit}</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-300",
                            isOverLimit ? "bg-red-500" : "bg-emerald-500"
                          )}
                          style={{ width: `${Math.min((characterCount / characterLimit) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Media Stats */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Media</label>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                      {post.media?.length || 0} files attached
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <Button className="w-full" variant="outline" onClick={onEdit}>
                      Edit Post
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
