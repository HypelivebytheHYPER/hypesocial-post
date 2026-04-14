"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  Calendar,
  Clock,
  Sparkles,
  ImageIcon,
  Users,
  Loader2,
  Trash2,
  Eye,
  CalendarDays,
  Zap,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, isPast } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadedFile } from "@/components/ui/file-upload";
import { cn } from "@/lib/utils";
import { PAGINATION, UPLOAD, PLATFORM_LIMITS } from "@/lib/constants";

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

import { MediaUploadEnhanced } from "../../@compose/_components/MediaUploadEnhanced";
import { PlatformSelectorEnhanced } from "../../@compose/_components/PlatformSelectorEnhanced";
import {
  useSocialAccounts,
  usePost,
  useUpdatePost,
  useDeletePost,
  useUploadMedia,
  usePosts,
} from "@/lib/hooks";
import type { PlatformConfigBuilder } from "@/types/post-for-me-types";

// ==================== MINI CALENDAR (Same as compose) ====================
function MiniCalendar({
  selectedDate,
  onSelectDate,
  posts,
}: {
  selectedDate?: Date;
  onSelectDate: (date: Date) => void;
  posts: any[];
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getPostsForDay = useCallback((day: Date) => {
    return posts.filter((post: any) => {
      if (!post.scheduled_at) return false;
      return isSameDay(new Date(post.scheduled_at), day);
    });
  }, [posts]);

  // Use constant defined outside component

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-semibold text-sm">{format(currentMonth, "MMMM yyyy")}</span>
        <button
          onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0">
        {WEEK_DAYS.map((day) => (
          <div key={day} className="text-center text-[10px] font-medium text-slate-400 py-2">{day}</div>
        ))}
      </div>

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
              aria-label={`${format(day, "MMMM d")}${dayPosts.length > 0 ? `, ${dayPosts.length} posts scheduled` : ""}`}
              aria-pressed={isSelected}
              className={cn(
                "relative aspect-square p-1 flex flex-col items-center justify-center transition-all",
                !isCurrentMonth && "opacity-30",
                isPastDate && "opacity-20 cursor-not-allowed",
                isSelected ? "bg-blue-500 text-white" : isTodayDate ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600" : "hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <span className={cn("text-sm font-medium", isSelected ? "text-white" : isTodayDate ? "text-blue-600" : "text-slate-700 dark:text-slate-300")}>
                {format(day, "d")}
              </span>
              {dayPosts.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayPosts.slice(0, 3).map((_: any, i: number) => (
                    <div key={i} className={cn("w-1 h-1 rounded-full", isSelected ? "bg-white/70" : "bg-blue-500")} />
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

// ==================== TIME SLOTS (Same as compose) ====================
function TimeSlots({
  selectedTime,
  onSelectTime,
  selectedDate,
  existingPosts,
}: {
  selectedTime: string;
  onSelectTime: (time: string) => void;
  selectedDate?: Date;
  existingPosts: any[];
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

    return existingPosts.filter((post: any) => {
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
            {hasConflict && <span className="ml-1 text-[9px]">({postsAtTime.length})</span>}
          </button>
        );
      })}
    </div>
  );
}

// ==================== MAIN EDIT PAGE ====================
export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

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
  const { data: existingPost, isLoading } = usePost(postId);
  const { data: allPosts = [] } = usePosts({ limit: PAGINATION.DEFAULT_LIMIT }, { select: (r: any) => r?.data ?? [] });
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();
  const uploadMedia = useUploadMedia();

  const accounts = accountsData?.data ?? [];
  const connectedAccounts = accounts.filter((a: any) => a.status === "connected");
  const scheduledPosts = allPosts.filter((p: any) => p.scheduled_at && p.status === "scheduled");

  // Load existing post data
  useEffect(() => {
    if (!existingPost) return;

    setContent(existingPost.caption || "");
    if (existingPost.scheduled_at) {
      const date = new Date(existingPost.scheduled_at);
      setScheduledDate(date);
      setScheduledTime(format(date, "HH:mm"));
    }
    if (existingPost.social_accounts) {
      setSelectedAccountIds(existingPost.social_accounts.map((a: any) => a.id));
    }
    if (existingPost.media) {
      const loadedFiles: UploadedFile[] = existingPost.media.map((m: any, index: number) => ({
        id: `existing-${index}`,
        file: new File([], `media-${index}`),
        preview: m.url,
        uploadedUrl: m.url,
        status: "success" as const,
        progress: 100,
      }));
      setFiles(loadedFiles);
    }
  }, [existingPost]);

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
      const selectedPlatforms = selectedAccountIds
        .map((id) => accounts.find((a: any) => a.id === id)?.platform)
        .filter(Boolean) as string[];

      if (selectedPlatforms.includes("instagram")) platformConfigs.instagram = { placement: "timeline" };
      if (selectedPlatforms.includes("tiktok")) platformConfigs.tiktok = { privacy_status: "public" };
      if (selectedPlatforms.includes("facebook")) platformConfigs.facebook = { placement: "timeline" };
      if (selectedPlatforms.includes("youtube")) platformConfigs.youtube = { privacy_status: "public" };

      const scheduledAt = scheduledDate
        ? new Date(`${format(scheduledDate, "yyyy-MM-dd")}T${scheduledTime}`).toISOString()
        : undefined;

      await updatePost.mutateAsync({
        id: postId,
        data: {
          caption: content,
          scheduled_at: scheduledAt,
          social_accounts: selectedAccountIds,
          media: mediaUrls,
          platform_configurations: platformConfigs,
        },
      });

      toast.success("Post updated successfully");
      router.push("/posts");
    } catch {
      toast.error("Failed to update post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      await deletePost.mutateAsync(postId);
      toast.success("Post deleted");
      router.push("/posts");
    } catch {
      toast.error("Failed to delete post");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!existingPost) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-lg font-semibold">Post not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/posts")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Posts
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/posts")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Edit Post</h1>
              <p className="text-sm text-slate-500">{postId.slice(0, 8)}...</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? "Hide Preview" : "Preview"}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deletePost.isPending}>
              {deletePost.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Update Post
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Editor */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="compose" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Compose
                </TabsTrigger>
                <TabsTrigger value="accounts" className="gap-2">
                  <Users className="w-4 h-4" />
                  Accounts
                </TabsTrigger>
                <TabsTrigger value="schedule" className="gap-2">
                  <CalendarDays className="w-4 h-4" />
                  Schedule
                </TabsTrigger>
              </TabsList>

              <TabsContent value="compose" className="mt-6 space-y-6">
                {/* Content */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                  <Label className="text-sm font-medium mb-3 block">Content</Label>
                  <Textarea
                    placeholder="What's on your mind?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[200px] resize-none text-base"
                  />
                  <div className="flex justify-between mt-2 text-xs text-slate-400">
                    <span>{content.length} characters</span>
                    <span>{selectedAccountIds.length} accounts selected</span>
                  </div>
                </div>

                {/* Media */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                  <Label className="text-sm font-medium mb-3 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> Media
                  </Label>
                  <MediaUploadEnhanced
                    files={files}
                    onFilesChange={setFiles}
                    onUpload={handleUpload}
                    maxFiles={PLATFORM_LIMITS.MAX_MEDIA_PER_POST}
                    maxSize={UPLOAD.MAX_FILE_SIZE}
                  />
                </div>
              </TabsContent>

              <TabsContent value="accounts" className="mt-6">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                  <PlatformSelectorEnhanced
                    accounts={connectedAccounts}
                    selectedIds={selectedAccountIds}
                    onToggle={toggleAccount}
                    contentLength={content.length}
                  />
                </div>
              </TabsContent>

              <TabsContent value="schedule" className="mt-6 space-y-6">
                {/* Schedule Toggle */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Schedule Post</p>
                        <p className="text-xs text-slate-500">Choose when to publish</p>
                      </div>
                    </div>
                    <Switch
                      checked={!!scheduledDate}
                      onCheckedChange={(checked) => setScheduledDate(checked ? new Date() : undefined)}
                    />
                  </div>
                </div>

                {scheduledDate && (
                  <>
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                      <Label className="text-sm font-medium mb-3 block">Select Date</Label>
                      <MiniCalendar
                        selectedDate={scheduledDate}
                        onSelectDate={setScheduledDate}
                        posts={scheduledPosts}
                      />
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                      <Label className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Select Time
                      </Label>
                      <TimeSlots
                        selectedTime={scheduledTime}
                        onSelectTime={setScheduledTime}
                        selectedDate={scheduledDate}
                        existingPosts={scheduledPosts}
                      />
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/20 p-4">
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
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Preview & Info */}
          <div className="space-y-6">
            {/* Post Status */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="font-semibold mb-4">Post Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Status</span>
                  <Badge variant="outline" className="capitalize">
                    {existingPost.status}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Created</span>
                  <span>{format(new Date(existingPost.created_at), "MMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Platforms</span>
                  <span>{existingPost.social_accounts?.length || 0}</span>
                </div>
                {existingPost.scheduled_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Scheduled</span>
                    <span>{format(new Date(existingPost.scheduled_at), "MMM d, h:mm a")}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <h3 className="font-semibold mb-4">Preview</h3>
                <div className="space-y-4">
                  {selectedAccountIds.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">
                      Select accounts to see preview
                    </p>
                  ) : (
                    selectedAccountIds.slice(0, 3).map((id) => {
                      const account = accounts.find((a: any) => a.id === id);
                      if (!account) return null;
                      return (
                        <div key={id} className="border rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
                            <div>
                              <p className="text-sm font-medium">{account.username}</p>
                              <p className="text-xs text-slate-400">Just now</p>
                            </div>
                          </div>
                          <p className="text-sm line-clamp-3">{content || "No content yet..."}</p>
                          {files.length > 0 && (
                            <div className="mt-2 aspect-video bg-slate-100 rounded-lg overflow-hidden">
                              <img
                                src={files[0]?.preview || files[0]?.uploadedUrl || ""}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
