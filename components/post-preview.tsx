"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Instagram, 
  Twitter, 
  Facebook, 
  Linkedin,
  Play,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { SocialAccount } from "@/types/post-for-me-types";

interface PostPreviewProps {
  caption: string;
  mediaUrls: string[];
  selectedAccounts: SocialAccount[];
  isLoading?: boolean;
}

const platformIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="w-4 h-4" />,
  facebook: <Facebook className="w-4 h-4" />,
  twitter: <Twitter className="w-4 h-4" />,
  linkedin: <Linkedin className="w-4 h-4" />,
  tiktok: <Play className="w-4 h-4" />,
  tiktok_business: <Play className="w-4 h-4" />,
};

const platformColors: Record<string, string> = {
  instagram: "from-purple-500 via-pink-500 to-orange-400",
  facebook: "from-blue-600 to-blue-500",
  twitter: "from-slate-800 to-slate-700",
  linkedin: "from-blue-700 to-blue-600",
  tiktok: "from-black to-slate-800",
  tiktok_business: "from-black to-slate-800",
};

export function PostPreview({
  caption,
  mediaUrls,
  selectedAccounts,
  isLoading,
}: PostPreviewProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>(
    selectedAccounts[0]?.platform || "instagram"
  );

  const selectedAccount = selectedAccounts.find(
    (a) => a.platform === selectedPlatform
  );

  if (selectedAccounts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-600 dark:text-slate-400">
          Select accounts to see preview
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-8">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-slate-200 rounded" />
              <div className="h-3 w-16 bg-slate-200 rounded" />
            </div>
          </div>
          <div className="h-32 bg-slate-200 rounded-lg" />
          <div className="space-y-2">
            <div className="h-3 w-full bg-slate-200 rounded" />
            <div className="h-3 w-5/6 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Platform Selector */}
      {selectedAccounts.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {selectedAccounts.map((account) => (
            <button
              key={account.id}
              onClick={() => setSelectedPlatform(account.platform)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                selectedPlatform === account.platform
                  ? "bg-blue-500 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200"
              )}
            >
              {platformIcons[account.platform.toLowerCase()]}
              <span className="capitalize">{account.platform.replace("_", " ")}</span>
            </button>
          ))}
        </div>
      )}

      {/* Platform Preview */}
      <motion.div
        key={selectedPlatform}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        {/* Platform Header */}
        <div
          className={cn(
            "h-1 bg-gradient-to-r",
            platformColors[selectedPlatform] || "bg-slate-400"
          )}
        />

        {/* Preview Content */}
        <div className="p-4 bg-white dark:bg-slate-900">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={selectedAccount?.profile_photo_url || ""} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                {selectedAccount?.username?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                {selectedAccount?.username || "Your Account"}
              </p>
              <p className="text-xs text-slate-500">Just now</p>
            </div>
            {platformIcons[selectedPlatform] && (
              <div className="text-slate-400">
                {platformIcons[selectedPlatform]}
              </div>
            )}
          </div>

          {/* Caption */}
          {caption && (
            <p className="text-sm text-slate-800 dark:text-slate-200 mb-3 whitespace-pre-wrap">
              {caption}
            </p>
          )}

          {/* Media Grid */}
          {mediaUrls.length > 0 && (
            <div
              className={cn(
                "grid gap-1 rounded-lg overflow-hidden",
                mediaUrls.length === 1
                  ? "grid-cols-1"
                  : mediaUrls.length === 2
                  ? "grid-cols-2"
                  : mediaUrls.length === 3
                  ? "grid-cols-2"
                  : "grid-cols-2"
              )}
            >
              {mediaUrls.slice(0, 4).map((url, i) => (
                <div
                  key={i}
                  className={cn(
                    "relative bg-slate-100 dark:bg-slate-800",
                    mediaUrls.length === 1
                      ? "aspect-video"
                      : "aspect-square",
                    i === 0 && mediaUrls.length === 3
                      ? "row-span-2"
                      : ""
                  )}
                >
                  <img
                    src={url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {mediaUrls.length > 4 && i === 3 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white text-xl font-semibold">
                        +{mediaUrls.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Platform Footer */}
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {selectedPlatform === "instagram" && (
              <div className="flex items-center justify-between text-slate-500">
                <div className="flex gap-4">
                  <span className="text-sm">❤️</span>
                  <span className="text-sm">💬</span>
                  <span className="text-sm">📤</span>
                </div>
                <span className="text-sm">🔖</span>
              </div>
            )}
            {selectedPlatform === "twitter" && (
              <div className="flex items-center justify-between text-slate-500">
                <div className="flex gap-4 text-sm">
                  <span>💬 0</span>
                  <span>🔄 0</span>
                  <span>❤️ 0</span>
                  <span>📊 0</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Character Count Warning */}
      {caption.length > 2200 && (
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span>Caption exceeds Instagram's 2,200 character limit</span>
        </div>
      )}

      {/* Media Count Warning */}
      {mediaUrls.length > 10 && (
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span>Instagram and Facebook limit: 10 images per post</span>
        </div>
      )}

      {/* Success Checks */}
      {caption.length <= 2200 && mediaUrls.length <= 10 && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg">
          <CheckCircle2 className="w-4 h-4" />
          <span>Post meets all platform requirements</span>
        </div>
      )}
    </div>
  );
}
