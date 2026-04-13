"use client";

import { useState, useCallback, useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Calendar,
  Clock,
  Sparkles,
  ImageIcon,
  Users,
  X,
  Loader2,
  Eye,
  Globe,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Wand2,
  LayoutTemplate,
  Settings2,
  Type,
  ImagePlus,
  MoreHorizontal,
  Trash2,
  Plus,
  ArrowLeft,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, isPast } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UploadedFile } from "@/components/ui/file-upload";
import { cn } from "@/lib/utils";

import { MediaUploadEnhanced } from "./posts/@compose/_components/MediaUploadEnhanced";
import { PlatformSelectorEnhanced } from "./posts/@compose/_components/PlatformSelectorEnhanced";
import { PlatformIconBar } from "./posts/@compose/_components/PlatformIconBar";
import { getPlatformIcon } from "@/lib/social-platforms";
import {
  useSocialAccounts,
  useCreatePost,
  usePosts,
  useUploadMedia,
} from "@/lib/hooks";
import {
  PLATFORM_CHARACTER_LIMITS,
  getMostRestrictiveLimit,
  getWarningThreshold,
} from "@/types/post-for-me-types";
import type { PlatformConfigBuilder, SocialPost } from "@/types/post-for-me-types";
import { UPLOAD } from "@/lib/constants";

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;
const DRAFT_STORAGE_KEY = "hypesocial_home_draft_v1";

