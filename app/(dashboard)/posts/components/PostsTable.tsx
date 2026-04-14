"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Edit3,
  Trash2,
  RefreshCw,
  FileEdit,
  ImageIcon,
  Play,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn, proxyMediaUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { platformIconsMap } from "@/lib/social-platforms";
import { statusConfig } from "../config";
import type { SocialPost, SocialPostResult } from "@/types/post-for-me-types";

interface PostsTableProps {
  posts: SocialPost[];
  accounts: Map<
    string,
    { platform: string; username: string | null; profile_photo_url?: string | null }
  >;
  resultsMap: Map<string, SocialPostResult[]>;
  onEdit: (postId: string) => void;
  onDelete: (id: string) => void;
  onRetry?: (post: SocialPost) => void;
}

function StatusBadge({ status, isPending }: { status: string; isPending?: boolean }) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
  const Icon = isPending ? config.icon : config.icon;

  const variants: Record<string, string> = {
    draft: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25",
    scheduled: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/25",
    processing: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-400 dark:border-violet-500/25",
    processed: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25",
    failed: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border",
        variants[status] || variants.draft
      )}
    >
      <Icon className={cn("w-3 h-3", isPending && "animate-spin")} />
      {config.label}
    </span>
  );
}

function Thumbnail({ post }: { post: SocialPost }) {
  const [imageError, setImageError] = useState(false);
  const firstMedia = post.media?.[0];
  const hasMedia = !!firstMedia;
  const isVideo = firstMedia?.url ? /\.(mp4|webm|mov|avi)($|\?)/i.test(firstMedia.url) : false;

  return (
    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
      {hasMedia && !imageError ? (
        <>
          <Image
            src={proxyMediaUrl(firstMedia.url)}
            alt=""
            width={40}
            height={40}
            className="object-cover w-full h-full"
            onError={() => setImageError(true)}
          />
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Play className="w-3 h-3 text-white fill-white" />
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageIcon className="w-4 h-4 text-slate-300" />
        </div>
      )}
    </div>
  );
}

function PlatformIcons({
  post,
  accounts,
}: {
  post: SocialPost;
  accounts: PostsTableProps["accounts"];
}) {
  const platforms =
    post.social_accounts
      ?.map((sa) => accounts.get(sa.id)?.platform)
      .filter(Boolean) as string[] | undefined;

  if (!platforms || platforms.length === 0) {
    return <span className="text-xs text-slate-400">—</span>;
  }

  return (
    <div className="flex items-center gap-1">
      {platforms.slice(0, 4).map((platform) => {
        const Icon = platformIconsMap[platform.toLowerCase()];
        return Icon ? (
          <Icon key={platform} className="w-3.5 h-3.5 text-slate-400" />
        ) : null;
      })}
      {platforms.length > 4 && (
        <span className="text-[10px] text-slate-400">+{platforms.length - 4}</span>
      )}
    </div>
  );
}

export function PostsTable({
  posts,
  accounts,
  resultsMap,
  onEdit,
  onDelete,
  onRetry,
}: PostsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ]);

  const columns = useMemo<ColumnDef<SocialPost>[]>(
    () => [
      {
        id: "thumbnail",
        header: "",
        cell: ({ row }) => <Thumbnail post={row.original} />,
        enableSorting: false,
        size: 48,
      },
      {
        accessorKey: "caption",
        header: "Caption",
        cell: ({ row }) => {
          const caption = row.original.caption;
          return (
            <p className="text-sm text-slate-700 dark:text-slate-200 truncate max-w-[240px]">
              {caption || <span className="text-slate-400 italic">No caption</span>}
            </p>
          );
        },
      },
      {
        id: "platforms",
        header: "Platforms",
        cell: ({ row }) => <PlatformIcons post={row.original} accounts={accounts} />,
        enableSorting: false,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          const isPending = status === "processing";
          return <StatusBadge status={status} isPending={isPending} />;
        },
        size: 100,
      },
      {
        accessorKey: "created_at",
        header: "Created",
        cell: ({ row }) => {
          const date = new Date(row.original.created_at);
          return (
            <div className="text-xs text-slate-500">
              <div>{formatDistanceToNow(date, { addSuffix: true })}</div>
              <div className="text-[10px] text-slate-400">{format(date, "MMM d, yyyy")}</div>
            </div>
          );
        },
        size: 120,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const post = row.original;
          const hasError = resultsMap.get(post.id)?.some((r) => !r.success) ?? false;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="w-4 h-4 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {post.status === "draft" && (
                  <DropdownMenuItem onClick={() => onEdit(post.id)}>
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
          );
        },
        enableSorting: false,
        size: 48,
      },
    ],
    [accounts, resultsMap, onEdit, onDelete, onRetry]
  );

  const table = useReactTable({
    data: posts,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      "px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400",
                      header.column.getCanSort() && "cursor-pointer select-none hover:text-slate-900 dark:hover:text-slate-200"
                    )}
                    style={{ width: header.getSize() }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="text-slate-400">
                          {header.column.getIsSorted() === "asc" ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : header.column.getIsSorted() === "desc" ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 opacity-30" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <FileEdit className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500">No posts found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
