"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Smartphone, 
  Monitor, 
  Share2,
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SocialPost } from "@/types/post-for-me-types";

type PreviewDevice = "mobile" | "desktop";
type PreviewPlatform = "twitter" | "linkedin" | "facebook" | "instagram";

interface PostPreviewProps {
  post: SocialPost | null;
  isOpen: boolean;
  onClose: () => void;
  onPublish?: () => void;
  onSchedule?: () => void;
  onEdit?: () => void;
}

function TwitterPreview({ post }: { post: SocialPost }) {
  const mediaUrls = post.media?.map(m => m.url) || [];
  
  return (
    <div className="bg-white dark:bg-black text-black dark:text-white rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold">Your Account</span>
            <span className="text-slate-500">@username</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-500">{new Date(post.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <MoreHorizontal className="w-5 h-5 text-slate-500" />
      </div>

      {/* Content */}
      <div className="px-4 pb-2">
        <p className="whitespace-pre-wrap">{post.caption}</p>
      </div>

      {/* Media */}
      {mediaUrls.length > 0 && (
        <div className="px-4 py-2">
          <div className={cn(
            "grid gap-1 rounded-xl overflow-hidden",
            mediaUrls.length === 1 ? "grid-cols-1" :
            mediaUrls.length === 2 ? "grid-cols-2" :
            mediaUrls.length === 3 ? "grid-cols-2" :
            "grid-cols-2"
          )}>
            {mediaUrls.slice(0, 4).map((url, i) => (
              <div key={i} className="aspect-square bg-slate-100 dark:bg-slate-800">
                <img src={url} alt="Post media" loading="lazy" decoding="async" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 flex items-center justify-between text-slate-500">
        <button className="flex items-center gap-2 hover:text-blue-500 transition-colors">
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">0</span>
        </button>
        <button className="flex items-center gap-2 hover:text-green-500 transition-colors">
          <Repeat2 className="w-5 h-5" />
          <span className="text-sm">0</span>
        </button>
        <button className="flex items-center gap-2 hover:text-red-500 transition-colors">
          <Heart className="w-5 h-5" />
          <span className="text-sm">0</span>
        </button>
        <button className="flex items-center gap-2 hover:text-blue-500 transition-colors">
          <Bookmark className="w-5 h-5" />
        </button>
        <button className="flex items-center gap-2 hover:text-blue-500 transition-colors">
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function LinkedInPreview({ post }: { post: SocialPost }) {
  const mediaUrls = post.media?.map(m => m.url) || [];
  
  return (
    <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="flex-1">
          <div className="font-semibold">Your Name</div>
          <div className="text-sm text-slate-500">Headline · {new Date(post.created_at).toLocaleDateString()}</div>
        </div>
        <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
          <MoreHorizontal className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="whitespace-pre-wrap">{post.caption}</p>
      </div>

      {/* Media */}
      {mediaUrls.length > 0 && (
        <div className="border-t border-slate-200 dark:border-slate-800">
          {mediaUrls.slice(0, 1).map((url, i) => (
            <div key={i} className="aspect-video bg-slate-100 dark:bg-slate-800">
              <img src={url} alt="Post media" loading="lazy" decoding="async" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Reactions */}
      <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>0 reactions</span>
          <span>0 comments</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <button className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <span className="text-lg">👍</span>
          <span className="text-sm font-medium">Like</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Comment</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <Repeat2 className="w-5 h-5" />
          <span className="text-sm font-medium">Repost</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <Send className="w-5 h-5" />
          <span className="text-sm font-medium">Send</span>
        </button>
      </div>
    </div>
  );
}

export function PostPreview({
  post,
  isOpen,
  onClose,
  onPublish,
  onSchedule,
  onEdit,
}: PostPreviewProps) {
  const [device, setDevice] = useState<PreviewDevice>("mobile");
  const [platform, setPlatform] = useState<PreviewPlatform>("twitter");

  if (!isOpen || !post) return null;

  const statusConfig: Record<string, { icon: typeof Clock; color: string; bg: string }> = {
    draft: { icon: Clock, color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-800" },
    scheduled: { icon: Clock, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
    published: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
    failed: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10" },
    processing: { icon: Clock, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
    processed: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  };

  const StatusIcon = statusConfig[post.status]?.icon || Clock;

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
          className="w-full max-w-4xl h-[85vh] bg-slate-50 dark:bg-slate-950 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Preview</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("capitalize", statusConfig[post.status]?.color)}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {post.status}
                  </Badge>
                  <span className="text-sm text-slate-500">
                    {post.social_accounts?.map(a => a.platform).join(", ")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Device Toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setDevice("mobile")}
                  className={cn(
                    "p-2 rounded-md transition-all",
                    device === "mobile" && "bg-white dark:bg-slate-700 shadow-sm"
                  )}
                >
                  <Smartphone className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDevice("desktop")}
                  className={cn(
                    "p-2 rounded-md transition-all",
                    device === "desktop" && "bg-white dark:bg-slate-700 shadow-sm"
                  )}
                >
                  <Monitor className="w-4 h-4" />
                </button>
              </div>

              {/* Platform Tabs */}
              <Tabs value={platform} onValueChange={(v) => setPlatform(v as PreviewPlatform)}>
                <TabsList>
                  <TabsTrigger value="twitter">𝕏</TabsTrigger>
                  <TabsTrigger value="linkedin">in</TabsTrigger>
                  <TabsTrigger value="facebook">f</TabsTrigger>
                  <TabsTrigger value="instagram">📷</TabsTrigger>
                </TabsList>
              </Tabs>

              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className={cn(
              "mx-auto transition-all duration-300",
              device === "mobile" ? "max-w-sm" : "max-w-2xl"
            )}>
              {platform === "twitter" && <TwitterPreview post={post} />}
              {platform === "linkedin" && <LinkedInPreview post={post} />}
              {platform === "facebook" && (
                <div className="bg-white dark:bg-slate-900 rounded-xl p-8 text-center text-slate-500">
                  Facebook preview coming soon
                </div>
              )}
              {platform === "instagram" && (
                <div className="bg-white dark:bg-slate-900 rounded-xl p-8 text-center text-slate-500">
                  Instagram preview coming soon
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <div className="text-sm text-slate-500">
              Scheduled for: {post.scheduled_at 
                ? new Date(post.scheduled_at).toLocaleString() 
                : "Not scheduled"}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onEdit}>Edit Post</Button>
              {post.status === "draft" && (
                <>
                  <Button variant="outline" onClick={onSchedule}>Schedule</Button>
                  <Button onClick={onPublish}>Publish Now</Button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