// ==================== MINI CALENDAR ====================
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

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <button
          onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
          className="p-1 rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium">
          {format(currentMonth, "MMMM yyyy")}
        </span>
        <button
          onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
          className="p-1 rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0">
        {WEEK_DAYS.map((day) => (
          <div key={day} className="text-center text-[10px] font-medium text-muted-foreground py-1.5">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0 px-1 pb-1">
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
              className={cn(
                "relative aspect-square p-1 flex flex-col items-center justify-center transition-all rounded-md text-sm",
                !isCurrentMonth && "opacity-30",
                isPastDate && "opacity-20 cursor-not-allowed",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : isTodayDate
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted text-foreground"
              )}
            >
              <span className="text-xs font-medium">{format(day, "d")}</span>
              {dayPosts.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayPosts.slice(0, 3).map((_, i) => (
                    <div
                      key={i}
                      className={cn("w-1 h-1 rounded-full", isSelected ? "bg-primary-foreground/70" : "bg-primary")}
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

// ==================== TIME SLOTS ====================
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
    <div className="grid grid-cols-4 gap-1.5 max-h-[180px] overflow-y-auto p-0.5">
      {timeSlots.map((time) => {
        const postsAtTime = getPostsAtTime(time);
        const isSelected = time === selectedTime;
        const hasConflict = postsAtTime.length > 0;

        return (
          <button
            key={time}
            onClick={() => onSelectTime(time)}
            className={cn(
              "px-2 py-1.5 rounded-md text-xs font-medium transition-all border",
              isSelected
                ? "bg-primary text-primary-foreground border-primary"
                : hasConflict
                ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                : "bg-card text-foreground border-border hover:border-muted-foreground/50"
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

// ==================== PLATFORM PREVIEW CARD ====================
function PlatformPreview({
  content,
  media,
  platform,
}: {
  content: string;
  media: UploadedFile[];
  platform: string;
}) {
  const Icon = getPlatformIcon(platform);
  const limit = PLATFORM_CHARACTER_LIMITS[platform as keyof typeof PLATFORM_CHARACTER_LIMITS] ?? Infinity;
  const isOverLimit = typeof limit === "number" && content.length > limit;

  const platformStyles: Record<string, string> = {
    instagram: "from-purple-500 via-pink-500 to-orange-400",
    facebook: "bg-blue-600",
    twitter: "bg-foreground",
    linkedin: "bg-blue-700",
    tiktok: "bg-background",
    youtube: "bg-red-600",
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className={cn("h-0.5 bg-gradient-to-r", platformStyles[platform] || "bg-muted")} />
      <div className="p-2.5 flex items-center gap-2 border-b border-border">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
        <span className="text-xs font-medium capitalize text-muted-foreground">{platform}</span>
        {typeof limit === "number" && (
          <span className={cn("text-xs ml-auto tabular-nums", isOverLimit ? "text-destructive" : "text-muted-foreground")}>
            {content.length}/{limit}
          </span>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary/50" />
          <div>
            <p className="text-xs font-semibold">Your Account</p>
            <p className="text-[10px] text-muted-foreground">Just now</p>
          </div>
        </div>

        <p className={cn("text-xs mb-2 whitespace-pre-wrap leading-relaxed", isOverLimit && "text-destructive")}>
          {content || <span className="text-muted-foreground italic">Your caption will appear here...</span>}
        </p>

        {media.length > 0 && (
          <div className={cn(
            "grid gap-0.5 rounded-md overflow-hidden",
            media.length === 1 ? "grid-cols-1 aspect-video" : "grid-cols-2"
          )}>
            {media.slice(0, 4).map((file, i) => (
              <div key={i} className="aspect-square bg-muted relative">
                <img src={file.preview || file.uploadedUrl} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border">
          <span className="text-[10px] text-muted-foreground">♡ 0</span>
          <span className="text-[10px] text-muted-foreground">💬 0</span>
          <span className="text-[10px] text-muted-foreground">↗ 0</span>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN PAGE ====================
export default function HomePage() {
  const router = useRouter();
  
  // Form state
  const [content, setContent] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("compose");
  const [showRightPanel, setShowRightPanel] = useState(true);

  // Data fetching
  // Smooth UI: Use transitions for non-urgent updates
  const [isPending, startTransition] = useTransition();
  
  // Data fetching with placeholderData for instant UI (no loading spinners)
  const { data: accountsData } = useSocialAccounts();
  const { data: allPosts = [] } = usePosts(
    { limit: 100 }, 
    { 
      select: (r) => r?.data ?? [],
      // Show previous data while fetching (no loading state)
      placeholderData: (previous) => previous,
    }
  );
  const createPost = useCreatePost();
  const uploadMedia = useUploadMedia();

  const accounts = accountsData?.data ?? [];
  const connectedAccounts = accounts.filter((a) => a.status === "connected");

  // Derived
  const selectedPlatforms = selectedAccountIds
    .map((id) => accounts.find((a) => a.id === id)?.platform)
    .filter(Boolean) as string[];

  const characterLimit = getMostRestrictiveLimit(selectedPlatforms);
  const warningThreshold = getWarningThreshold(characterLimit);
  const isOverLimit = characterLimit !== Infinity && content.length > characterLimit;
  const isNearLimit = characterLimit !== Infinity && content.length >= warningThreshold;
  const charactersRemaining = characterLimit !== Infinity ? characterLimit - content.length : null;

  // Restore draft on mount
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!saved) return;
    try {
      const draft = JSON.parse(saved);
      if (Date.now() - draft.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        return;
      }
      if (draft.content) setContent(draft.content);
      if (draft.scheduledDate) setScheduledDate(new Date(draft.scheduledDate));
      if (draft.scheduledTime) setScheduledTime(draft.scheduledTime);
      if (draft.selectedAccountIds?.length) setSelectedAccountIds(draft.selectedAccountIds);
      // Restore media files
      if (draft.mediaFiles?.length) {
        const restoredFiles: UploadedFile[] = draft.mediaFiles.map((f: UploadedFile, index: number) => ({
          ...f,
          id: `draft-${Date.now()}-${index}`,
          file: new File([], f.file?.name || "restored-media"),
          status: "success" as const,
        }));
        setFiles(restoredFiles);
      }
    } catch {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    if (!content.trim() && files.length === 0 && selectedAccountIds.length === 0) return;
    const draft = {
      content,
      scheduledDate: scheduledDate?.toISOString() || "",
      scheduledTime,
      selectedAccountIds,
      mediaFiles: files.length > 0 ? files.map(f => ({
        uploadedUrl: f.uploadedUrl,
        preview: f.preview,
        file: { name: f.file.name, type: f.file.type },
      })) : [],
      timestamp: Date.now(),
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [content, scheduledDate, scheduledTime, files, selectedAccountIds]);

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

    // Use transition for smooth UI during submission
    startTransition(() => {
      setIsSubmitting(true);
    });

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
      toast.success(scheduledDate ? "Post scheduled!" : "Post published!");
      router.push("/posts");
    } catch {
      toast.error("Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scheduledPosts = allPosts.filter((p) => p.scheduled_at && p.status === "scheduled");

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col -m-4 md:-m-8">
      {/* Builder Header */}
      <header className="h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">New Post</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Type className="w-3.5 h-3.5" />
              {content.length} chars
            </span>
            {selectedAccountIds.length > 0 && (
              <>
                <span className="text-border">|</span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {selectedAccountIds.length} platforms
                </span>
              </>
            )}
            {scheduledDate && (
              <>
                <span className="text-border">|</span>
                <span className="flex items-center gap-1 text-primary">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(scheduledDate, "MMM d")}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRightPanel(!showRightPanel)}
            className={cn("h-8 text-xs gap-1.5", showRightPanel && "bg-muted")}
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              (!content.trim() && files.length === 0) ||
              selectedAccountIds.length === 0 ||
              isOverLimit
            }
            className="h-8 text-xs gap-1.5"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            {scheduledDate ? "Schedule" : "Post"}
          </Button>
        </div>
      </header>

      {/* Builder Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <div className="w-14 border-r border-border bg-muted/30 flex flex-col items-center py-3 gap-1 shrink-0">
          <button
            onClick={() => setActiveTab("compose")}
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
              activeTab === "compose" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
            title="Compose"
          >
            <Type className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTab("accounts")}
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center transition-colors relative",
              activeTab === "accounts" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
            title="Accounts"
          >
            <Users className="w-4 h-4" />
            {selectedAccountIds.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center border-2 border-background">
                {selectedAccountIds.length}
              </span>
            )}
          </button>
          <Separator className="my-1 w-6" />
          <button className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="AI Assist">
            <Wand2 className="w-4 h-4" />
          </button>
          <button className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Templates">
            <LayoutTemplate className="w-4 h-4" />
          </button>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 flex min-w-0 overflow-hidden">
          {/* Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              {/* Tab Content */}
              <div className="flex-1 overflow-hidden">
                <TabsContent value="compose" className="mt-0 h-full overflow-auto">
                  <div className="max-w-2xl mx-auto p-6 pb-20 space-y-6">
                      {/* Text Editor */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Content</Label>
                          {charactersRemaining !== null && (
                            <span className={cn(
                              "text-xs font-medium tabular-nums",
                              isOverLimit ? "text-destructive" : isNearLimit ? "text-amber-500" : "text-muted-foreground"
                            )}>
                              {charactersRemaining} remaining
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <Textarea
                            placeholder="What's on your mind?"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className={cn(
                              "min-h-[200px] resize-none text-base bg-card border-input focus-visible:ring-1 focus-visible:ring-ring",
                              isOverLimit && "border-destructive focus-visible:ring-destructive"
                            )}
                          />
                        </div>
                        
                      </div>

                      {/* Platform Selector - Icon Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Platforms</Label>
                          {selectedAccountIds.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {selectedAccountIds.length} selected
                            </span>
                          )}
                        </div>
                        <PlatformIconBar
                          accounts={connectedAccounts}
                          selectedIds={selectedAccountIds}
                          onToggle={toggleAccount}
                        />
                        
                        {/* Character Limit Indicator */}
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
                                    "flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full border",
                                    isExceeded
                                      ? "bg-destructive/10 text-destructive border-destructive/30"
                                      : "bg-muted text-muted-foreground border-border"
                                  )}
                                >
                                  <Icon className="w-3 h-3" />
                                  <span className="capitalize">{platform}</span>
                                  <span className={isExceeded ? "font-medium" : ""}>
                                    {typeof limit === "number" ? `${content.length}/${limit}` : "∞"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Schedule - Minimal Inline */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Schedule</Label>
                          <div className="flex items-center gap-2">
                            {scheduledDate && (
                              <span className="text-xs text-primary font-medium">
                                {format(scheduledDate, "MMM d, h:mm a")}
                              </span>
                            )}
                            <Switch
                              checked={!!scheduledDate}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setScheduledDate(new Date());
                                } else {
                                  setScheduledDate(undefined);
                                }
                              }}
                            />
                          </div>
                        </div>
                        
                        {scheduledDate && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-2"
                          >
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="flex-1 justify-start text-left font-normal">
                                  <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                                  {format(scheduledDate, "MMM d, yyyy")}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <MiniCalendar
                                  selectedDate={scheduledDate}
                                  onSelectDate={setScheduledDate}
                                  posts={scheduledPosts}
                                />
                              </PopoverContent>
                            </Popover>
                            
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="w-[120px] justify-start text-left font-normal">
                                  <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                                  {scheduledTime}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-2" align="end">
                                <div className="grid grid-cols-4 gap-1 max-h-[200px] overflow-y-auto">
                                  {Array.from({ length: 34 }, (_, i) => {
                                    const hour = Math.floor(i / 2) + 6;
                                    const minute = (i % 2) * 30;
                                    const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
                                    return (
                                      <button
                                        key={time}
                                        onClick={() => setScheduledTime(time)}
                                        className={cn(
                                          "px-2 py-1.5 rounded text-xs font-medium transition-colors",
                                          scheduledTime === time
                                            ? "bg-primary text-primary-foreground"
                                            : "hover:bg-muted"
                                        )}
                                      >
                                        {time}
                                      </button>
                                    );
                                  })}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </motion.div>
                        )}
                      </div>

                      {/* Media Upload */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Media</Label>
                        <MediaUploadEnhanced
                          files={files}
                          onFilesChange={setFiles}
                          onUpload={handleUpload}
                          maxFiles={10}
                          maxSize={100 * 1024 * 1024}
                        />
                      </div>
                    </div>
                </TabsContent>

                <TabsContent value="accounts" className="mt-0 h-full overflow-auto">
                  <div className="max-w-2xl mx-auto p-6 pb-20">
                    <PlatformSelectorEnhanced
                      accounts={connectedAccounts}
                      selectedIds={selectedAccountIds}
                      onToggle={toggleAccount}
                      contentLength={content.length}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="schedule" className="mt-0 h-full overflow-auto">
                  <div className="max-w-md mx-auto p-6 pb-20 space-y-4">
                    <div className="p-4 rounded-lg border border-border bg-card">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Schedule</p>
                          <p className="text-xs text-muted-foreground">
                            Scheduling is now in the Compose tab
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setActiveTab("compose")}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Compose
                      </Button>
                    </div>
                    
                    {scheduledDate && (
                      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium">Currently Scheduled</p>
                            <p className="text-sm text-muted-foreground">
                              {format(
                                new Date(`${format(scheduledDate, "yyyy-MM-dd")}T${scheduledTime}`),
                                "EEEE, MMMM d 'at' h:mm a"
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Right Preview Panel */}
          <AnimatePresence>
            {showRightPanel && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="border-l border-border bg-muted/20 overflow-hidden flex flex-col shrink-0"
              >
                <div className="h-10 border-b border-border flex items-center justify-between px-3 shrink-0">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Preview</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowRightPanel(false)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex-1 overflow-auto p-3">
                  <div className="space-y-3 pb-6">
                    {selectedPlatforms.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Select accounts to preview</p>
                      </div>
                    ) : (
                      selectedPlatforms.map((platform) => (
                        <PlatformPreview
                          key={platform}
                          content={content}
                          media={files}
                          platform={platform}
                        />
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
