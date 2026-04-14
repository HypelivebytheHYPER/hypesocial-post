"use client";

import { motion } from "framer-motion";
import { getPlatformIcon } from "@/lib/social-platforms";
import type { SocialPostPreview } from "@/types/post-for-me-types";

export function PreviewCard({
  preview,
  platform,
}: {
  preview: SocialPostPreview;
  platform: string;
}) {
  const PlatformIcon = getPlatformIcon(platform);
  const isDark = ["tiktok", "x", "twitter"].includes(platform);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl overflow-hidden border shadow-sm ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
    >
      {/* Header */}
      <div
        className={`flex items-center gap-3 p-4 border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}
      >
        <div
          className={`w-10 h-10 rounded-full ${isDark ? "bg-slate-800" : "bg-slate-100"} flex items-center justify-center`}
        >
          {PlatformIcon ? (
            <PlatformIcon
              className={`w-5 h-5 ${isDark ? "text-white" : "text-slate-700"}`}
            />
          ) : (
            <span className="text-lg">{platform[0]}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-slate-900"}`}
          >
            {String(preview.social_account_username || platform)}
          </p>
          <p
            className={`text-xs truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            @{String(preview.social_account_username || "username")}
          </p>
        </div>
        <div
          className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
        >
          Just now
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p
          className={`text-sm whitespace-pre-wrap break-words ${isDark ? "text-white" : "text-slate-800"}`}
        >
          {preview.caption}
        </p>

        {/* Media Preview */}
        {preview.media && preview.media.length > 0 && (
          <div className="mt-3 space-y-2">
            <div
              className={`grid gap-2 ${preview.media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
            >
              {preview.media.slice(0, 4).map((mediaItem, idx) => {
                const mediaWithType = mediaItem as typeof mediaItem & {
                  content_type?: string;
                };
                const isVideo =
                  mediaWithType.content_type?.startsWith("video/") ||
                  mediaItem.url.match(/\.(mp4|mov|webm)($|\?)/);
                // Local previews are always images (blob URL for images, JPEG data URL for video frame captures)
                const isLocalPreview =
                  mediaItem.url.startsWith("blob:") ||
                  mediaItem.url.startsWith("data:");
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="aspect-square rounded-xl overflow-hidden bg-slate-100 relative group"
                  >
                    {isVideo && !isLocalPreview ? (
                      <video
                        src={mediaItem.url}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <>
                        { }
                        <img
                          src={mediaItem.url}
                          alt=""
                          className="w-full h-full object-cover"
                          crossOrigin={isLocalPreview ? undefined : "anonymous"}
                          referrerPolicy={
                            isLocalPreview ? undefined : "no-referrer"
                          }
                        />
                      </>
                    )}
                    {/* Media Type Badge */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[10px] rounded-full">
                      {isVideo ? "VIDEO" : "IMAGE"}
                    </div>
                  </motion.div>
                );
              })}
              {preview.media.length > 4 && (
                <div className="aspect-square rounded-xl overflow-hidden bg-slate-900/80 flex items-center justify-center">
                  <span
                    className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-700"}`}
                  >
                    +{preview.media.length - 4}
                  </span>
                </div>
              )}
            </div>
            {/* Media URLs */}
            <div
              className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"} space-y-1`}
            >
              {preview.media.map((mediaItem, idx) => (
                <div key={idx} className="truncate font-mono">
                  {idx + 1}. {mediaItem.url.split("/").pop()?.split("?")[0]}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Engagement mock */}
        <div
          className={`mt-4 flex items-center gap-6 pt-4 border-t ${isDark ? "border-slate-800" : "border-slate-100"}`}
        >
          <div
            className={`flex items-center gap-2 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span>0</span>
          </div>
          <div
            className={`flex items-center gap-2 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>0</span>
          </div>
          <div
            className={`flex items-center gap-2 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            <span>0</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
