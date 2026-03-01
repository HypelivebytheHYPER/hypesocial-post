"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ImageIcon,
  Video,
  FileText,
  Link as LinkIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  RotateCcw,
  GripVertical,
} from "lucide-react";
import {
  XIcon,
  InstagramIcon,
  FacebookIcon,
  LinkedInIcon,
} from "@/components/icons/social-icons";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Types
interface MoodboardItem {
  id: string;
  type: "image" | "video" | "note" | "tweet" | "link";
  content: string;
  imageUrl?: string;
  platform?: "x" | "instagram" | "facebook" | "linkedin";
  likes?: string;
  comments?: string;
  author?: string;
  tags?: string[];
  videoRatio?: "9:16" | "16:9";
}

interface DayColumnType {
  id: string;
  day: string;
  date: number;
  fullDate: string;
  items: MoodboardItem[];
}

// Video dimension examples
const videoDimensions = {
  "9:16": { width: 1080, height: 1920, label: "1080×1920" },
  "16:9": { width: 1920, height: 1080, label: "1920×1080" },
};

// Mock initial data
const initialColumns: DayColumnType[] = [
  {
    id: "mon",
    day: "MON",
    date: 20,
    fullDate: "November 20",
    items: [
      {
        id: "1",
        type: "image",
        content: "The Crown - Final season pt.1",
        imageUrl:
          "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=500&fit=crop",
        platform: "x",
      },
      {
        id: "2",
        type: "video",
        content: "Behind the scenes - Reels",
        imageUrl:
          "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&h=711&fit=crop",
        platform: "instagram",
        videoRatio: "9:16",
      },
      {
        id: "3",
        type: "tweet",
        content:
          "The Paris tragedy is presented movingly in this episode. Although this is fiction, the plot is nonetheless interesting.",
        author: "TheCrown56",
        platform: "x",
        likes: "2.8K",
        comments: "48",
        tags: ["#review", "#TheCrown"],
      },
    ],
  },
  {
    id: "tue",
    day: "TUE",
    date: 21,
    fullDate: "November 21",
    items: [
      {
        id: "4",
        type: "image",
        content: "Final season pt.1",
        imageUrl:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop",
        platform: "instagram",
      },
      {
        id: "5",
        type: "video",
        content: "Product showcase - YouTube",
        imageUrl:
          "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=338&fit=crop",
        platform: "facebook",
        videoRatio: "16:9",
      },
      {
        id: "6",
        type: "note",
        content:
          "• start study session\n• update transport card\n• go to Apple store\n• read for 30 min\n• delivery items",
      },
    ],
  },
  {
    id: "wed",
    day: "WED",
    date: 22,
    fullDate: "November 22",
    items: [
      {
        id: "7",
        type: "note",
        content:
          "Package tracking:\n📦 underwear\n🚚 click & collect\n📅 Est. delivery: 27 November",
      },
      {
        id: "8",
        type: "image",
        content: "Study session",
        imageUrl:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop",
      },
    ],
  },
  {
    id: "thu",
    day: "THU",
    date: 23,
    fullDate: "November 23",
    items: [
      {
        id: "9",
        type: "image",
        content: "La papeterie Tsubaki",
        imageUrl:
          "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=500&fit=crop",
        platform: "instagram",
      },
      {
        id: "10",
        type: "note",
        content:
          "• start new lessons\n• go to the pharmacy\n• fix medical appt\n• prep dinner",
      },
    ],
  },
  {
    id: "fri",
    day: "FRI",
    date: 24,
    fullDate: "November 24",
    items: [
      {
        id: "11",
        type: "note",
        content: "🏥 Medical appointment\n📅 9:15 am\n📝 For medical reasons",
      },
    ],
  },
  {
    id: "sat",
    day: "SAT",
    date: 25,
    fullDate: "November 25",
    items: [
      {
        id: "12",
        type: "image",
        content: "Weekend vibes",
        imageUrl:
          "https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=400&h=500&fit=crop",
      },
    ],
  },
  {
    id: "sun",
    day: "SUN",
    date: 19,
    fullDate: "November 19",
    items: [
      {
        id: "13",
        type: "note",
        content:
          "🚩 red flag: bugs, saturated storage, RAM\n\n💻 U've to buy new Mac!!!",
      },
      {
        id: "14",
        type: "note",
        content:
          "Top priorities:\n☑ MRI appt @Friday\n☑ start Domestika courses\n☑ schedule appt with Apple store",
      },
    ],
  },
];

