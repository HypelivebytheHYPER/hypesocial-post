"use client";

import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ImageIcon,
  Video,
  FileText,
  Link as LinkIcon,
  X,
} from "lucide-react";
import { proxyMediaUrl } from "@/lib/utils";
import type { MoodboardItem } from "@/lib/hooks/useMoodboard";

const typeIcons = {
  image: ImageIcon,
  video: Video,
  note: FileText,
  tweet: FileText,
  link: LinkIcon,
};

const typeBg = {
  image: "bg-slate-100",
  video: "bg-slate-800",
  note: "bg-amber-50",
  tweet: "bg-sky-50",
  link: "bg-blue-50",
};

export const CompactMoodboardCard = memo(function CompactMoodboardCard({
  item,
  onDelete,
}: {
  item: MoodboardItem;
  onDelete: (id: string) => void;
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
  };

  const imageUrl = item.media_url ? proxyMediaUrl(item.media_url) : undefined;
  const Icon = typeIcons[item.type] || FileText;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group/compact flex items-center gap-1.5 px-1 py-0.5 rounded-md hover:bg-slate-50 cursor-grab active:cursor-grabbing"
    >
      {/* Thumbnail or type icon */}
      <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center overflow-hidden ${typeBg[item.type]}`}>
        {imageUrl && (item.type === "image" || item.type === "video") ? (
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <Icon className={`w-2.5 h-2.5 ${item.type === "video" ? "text-white/70" : "text-slate-400"}`} />
        )}
      </div>

      {/* Truncated text */}
      <span className="text-[10px] text-slate-600 truncate flex-1 min-w-0">
        {item.content}
      </span>

      {/* Hover delete */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onDelete(item.id);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="w-3.5 h-3.5 rounded-full flex items-center justify-center opacity-0 group-hover/compact:opacity-100 transition-opacity flex-shrink-0 hover:bg-red-100"
      >
        <X className="w-2.5 h-2.5 text-slate-400 hover:text-red-500" />
      </button>
    </div>
  );
});
