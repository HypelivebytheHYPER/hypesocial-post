"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Check,
  AlertCircle,
  Users,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TikTokIcon } from "@/components/icons/social-icons";
import type { SocialAccount } from "@/types/post-for-me-types";

const platformConfig: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
  characterLimit: number;
}> = {
  instagram: {
    icon: Instagram,
    color: "text-pink-500",
    bgColor: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400",
    borderColor: "border-pink-200 dark:border-pink-500/30",
    label: "Instagram",
    characterLimit: 2200,
  },
  facebook: {
    icon: Facebook,
    color: "text-blue-600",
    bgColor: "bg-blue-600",
    borderColor: "border-blue-200 dark:border-blue-500/30",
    label: "Facebook",
    characterLimit: 63206,
  },
  twitter: {
    icon: Twitter,
    color: "text-slate-900 dark:text-white",
    bgColor: "bg-slate-900 dark:bg-white",
    borderColor: "border-slate-200 dark:border-slate-700",
    label: "X (Twitter)",
    characterLimit: 280,
  },
  linkedin: {
    icon: Linkedin,
    color: "text-blue-700",
    bgColor: "bg-blue-700",
    borderColor: "border-blue-200 dark:border-blue-500/30",
    label: "LinkedIn",
    characterLimit: 3000,
  },
  youtube: {
    icon: Youtube,
    color: "text-red-600",
    bgColor: "bg-red-600",
    borderColor: "border-red-200 dark:border-red-500/30",
    label: "YouTube",
    characterLimit: 5000,
  },
  tiktok: {
    icon: TikTokIcon,
    color: "text-slate-900 dark:text-white",
    bgColor: "bg-black",
    borderColor: "border-slate-200 dark:border-slate-700",
    label: "TikTok",
    characterLimit: 2200,
  },
  tiktok_business: {
    icon: TikTokIcon,
    color: "text-cyan-500",
    bgColor: "bg-gradient-to-r from-cyan-500 to-pink-500",
    borderColor: "border-cyan-200 dark:border-cyan-500/30",
    label: "TikTok Business",
    characterLimit: 2200,
  },
};

