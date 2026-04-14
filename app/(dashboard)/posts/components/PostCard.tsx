"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MoreHorizontal,
  ExternalLink,
  Trash2,
  RefreshCw,
  Play,
  ImageIcon,
  Edit3,
  AlertCircle,

  Clock4
} from "lucide-react";
import { formatDistanceToNow, format, isPast } from "date-fns";
import { platformIconsMap } from "@/lib/social-platforms";
import { cn, proxyMediaUrl } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { statusConfig } from "../config";
import type { SocialPost, SocialPostResult } from "@/types/post-for-me-types";

interface PostCardProps {
  post: SocialPost;
  onDelete: (id: string) => void;
  onRetry?: (post: SocialPost) => void;
  onEdit?: (post: SocialPost) => void;
  onPrefetch?: (id: string) => void;
  accounts: Map<
    string,
    {
      platform: string;
      username: string | null;
      profile_photo_url?: string | null;
    }
  >;
  results?: SocialPostResult[];
  viewMode?: "board" | "list";
}

// Compact Status Badge
function StatusBadge({ status, isPending }: { status: keyof typeof statusConfig; isPending?: boolean }) {
  const config = statusConfig[status] || statusConfig.draft;
  const Icon = isPending ? Clock4 : config.icon;
  
  const variants: Record<string, string> = {
    draft: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25",
    scheduled: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/25",
    processing: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-400 dark:border-violet-500/25",
    processed: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25",
    failed: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25",
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border",
      variants[status] || variants.draft
    )}>
      <Icon className={cn("w-3 h-3", isPending && "animate-spin")} />
      {config.label}
    </span>
  );
}

// Platform Avatar Stack
function PlatformStack({ 
  accounts, 
  accountIds, 
  max = 3 
}: { 
  accounts: Map<string, { platform: string; username: string | null; profile_photo_url?: string | null }>;
  accountIds: { id: string }[];
  max?: number;
}) {
  const visible = accountIds.slice(0, max);
  const remaining = accountIds.length - max;

  return (
    <div className="flex -space-x-1.5">
      {visible.map((sa, i) => {
        const acc = accounts.get(sa.id);
        const Icon = acc?.platform
          ? platformIconsMap[acc.platform.toLowerCase()] || ExternalLink
          : ExternalLink;
        
        return (
          <Avatar
            key={sa.id}
            className="w-5 h-5 ring-1.5 ring-white dark:ring-slate-900"
            style={{ zIndex: max - i }}
          >
            <AvatarImage
              src={acc?.profile_photo_url ? proxyMediaUrl(acc.profile_photo_url) : ""}
              className="object-cover"
            />
            <AvatarFallback className="text-[8px] bg-slate-100">
              <Icon className="w-2.5 h-2.5 text-slate-400" />
            </AvatarFallback>
          </Avatar>
        );
      })}
      {remaining > 0 && (
        <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center ring-1.5 ring-white dark:ring-slate-900 text-[8px] font-medium text-slate-500">
          +{remaining}
        </div>
      )}
    </div>
  );
}

