"use client";

import {
  ArrowLeft,
  ImageIcon,
  Send,
  Calendar,
  Check,
  Loader2,
  X,
  FileEdit,
  Play,
  AlertCircle,
  Eye,
  Smartphone,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  useAccounts,
  useCreatePost,
  useUploadMedia,
  usePausedAccounts,
  usePostPreview,
} from "@/lib/hooks/usePostForMe";
import type { PlatformConfig, SocialPostPreview } from "@/types/post-for-me";
import { platformIconsMap } from "@/lib/social-platforms";
import { cn } from "@/lib/utils";
import {
  getMostRestrictiveLimit,
  getWarningThreshold,
  getDangerThreshold,
} from "@/types/post-for-me";

// Auto-save draft key
const DRAFT_STORAGE_KEY = "hypesocial_post_draft";

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
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
};

const slideInVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 400, damping: 30 },
  },
};

function getPlatformIcon(platform: string) {
  return platformIconsMap[platform.toLowerCase()];
}

// Skeleton loader for preview
function PreviewSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border bg-white border-slate-200 animate-pulse">
      <div className="flex items-center gap-3 p-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-slate-200 rounded w-24" />
          <div className="h-2 bg-slate-200 rounded w-16" />
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="h-3 bg-slate-200 rounded w-full" />
        <div className="h-3 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
      </div>
    </div>
  );
}

// Empty state component
function EmptyPreviewState({
  hasAccounts,
  hasContent,
}: {
  hasAccounts: boolean;
  hasContent: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-16 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200"
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
        <Eye className="w-8 h-8 text-slate-300" />
      </div>
      <p className="text-slate-500 font-medium mb-1">
        {!hasAccounts
          ? "Select accounts to preview"
          : !hasContent
            ? "Start typing to preview"
            : "Preview ready"}
      </p>
      <p className="text-slate-400 text-sm max-w-xs mx-auto">
        {!hasAccounts
          ? "Choose at least one social account to see how your post will look"
          : !hasContent
            ? "Your content will appear here as you type"
            : "Select accounts to generate preview"}
      </p>
    </motion.div>
  );
}

