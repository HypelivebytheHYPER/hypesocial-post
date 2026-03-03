"use client";

import { useState, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  endOfWeek,
  eachDayOfInterval,
  format,
  addDays,
} from "date-fns";

import { Button } from "@/components/ui/button";
import { ProjectSelector } from "@/components/moodboard/ProjectSelector";
import { HorizontalView } from "@/components/moodboard/views/HorizontalView";
import { MonthlyView } from "@/components/moodboard/views/MonthlyView";
import {
  useMoodboardItems,
  useProject,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  useReorderItems,
  useUploadMoodboardMedia,
  type MoodboardItem,
  type DayColumnType,
} from "@/lib/hooks/useMoodboard";

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

type ViewMode = "weekly" | "monthly";

function resolveViewMode(param: string | null): ViewMode {
  if (param === "monthly") return "monthly";
  // backward compat: horizontal/vertical/schedule all map to weekly
  return "weekly";
}

function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 0 });
}

/** Build columns for an arbitrary date range */
function buildColumns(
  rangeStart: Date,
  rangeEnd: Date,
  items: MoodboardItem[],
): DayColumnType[] {
  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

  return days.map((day) => {
    const isoDate = format(day, "yyyy-MM-dd");
    const dayItems = items
      .filter((item) => item.column_date === isoDate)
      .sort((a, b) => a.sort_order - b.sort_order);

    return {
      id: isoDate,
      day: DAY_NAMES[day.getDay()] ?? "",
      date: day.getDate(),
      fullDate: format(day, "MMMM d"),
      isoDate,
      items: dayItems,
    };
  });
}

function getWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    )
  );
}

/** Get the calendar grid range for a month (startOfWeek of startOfMonth → endOfWeek of endOfMonth) */
function getMonthCalendarRange(anchor: Date) {
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  return { calStart, calEnd };
}