// Editable Text Component
function EditableText({
  content,
  onSave,
  className = "",
  isNote = false,
  placeholder = "Click to edit...",
}: {
  content: string;
  onSave: (text: string) => void;
  className?: string;
  isNote?: boolean;
  placeholder?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(content);
  }, [content]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (text !== content) {
      onSave(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === "Escape") {
      setText(content);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full bg-transparent resize-none outline-none ${className}`}
        rows={isNote ? 4 : 2}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`cursor-text hover:bg-slate-50/50 rounded transition-colors ${className}`}
    >
      {content || <span className="text-slate-300 italic">{placeholder}</span>}
    </div>
  );
}

// Sortable Item Component
function SortableMoodboardCard({
  item,
  onDelete,
  onUpdate,
}: {
  item: MoodboardItem;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<MoodboardItem>) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, data: { item } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  const platformIcons = {
    x: XIcon,
    instagram: InstagramIcon,
    facebook: FacebookIcon,
    linkedin: LinkedInIcon,
  };

  return (
    <div ref={setNodeRef} style={style} className="group relative">
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing z-20 transition-opacity"
      >
        <div className="w-6 h-8 bg-white rounded shadow-sm border border-slate-200 flex items-center justify-center">
          <GripVertical className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* Card Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="absolute top-2 right-2 z-10 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
        >
          <X className="w-3 h-3 text-slate-500" />
        </button>

        {/* Platform badge */}
        {item.platform && (
          <div className="absolute top-2 left-2 z-10">
            {(() => {
              const Icon = platformIcons[item.platform];
              return Icon ? (
                <Icon className="w-4 h-4 text-white drop-shadow-md" />
              ) : null;
            })()}
          </div>
        )}

        {/* Image type - 4:5 Standard */}
        {item.type === "image" && item.imageUrl && (
          <div className="aspect-[4/5] relative">
            <img
              src={item.imageUrl}
              alt={item.content}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
              <EditableText
                content={item.content}
                onSave={(text) => onUpdate(item.id, { content: text })}
                className="text-white text-xs font-medium line-clamp-1"
                placeholder="Add caption..."
              />
            </div>
          </div>
        )}

        {/* Video type */}
        {item.type === "video" && (
          <div
            className={`relative bg-slate-900 rounded-xl flex items-center justify-center overflow-hidden ${
              item.videoRatio === "9:16" ? "aspect-[9/16]" : "aspect-video"
            }`}
          >
            <img
              src={
                item.imageUrl ||
                "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&h=600&fit=crop"
              }
              alt="Video thumbnail"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 rounded text-white text-[10px] font-medium">
              0:45
            </div>
            <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 rounded text-white text-[9px] font-medium">
              {item.videoRatio === "9:16" ? "9:16" : "16:9"}
            </div>
            <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/60 rounded text-white text-[8px]">
              {item.videoRatio === "9:16"
                ? videoDimensions["9:16"].label
                : videoDimensions["16:9"].label}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(item.id, {
                  videoRatio: item.videoRatio === "9:16" ? "16:9" : "9:16",
                });
              }}
              className="absolute top-2 right-2 px-1.5 py-0.5 bg-white/20 hover:bg-white/40 rounded text-white text-[9px] backdrop-blur-sm transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Tweet type */}
        {item.type === "tweet" && (
          <div className="p-3">
            <div className="flex items-start gap-2 mb-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-[8px] bg-slate-200">
                  {item.author?.[0] || "T"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <EditableText
                  content={item.content}
                  onSave={(text) => onUpdate(item.id, { content: text })}
                  className="text-[10px] text-slate-700 leading-relaxed line-clamp-4"
                />
              </div>
            </div>
            {item.tags && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.tags.map((tag) => (
                  <span key={tag} className="text-[9px] text-blue-500">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {(item.likes || item.comments) && (
              <div className="flex items-center gap-3 mt-2 text-[9px] text-slate-400">
                {item.likes && <span>❤️ {item.likes}</span>}
                {item.comments && <span>💬 {item.comments}</span>}
              </div>
            )}
          </div>
        )}

        {/* Note type */}
        {item.type === "note" && (
          <div className="p-3 bg-amber-50/50">
            <div className="flex items-start gap-1">
              <FileText className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
              <EditableText
                content={item.content}
                onSave={(text) => onUpdate(item.id, { content: text })}
                className="text-[11px] text-slate-700 whitespace-pre-line leading-relaxed flex-1"
                isNote
              />
            </div>
          </div>
        )}

        {/* Link type */}
        {item.type === "link" && (
          <div className="p-3 bg-blue-50/50">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-blue-500" />
              <EditableText
                content={item.content}
                onSave={(text) => onUpdate(item.id, { content: text })}
                className="text-[11px] text-blue-600 truncate flex-1"
              />
            </div>
          </div>
        )}

        {/* Editable title for video */}
        {item.type === "video" && (
          <div className="p-2 border-t border-slate-100">
            <EditableText
              content={item.content}
              onSave={(text) => onUpdate(item.id, { content: text })}
              className="text-[11px] text-slate-600 line-clamp-1"
              placeholder="Add title..."
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Day Column with Sortable Context
function DayColumn({
  column,
  onDeleteItem,
  onAddItem,
  onUpdateItem,
}: {
  column: DayColumnType;
  onDeleteItem: (id: string) => void;
  onAddItem: (columnId: string, type: MoodboardItem["type"]) => void;
  onUpdateItem: (id: string, updates: Partial<MoodboardItem>) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { column },
  });

  const itemIds = column.items.map((item) => item.id);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-h-[400px] rounded-3xl transition-colors ${
        isOver ? "bg-slate-100/50 ring-2 ring-slate-200" : ""
      }`}
    >
      {/* Day Header */}
      <div className="flex flex-col items-center mb-4">
        <span className="text-xs font-medium text-slate-400">
          {column.date}
        </span>
        <span className="text-lg font-semibold text-slate-800">
          {column.day}
        </span>
      </div>

      {/* Sortable Items */}
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-3 p-2">
          {column.items.map((item) => (
            <SortableMoodboardCard
              key={item.id}
              item={item}
              onDelete={onDeleteItem}
              onUpdate={onUpdateItem}
            />
          ))}
        </div>
      </SortableContext>

      {/* Add buttons */}
      <div className="flex items-center justify-center gap-1 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onAddItem(column.id, "image")}
          className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
        >
          <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
        </button>
        <button
          onClick={() => onAddItem(column.id, "video")}
          className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
        >
          <Video className="w-3.5 h-3.5 text-slate-500" />
        </button>
        <button
          onClick={() => onAddItem(column.id, "note")}
          className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
        >
          <FileText className="w-3.5 h-3.5 text-slate-500" />
        </button>
        <button
          onClick={() => onAddItem(column.id, "link")}
          className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
        >
          <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
        </button>
      </div>
    </div>
  );
}

