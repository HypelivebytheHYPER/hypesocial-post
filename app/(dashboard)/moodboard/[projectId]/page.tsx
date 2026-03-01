"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import {
  addWeeks,
  subWeeks,
  startOfWeek,
  eachDayOfInterval,
  format,
  addDays,
} from "date-fns";

import { Button } from "@/components/ui/button";
import { ProjectSelector } from "@/components/moodboard/ProjectSelector";
import { HorizontalView } from "@/components/moodboard/views/HorizontalView";
import { VerticalView } from "@/components/moodboard/views/VerticalView";
import { ScheduleView } from "@/components/moodboard/views/ScheduleView";
import {
  useMoodboardItems,
  useProject,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  useReorderItems,
  useUploadMoodboardMedia,
  useUpdateProject,
  type MoodboardItem,
  type DayColumnType,
} from "@/lib/hooks/useMoodboard";

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 0 });
}

function buildColumns(
  weekStart: Date,
  items: MoodboardItem[],
): DayColumnType[] {
  const days = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6),
  });

  return days.map((day) => {
    const isoDate = format(day, "yyyy-MM-dd");
    const dayItems = items
      .filter((item) => item.column_date === isoDate)
      .sort((a, b) => a.sort_order - b.sort_order);

    return {
      id: isoDate,
      day: DAY_NAMES[day.getDay()],
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

export default function ProjectMoodboardPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;

  const viewMode = (searchParams.get("view") || "horizontal") as
    | "horizontal"
    | "vertical"
    | "schedule";

  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const weekStartStr = format(weekStart, "yyyy-MM-dd");

  const weekNotesRef = useRef<HTMLTextAreaElement>(null);

  // Data hooks
  const { data: project } = useProject(projectId);
  const { data: itemsData } = useMoodboardItems(projectId, weekStartStr);
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const reorderItems = useReorderItems(projectId, weekStartStr);
  const uploadMedia = useUploadMoodboardMedia();
  const updateProject = useUpdateProject();

  const items = itemsData?.items || [];
  const columns = useMemo(
    () => buildColumns(weekStart, items),
    [weekStart, items],
  );

  const weekLabel = `Week ${getWeekNumber(weekStart)}`;
  const dateRange = `${format(weekStart, "MMMM d")} - ${format(addDays(weekStart, 6), "MMMM d")}`;
  const weekKey = format(weekStart, "yyyy-'W'II");

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
    (columnId: string, files: File[]) => {
      const column = columns.find((c) => c.id === columnId);
      if (!column) return;

      files.forEach(async (file, idx) => {
        const isVideo = file.type.startsWith("video/");
        const type = isVideo ? "video" : "image";

        try {
          const mediaUrl = await uploadMedia.mutateAsync({
            file,
            projectId,
          });

          createItem.mutate({
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
        }
      });
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

  // Week navigation
  const goToPrevWeek = () => setWeekStart((w) => subWeeks(w, 1));
  const goToNextWeek = () => setWeekStart((w) => addWeeks(w, 1));

  // View mode toggle
  const setViewMode = (mode: "horizontal" | "vertical" | "schedule") => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("view", mode);
    router.replace(`?${p.toString()}`, { scroll: false });
  };

  // Week notes
  const currentWeekNotes = project?.week_notes?.[weekKey] || "";
  const handleSaveNotes = useCallback(() => {
    if (!project || !weekNotesRef.current) return;
    const notes = weekNotesRef.current.value;
    if (notes === currentWeekNotes) return;

    updateProject.mutate({
      projectId,
      data: {
        week_notes: { ...project.week_notes, [weekKey]: notes },
      },
    });
  }, [project, projectId, weekKey, currentWeekNotes, updateProject]);

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
            <span className="text-slate-500 text-sm">{weekLabel}</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-600">{dateRange}</span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Plan your weekly social content
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
            {(["horizontal", "vertical", "schedule"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
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

          {/* Week nav */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={goToPrevWeek}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={goToNextWeek}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* View */}
      {viewMode === "horizontal" && <HorizontalView {...viewProps} />}
      {viewMode === "vertical" && <VerticalView {...viewProps} />}
      {viewMode === "schedule" && <ScheduleView {...viewProps} />}

      {/* Video Dimensions Reference */}
      <div className="card-premium p-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Video Dimensions Reference
        </h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
            <div className="w-4 h-7 bg-slate-800 rounded flex items-center justify-center">
              <span className="text-[8px] text-white">9:16</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">
                Reels / TikTok / Stories
              </p>
              <p className="text-xs text-slate-400">1080x1920 (Vertical)</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
            <div className="w-7 h-4 bg-slate-800 rounded flex items-center justify-center">
              <span className="text-[8px] text-white">16:9</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">
                YouTube / Facebook / LinkedIn
              </p>
              <p className="text-xs text-slate-400">1920x1080 (Landscape)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Week Notes */}
      <div className="card-premium p-6">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          WEEK NOTES
        </h3>
        <div className="bg-white rounded-2xl border border-slate-100 min-h-[200px] p-4">
          <textarea
            ref={weekNotesRef}
            defaultValue={currentWeekNotes}
            key={weekKey}
            onBlur={handleSaveNotes}
            className="w-full h-full min-h-[180px] resize-none text-sm text-slate-700 placeholder-slate-300 focus:outline-none"
            placeholder="Write your weekly notes here..."
          />
        </div>
      </div>
    </div>
  );
}
