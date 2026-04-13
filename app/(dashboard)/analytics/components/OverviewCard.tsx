"use client";

import { Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/metrics";

interface OverviewCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  isLoading: boolean;
  isPartial: boolean;
  caveatNote?: string;
}

export function OverviewCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  isLoading,
  isPartial,
  caveatNote,
}: OverviewCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}
        >
          <Icon className={`w-4.5 h-4.5 ${color}`} />
        </div>
        {isPartial && !isLoading && (
          <span
            className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"
            title="Still loading some accounts"
          />
        )}
      </div>
      {isLoading ? (
        <Skeleton className="w-20 h-7 mb-1" />
      ) : (
        <p className="stat-value">{formatNumber(value)}</p>
      )}
      <p className="stat-label">
        {label}
        {caveatNote && (
          <span className="inline-flex ml-1 group relative">
            <Info className="w-3 h-3 text-amber-400" />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-800 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-10">
              {caveatNote}
            </span>
          </span>
        )}
      </p>
    </div>
  );
}
