"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import {
  X,
  Send,
  Calendar,
  Clock,
  Sparkles,
  Users,
  Loader2,
  ArrowLeft,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  CalendarDays,
  Globe,
  Zap,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, isPast } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadedFile } from "@/components/ui/file-upload";
import { cn } from "@/lib/utils";

import { MediaUploadEnhanced } from "./_components/MediaUploadEnhanced";
import { PlatformSelectorEnhanced } from "./_components/PlatformSelectorEnhanced";
import { getPlatformIcon } from "@/lib/social-platforms";
import { PlatformPreview } from "@/components/post-preview-platform";
import {
  useSocialAccounts,
  usePost,
  useCreatePost,
  useUpdatePost,
  useDeletePost,
  useUploadMedia,
  usePosts,
  usePostPreview,
} from "@/lib/hooks";
import { usePostsLayout } from "../layout";
import type { PlatformConfigBuilder, SocialPost } from "@/types/post-for-me-types";
import {
  PLATFORM_CHARACTER_LIMITS,
  getMostRestrictiveLimit,
  getWarningThreshold,
} from "@/types/post-for-me-types";
import { UPLOAD, TIME, PAGINATION, UI } from "@/lib/constants";
import { TemplateGallery } from "@/components/template-gallery";
import type { PostTemplate } from "@/lib/templates/social-templates";


// Constants - defined outside component to avoid recreation
const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;
const DEBOUNCE_DELAY_MS = 800;
const PREVIEW_WIDTH_PX = 380;
const DRAFT_STORAGE_KEY = "hypesocial_post_draft_v3";
const CALENDAR_START_HOUR = 6;
const CALENDAR_END_HOUR = 22;
const TIME_SLOT_INTERVAL_MINUTES = 30;

interface DraftData {
  content: string;
  scheduledDate: string;
  scheduledTime: string;
  selectedAccountIds: string[];
  timestamp: number;
}

interface MiniCalendarProps {
  selectedDate?: Date;
  onSelectDate: (date: Date) => void;
  posts: SocialPost[];
}

function getDayClassNames(
  isCurrentMonth: boolean,
  isPastDate: boolean,
  isSelected: boolean,
  isTodayDate: boolean
): string {
  const baseClasses = "relative aspect-square p-1 flex flex-col items-center justify-center transition-all";
  
  if (!isCurrentMonth) {
    return cn(baseClasses, "opacity-30");
  }
  if (isPastDate) {
    return cn(baseClasses, "opacity-20 cursor-not-allowed");
  }
  if (isSelected) {
    return cn(baseClasses, "bg-blue-500 text-white");
  }
  if (isTodayDate) {
    return cn(baseClasses, "bg-blue-50 dark:bg-blue-500/10 text-blue-600");
  }
  return cn(baseClasses, "hover:bg-slate-50 dark:hover:bg-slate-800");
}

function getDayTextClassNames(isSelected: boolean, isTodayDate: boolean): string {
  const baseClasses = "text-sm font-medium";
  if (isSelected) {
    return cn(baseClasses, "text-white");
  }
  if (isTodayDate) {
    return cn(baseClasses, "text-blue-600");
  }
  return cn(baseClasses, "text-slate-700 dark:text-slate-300");
}