export default function ProjectMoodboardPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;

  const viewMode = resolveViewMode(searchParams.get("view"));

  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [monthAnchor, setMonthAnchor] = useState(() => new Date());

  // Compute active date range based on view mode
  const { rangeStart, rangeEnd } = useMemo(() => {
    if (viewMode === "monthly") {
      const { calStart, calEnd } = getMonthCalendarRange(monthAnchor);
      return { rangeStart: calStart, rangeEnd: calEnd };
    }
    return { rangeStart: weekStart, rangeEnd: addDays(weekStart, 6) };
  }, [viewMode, weekStart, monthAnchor]);

  const rangeStartStr = format(rangeStart, "yyyy-MM-dd");
  const rangeEndStr = format(rangeEnd, "yyyy-MM-dd");

  // Data hooks
  const { data: project } = useProject(projectId);
  const { data: itemsData } = useMoodboardItems(projectId, rangeStartStr, rangeEndStr);
  const createItem = useCreateItem(projectId, rangeStartStr);
  const updateItem = useUpdateItem(projectId, rangeStartStr);
  const deleteItem = useDeleteItem(projectId, rangeStartStr);
  const reorderItems = useReorderItems(projectId, rangeStartStr);
  const uploadMedia = useUploadMoodboardMedia();

  const items = itemsData?.items || [];
  const columns = useMemo(
    () => buildColumns(rangeStart, rangeEnd, items),
    [rangeStart, rangeEnd, items],
  );

  // Header labels
  const headerLabel = viewMode === "monthly"
    ? format(monthAnchor, "MMMM yyyy")
    : `Week ${getWeekNumber(weekStart)}`;
  const headerSub = viewMode === "monthly"
    ? undefined
    : `${format(weekStart, "MMMM d")} - ${format(addDays(weekStart, 6), "MMMM d")}`;

  const isSaving =
    createItem.isPending ||
    updateItem.isPending ||
    deleteItem.isPending ||
    reorderItems.isPending ||
    uploadMedia.isPending;

  // Shared handlers passed to all views
  const handleDeleteItem = useCallback(
    (itemId: string) => deleteItem.mutate(itemId),
    [deleteItem],
  );

  const handleUpdateItem = useCallback(
    (itemId: string, updates: Partial<MoodboardItem>) =>
      updateItem.mutate({ itemId, data: updates }),
    [updateItem],
  );

  const handleAddItem = useCallback(
    (columnId: string, type: MoodboardItem["type"]) => {
      const column = columns.find((c) => c.id === columnId);
      if (!column) return;

      createItem.mutate({
        project_id: projectId,
        column_date: column.isoDate,
        sort_order: column.items.length,
        type,
        content:
          type === "note"
            ? "New note..."
            : type === "link"
              ? "https://..."
              : "New content",
        media_url: "",
        platform: "",
        video_ratio: type === "video" ? "9:16" : "",
        author: "",
        tags: [],
        likes: "",
        comments: "",
        linked_post_id: "",
      });
    },
    [columns, projectId, createItem],
  );

  const handleFileDrop = useCallback(
    async (columnId: string, files: File[]) => {
      const column = columns.find((c) => c.id === columnId);
      if (!column) return;

      for (let idx = 0; idx < files.length; idx++) {
        const file = files[idx]!;
        const isVideo = file.type.startsWith("video/");
        const type = isVideo ? "video" : "image";

        try {
          const mediaUrl = await uploadMedia.mutateAsync({
            file,
            projectId,
          });

          await createItem.mutateAsync({
            project_id: projectId,
            column_date: column.isoDate,
            sort_order: column.items.length + idx,
            type,
            content: file.name.replace(/\.[^.]+$/, ""),
            media_url: mediaUrl,
            platform: "",
            video_ratio: isVideo ? "9:16" : "",
            author: "",
            tags: [],
            likes: "",
            comments: "",
            linked_post_id: "",
          });
        } catch (err) {
          console.error("Upload failed:", err);
          toast.error(`Failed to upload ${file.name}`);
        }
      }
    },
    [columns, projectId, uploadMedia, createItem],
  );

  const handleReorder = useCallback(
    (finalColumns: DayColumnType[]) => {
      const payload = finalColumns.flatMap((col) =>
        col.items.map((item, idx) => ({
          item_id: item.id,
          column_date: col.isoDate,
          sort_order: idx,
        })),
      );
      reorderItems.mutate(payload);
    },
    [reorderItems],
  );

  // Navigation
  const goToPrev = () => {
    if (viewMode === "monthly") {
      setMonthAnchor((m) => subMonths(m, 1));
    } else {
      setWeekStart((w) => subWeeks(w, 1));
    }
  };
  const goToNext = () => {
    if (viewMode === "monthly") {
      setMonthAnchor((m) => addMonths(m, 1));
    } else {
      setWeekStart((w) => addWeeks(w, 1));
    }
  };

  // View mode toggle — sync time context on switch
  const setView = (mode: ViewMode) => {
    if (mode === "monthly" && viewMode === "weekly") {
      // Set month anchor from current week
      setMonthAnchor(weekStart);
    } else if (mode === "weekly" && viewMode === "monthly") {
      // Set week start from current month anchor
      setWeekStart(getWeekStart(monthAnchor));
    }
    const p = new URLSearchParams(searchParams.toString());
    p.set("view", mode);
    router.replace(`?${p.toString()}`, { scroll: false });
  };

  const viewProps = {
    columns,
    onDeleteItem: handleDeleteItem,
    onAddItem: handleAddItem,
    onUpdateItem: handleUpdateItem,
    onFileDrop: handleFileDrop,
    onReorder: handleReorder,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <ProjectSelector />
            <span className="text-slate-400">|</span>
            <span className="text-slate-500 text-sm">{headerLabel}</span>
            {headerSub && (
              <>
                <span className="text-slate-400">|</span>
                <span className="text-slate-600">{headerSub}</span>
              </>
            )}
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Plan your {viewMode === "monthly" ? "monthly" : "weekly"} social content
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Save status */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-2">
            {isSaving ? (
              <>
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Saved</span>
              </>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-white rounded-full border border-slate-200 p-1">
            {(["weekly", "monthly"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setView(mode)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  viewMode === mode
                    ? "text-slate-800 bg-slate-100"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {mode.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Date nav */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={goToPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* View */}
      {viewMode === "weekly" && <HorizontalView {...viewProps} />}
      {viewMode === "monthly" && (
        <MonthlyView {...viewProps} monthAnchor={monthAnchor} />
      )}
    </div>
  );
}
