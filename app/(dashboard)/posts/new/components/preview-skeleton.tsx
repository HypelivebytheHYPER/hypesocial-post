"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

export function PreviewSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border bg-white border-slate-200 animate-pulse">
      <div className="flex items-center gap-3 p-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-slate-200 rounded w-24" />
          <div className="h-2 bg-slate-200 rounded w-16" />
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="h-3 bg-slate-200 rounded w-full" />
        <div className="h-3 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
      </div>
    </div>
  );
}
