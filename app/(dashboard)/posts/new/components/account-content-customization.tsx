"use client";

import { useState } from "react";
import { 
  ChevronDown, FileEdit, ChevronRight, Play, Check
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";

import type { MediaItem, AccountConfigurationDetailsDto } from "@/types/post-for-me-types";
import { PLATFORM_CHARACTER_LIMITS } from "@/types/post-for-me-types";
import { getPlatformIcon } from "@/lib/social-platforms";
import { cn } from "@/lib/utils";

// Local type definitions (originally from page.tsx)
type UploadStatus = "pending" | "uploading" | "success" | "error";

interface MediaFile {
  id: string;
  file: File;
  preview: string;
  status: UploadStatus;
  uploadedUrl?: string;
  uploadProgress?: number;
  error?: string;
  skipProcessing?: boolean;
  width?: number;
  height?: number;
}

export function AccountContentCustomization({
  selectedAccountIds,
  accounts,
  mediaFiles,
  defaultCaption,
  accountOverrides,
  onSetOverride,
  onClearOverride,
}: {
  selectedAccountIds: string[];
  accounts: { id: string; platform: string; username: string | null }[];
  mediaFiles: MediaFile[];
  defaultCaption: string;
  accountOverrides: Record<string, Partial<AccountConfigurationDetailsDto>>;
  onSetOverride: (
    accountId: string,
    field: keyof AccountConfigurationDetailsDto,
    value: AccountConfigurationDetailsDto[keyof AccountConfigurationDetailsDto],
  ) => void;
  onClearOverride: (
    accountId: string,
    field: keyof AccountConfigurationDetailsDto,
  ) => void;
}) {
  const [expandedAccounts, setExpandedAccounts] = useState<string[]>([]);
  const uploadedMedia = mediaFiles.filter(
    (m) => m.status === "success" && m.uploadedUrl,
  );

  if (selectedAccountIds.length < 2) return null;

  const hasAnyOverride = selectedAccountIds.some((id) => {
    const o = accountOverrides[id];
    return o && (o.caption !== undefined || o.media !== undefined);
  });

  return (
    <div className="border-t border-slate-100 dark:border-slate-700/50 pt-4">
      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <FileEdit className="w-3 h-3" />
        Per-Account Content
        {hasAnyOverride && (
          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full text-[9px] font-bold ml-1">
            Customized
          </span>
        )}
      </div>
      <p className="text-[11px] text-slate-400 mb-3">
        Override caption or media for specific accounts. Empty = uses default.
      </p>
      <div className="space-y-2">
        {selectedAccountIds.map((accountId) => {
          const account = accounts.find((a) => a.id === accountId);
          if (!account) return null;
          const PlatformIcon = getPlatformIcon(account.platform);
          const overrides = accountOverrides[accountId] || {};
          const hasCaption = overrides.caption !== undefined;
          const hasMedia = overrides.media !== undefined;
          const overrideCount = (hasCaption ? 1 : 0) + (hasMedia ? 1 : 0);
          const isExpanded = expandedAccounts.includes(accountId);
          const charLimit =
            PLATFORM_CHARACTER_LIMITS[account.platform] || Infinity;
          const captionText = hasCaption ? String(overrides.caption ?? "") : "";
          const isOverCharLimit = hasCaption && captionText.length > charLimit;

          // Which media URLs are selected for this account
          const overrideMediaUrls = hasMedia
            ? ((overrides.media as MediaItem[]) || []).map((m) => m.url)
            : uploadedMedia.map((m) => m.uploadedUrl!);

          return (
            <div
              key={accountId}
              className="rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800/50"
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedAccounts((prev) =>
                    prev.includes(accountId)
                      ? prev.filter((id) => id !== accountId)
                      : [...prev, accountId],
                  )
                }
                className="w-full flex items-center gap-2.5 p-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                  {PlatformIcon ? (
                    <PlatformIcon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                  ) : (
                    <span className="text-[10px] text-slate-500">
                      {account.platform[0]}
                    </span>
                  )}
                </div>
                <span className="text-slate-700 dark:text-slate-200 font-medium truncate flex-1 text-left">
                  @{account.username || account.platform}
                </span>
                <div className="flex items-center gap-1.5">
                  {overrideCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full text-[9px] font-bold">
                      {overrideCount}
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-2.5 pb-2.5 space-y-3">
                      {/* Caption override */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Caption
                          </span>
                          {hasCaption ? (
                            <button
                              type="button"
                              onClick={() =>
                                onClearOverride(accountId, "caption")
                              }
                              className="text-[10px] text-blue-500 hover:text-blue-700 transition-colors"
                            >
                              Use default
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                onSetOverride(
                                  accountId,
                                  "caption",
                                  defaultCaption as unknown as AccountConfigurationDetailsDto[keyof AccountConfigurationDetailsDto],
                                )
                              }
                              className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              Customize
                            </button>
                          )}
                        </div>
                        {hasCaption ? (
                          <div>
                            <textarea
                              value={captionText}
                              onChange={(e) =>
                                onSetOverride(
                                  accountId,
                                  "caption",
                                  e.target
                                    .value as unknown as AccountConfigurationDetailsDto[keyof AccountConfigurationDetailsDto],
                                )
                              }
                              placeholder={
                                defaultCaption ||
                                "Custom caption for this account..."
                              }
                              rows={3}
                              className={cn(
                                "w-full px-3 py-2 text-xs border rounded-lg resize-none focus:ring-2 focus:ring-slate-200 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200",
                                isOverCharLimit
                                  ? "border-red-300 focus:ring-red-200"
                                  : "border-slate-200",
                              )}
                            />
                            <div className="flex justify-between mt-1">
                              <span className="text-[10px] text-slate-400">
                                {account.platform}
                              </span>
                              <span
                                className={cn(
                                  "text-[10px]",
                                  isOverCharLimit
                                    ? "text-red-500 font-medium"
                                    : "text-slate-400",
                                )}
                              >
                                {captionText.length}
                                {charLimit !== Infinity && ` / ${charLimit}`}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic truncate">
                            {defaultCaption || "No caption yet"}
                          </p>
                        )}
                      </div>

                      {/* Media override */}
                      {uploadedMedia.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                              Media ({overrideMediaUrls.length}/
                              {uploadedMedia.length})
                            </span>
                            {hasMedia ? (
                              <button
                                type="button"
                                onClick={() =>
                                  onClearOverride(accountId, "media")
                                }
                                className="text-[10px] text-blue-500 hover:text-blue-700 transition-colors"
                              >
                                Use all
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400">
                                All included
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {uploadedMedia.map((media) => {
                              const isIncluded = overrideMediaUrls.includes(
                                media.uploadedUrl!,
                              );
                              const isVideo =
                                /\.(mp4|mov|webm|avi|3gp)($|\?)/i.test(
                                  media.file.name,
                                );
                              return (
                                <button
                                  key={media.id}
                                  type="button"
                                  onClick={() => {
                                    const currentMedia = hasMedia
                                      ? (overrides.media as MediaItem[]) || []
                                      : uploadedMedia.map((m) => ({
                                          url: m.uploadedUrl!,
                                        }));
                                    const newMedia = isIncluded
                                      ? currentMedia.filter(
                                          (m) => m.url !== media.uploadedUrl,
                                        )
                                      : [
                                          ...currentMedia,
                                          { url: media.uploadedUrl! },
                                        ];
                                    if (
                                      newMedia.length ===
                                        uploadedMedia.length &&
                                      !hasMedia
                                    )
                                      return;
                                    if (
                                      newMedia.length === uploadedMedia.length
                                    ) {
                                      onClearOverride(accountId, "media");
                                    } else {
                                      onSetOverride(
                                        accountId,
                                        "media",
                                        newMedia as unknown as AccountConfigurationDetailsDto[keyof AccountConfigurationDetailsDto],
                                      );
                                    }
                                  }}
                                  className={cn(
                                    "relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all",
                                    isIncluded
                                      ? "border-blue-500 opacity-100"
                                      : "border-slate-200 opacity-40 grayscale",
                                  )}
                                >
                                  { }
                                  <img
                                    src={media.preview}
                                    alt={media.file.name}
                                    className="w-full h-full object-cover"
                                  />
                                  {isVideo && (
                                    <Play className="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow" />
                                  )}
                                  {isIncluded && (
                                    <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center">
                                      <Check className="w-2 h-2 text-white" />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          {hasMedia && overrideMediaUrls.length === 0 && (
                            <p className="text-[10px] text-amber-500 mt-1">
                              No media selected — this account will post text
                              only.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
