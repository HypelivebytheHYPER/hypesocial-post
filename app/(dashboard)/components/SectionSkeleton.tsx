"use client";

import { Loader2 } from "lucide-react";

interface SectionSkeletonProps {
  height?: string;
}

export function SectionSkeleton({ height = "h-32" }: SectionSkeletonProps) {
  return (
    <div className={`card-premium flex items-center justify-center ${height}`}>
      <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
    </div>
  );
}