interface PlatformSelectorEnhancedProps {
  accounts: SocialAccount[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  contentLength?: number;
}

export function PlatformSelectorEnhanced({
  accounts,
  selectedIds,
  onToggle,
  contentLength = 0,
}: PlatformSelectorEnhancedProps) {
  // Group accounts by platform
  const accountsByPlatform = accounts.reduce((acc, account) => {
    const platform = account.platform.toLowerCase();
    if (!acc[platform]) {
      acc[platform] = [];
    }
    acc[platform].push(account);
    return acc;
  }, {} as Record<string, SocialAccount[]>);

  const selectedAccounts = accounts.filter((a) => selectedIds.includes(a.id));
  const selectedPlatforms = [...new Set(selectedAccounts.map((a) => a.platform.toLowerCase()))];

  // Get most restrictive character limit
  const mostRestrictiveLimit = selectedPlatforms.length > 0
    ? Math.min(...selectedPlatforms.map((p) => platformConfig[p]?.characterLimit || Infinity))
    : Infinity;

  const isOverLimit = contentLength > mostRestrictiveLimit;
  const remainingChars = mostRestrictiveLimit !== Infinity ? mostRestrictiveLimit - contentLength : null;

  return (
    <div className="space-y-4">
      {/* Selected Platforms Summary */}
      {selectedPlatforms.length > 0 && (
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">
              {selectedAccounts.length} account{selectedAccounts.length > 1 ? "s" : ""} selected
            </span>
            {remainingChars !== null && (
              <span
                className={cn(
                  "text-xs font-medium",
                  isOverLimit ? "text-red-500" : remainingChars < 50 ? "text-amber-500" : "text-emerald-500"
                )}
              >
                {remainingChars} chars left
              </span>
            )}
          </div>
          
          {/* Character Limit Bar */}
          {mostRestrictiveLimit !== Infinity && (
            <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  isOverLimit ? "bg-red-500" : remainingChars && remainingChars < 50 ? "bg-amber-500" : "bg-emerald-500"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((contentLength / mostRestrictiveLimit) * 100, 100)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}

          {/* Platform Tags */}
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedPlatforms.map((platform) => {
              const config = platformConfig[platform];
              const Icon = config?.icon || Globe;
              const limit = config?.characterLimit;
              const platformAccounts = selectedAccounts.filter(
                (a) => a.platform.toLowerCase() === platform
              );

              return (
                <div
                  key={platform}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border",
                    config?.borderColor || "border-slate-200",
                    "bg-white dark:bg-slate-900"
                  )}
                >
                  <div className={cn("w-3 h-3 rounded-full", config?.bgColor)}>
                    <Icon className="w-3 h-3 text-white" />
                  </div>
                  <span className="capitalize">{platform}</span>
                  <span className="text-slate-400">
                    {platformAccounts.length > 1 && `(${platformAccounts.length})`}
                  </span>
                  {limit && contentLength > limit && (
                    <AlertCircle className="w-3 h-3 text-red-500" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Platform Groups */}
      <div className="space-y-3">
        {Object.entries(accountsByPlatform).map(([platform, platformAccounts]) => {
          const config = platformConfig[platform];
          const Icon = config?.icon || Globe;
          const selectedCount = platformAccounts.filter((a) => selectedIds.includes(a.id)).length;
          const allSelected = selectedCount === platformAccounts.length;
          const someSelected = selectedCount > 0 && !allSelected;

          return (
            <motion.div
              key={platform}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "rounded-xl border overflow-hidden",
                allSelected
                  ? cn("border-2", config?.borderColor || "border-slate-200")
                  : "border-slate-200 dark:border-slate-800"
              )}
            >
              {/* Platform Header */}
              <div
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 cursor-pointer",
                  "bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                )}
                onClick={() => {
                  // Toggle all accounts for this platform
                  if (allSelected) {
                    platformAccounts.forEach((a) => {
                      if (selectedIds.includes(a.id)) onToggle(a.id);
                    });
                  } else {
                    platformAccounts.forEach((a) => {
                      if (!selectedIds.includes(a.id)) onToggle(a.id);
                    });
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      config?.bgColor || "bg-slate-400"
                    )}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-sm font-medium capitalize">{platform}</span>
                    <span className="text-xs text-slate-400 ml-1.5">
                      {selectedCount}/{platformAccounts.length}
                    </span>
                  </div>
                </div>

                {/* Checkbox */}
                <div
                  className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                    allSelected
                      ? "bg-blue-500 border-blue-500"
                      : someSelected
                      ? "bg-blue-500/50 border-blue-500"
                      : "border-slate-300"
                  )}
                >
                  {(allSelected || someSelected) && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
              </div>

              {/* Accounts List */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {platformAccounts.map((account) => {
                  const isSelected = selectedIds.includes(account.id);
                  const isConnected = account.status === "connected";

                  return (
                    <motion.button
                      key={account.id}
                      layout
                      onClick={() => isConnected && onToggle(account.id)}
                      disabled={!isConnected}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all",
                        isSelected
                          ? "bg-blue-50/50 dark:bg-blue-500/5"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                        !isConnected && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={account.profile_photo_url || undefined} />
                        <AvatarFallback className="bg-slate-100">
                          <Icon className="w-4 h-4 text-slate-400" />
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {account.username || "Unknown"}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {isConnected ? "Connected" : "Disconnected"}
                        </p>
                      </div>

                      {/* Selection Indicator */}
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                          isSelected
                            ? "bg-blue-500 border-blue-500"
                            : "border-slate-300"
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {accounts.length === 0 && (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm text-slate-500">No accounts connected</p>
          <p className="text-xs text-slate-400 mt-1">
            Connect social accounts to start posting
          </p>
        </div>
      )}
    </div>
  );
}
