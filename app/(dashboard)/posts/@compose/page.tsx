"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import {
  X,
  Send,
  Calendar,
  Clock,
  Sparkles,
  ImageIcon,
  Users,
  Check,
  Loader2,
  ArrowLeft,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  CalendarDays,
  MapPin,
  Globe,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, isPast } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadedFile } from "@/components/ui/file-upload";
import { cn } from "@/lib/utils";

// Constants - defined outside component to avoid recreation
const SPRING_TRANSITION: Transition = { type: "spring", stiffness: 400, damping: 30 };
const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

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
import { UPLOAD } from "@/lib/constants";

// Auto-save draft key
const DRAFT_STORAGE_KEY = "hypesocial_post_draft_v3";

interface DraftData {
  content: string;
  scheduledDate: string;
  scheduledTime: string;
  selectedAccountIds: string[];
  timestamp: number;
}

// ==================== MINI CALENDAR COMPONENT ====================
function MiniCalendar({
  selectedDate,
  onSelectDate,
  posts,
}: {
  selectedDate?: Date;
  onSelectDate: (date: Date) => void;
  posts: SocialPost[];
}) {
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

  // Use constant defined outside component

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-semibold text-sm">
          {format(currentMonth, "MMMM yyyy")}
        </span>
        <button
          onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
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
              onClick={() => !isPastDate && onSelectDate(day)}
              disabled={isPastDate}
              aria-label={`${format(day, "MMMM d")}${dayPosts.length > 0 ? `, ${dayPosts.length} posts scheduled` : ''}`}
              aria-pressed={isSelected}
              className={cn(
                "relative aspect-square p-1 flex flex-col items-center justify-center transition-all",
                !isCurrentMonth && "opacity-30",
                isPastDate && "opacity-20 cursor-not-allowed",
                isSelected
                  ? "bg-blue-500 text-white"
                  : isTodayDate
                  ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <span
                className={cn(
                  "text-sm font-medium",
                  isSelected ? "text-white" : isTodayDate ? "text-blue-600" : "text-slate-700 dark:text-slate-300"
                )}
              >
                {format(day, "d")}
              </span>
              {dayPosts.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayPosts.slice(0, 3).map((_, i) => (
                    <div
                      key={i}
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

// ==================== TIME SLOTS COMPONENT ====================
function TimeSlots({
  selectedTime,
  onSelectTime,
  selectedDate,
  existingPosts,
}: {
  selectedTime: string;
  onSelectTime: (time: string) => void;
  selectedDate?: Date;
  existingPosts: SocialPost[];
}) {
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const time = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
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
            aria-label={`${time}${hasConflict ? `, ${postsAtTime.length} posts scheduled` : ''}`}
            className={cn(
              "px-2 py-2 rounded-lg text-xs font-medium transition-all border",
              isSelected
                ? "bg-blue-500 text-white border-blue-500"
                : hasConflict
                ? "bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-300"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300"
            )}
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



// ==================== MAIN COMPOSE PANEL ====================
export default function ComposePanel() {
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
  const { data: existingPost } = usePost(editPostId || "");
  const { data: allPosts = [] } = usePosts(
    { limit: 100 },
    { select: (r) => r?.data ?? [] }
  );
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();
  const uploadMedia = useUploadMedia();
  const postPreview = usePostPreview();

  // Debounced preview API call
  useEffect(() => {
    if (!showPreview || selectedAccountIds.length === 0) return;
    if (!content.trim() && files.length === 0) return;

    const timer = setTimeout(() => {
      const previewAccounts = selectedAccountIds
        .map((id) => accounts.find((a) => a.id === id))
        .filter(Boolean)
        .map((a) => ({
          id: a!.id,
          platform: a!.platform,
          username: a!.username || undefined,
        }));

      if (previewAccounts.length === 0) return;

      postPreview.mutate({
        caption: content,
        preview_social_accounts: previewAccounts,
        media: files
          .filter((f) => f.status === "success" && f.uploadedUrl)
          .map((f) => ({
            url: f.uploadedUrl!,
            skip_processing: f.file.size > 50 * 1024 * 1024,
          })),
      });
    }, 800); // Debounce 800ms

    return () => clearTimeout(timer);
  }, [content, files, selectedAccountIds, showPreview]);

  const accounts = accountsData?.data ?? [];
  const connectedAccounts = accounts.filter((a) => a.status === "connected");

  // Derived data
  const selectedPlatforms = selectedAccountIds
    .map((id) => accounts.find((a) => a.id === id)?.platform)
    .filter(Boolean) as string[];

  const characterLimit = getMostRestrictiveLimit(selectedPlatforms);
  const warningThreshold = getWarningThreshold(characterLimit);
  const isOverLimit = characterLimit !== Infinity && content.length > characterLimit;
  const isNearLimit = characterLimit !== Infinity && content.length >= warningThreshold;
  const charactersRemaining = characterLimit !== Infinity ? characterLimit - content.length : null;

  // Load existing post data
  useEffect(() => {
    if (!isEditMode || !existingPost) return;

    setContent(existingPost.caption || "");
    if (existingPost.scheduled_at) {
      const date = new Date(existingPost.scheduled_at);
      setScheduledDate(date);
      setScheduledTime(format(date, "HH:mm"));
    }
    if (existingPost.social_accounts) {
      setSelectedAccountIds(existingPost.social_accounts.map((a) => a.id));
    }
    if (existingPost.media) {
      const loadedFiles: UploadedFile[] = existingPost.media.map((m, index) => ({
        id: `existing-${index}`,
        file: new File([], `media-${index}`),
        preview: m.url,
        uploadedUrl: m.url,
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
      scheduledDate: scheduledDate?.toISOString() || "",
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
      if (Date.now() - draft.timestamp > 24 * 60 * 60 * 1000) {
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

  const toggleAccount = (accountId: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId]
    );
  };

  const handleSubmit = async () => {
    if (!content.trim() && files.length === 0) {
      toast.error("Please add some content or media");
      return;
    }
    if (selectedAccountIds.length === 0) {
      toast.error("Please select at least one account");
      setActiveTab("accounts");
      return;
    }
    if (isOverLimit) {
      toast.error(`Content exceeds the ${characterLimit} character limit`);
      return;
    }

    setIsSubmitting(true);

    try {
      const mediaUrls = files
        .filter((f) => f.status === "success")
        .map((f) => {
          const isVideo = f.file.type.startsWith("video/");
          const isLargeFile = f.file.size > UPLOAD.SKIP_PROCESSING_THRESHOLD;
          return {
            url: f.uploadedUrl!,
            content_type: f.file.type,
            // Skip processing for large videos to speed up uploads
            // Note: Increases failure risk if video doesn't meet platform requirements
            skip_processing: isVideo && isLargeFile,
          };
        });

      const platformConfigs: PlatformConfigBuilder = {};
      if (selectedPlatforms.includes("instagram")) platformConfigs.instagram = { placement: "timeline" };
      if (selectedPlatforms.includes("tiktok")) platformConfigs.tiktok = { privacy_status: "public" };
      if (selectedPlatforms.includes("facebook")) platformConfigs.facebook = { placement: "timeline" };
      if (selectedPlatforms.includes("youtube")) platformConfigs.youtube = { privacy_status: "public" };

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
    } catch (error) {
      toast.error(isEditMode ? "Failed to update post" : "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editPostId) return;
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      await deletePost.mutateAsync(editPostId);
      closeCompose();
    } catch {
      toast.error("Failed to delete post");
    }
  };

  const scheduledPosts = allPosts.filter((p) => p.scheduled_at && p.status === "scheduled");

  return (
    <div className="h-full flex flex-col bg-slate-50/80">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/60 bg-white/80 backdrop-blur-sm">
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
            onClick={() => setShowPreview(!showPreview)}
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
            <TabsList className="mx-4 mt-2 grid grid-cols-3 bg-slate-100/80 p-1 rounded-2xl">
              <TabsTrigger value="compose" className="gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span className="hidden sm:inline">Compose</span>
              </TabsTrigger>
              <TabsTrigger value="accounts" className="gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Users className="w-4 h-4 text-purple-500" />
                <span className="hidden sm:inline">Accounts</span>
                {selectedAccountIds.length > 0 && (
                  <Badge className="text-[10px] h-4 px-1.5 bg-blue-100 text-blue-600 border-0">
                    {selectedAccountIds.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="schedule" className="gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <CalendarDays className="w-4 h-4 text-emerald-500" />
                <span className="hidden sm:inline">Schedule</span>
                {scheduledDate && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
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
                      onChange={(e) => setContent(e.target.value)}
                      className={cn("min-h-[200px] text-base bg-white shadow-inner", isOverLimit && "ring-2 ring-red-400/50 bg-red-50")}
                    />
                    {charactersRemaining !== null && (
                      <div
                        className={cn(
                          "absolute bottom-3 right-3 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm",
                          isOverLimit
                            ? "bg-rose-100 text-rose-600"
                            : isNearLimit
                            ? "bg-amber-100 text-amber-600"
                            : "bg-blue-50 text-blue-600"
                        )}
                      >
                        {charactersRemaining}
                      </div>
                    )}
                  </div>

                  {/* Platform Character Limits */}
                  {selectedPlatforms.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedPlatforms.map((platform) => {
                        const limit = PLATFORM_CHARACTER_LIMITS[platform] ?? "∞";
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
                  maxFiles={10}
                  maxSize={100 * 1024 * 1024}
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
            </ScrollArea>
          </Tabs>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 space-y-3 bg-white/50">
            <div className="flex items-center gap-2">
              {selectedPlatforms.slice(0, 4).map((platform) => {
                const Icon = getPlatformIcon(platform);
                if (!Icon) return null;
                return (
                  <div key={platform} className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                );
              })}
              {selectedPlatforms.length > 4 && (
                <Badge className="text-[10px] bg-slate-100 text-slate-600 border-0">
                  +{selectedPlatforms.length - 4}
                </Badge>
              )}
              <span className="text-xs text-slate-400 ml-auto">{content.length} characters</span>
            </div>
            <div className="flex gap-2">
              {isEditMode && (
                <Button
                  variant="outline"
                  className="text-rose-500 border-rose-200 hover:bg-rose-50 rounded-xl"
                  onClick={handleDelete}
                  disabled={deletePost.isPending}
                >
                  {deletePost.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              )}
              <Button variant="outline" className="flex-1 rounded-xl border-slate-200" onClick={closeCompose}>
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-xl bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/25"
                disabled={
                  isSubmitting ||
                  (!content.trim() && files.length === 0) ||
                  selectedAccountIds.length === 0 ||
                  isOverLimit
                }
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEditMode ? "Updating..." : "Posting..."}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {isEditMode ? "Update" : scheduledDate ? "Schedule" : "Post Now"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="hidden lg:block border-l border-slate-200 bg-slate-50/80 overflow-hidden"
            >
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-slate-200 bg-white/50">
                  <h3 className="font-semibold flex items-center gap-2 text-slate-800">
                    <Eye className="w-4 h-4 text-blue-500" /> Preview
                  </h3>
                  <p className="text-xs text-slate-500">See how your post will look</p>
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
                          (p) => p.social_account_id === accountId
                        );
                        
                        return (
                          <PlatformPreview
                            key={accountId}
                            caption={apiPreview?.caption || content}
                            media={apiPreview?.media?.length ? apiPreview.media : files.map(f => ({ url: f.preview || f.uploadedUrl || "" }))}
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