// Preview Card Component
function PreviewCard({
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
              {preview.media.slice(0, 4).map((mediaItem, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="aspect-square rounded-xl overflow-hidden bg-slate-100 relative group"
                >
                  <img
                    src={mediaItem.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {/* Media Type Badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[10px] rounded-full">
                    {mediaItem.url.match(/\.(mp4|mov|webm)($|\?)/) ? "VIDEO" : "IMAGE"}
                  </div>
                </motion.div>
              ))}
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
            <div className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"} space-y-1`}>
              {preview.media.map((mediaItem, idx) => (
                <div key={idx} className="truncate font-mono">
                  {idx + 1}. {mediaItem.url.split('/').pop()?.split('?')[0]}
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

// Platform option section with collapsible content
function PlatformOptions({
  title,
  platform,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  platform: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const PlatformIcon = getPlatformIcon(platform);

  return (
    <motion.div layout className="bg-slate-50 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          {PlatformIcon && <PlatformIcon className="w-4 h-4 text-slate-600" />}
          <span className="text-sm font-medium text-slate-700">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function NewPostPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [previews, setPreviews] = useState<SocialPostPreview[]>([]);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [expandedPlatforms, setExpandedPlatforms] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewRefreshTrigger, setPreviewRefreshTrigger] = useState(0);

  const { data: accountsData, isLoading: accountsLoading } = useAccounts();
  const { isPaused } = usePausedAccounts();
  const createPost = useCreatePost();
  const uploadMedia = useUploadMedia();
  const postPreview = usePostPreview();
  const postPreviewRef = useRef(postPreview);
  postPreviewRef.current = postPreview;

  const accounts = accountsData?.data || [];
  const connectedAccounts = accounts.filter(
    (a) => a.status === "connected" && !isPaused(a.id),
  );
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);

  // Platform configs
  const [tiktokPrivacy, setTiktokPrivacy] = useState<"public" | "private">(
    "public",
  );
  const [tiktokAllowDuet, setTiktokAllowDuet] = useState(true);
  const [tiktokAllowStitch, setTiktokAllowStitch] = useState(true);
  const [tiktokAllowComment, setTiktokAllowComment] = useState(true);
  const [tiktokAutoAddMusic, setTiktokAutoAddMusic] = useState(true);
  const [tiktokIsDraft, setTiktokIsDraft] = useState(false);
  const [tiktokDiscloseBrand, setTiktokDiscloseBrand] = useState(false);
  const [tiktokDiscloseBrandedContent, setTiktokDiscloseBrandedContent] =
    useState(false);
  const [tiktokIsAIGenerated, setTiktokIsAIGenerated] = useState(false);
  const [instagramPlacement, setInstagramPlacement] = useState<
    "reels" | "stories" | "timeline"
  >("timeline");
  const [facebookPlacement, setFacebookPlacement] = useState<
    "timeline" | "reels"
  >("timeline");
  const [youtubePrivacy, setYoutubePrivacy] = useState<
    "public" | "private" | "unlisted"
  >("public");
  const [youtubeMadeForKids, setYoutubeMadeForKids] = useState(false);
  const [xReplySettings, setXReplySettings] = useState<
    "following" | "mentionedUsers" | "subscribers" | "verified"
  >("following");
  const [pinterestBoardId, setPinterestBoardId] = useState("");
  const [pinterestLink, setPinterestLink] = useState("");

  const hasUploadingMedia = mediaFiles.some((f) => f.status === "uploading");
  const hasUploadErrors = mediaFiles.some((f) => f.status === "error");
  const uploadedMedia = useMemo(
    () =>
      mediaFiles
        .filter((f) => f.status === "success")
        .map((f) => ({
          url: f.uploadedUrl!,
          skip_processing: f.skipProcessing || false,
        })),
    [mediaFiles],
  );

  // Get selected platforms for character limit calculation
  const selectedPlatforms = useMemo(
    () =>
      selectedAccountIds
        .map((id) => accounts.find((a) => a.id === id)?.platform)
        .filter(Boolean) as string[],
    [selectedAccountIds, accounts],
  );

  // Calculate character limits
  const characterLimit = useMemo(
    () => getMostRestrictiveLimit(selectedPlatforms),
    [selectedPlatforms],
  );
  const warningThreshold = useMemo(
    () => getWarningThreshold(characterLimit),
    [characterLimit],
  );
  const dangerThreshold = useMemo(
    () => getDangerThreshold(characterLimit),
    [characterLimit],
  );
  const isOverLimit =
    characterLimit !== Infinity && content.length > characterLimit;
  const isNearLimit =
    characterLimit !== Infinity && content.length >= warningThreshold;
  const charactersRemaining =
    characterLimit !== Infinity ? characterLimit - content.length : null;

  // Auto-save draft to localStorage
  useEffect(() => {
    const saveDraft = () => {
      if (
        content.trim() ||
        mediaFiles.length > 0 ||
        selectedAccountIds.length > 0
      ) {
        const draft = {
          content,
          scheduledDate,
          scheduledTime,
          selectedAccountIds,
          mediaFiles: mediaFiles
            .filter((f) => f.status === "success")
            .map((f) => ({
              url: f.uploadedUrl,
              preview: f.preview,
            })),
          platformConfigs: {
            tiktok: {
              tiktokPrivacy,
              tiktokAllowDuet,
              tiktokAllowStitch,
              tiktokAllowComment,
              tiktokAutoAddMusic,
              tiktokIsDraft,
            },
            instagram: { instagramPlacement },
            facebook: { facebookPlacement },
            youtube: { youtubePrivacy, youtubeMadeForKids },
            x: { xReplySettings },
          },
          timestamp: Date.now(),
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      } else {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    };

    const interval = setInterval(saveDraft, 3000); // Save every 3 seconds
    return () => {
      clearInterval(interval);
      saveDraft(); // Final save on unmount
    };
  }, [
    content,
    scheduledDate,
    scheduledTime,
    selectedAccountIds,
    mediaFiles,
    tiktokPrivacy,
    tiktokAllowDuet,
    tiktokAllowStitch,
    tiktokAllowComment,
    tiktokAutoAddMusic,
    tiktokIsDraft,
    instagramPlacement,
    facebookPlacement,
    youtubePrivacy,
    youtubeMadeForKids,
    xReplySettings,
  ]);

  // Restore draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        // Only restore if less than 24 hours old
        if (Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) {
          if (draft.content) setContent(draft.content);
          if (draft.scheduledDate) setScheduledDate(draft.scheduledDate);
          if (draft.scheduledTime) setScheduledTime(draft.scheduledTime);
          if (draft.selectedAccountIds?.length > 0)
            setSelectedAccountIds(draft.selectedAccountIds);
          // Platform configs restoration would go here
          toast.info("Restored your previous draft");
        } else {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    }
  }, []); // Empty deps - only on mount

  const toggleAccount = useCallback((accountId: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId],
    );
  }, []);

  const togglePlatformSection = (platform: string) => {
    setExpandedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform],
    );
  };

  // Comprehensive preview synchronization
  useEffect(() => {
    const generatePreview = async () => {
      if (!content.trim() || selectedAccountIds.length === 0) {
        setPreviews([]);
        setPreviewError(null);
        return;
      }

      // Skip if media is still uploading
      if (hasUploadingMedia) {
        return;
      }

      setIsGeneratingPreview(true);
      setPreviewError(null);
      try {
        const previewAccounts = selectedAccountIds.map((id) => {
          const account = accounts.find((a) => a.id === id);
          return {
            id: id,
            platform: account?.platform || "unknown",
            username: account?.username || undefined,
          };
        });

        const platformConfigs: Record<string, PlatformConfig> = {};
        const hasTikTok = selectedAccountIds.some(
          (id) => accounts.find((a) => a.id === id)?.platform === "tiktok",
        );
        const hasInstagram = selectedAccountIds.some(
          (id) => accounts.find((a) => a.id === id)?.platform === "instagram",
        );
        const hasFacebook = selectedAccountIds.some(
          (id) => accounts.find((a) => a.id === id)?.platform === "facebook",
        );
        const hasYouTube = selectedAccountIds.some(
          (id) => accounts.find((a) => a.id === id)?.platform === "youtube",
        );
        const hasX = selectedAccountIds.some((id) => {
          const p = accounts.find((a) => a.id === id)?.platform;
          return p === "x" || p === "twitter";
        });
        const hasPinterest = selectedAccountIds.some(
          (id) => accounts.find((a) => a.id === id)?.platform === "pinterest",
        );

        if (hasTikTok) {
          platformConfigs.tiktok = {
            privacy_status: tiktokPrivacy,
            allow_comment: tiktokAllowComment,
            allow_duet: tiktokAllowDuet,
            allow_stitch: tiktokAllowStitch,
            auto_add_music: tiktokAutoAddMusic,
            is_draft: tiktokIsDraft,
            disclose_your_brand: tiktokDiscloseBrand,
            disclose_branded_content: tiktokDiscloseBrandedContent,
            is_ai_generated: tiktokIsAIGenerated,
          };
        }
        if (hasInstagram)
          platformConfigs.instagram = { placement: instagramPlacement };
        if (hasFacebook)
          platformConfigs.facebook = { placement: facebookPlacement };
        if (hasYouTube)
          platformConfigs.youtube = {
            privacy_status: youtubePrivacy,
            made_for_kids: youtubeMadeForKids,
          };
        if (hasX) platformConfigs.x = { reply_settings: xReplySettings };
        if (hasPinterest) {
          platformConfigs.pinterest = {
            board_ids: pinterestBoardId ? [pinterestBoardId] : undefined,
            link: pinterestLink || undefined,
          };
        }

        const result = await postPreviewRef.current.mutateAsync({
          caption: content,
          preview_social_accounts: previewAccounts,
          platform_configurations:
            Object.keys(platformConfigs).length > 0
              ? platformConfigs
              : undefined,
          media:
            uploadedMedia.length > 0
              ? uploadedMedia.map((m) => ({ url: m.url, skip_processing: m.skip_processing }))
              : undefined,
        });

        // API returns array directly, not { data: [...] }
        const previewsArray = Array.isArray(result) ? result : (result.data || []);
        const previewsWithMedia = previewsArray.map((preview) => ({
          ...preview,
          media: preview.media || [],
        }));

        setPreviews(previewsWithMedia);
      } catch (error) {
        console.error("Preview generation failed:", error);
        setPreviewError(error instanceof Error ? error.message : "Failed to generate preview");
      } finally {
        setIsGeneratingPreview(false);
      }
    };

    const debounceTimer = setTimeout(generatePreview, 400);
    return () => clearTimeout(debounceTimer);
  }, [
    content,
    selectedAccountIds,
    uploadedMedia,
    accounts,
    tiktokPrivacy,
    tiktokAllowComment,
    tiktokAllowDuet,
    tiktokAllowStitch,
    tiktokAutoAddMusic,
    tiktokIsDraft,
    tiktokDiscloseBrand,
    tiktokDiscloseBrandedContent,
    tiktokIsAIGenerated,
    instagramPlacement,
    facebookPlacement,
    youtubePrivacy,
    youtubeMadeForKids,
    xReplySettings,
    pinterestBoardId,
    pinterestLink,
    previewRefreshTrigger,
  ]);

  const handleMediaSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const processFiles = async () => {
        const newFiles: MediaFile[] = await Promise.all(
          Array.from(files).map(async (file) => {
            const isVideo = file.type.startsWith("video/");
            let preview: string;

            if (isVideo) {
              preview = await new Promise((resolve) => {
                const video = document.createElement("video");
                video.preload = "metadata";
                video.onloadedmetadata = () => {
                  video.currentTime = Math.min(1, video.duration * 0.1);
                };
                video.onseeked = () => {
                  const canvas = document.createElement("canvas");
                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
                  const ctx = canvas.getContext("2d");
                  ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
                  resolve(canvas.toDataURL("image/jpeg"));
                };
                video.onerror = () => resolve(URL.createObjectURL(file));
                video.src = URL.createObjectURL(file);
              });
            } else {
              preview = URL.createObjectURL(file);
            }

            return {
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              file,
              preview,
              status: "uploading" as UploadStatus,
            };
          }),
        );

        setMediaFiles((prev) => [...prev, ...newFiles]);

        // Check if any images are being uploaded for TikTok-only selection
        const hasImages = newFiles.some((f) => !f.file.type.startsWith("video/"));
        const hasOnlyTikTok = selectedPlatforms.length === 1 && selectedPlatforms[0] === "tiktok";
        if (hasImages && hasOnlyTikTok) {
          toast.warning("TikTok only supports video posts. Images will not be posted to TikTok.");
        }

        // Upload files sequentially to avoid overwhelming the server
        for (const mediaFile of newFiles) {
          try {
            // Simulate progress updates
            const progressInterval = setInterval(() => {
              setMediaFiles((prev) =>
                prev.map((f) =>
                  f.id === mediaFile.id && f.status === "uploading"
                    ? {
                        ...f,
                        uploadProgress: Math.min(
                          (f.uploadProgress || 0) + Math.random() * 15,
                          85,
                        ),
                      }
                    : f,
                ),
              );
            }, 300);

            const result = await uploadMedia.mutateAsync({
              file: mediaFile.file,
              onProgress: (progress) => {
                setMediaFiles((prev) =>
                  prev.map((f) =>
                    f.id === mediaFile.id
                      ? { ...f, uploadProgress: progress }
                      : f,
                  ),
                );
              },
            });

            // Auto-enable skip_processing for large videos (>50MB)
            const isLargeVideo = mediaFile.file.type.startsWith("video/") && mediaFile.file.size > 50 * 1024 * 1024;

            clearInterval(progressInterval);

            setMediaFiles((prev) =>
              prev.map((f) =>
                f.id === mediaFile.id
                  ? {
                      ...f,
                      status: "success",
                      uploadedUrl: result.url,
                      uploadProgress: 100,
                      skipProcessing: isLargeVideo,
                    }
                  : f,
              ),
            );

            toast.success(`${mediaFile.file.name} uploaded successfully`);

            // Trigger preview refresh after successful upload
            setPreviewRefreshTrigger(prev => prev + 1);
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "Upload failed";
            console.error("[Upload] Error:", errorMsg);
            setMediaFiles((prev) =>
              prev.map((f) =>
                f.id === mediaFile.id
                  ? {
                      ...f,
                      status: "error",
                      error: errorMsg,
                      uploadProgress: 0,
                    }
                  : f,
              ),
            );
            toast.error(`Failed to upload ${mediaFile.file.name}: ${errorMsg}`);
          }
        }
      };

      processFiles();
      e.target.value = "";
    },
    [uploadMedia],
  );

  const removeMedia = useCallback((id: string) => {
    setMediaFiles((prev) => {
      const media = prev.find((f) => f.id === id);
      if (media?.preview) URL.revokeObjectURL(media.preview);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!content.trim()) {
      toast.error("Please enter some content");
      return;
    }
    if (selectedAccountIds.length === 0) {
      toast.error("Please select at least one account");
      return;
    }
    if (hasUploadingMedia) {
      toast.error("Please wait for media uploads to complete");
      return;
    }

    setIsSubmitting(true);

    const platformConfigs: Record<string, PlatformConfig> = {};
    const hasTikTok = selectedAccountIds.some(
      (id) => accounts.find((a) => a.id === id)?.platform === "tiktok",
    );
    const hasInstagram = selectedAccountIds.some(
      (id) => accounts.find((a) => a.id === id)?.platform === "instagram",
    );
    const hasFacebook = selectedAccountIds.some(
      (id) => accounts.find((a) => a.id === id)?.platform === "facebook",
    );
    const hasYouTube = selectedAccountIds.some(
      (id) => accounts.find((a) => a.id === id)?.platform === "youtube",
    );
    const hasX = selectedAccountIds.some((id) => {
      const p = accounts.find((a) => a.id === id)?.platform;
      return p === "x" || p === "twitter";
    });
    const hasPinterest = selectedAccountIds.some(
      (id) => accounts.find((a) => a.id === id)?.platform === "pinterest",
    );

    if (hasTikTok) {
      platformConfigs.tiktok = {
        privacy_status: tiktokPrivacy,
        allow_comment: tiktokAllowComment,
        allow_duet: tiktokAllowDuet,
        allow_stitch: tiktokAllowStitch,
        auto_add_music: tiktokAutoAddMusic,
        is_draft: tiktokIsDraft,
        disclose_your_brand: tiktokDiscloseBrand,
        disclose_branded_content: tiktokDiscloseBrandedContent,
        is_ai_generated: tiktokIsAIGenerated,
      };
    }
    if (hasInstagram)
      platformConfigs.instagram = { placement: instagramPlacement };
    if (hasFacebook)
      platformConfigs.facebook = { placement: facebookPlacement };
    if (hasYouTube)
      platformConfigs.youtube = {
        privacy_status: youtubePrivacy,
        made_for_kids: youtubeMadeForKids,
      };
    if (hasX) platformConfigs.x = { reply_settings: xReplySettings };
    if (hasPinterest) {
      platformConfigs.pinterest = {
        board_ids: pinterestBoardId ? [pinterestBoardId] : undefined,
        link: pinterestLink || undefined,
      };
    }

    const mediaForPost = mediaFiles
      .filter((f) => f.status === "success")
      .map((f) => ({
        url: f.uploadedUrl!,
        skip_processing: f.skipProcessing || false,
      }));

    try {
      await createPost.mutateAsync({
        caption: content,
        social_accounts: selectedAccountIds,
        scheduled_at:
          scheduledDate && scheduledTime
            ? `${scheduledDate}T${scheduledTime}`
            : undefined,
        media:
          mediaForPost.length > 0 ? mediaForPost : undefined,
        platform_configurations:
          Object.keys(platformConfigs).length > 0 ? platformConfigs : undefined,
      });

      // Clear draft on success
      localStorage.removeItem(DRAFT_STORAGE_KEY);

      toast.success(
        scheduledDate
          ? "Post scheduled successfully!"
          : "Post created successfully!",
      );
      router.push("/posts");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create post",
      );
      setIsSubmitting(false);
    }
  }, [
    content,
    selectedAccountIds,
    hasUploadingMedia,
    accounts,
    createPost,
    router,
    scheduledDate,
    scheduledTime,
    mediaFiles,
    tiktokPrivacy,
    tiktokAllowComment,
    tiktokAllowDuet,
    tiktokAllowStitch,
    tiktokAutoAddMusic,
    tiktokIsDraft,
    tiktokDiscloseBrand,
    tiktokDiscloseBrandedContent,
    tiktokIsAIGenerated,
    instagramPlacement,
    facebookPlacement,
    youtubePrivacy,
    youtubeMadeForKids,
    xReplySettings,
    pinterestBoardId,
    pinterestLink,
  ]);

  const canSubmit =
    content.trim().length > 0 &&
    selectedAccountIds.length > 0 &&
    !hasUploadingMedia &&
    !hasUploadErrors &&
    !isOverLimit;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <Link href="/posts">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Create Post</h1>
          <p className="text-slate-500 text-sm">
            Compose and preview your content
          </p>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="btn-gradient gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {scheduledDate ? "Scheduling..." : "Posting..."}
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              {scheduledDate ? "Schedule" : "Post"}
            </>
          )}
        </Button>
      </motion.div>

      <motion.div variants={itemVariants} className="divider-soft" />

      {/* 50:50 Layout - Preview first on mobile */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT SIDE - Editor */}
        <motion.div variants={containerVariants} className="space-y-6 order-2 lg:order-1">
          {/* Content Editor */}
          <motion.section variants={itemVariants} className="card-premium p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-slate-800 font-semibold flex items-center gap-2">
                <FileEdit className="w-4 h-4" />
                Content
              </h2>
              <div className="flex items-center gap-3">
                {selectedPlatforms.length > 0 &&
                  characterLimit !== Infinity && (
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-xs font-medium transition-colors",
                          isOverLimit
                            ? "text-red-500"
                            : isNearLimit
                              ? "text-amber-500"
                              : "text-slate-400",
                        )}
                      >
                        {charactersRemaining}
                      </span>
                      <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all duration-300",
                            isOverLimit
                              ? "bg-red-500"
                              : isNearLimit
                                ? "bg-amber-500"
                                : "bg-emerald-500",
                          )}
                          style={{
                            width: `${Math.min((content.length / characterLimit) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                {selectedPlatforms.length === 0 && (
                  <span className="text-xs text-slate-400">
                    Select accounts to see limits
                  </span>
                )}
                {content.length > 0 && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setContent("")}
                    className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Clear
                  </motion.button>
                )}
              </div>
            </div>

            <div className="relative">
              <textarea
                data-testid="post-caption-input"
                className={cn(
                  "min-h-[180px] w-full resize-none p-4 bg-slate-50 rounded-2xl text-slate-700 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all",
                  isOverLimit && "ring-2 ring-red-200 focus:ring-red-300",
                )}
                placeholder="What's on your mind? Share your thoughts, ideas, or updates..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              {isOverLimit && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-500 mt-2 flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  Over limit by {content.length - characterLimit} characters for{" "}
                  {selectedPlatforms.find((p) => {
                    const limits: Record<string, number> = {
                      x: 280,
                      twitter: 280,
                      instagram: 2200,
                      facebook: 63206,
                      linkedin: 3000,
                      tiktok: 2200,
                      threads: 500,
                      pinterest: 500,
                      youtube: 5000,
                      bluesky: 300,
                    };
                    return limits[p.toLowerCase()] === characterLimit;
                  })}
                </motion.p>
              )}
              {isNearLimit && !isOverLimit && characterLimit !== Infinity && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-amber-500 mt-2"
                >
                  Approaching character limit
                </motion.p>
              )}
            </div>

            {/* Media Upload */}
            <div className="mt-4 flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleMediaSelect}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={hasUploadingMedia}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all active:scale-95"
              >
                <ImageIcon className="w-4 h-4 text-slate-600" />
                <span className="text-sm text-slate-600 font-medium">
                  Add Media
                </span>
              </button>
              {mediaFiles.length > 0 && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs text-slate-400"
                >
                  {mediaFiles.filter((f) => f.status === "success").length} of{" "}
                  {mediaFiles.length} ready
                </motion.span>
              )}
            </div>

            {/* Upload status indicator */}
            <AnimatePresence mode="popLayout">
              {mediaFiles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4"
                >
                  <div className="flex flex-wrap gap-2">
                    {mediaFiles.map((media) => (
                      <motion.div
                        key={media.id}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs",
                          media.status === "uploading" &&
                            "bg-amber-50 text-amber-600",
                          media.status === "success" &&
                            "bg-emerald-50 text-emerald-600",
                          media.status === "error" && "bg-red-50 text-red-600",
                        )}
                      >
                        {media.status === "uploading" && (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        )}
                        {media.status === "success" && !isGeneratingPreview && (
                          <Check className="w-3 h-3" />
                        )}
                        {media.status === "success" && isGeneratingPreview && (
                          <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                        )}
                        {media.status === "error" && (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        <span className="truncate max-w-[120px]">
                          {media.file.name}
                          {media.status === "success" && isGeneratingPreview && (
                            <span className="ml-1 text-[10px] text-amber-600">(syncing preview...)</span>
                          )}
                        </span>
                        <button
                          onClick={() => removeMedia(media.id)}
                          className="hover:text-slate-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>

          {/* Account Selection */}
          <motion.section variants={itemVariants} className="card-premium p-6">
            <h2 className="text-slate-800 font-semibold mb-4 flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Accounts
              {selectedAccountIds.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-2 px-2 py-0.5 bg-slate-800 text-white text-xs rounded-full"
                >
                  {selectedAccountIds.length}
                </motion.span>
              )}
            </h2>

            {accountsLoading ? (
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-14 bg-slate-100 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : connectedAccounts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200"
              >
                <Smartphone className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm mb-3">
                  No accounts connected
                </p>
                <Link href="/accounts/connect">
                  <Button variant="soft" size="sm">
                    Connect Account
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {connectedAccounts.map((account, idx) => {
                  const PlatformIcon = getPlatformIcon(account.platform);
                  const isSelected = selectedAccountIds.includes(account.id);
                  return (
                    <motion.button
                      key={account.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => toggleAccount(account.id)}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                        isSelected
                          ? "bg-slate-800 border-slate-800 text-white"
                          : "bg-transparent border-slate-100 hover:border-slate-200 text-slate-700",
                      )}
                    >
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                          isSelected ? "bg-white/10" : "bg-slate-100",
                        )}
                      >
                        {PlatformIcon ? (
                          <PlatformIcon
                            className={cn(
                              "w-5 h-5",
                              isSelected ? "text-white" : "text-slate-600",
                            )}
                          />
                        ) : (
                          account.platform[0]
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium block truncate">
                          @{account.username || account.platform}
                        </span>
                        <span
                          className={cn(
                            "text-xs",
                            isSelected ? "text-white/60" : "text-slate-400",
                          )}
                        >
                          {account.platform}
                        </span>
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"
                        >
                          <Check className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.section>

          {/* Schedule */}
          <motion.section variants={itemVariants} className="card-premium p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-slate-800 font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Schedule
              </h2>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <div
                  className={cn(
                    "w-10 h-6 rounded-full transition-colors relative",
                    scheduledDate || scheduledTime
                      ? "bg-slate-800"
                      : "bg-slate-200",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={!!scheduledDate || !!scheduledTime}
                    onChange={(e) => {
                      if (!e.target.checked) {
                        setScheduledDate("");
                        setScheduledTime("");
                      } else {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        tomorrow.setHours(9, 0, 0, 0);
                        setScheduledDate(tomorrow.toISOString().split("T")[0]);
                        setScheduledTime("09:00");
                      }
                    }}
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                      scheduledDate || scheduledTime
                        ? "translate-x-5"
                        : "translate-x-1",
                    )}
                  />
                </div>
                <span className="text-slate-600">Schedule for later</span>
              </label>
            </div>

            <AnimatePresence>
              {(scheduledDate || scheduledTime) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">
                        Date
                      </label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-sm border-0 focus:ring-2 focus:ring-slate-200 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">
                        Time
                      </label>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-sm border-0 focus:ring-2 focus:ring-slate-200 transition-all"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Your local timezone
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {!scheduledDate && !scheduledTime && (
              <p className="text-sm text-slate-400">
                Post will be published immediately
              </p>
            )}
          </motion.section>
        </motion.div>

        {/* RIGHT SIDE - Preview (first on mobile) */}
        <motion.div variants={containerVariants} className="space-y-6 order-1 lg:order-2">
          {/* Live Preview */}
          <motion.section variants={itemVariants} className="card-premium p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-slate-800 font-semibold flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Preview
                {previews.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
                    {previews.length}
                  </span>
                )}
              </h2>
              {isGeneratingPreview && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-amber-500 flex items-center gap-1.5"
                >
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {uploadedMedia.length > 0 && content.length > 0 ? 'Syncing preview...' : 'Updating...'}
                </motion.span>
              )}
            </div>

            <AnimatePresence mode="wait">
              {isGeneratingPreview && previews.length === 0 ? (
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <PreviewSkeleton />
                </motion.div>
              ) : previewError ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12 bg-red-50 rounded-2xl border border-red-100"
                >
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  </div>
                  <p className="text-red-600 font-medium mb-1">Preview failed</p>
                  <p className="text-red-400 text-sm max-w-xs mx-auto">{previewError}</p>
                </motion.div>
              ) : previews.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <EmptyPreviewState
                    hasAccounts={selectedAccountIds.length > 0}
                    hasContent={content.length > 0}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="previews"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar"
                >
                  <AnimatePresence>
                    {previews.map((preview, idx) => (
                      <PreviewCard
                        key={`${preview.social_account_id}-${idx}`}
                        preview={preview}
                        platform={preview.platform}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>

          {/* Platform Options */}
          {selectedAccountIds.length > 0 && (
            <motion.section
              variants={itemVariants}
              className="card-premium p-6"
            >
              <h2 className="text-slate-800 font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Platform Options
              </h2>
              <div className="space-y-3">
                {/* TikTok */}
                {selectedPlatforms.includes("tiktok") && (
                  <PlatformOptions
                    title="TikTok"
                    platform="tiktok"
                    isOpen={expandedPlatforms.includes("tiktok")}
                    onToggle={() => togglePlatformSection("tiktok")}
                  >
                    <select
                      value={tiktokPrivacy}
                      onChange={(e) =>
                        setTiktokPrivacy(e.target.value as "public" | "private")
                      }
                      className="w-full px-3 py-2 bg-white rounded-lg text-sm border border-slate-200 focus:ring-2 focus:ring-slate-200"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        {
                          label: "Allow Duet",
                          checked: tiktokAllowDuet,
                          onChange: setTiktokAllowDuet,
                        },
                        {
                          label: "Allow Stitch",
                          checked: tiktokAllowStitch,
                          onChange: setTiktokAllowStitch,
                        },
                        {
                          label: "Comments",
                          checked: tiktokAllowComment,
                          onChange: setTiktokAllowComment,
                        },
                        {
                          label: "Save as Draft",
                          checked: tiktokIsDraft,
                          onChange: setTiktokIsDraft,
                        },
                      ].map(({ label, checked, onChange }) => (
                        <label
                          key={label}
                          className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1.5 rounded transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => onChange(e.target.checked)}
                            className="rounded border-slate-300 text-slate-800 focus:ring-slate-200"
                          />
                          <span className="text-slate-600">{label}</span>
                        </label>
                      ))}
                    </div>
                  </PlatformOptions>
                )}

                {/* Instagram */}
                {selectedPlatforms.includes("instagram") && (
                  <PlatformOptions
                    title="Instagram"
                    platform="instagram"
                    isOpen={expandedPlatforms.includes("instagram")}
                    onToggle={() => togglePlatformSection("instagram")}
                  >
                    <select
                      value={instagramPlacement}
                      onChange={(e) =>
                        setInstagramPlacement(
                          e.target.value as "reels" | "stories" | "timeline",
                        )
                      }
                      className="w-full px-3 py-2 bg-white rounded-lg text-sm border border-slate-200 focus:ring-2 focus:ring-slate-200"
                    >
                      <option value="timeline">Feed Post</option>
                      <option value="reels">Reels</option>
                      <option value="stories">Stories</option>
                    </select>
                  </PlatformOptions>
                )}

                {/* YouTube */}
                {selectedPlatforms.includes("youtube") && (
                  <PlatformOptions
                    title="YouTube"
                    platform="youtube"
                    isOpen={expandedPlatforms.includes("youtube")}
                    onToggle={() => togglePlatformSection("youtube")}
                  >
                    <select
                      value={youtubePrivacy}
                      onChange={(e) =>
                        setYoutubePrivacy(
                          e.target.value as "public" | "private" | "unlisted",
                        )
                      }
                      className="w-full px-3 py-2 bg-white rounded-lg text-sm border border-slate-200 focus:ring-2 focus:ring-slate-200"
                    >
                      <option value="public">Public</option>
                      <option value="unlisted">Unlisted</option>
                      <option value="private">Private</option>
                    </select>
                    <label className="flex items-center gap-2 cursor-pointer text-xs hover:bg-slate-100 p-1.5 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={youtubeMadeForKids}
                        onChange={(e) =>
                          setYoutubeMadeForKids(e.target.checked)
                        }
                        className="rounded border-slate-300 text-slate-800 focus:ring-slate-200"
                      />
                      <span className="text-slate-600">Made for Kids</span>
                    </label>
                  </PlatformOptions>
                )}

                {/* X/Twitter */}
                {(selectedPlatforms.includes("x") ||
                  selectedPlatforms.includes("twitter")) && (
                  <PlatformOptions
                    title="X (Twitter)"
                    platform="x"
                    isOpen={expandedPlatforms.includes("x")}
                    onToggle={() => togglePlatformSection("x")}
                  >
                    <label className="text-xs text-slate-500 mb-1.5 block">
                      Who can reply?
                    </label>
                    <select
                      value={xReplySettings}
                      onChange={(e) =>
                        setXReplySettings(
                          e.target.value as
                            | "following"
                            | "mentionedUsers"
                            | "subscribers"
                            | "verified",
                        )
                      }
                      className="w-full px-3 py-2 bg-white rounded-lg text-sm border border-slate-200 focus:ring-2 focus:ring-slate-200"
                    >
                      <option value="following">Everyone</option>
                      <option value="mentionedUsers">People you follow</option>
                      <option value="subscribers">Only subscribers</option>
                      <option value="verified">Only verified</option>
                    </select>
                  </PlatformOptions>
                )}
              </div>
            </motion.section>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