// ==================== MINI CALENDAR COMPONENT ====================
function MiniCalendar({
  selectedDate,
  onSelectDate,
  posts,
}: MiniCalendarProps): React.ReactElement {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getPostsForDay = useCallback((day: Date) => {
    return posts.filter((post) => {
      if (!post.scheduled_at) return false;
      return isSameDay(new Date(post.scheduled_at), day);
    });
  }, [posts]);

  function handlePreviousMonth(): void {
    setCurrentMonth((previous) => subMonths(previous, 1));
  }

  function handleNextMonth(): void {
    setCurrentMonth((previous) => addMonths(previous, 1));
  }

  function handleSelectDate(day: Date, isPastDate: boolean): void {
    if (!isPastDate) {
      onSelectDate(day);
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={handlePreviousMonth}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-semibold text-sm">
          {format(currentMonth, "MMMM yyyy")}
        </span>
        <button
          onClick={handleNextMonth}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-0">
        {WEEK_DAYS.map((day) => (
          <div
            key={day}
            className="text-center text-[10px] font-medium text-slate-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-0">
        {days.map((day) => {
          const dayPosts = getPostsForDay(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isTodayDate = isToday(day);
          const isPastDate = isPast(day) && !isTodayDate;

          return (
            <button
              key={day.toISOString()}
              onClick={() => handleSelectDate(day, isPastDate)}
              disabled={isPastDate}
              aria-label={`${format(day, "MMMM d")}${dayPosts.length > 0 ? `, ${dayPosts.length} posts scheduled` : ""}`}
              aria-pressed={isSelected}
              className={getDayClassNames(isCurrentMonth, isPastDate, !!isSelected, isTodayDate)}
            >
              <span className={getDayTextClassNames(!!isSelected, isTodayDate)}>
                {format(day, "d")}
              </span>
              {dayPosts.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayPosts.slice(0, UI.MAX_MEDIA_PREVIEW).map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        "w-1 h-1 rounded-full",
                        isSelected ? "bg-white/70" : "bg-blue-500"
                      )}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface TimeSlotsProps {
  selectedTime: string;
  onSelectTime: (time: string) => void;
  selectedDate?: Date;
  existingPosts: SocialPost[];
}

function getTimeSlotClassNames(isSelected: boolean, hasConflict: boolean): string {
  const baseClasses = "px-2 py-2 rounded-lg text-xs font-medium transition-all border";
  
  if (isSelected) {
    return cn(baseClasses, "bg-blue-500 text-white border-blue-500");
  }
  if (hasConflict) {
    return cn(baseClasses, "bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-300");
  }
  return cn(baseClasses, "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300");
}

// ==================== TIME SLOTS COMPONENT ====================
function TimeSlots({
  selectedTime,
  onSelectTime,
  selectedDate,
  existingPosts,
}: TimeSlotsProps): React.ReactElement {
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = CALENDAR_START_HOUR; hour <= CALENDAR_END_HOUR; hour++) {
      for (let minute = 0; minute < 60; minute += TIME_SLOT_INTERVAL_MINUTES) {
        const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        slots.push(time);
      }
    }
    return slots;
  }, []);

  const getPostsAtTime = useCallback((time: string) => {
    if (!selectedDate) return [];
    const [hoursStr, minutesStr] = time.split(":");
    const hours = parseInt(hoursStr ?? "0", 10);
    const minutes = parseInt(minutesStr ?? "0", 10);
    const checkDate = new Date(selectedDate);
    checkDate.setHours(hours, minutes);

    return existingPosts.filter((post) => {
      if (!post.scheduled_at) return false;
      const postDate = new Date(post.scheduled_at);
      return isSameDay(postDate, checkDate) && postDate.getHours() === hours && postDate.getMinutes() === minutes;
    });
  }, [selectedDate, existingPosts]);

  return (
    <div className="grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto p-1">
      {timeSlots.map((time) => {
        const postsAtTime = getPostsAtTime(time);
        const isSelected = time === selectedTime;
        const hasConflict = postsAtTime.length > 0;

        return (
          <button
            key={time}
            onClick={() => onSelectTime(time)}
            aria-pressed={isSelected}
            aria-label={`${time}${hasConflict ? `, ${postsAtTime.length} posts scheduled` : ""}`}
            className={getTimeSlotClassNames(isSelected, hasConflict)}
          >
            {time}
            {hasConflict && (
              <span className="ml-1 text-[9px]">({postsAtTime.length})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface PreviewAccount {
  id: string;
  platform: string;
  username: string | undefined;
}

// ==================== MAIN COMPOSE PANEL ====================
export default function ComposePanel(): React.ReactElement {
  const searchParams = useSearchParams();
  const { closeCompose, editingPostId, setEditingPostId } = usePostsLayout();

  // Sync URL edit param with context
  const urlEditId = searchParams.get("edit");
  useEffect(() => {
    if (urlEditId && urlEditId !== editingPostId) {
      setEditingPostId(urlEditId);
    }
  }, [urlEditId, editingPostId, setEditingPostId]);

  const editPostId = editingPostId;
  const isEditMode = !!editPostId;

  // Form state
  const [content, setContent] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("compose");
  const [showPreview, setShowPreview] = useState(false);

  // Data fetching
  const { data: accountsData } = useSocialAccounts();
  const { data: existingPost } = usePost(editPostId ?? "");
  const { data: allPosts = [] } = usePosts(
    { limit: PAGINATION.DEFAULT_LIMIT },
    { select: (response) => response?.data ?? [] }
  );
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();
  const uploadMedia = useUploadMedia();
  const postPreview = usePostPreview();

  const accounts = useMemo(() => accountsData?.data ?? [], [accountsData]);
  const connectedAccounts = accounts.filter((account) => account.status === "connected");

  // Debounced preview API call
  useEffect(() => {
    if (!showPreview || selectedAccountIds.length === 0) return;
    if (!content.trim() && files.length === 0) return;

    const timer = setTimeout(() => {
      const previewAccounts: PreviewAccount[] = selectedAccountIds
        .map((id) => accounts.find((account) => account.id === id))
        .filter((account): account is NonNullable<typeof account> => Boolean(account))
        .map((account) => ({
          id: account.id,
          platform: account.platform,
          username: account.username ?? undefined,
        }));

      if (previewAccounts.length === 0) return;

      postPreview.mutate({
        caption: content,
        preview_social_accounts: previewAccounts,
        media: files
          .filter((file) => file.status === "success" && file.uploadedUrl)
          .map((file) => ({
            url: file.uploadedUrl!,
            skip_processing: file.file.size > UPLOAD.SKIP_PROCESSING_THRESHOLD,
          })),
      });
    }, DEBOUNCE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [content, files, selectedAccountIds, showPreview, accounts, postPreview]);

  // Derived data
  const selectedPlatforms = selectedAccountIds
    .map((id) => accounts.find((account) => account.id === id)?.platform)
    .filter((platform): platform is string => Boolean(platform));

  const characterLimit = getMostRestrictiveLimit(selectedPlatforms);
  const warningThreshold = getWarningThreshold(characterLimit);
  const isOverLimit = characterLimit !== Infinity && content.length > characterLimit;
  const isNearLimit = characterLimit !== Infinity && content.length >= warningThreshold;
  const charactersRemaining = characterLimit !== Infinity ? characterLimit - content.length : null;

  // Load existing post data
  useEffect(() => {
    if (!isEditMode || !existingPost) return;

    setContent(existingPost.caption ?? "");
    if (existingPost.scheduled_at) {
      const date = new Date(existingPost.scheduled_at);
      setScheduledDate(date);
      setScheduledTime(format(date, "HH:mm"));
    }
    if (existingPost.social_accounts) {
      setSelectedAccountIds(existingPost.social_accounts.map((account) => account.id));
    }
    if (existingPost.media) {
      const loadedFiles: UploadedFile[] = existingPost.media.map((mediaItem, index) => ({
        id: `existing-${index}`,
        file: new File([], `media-${index}`),
        preview: mediaItem.url,
        uploadedUrl: mediaItem.url,
        status: "success" as const,
        progress: 100,
      }));
      setFiles(loadedFiles);
    }
  }, [isEditMode, existingPost]);

  // Auto-save draft
  useEffect(() => {
    if (isEditMode) return;
    if (!content.trim() && files.length === 0 && selectedAccountIds.length === 0) return;

    const draft: DraftData = {
      content,
      scheduledDate: scheduledDate?.toISOString() ?? "",
      scheduledTime,
      selectedAccountIds,
      timestamp: Date.now(),
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [content, scheduledDate, scheduledTime, files, selectedAccountIds, isEditMode]);

  // Restore draft
  useEffect(() => {
    if (isEditMode) return;
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!saved) return;

    try {
      const draft: DraftData = JSON.parse(saved);
      if (Date.now() - draft.timestamp > TIME.DAY) {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        return;
      }
      if (draft.content) setContent(draft.content);
      if (draft.scheduledDate) setScheduledDate(new Date(draft.scheduledDate));
      if (draft.scheduledTime) setScheduledTime(draft.scheduledTime);
      if (draft.selectedAccountIds?.length) setSelectedAccountIds(draft.selectedAccountIds);
    } catch {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }, [isEditMode]);

  const handleUpload = async (file: UploadedFile): Promise<string> => {
    const result = await uploadMedia.mutateAsync({ file: file.file });
    return result.url;
  };

  const toggleAccount = (accountId: string): void => {
    setSelectedAccountIds((previous) =>
      previous.includes(accountId) ? previous.filter((id) => id !== accountId) : [...previous, accountId]
    );
  };

  function validateSubmit(): boolean {
    if (!content.trim() && files.length === 0) {
      toast.error("Please add some content or media");
      return false;
    }
    if (selectedAccountIds.length === 0) {
      toast.error("Please select at least one account");
      setActiveTab("accounts");
      return false;
    }
    if (isOverLimit) {
      toast.error(`Content exceeds the ${characterLimit} character limit`);
      return false;
    }
    return true;
  }

  function buildMediaUrls() {
    return files
      .filter((file) => file.status === "success")
      .map((file) => {
        const isVideo = file.file.type.startsWith("video/");
        const isLargeFile = file.file.size > UPLOAD.SKIP_PROCESSING_THRESHOLD;
        return {
          url: file.uploadedUrl!,
          content_type: file.file.type,
          skip_processing: isVideo && isLargeFile,
        };
      });
  }

  function buildPlatformConfigs(): PlatformConfigBuilder {
    const configs: PlatformConfigBuilder = {};
    if (selectedPlatforms.includes("instagram")) configs.instagram = { placement: "timeline" };
    if (selectedPlatforms.includes("tiktok")) configs.tiktok = { privacy_status: "public" };
    if (selectedPlatforms.includes("facebook")) configs.facebook = { placement: "timeline" };
    if (selectedPlatforms.includes("youtube")) configs.youtube = { privacy_status: "public" };
    return configs;
  }

  async function handleSubmit(): Promise<void> {
    if (!validateSubmit()) return;

    setIsSubmitting(true);

    try {
      const mediaUrls = buildMediaUrls();
      const platformConfigs = buildPlatformConfigs();

      const scheduledAt = scheduledDate
        ? new Date(`${format(scheduledDate, "yyyy-MM-dd")}T${scheduledTime}`).toISOString()
        : undefined;

      if (isEditMode && editPostId) {
        await updatePost.mutateAsync({
          id: editPostId,
          data: {
            caption: content,
            scheduled_at: scheduledAt,
            social_accounts: selectedAccountIds,
            media: mediaUrls,
            platform_configurations: platformConfigs,
          },
        });
      } else {
        await createPost.mutateAsync({
          caption: content,
          scheduled_at: scheduledAt,
          social_accounts: selectedAccountIds,
          media: mediaUrls,
          platform_configurations: platformConfigs,
        });
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setContent("");
        setFiles([]);
        setSelectedAccountIds([]);
        setScheduledDate(undefined);
      }

      closeCompose();
    } catch (submitError) {
      const errorMessage = isEditMode ? "Failed to update post" : "Failed to create post";
      toast.error(errorMessage);
      console.error("Post submission error:", submitError);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!editPostId) return;
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      await deletePost.mutateAsync(editPostId);
      closeCompose();
    } catch (deleteError) {
      toast.error("Failed to delete post");
      console.error("Delete post error:", deleteError);
    }
  }

  function handleTogglePreview(): void {
    setShowPreview((previous) => !previous);
  }

  function handleApplyTemplate(template: PostTemplate): void {
    setContent(template.caption);
    setActiveTab("compose");
    toast.success(`Template "${template.name}" applied!`);
  }

  const scheduledPosts = allPosts.filter((post) => post.scheduled_at && post.status === "scheduled");

  return (
    <div className="h-full flex flex-col bg-[#fafafa] dark:bg-[#0a0a0a]">
      {/* Header - Minimal */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-[#111111]/70 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="lg:hidden rounded-xl" onClick={closeCompose} aria-label="Go back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isEditMode ? "Edit Post" : "Create Post"}
            </h2>
            <p className="text-xs text-slate-500">
              {selectedAccountIds.length > 0
                ? `${selectedAccountIds.length} account${selectedAccountIds.length > 1 ? "s" : ""} selected`
                : "Select accounts to post"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleTogglePreview}
            className={cn("rounded-xl", showPreview && "bg-slate-100")}
            aria-label={showPreview ? "Hide preview" : "Show preview"}
            aria-pressed={showPreview}
          >
            <Eye className="w-5 h-5" />
          </Button>
          {isEditMode && (
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleDelete}
              disabled={deletePost.isPending}
              aria-label="Delete post"
            >
              {deletePost.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
            </Button>
          )}
          <Button variant="ghost" size="icon" className="hidden lg:flex" onClick={closeCompose} aria-label="Close composer">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Editor */}
        <div className={cn("flex-1 flex flex-col min-w-0 transition-all", showPreview && "lg:w-1/2")}>
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="mx-4 mt-3 grid grid-cols-4 bg-slate-100/80 dark:bg-slate-800/50 p-1 rounded-lg">
              <TabsTrigger value="compose" className="gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Compose</span>
              </TabsTrigger>
              <TabsTrigger value="accounts" className="gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Accounts</span>
                {selectedAccountIds.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-full text-slate-700 dark:text-slate-300">
                    {selectedAccountIds.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="schedule" className="gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">
                <CalendarDays className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Schedule</span>
                {scheduledDate && <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
              </TabsTrigger>
              <TabsTrigger value="templates" className="gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Templates</span>
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              {/* Compose Tab */}
              <TabsContent value="compose" className="mt-0 p-4 space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Textarea
                      placeholder="What's on your mind?"
                      value={content}
                      onChange={(event) => setContent(event.target.value)}
                      className={cn("min-h-[200px] text-base bg-white shadow-inner", isOverLimit && "ring-2 ring-red-400/50 bg-red-50")}
                    />
                    {charactersRemaining !== null && (
                      <CharacterCounter 
                        charactersRemaining={charactersRemaining} 
                        isOverLimit={isOverLimit} 
                        isNearLimit={isNearLimit} 
                      />
                    )}
                  </div>

                  {/* Platform Character Limits */}
                  {selectedPlatforms.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedPlatforms.map((platform) => {
                        const limit = PLATFORM_CHARACTER_LIMITS[platform] ?? Infinity;
                        const Icon = getPlatformIcon(platform);
                        const isExceeded = typeof limit === "number" && content.length > limit;
                        if (!Icon) return null;
                        return (
                          <div
                            key={platform}
                            className={cn(
                              "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full shadow-sm",
                              isExceeded
                                ? "bg-rose-50 text-rose-600 ring-1 ring-rose-200"
                                : "bg-white text-slate-600 ring-1 ring-slate-200"
                            )}
                          >
                            <Icon className="w-3 h-3" />
                            <span className="capitalize">{platform}</span>
                            <span className={isExceeded ? "text-red-500 font-medium" : "text-slate-400"}>
                              {typeof limit === "number" ? `${content.length}/${limit}` : "∞"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Media Upload - Enhanced */}
                <MediaUploadEnhanced
                  files={files}
                  onFilesChange={setFiles}
                  onUpload={handleUpload}
                  maxFiles={PLATFORM_LIMITS.MAX_MEDIA_PER_POST}
                  maxSize={UPLOAD.MAX_FILE_SIZE}
                />
              </TabsContent>

              {/* Accounts Tab - Enhanced */}
              <TabsContent value="accounts" className="mt-0 p-4">
                <PlatformSelectorEnhanced
                  accounts={connectedAccounts}
                  selectedIds={selectedAccountIds}
                  onToggle={toggleAccount}
                  contentLength={content.length}
                />
              </TabsContent>

              {/* Schedule Tab */}
              <TabsContent value="schedule" className="mt-0 p-4 space-y-4">
                {/* Schedule Toggle */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Schedule Post</p>
                      <p className="text-xs text-slate-500">Choose when to publish</p>
                    </div>
                  </div>
                  <Switch
                    checked={!!scheduledDate}
                    onCheckedChange={(checked) => setScheduledDate(checked ? new Date() : undefined)}
                  />
                </div>

                {!scheduledDate && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8 text-slate-400"
                  >
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Enable scheduling to select date and time</p>
                    <p className="text-xs mt-1">Your post will be published immediately otherwise</p>
                  </motion.div>
                )}

                {scheduledDate && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-4"
                  >
                    {/* Calendar */}
                    <MiniCalendar
                      selectedDate={scheduledDate}
                      onSelectDate={setScheduledDate}
                      posts={scheduledPosts}
                    />

                    {/* Time Selection */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Select Time
                      </Label>
                      <TimeSlots
                        selectedTime={scheduledTime}
                        onSelectTime={setScheduledTime}
                        selectedDate={scheduledDate}
                        existingPosts={scheduledPosts}
                      />
                    </div>

                    {/* Summary */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/20">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm text-blue-900 dark:text-blue-100">
                            Scheduled for
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-200">
                            {format(
                              new Date(`${format(scheduledDate, "yyyy-MM-dd")}T${scheduledTime}`),
                              "EEEE, MMMM d 'at' h:mm a"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </TabsContent>

              {/* Templates Tab */}
              <TabsContent value="templates" className="mt-0 p-4 h-full">
                <TemplateGallery
                  onSelectTemplate={handleApplyTemplate}
                  selectedPlatform={selectedPlatforms[0]}
                />
              </TabsContent>
            </ScrollArea>
          </Tabs>

          {/* Footer - Minimal */}
          <div className="p-4 border-t border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-[#111111]/70">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                {selectedPlatforms.slice(0, UI.MAX_PLATFORM_ICONS).map((platform) => {
                  const Icon = getPlatformIcon(platform);
                  if (!Icon) return null;
                  return (
                    <div key={platform} className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                    </div>
                  );
                })}
                {selectedPlatforms.length > UI.MAX_PLATFORM_ICONS && (
                  <span className="text-xs text-slate-500">
                    +{selectedPlatforms.length - UI.MAX_PLATFORM_ICONS}
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500">{content.length} chars</span>
            </div>
            <div className="flex gap-2">
              {isEditMode && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  onClick={handleDelete}
                  disabled={deletePost.isPending}
                >
                  {deletePost.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </Button>
              )}
              <Button variant="outline" size="sm" className="flex-1 rounded-lg border-slate-200 dark:border-slate-700" onClick={closeCompose}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900"
                disabled={
                  isSubmitting ||
                  (!content.trim() && files.length === 0) ||
                  selectedAccountIds.length === 0 ||
                  isOverLimit
                }
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-1.5" />
                )}
                {isEditMode ? "Update" : scheduledDate ? "Schedule" : "Post"}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: PREVIEW_WIDTH_PX, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="hidden lg:block border-l border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-[#111111]/50 overflow-hidden"
            >
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60">
                  <h3 className="font-medium flex items-center gap-2 text-slate-800 dark:text-slate-200 text-sm">
                    <Eye className="w-4 h-4 text-slate-500" /> Preview
                  </h3>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {selectedPlatforms.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Select accounts to see preview</p>
                      </div>
                    ) : (
                      selectedAccountIds.map((accountId) => {
                        const account = accounts.find((a) => a.id === accountId);
                        if (!account) return null;
                        
                        // Find matching preview from API response
                        const apiPreview = postPreview.data?.find(
                          (preview) => preview.social_account_id === accountId
                        );
                        
                        return (
                          <PlatformPreview
                            key={accountId}
                            caption={apiPreview?.caption ?? content}
                            media={apiPreview?.media?.length ? apiPreview.media : files.map((file) => ({ url: file.preview ?? file.uploadedUrl ?? "" }))}
                            account={account}
                            isLoading={postPreview.isPending}
                          />
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface CharacterCounterProps {
  charactersRemaining: number;
  isOverLimit: boolean;
  isNearLimit: boolean;
}

function CharacterCounter({ charactersRemaining, isOverLimit, isNearLimit }: CharacterCounterProps): React.ReactElement {
  function getCounterClasses(): string {
    if (isOverLimit) {
      return "bg-rose-100 text-rose-600";
    }
    if (isNearLimit) {
      return "bg-amber-100 text-amber-600";
    }
    return "bg-blue-50 text-blue-600";
  }

  return (
    <div
      className={cn(
        "absolute bottom-3 right-3 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm",
        getCounterClasses()
      )}
    >
      {charactersRemaining}
    </div>
  );
}

import { PLATFORM_LIMITS } from "@/lib/constants";