export default function MoodboardPage() {
  const [columns, setColumns] = useState<DayColumnType[]>(initialColumns);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<MoodboardItem | null>(null);
  const [currentWeek, setCurrentWeek] = useState("Week 47");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Auto-save indicator - use ref to avoid effect dependencies
  const markAsSaving = useCallback(() => {
    setSaveStatus("saving");
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus("saved");
    }, 1000);
  }, []);

  const findContainer = (id: string) => {
    return columns.find((col) => col.items.some((item) => item.id === id))?.id;
  };

  const findItem = (id: string) => {
    for (const col of columns) {
      const item = col.items.find((i) => i.id === id);
      if (item) return item;
    }
    return null;
  };

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      setActiveId(active.id as string);
      setActiveItem(findItem(active.id as string));
    },
    [columns],
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;

      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeContainer = findContainer(activeId);
      const overContainer = overId.startsWith("day-")
        ? overId
        : findContainer(overId);

      if (
        !activeContainer ||
        !overContainer ||
        activeContainer === overContainer
      ) {
        return;
      }

      setColumns((prev) => {
        const activeCol = prev.find((c) => c.id === activeContainer);
        const overCol = prev.find((c) => c.id === overContainer);

        if (!activeCol || !overCol) return prev;

        const activeIndex = activeCol.items.findIndex((i) => i.id === activeId);
        const overIndex = overCol.items.findIndex((i) => i.id === overId);

        let newIndex;
        if (overId.startsWith("day-")) {
          newIndex = overCol.items.length + 1;
        } else {
          const isBelowOverItem =
            over &&
            active.rect.current.translated &&
            active.rect.current.translated.top >
              over.rect.top + over.rect.height;

          const modifier = isBelowOverItem ? 1 : 0;
          newIndex =
            overIndex >= 0 ? overIndex + modifier : overCol.items.length + 1;
        }

        const item = activeCol.items[activeIndex];

        return prev.map((col) => {
          if (col.id === activeContainer) {
            return {
              ...col,
              items: col.items.filter((i) => i.id !== activeId),
            };
          }
          if (col.id === overContainer) {
            const newItems = [...col.items];
            newItems.splice(newIndex, 0, item);
            return { ...col, items: newItems };
          }
          return col;
        });
      });
    },
    [columns],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setActiveItem(null);

      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeContainer = findContainer(activeId);
      const overContainer = overId.startsWith("day-")
        ? overId
        : findContainer(overId);

      if (!activeContainer || !overContainer) return;

      const activeCol = columns.find((c) => c.id === activeContainer);
      const overCol = columns.find((c) => c.id === overContainer);

      if (!activeCol || !overCol) return;

      const activeIndex = activeCol.items.findIndex((i) => i.id === activeId);
      const overIndex = overCol.items.findIndex((i) => i.id === overId);

      if (activeContainer === overContainer) {
        if (activeIndex !== overIndex) {
          setColumns((prev) =>
            prev.map((col) => {
              if (col.id === activeContainer) {
                return {
                  ...col,
                  items: arrayMove(col.items, activeIndex, overIndex),
                };
              }
              return col;
            }),
          );
          markAsSaving();
        }
      } else {
        markAsSaving();
      }
    },
    [columns, markAsSaving],
  );

  const handleDeleteItem = useCallback(
    (itemId: string) => {
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          items: col.items.filter((i) => i.id !== itemId),
        })),
      );
      markAsSaving();
    },
    [markAsSaving],
  );

  const handleUpdateItem = useCallback(
    (itemId: string, updates: Partial<MoodboardItem>) => {
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          items: col.items.map((item) =>
            item.id === itemId ? { ...item, ...updates } : item,
          ),
        })),
      );
      markAsSaving();
    },
    [markAsSaving],
  );

  const handleAddItem = useCallback(
    (columnId: string, type: MoodboardItem["type"]) => {
      const newItem: MoodboardItem = {
        id: Date.now().toString(),
        type,
        content:
          type === "note"
            ? "New note..."
            : type === "link"
              ? "https://..."
              : "New content",
        platform: ["x", "instagram", "facebook", "linkedin"][
          Math.floor(Math.random() * 4)
        ] as MoodboardItem["platform"],
        videoRatio: type === "video" ? "9:16" : undefined,
      };

      setColumns((prev) =>
        prev.map((col) =>
          col.id === columnId
            ? { ...col, items: [...col.items, newItem] }
            : col,
        ),
      );
      markAsSaving();
    },
    [markAsSaving],
  );

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: { opacity: "0.5" },
      },
    }),
  };

  const orderedColumns = [columns[6], ...columns.slice(0, 6)];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-800">
              {currentWeek}
            </h1>
            <span className="text-slate-400">|</span>
            <span className="text-slate-600">November 19 - November 25</span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Plan your weekly social content
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Save status indicator */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-2">
            {saveStatus === "saving" ? (
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

          <div className="flex items-center bg-white rounded-full border border-slate-200 p-1">
            <button className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 rounded-full">
              HORIZONTAL
            </button>
            <button className="px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 rounded-full">
              VERTICAL
            </button>
            <button className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 rounded-full">
              SCHEDULE
            </button>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Moodboard Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          {orderedColumns.map((column) => (
            <div key={column.id} className="group">
              <DayColumn
                column={column}
                onDeleteItem={handleDeleteItem}
                onAddItem={handleAddItem}
                onUpdateItem={handleUpdateItem}
              />
            </div>
          ))}
        </div>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeItem ? (
            <div className="opacity-90 rotate-2 scale-105">
              <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden">
                {activeItem.type === "image" && activeItem.imageUrl && (
                  <div className="aspect-[4/5]">
                    <img
                      src={activeItem.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {activeItem.type === "video" && (
                  <div
                    className={`${activeItem.videoRatio === "9:16" ? "aspect-[9/16]" : "aspect-video"} bg-slate-800 flex items-center justify-center`}
                  >
                    <Video className="w-8 h-8 text-white/50" />
                  </div>
                )}
                {activeItem.type === "note" && (
                  <div className="p-3 bg-amber-50">
                    <FileText className="w-4 h-4 text-amber-400" />
                  </div>
                )}
                {activeItem.type === "tweet" && (
                  <div className="p-3">
                    <p className="text-[10px] text-slate-700 line-clamp-3">
                      {activeItem.content}
                    </p>
                  </div>
                )}
                {activeItem.type === "link" && (
                  <div className="p-3 bg-blue-50">
                    <LinkIcon className="w-4 h-4 text-blue-500" />
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

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
              <p className="text-xs text-slate-400">1080×1920 (Vertical)</p>
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
              <p className="text-xs text-slate-400">1920×1080 (Landscape)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Notes & Calendar */}
      <div className="grid lg:grid-cols-3 gap-6 mt-8">
        {/* Notes Area */}
        <div className="lg:col-span-2 card-premium p-6">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            NOTES
          </h3>
          <div className="bg-white rounded-2xl border border-slate-100 min-h-[200px] p-4">
            <textarea
              className="w-full h-full min-h-[180px] resize-none text-sm text-slate-700 placeholder-slate-300 focus:outline-none"
              placeholder="Write your weekly notes here..."
            />
          </div>
        </div>

        {/* Mini Calendar */}
        <div className="card-premium p-6">
          <h3 className="text-center text-slate-700 font-medium mb-4">
            November
          </h3>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-400 mb-2">
            {["WK", "S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span key={`${d}-${i}`}>{d}</span>
            ))}
          </div>
          <div className="space-y-1">
            <div className="grid grid-cols-8 gap-1 text-center text-[10px]">
              <span className="text-slate-300">44</span>
              {["29", "30", "31", "1", "2", "3", "4"].map((d) => (
                <span key={d} className="text-slate-400 py-1">
                  {d}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-8 gap-1 text-center text-[10px]">
              <span className="text-slate-300">45</span>
              {["5", "6", "7", "8", "9", "10", "11"].map((d) => (
                <span key={d} className="text-slate-400 py-1">
                  {d}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-8 gap-1 text-center text-[10px]">
              <span className="text-slate-300">46</span>
              {["12", "13", "14", "15", "16", "17", "18"].map((d) => (
                <span key={d} className="text-slate-400 py-1">
                  {d}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-8 gap-1 text-center text-[10px]">
              <span className="text-slate-500 font-medium">47</span>
              {["19", "20", "21", "22", "23", "24", "25"].map((d, i) => (
                <span
                  key={d}
                  className={`py-1 rounded ${
                    [4, 5].includes(i)
                      ? "bg-slate-200 text-slate-700"
                      : "text-slate-400"
                  }`}
                >
                  {d}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-8 gap-1 text-center text-[10px]">
              <span className="text-slate-300">48</span>
              {["26", "27", "28", "29", "30", "1", "2"].map((d) => (
                <span
                  key={d}
                  className={`py-1 ${d === "1" || d === "2" ? "text-slate-300" : "text-slate-400"}`}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
