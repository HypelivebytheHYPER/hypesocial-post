"use client";

import { getPlatformIcon } from "@/lib/social-platforms";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

export function PlatformOptions({
  title,
  platform,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  platform: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const PlatformIcon = getPlatformIcon(platform);

  return (
    <motion.div layout className="bg-slate-50 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          {PlatformIcon && <PlatformIcon className="w-4 h-4 text-slate-600" />}
          <span className="text-sm font-medium text-slate-700">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