export function PostCard({
  post,
  onDelete,
  onRetry,
  onEdit,
  onPrefetch,
  accounts,
  results,
  viewMode = "board",
}: PostCardProps) {
  const [imageError, setImageError] = useState(false);
  
  const status = post.status as keyof typeof statusConfig;
  const hasError = results?.some((r) => !r.success) ?? false;
  const isPending = post.status === "processing";
  const isListView = viewMode === "list";

  const firstMedia = post.media?.[0];
  const hasMedia = !!firstMedia;
  const isVideo = firstMedia?.url ? /\.(mp4|webm|mov|avi)($|\?)/i.test(firstMedia.url) : false;

  // Format date
  const dateText = post.scheduled_at
    ? { text: format(new Date(post.scheduled_at), "MMM d"), time: format(new Date(post.scheduled_at), "h:mm a") }
    : { text: formatDistanceToNow(new Date(post.created_at), { addSuffix: true }), time: null };

  const isOverdue = post.scheduled_at && isPast(new Date(post.scheduled_at)) && status === "scheduled";

  if (isListView) {
    // Compact List View
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ backgroundColor: "rgba(248, 250, 252, 0.8)" }}
        className={cn(
          "group flex items-center gap-3 p-3 rounded-xl",
          "bg-white/50 dark:bg-slate-900/50",
          "backdrop-blur-sm",
          "border border-transparent hover:border-slate-200 dark:hover:border-slate-800",
          "transition-all duration-200"
        )}
        onMouseEnter={() => onPrefetch?.(post.id)}
      >
        {/* Thumbnail */}
        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
          {hasMedia && !imageError ? (
            <>
              <img
                src={proxyMediaUrl(firstMedia.url)}
                alt=""
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
              {isVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="w-4 h-4 text-white fill-white" />
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-slate-300" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-700 dark:text-slate-200 truncate">
            {post.caption || <span className="text-slate-400 italic">No caption</span>}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <PlatformStack accounts={accounts} accountIds={post.social_accounts || []} max={2} />
            <span className="text-[10px] text-slate-400">
              {(() => {
                const firstId = post.social_accounts?.[0]?.id;
                if (!firstId) return "Unknown";
                const acc = accounts.get(firstId);
                return acc?.username || acc?.platform || "Unknown";
              })()}
            </span>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 shrink-0">
          <StatusBadge status={status} isPending={isPending} />
          
          <div className={cn("text-[10px]", isOverdue ? "text-red-500" : "text-slate-400")}>
            {dateText.text}
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <MoreHorizontal className="w-4 h-4 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[120px]">
              {onEdit && status === "draft" && (
                <DropdownMenuItem onClick={() => onEdit(post)}>
                  <Edit3 className="w-3.5 h-3.5 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onRetry && hasError && (
                <DropdownMenuItem onClick={() => onRetry(post)}>
                  <RefreshCw className="w-3.5 h-3.5 mr-2" />
                  Retry
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-red-600">
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>
    );
  }

  // Board View - Card
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className={cn(
        "group relative rounded-xl overflow-hidden",
        "bg-white dark:bg-slate-900",
        "border border-slate-200/60 dark:border-slate-800/60",
        "shadow-[0_1px_3px_-1px_rgba(0,0,0,0.08)]",
        "hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.15)]",
        "hover:border-slate-300/60 dark:hover:border-slate-700/60",
        "transition-all duration-200"
      )}
      onMouseEnter={() => onPrefetch?.(post.id)}
    >
      {/* Status line indicator */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-0.5",
        status === "draft" && "bg-amber-400",
        status === "scheduled" && "bg-blue-400",
        status === "processing" && "bg-violet-400",
        status === "processed" && "bg-emerald-400",
        status === "failed" && "bg-red-400"
      )} />

      {/* Media Preview */}
      {hasMedia && !imageError && (
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img
            src={proxyMediaUrl(firstMedia.url)}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Video indicator */}
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-white/90 dark:bg-black/70 flex items-center justify-center shadow-lg backdrop-blur-sm">
                <Play className="w-4 h-4 text-slate-900 dark:text-white fill-current ml-0.5" />
              </div>
            </div>
          )}
          
          {/* Media count */}
          {(post.media?.length ?? 0) > 1 && (
            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium">
              +{(post.media?.length ?? 0) - 1}
            </div>
          )}

          {/* Status badge on image */}
          <div className="absolute top-2 left-2">
            <StatusBadge status={status} isPending={isPending} />
          </div>
        </div>
      )}

      {/* No media placeholder */}
      {!hasMedia || imageError ? (
        <div className="relative aspect-[16/10] bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center">
          <ImageIcon className="w-8 h-8 text-slate-200 dark:text-slate-700 mb-1" />
          <span className="text-[10px] text-slate-300 dark:text-slate-600">No media</span>
          
          {/* Status badge */}
          <div className="absolute top-2 left-2">
            <StatusBadge status={status} isPending={isPending} />
          </div>
        </div>
      ) : null}

      {/* Content */}
      <div className="p-3">
        {/* Platforms row */}
        <div className="flex items-center justify-between mb-2">
          <PlatformStack accounts={accounts} accountIds={post.social_accounts || []} max={3} />
          
          {/* Error indicator */}
          {hasError && (
            <div className="flex items-center gap-1 text-[10px] text-red-500">
              <AlertCircle className="w-3 h-3" />
              Error
            </div>
          )}
        </div>

        {/* Caption */}
        <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-2 leading-relaxed mb-3">
          {post.caption || <span className="text-slate-400 italic text-xs">No caption</span>}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            {post.scheduled_at ? (
              <span className={cn("flex items-center gap-1", isOverdue && "text-red-500")}>
                <Calendar className="w-3 h-3" />
                {dateText.text}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {dateText.text}
              </span>
            )}
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <MoreHorizontal className="w-4 h-4 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[120px]">
              {onEdit && status === "draft" && (
                <DropdownMenuItem onClick={() => onEdit(post)}>
                  <Edit3 className="w-3.5 h-3.5 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onRetry && hasError && (
                <DropdownMenuItem onClick={() => onRetry(post)}>
                  <RefreshCw className="w-3.5 h-3.5 mr-2" />
                  Retry
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-red-600">
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
}
