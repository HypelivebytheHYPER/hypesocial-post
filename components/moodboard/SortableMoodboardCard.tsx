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
  RotateCcw,
  GripVertical,
} from "lucide-react";
import {
  XIcon,
  InstagramIcon,
  FacebookIcon,
  LinkedInIcon,
} from "@/components/icons/social-icons";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EditableText } from "./EditableText";
import { proxyMediaUrl } from "@/lib/utils";
import type { MoodboardItem } from "@/lib/hooks/useMoodboard";

const videoDimensions = {
  "9:16": { label: "1080x1920" },
  "16:9": { label: "1920x1080" },
};

const platformIcons = {
  x: XIcon,
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  linkedin: LinkedInIcon,
};

export const SortableMoodboardCard = memo(function SortableMoodboardCard({
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

  const imageUrl = item.media_url
    ? proxyMediaUrl(item.media_url)
    : undefined;

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
              const Icon = platformIcons[item.platform as keyof typeof platformIcons];
              return Icon ? (
                <Icon className="w-4 h-4 text-white drop-shadow-md" />
              ) : null;
            })()}
          </div>
        )}

        {/* Image type */}
        {item.type === "image" && (
          <div className="aspect-[4/5] relative">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={item.content}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-slate-300" />
              </div>
            )}
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
              item.video_ratio === "9:16" ? "aspect-[9/16]" : "aspect-video"
            }`}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Video thumbnail"
                className="w-full h-full object-cover opacity-60"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-slate-800" />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 rounded text-white text-[9px] font-medium">
              {item.video_ratio === "9:16" ? "9:16" : "16:9"}
            </div>
            <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/60 rounded text-white text-[8px]">
              {item.video_ratio === "9:16"
                ? videoDimensions["9:16"].label
                : videoDimensions["16:9"].label}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(item.id, {
                  video_ratio: item.video_ratio === "9:16" ? "16:9" : "9:16",
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
            {item.tags && item.tags.length > 0 && (
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
});
