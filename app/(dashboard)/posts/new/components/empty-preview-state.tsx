"use client";

import { motion } from "framer-motion";
import { Eye } from "lucide-react";

export function EmptyPreviewState({
  hasAccounts,
  hasContent,
}: {
  hasAccounts: boolean;
  hasContent: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-16 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200"
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
        <Eye className="w-8 h-8 text-slate-300" />
      </div>
      <p className="text-slate-500 font-medium mb-1">
        {!hasAccounts
          ? "Select accounts to preview"
          : !hasContent
            ? "Start typing to preview"
            : "Preview ready"}
      </p>
      <p className="text-slate-400 text-sm max-w-xs mx-auto">
        {!hasAccounts
          ? "Choose at least one social account to see how your post will look"
          : !hasContent
            ? "Your content will appear here as you type"
            : "Select accounts to generate preview"}
      </p>
    </motion.div>
  );
}
