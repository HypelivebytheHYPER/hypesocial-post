"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Calendar, Copy, CheckCircle, FolderInput, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { BulkAction } from "./types";

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  selectedIds: string[];
  actions: BulkAction[];
  onClearSelection: () => void;
  onSelectAll: () => void;
  isVisible: boolean;
  className?: string;
}

const defaultActions: BulkAction[] = [
  {
    id: "publish",
    label: "Publish Now",
    icon: CheckCircle,
    action: () => {},
    variant: "primary",
  },
  {
    id: "schedule",
    label: "Schedule",
    icon: Calendar,
    action: () => {},
  },
  {
    id: "duplicate",
    label: "Duplicate",
    icon: Copy,
    action: () => {},
  },
  {
    id: "move",
    label: "Move to...",
    icon: FolderInput,
    action: () => {},
  },
  {
    id: "export",
    label: "Export",
    icon: Download,
    action: () => {},
  },
  {
    id: "delete",
    label: "Delete",
    icon: Trash2,
    action: () => {},
    variant: "destructive",
  },
];

export function BulkActionBar({
  selectedCount,
  totalCount,
  selectedIds,
  actions = defaultActions,
  onClearSelection,
  onSelectAll,
  isVisible,
  className,
}: BulkActionBarProps) {
  const selectedActions = actions.filter(a => selectedCount > 0 || a.id === "select-all");

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className={cn(
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
            "flex items-center gap-2 px-4 py-3",
            "bg-white dark:bg-slate-900",
            "border border-slate-200 dark:border-slate-700",
            "rounded-2xl shadow-2xl shadow-black/20",
            "min-w-fit",
            className
          )}
        >
          {/* Selection Info */}
          <div className="flex items-center gap-3 pr-4 border-r border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {selectedCount}
              </span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {selectedCount === 1 ? "1 post selected" : `${selectedCount} posts selected`}
              </p>
              <button 
                onClick={onSelectAll}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                {selectedCount === totalCount ? "Deselect all" : `Select all ${totalCount}`}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {selectedActions.slice(0, 4).map((action) => (
              <Button
                key={action.id}
                variant={action.variant === "destructive" ? "destructive" : action.variant === "primary" ? "default" : "ghost"}
                size="sm"
                onClick={() => action.action(selectedIds)}
                className={cn(
                  "gap-2 h-9",
                  action.variant !== "destructive" && action.variant !== "primary" && "hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                <action.icon className="w-4 h-4" />
                <span className="hidden md:inline">{action.label}</span>
              </Button>
            ))}
            
            {/* More Actions Dropdown */}
            {selectedActions.length > 4 && (
              <Button variant="ghost" size="sm" className="h-9 px-2">
                <span className="text-xs">More</span>
              </Button>
            )}
          </div>

          {/* Clear Button */}
          <button
            onClick={onClearSelection}
            className="ml-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Checkbox for bulk selection
interface BulkCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  className?: string;
}

export function BulkCheckbox({ checked, indeterminate, onChange, className }: BulkCheckboxProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={cn(
        "flex items-center justify-center w-5 h-5 rounded border transition-all duration-150",
        checked || indeterminate
          ? "bg-slate-900 border-slate-900 dark:bg-white dark:border-white"
          : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 hover:border-slate-400",
        className
      )}
    >
      {(checked || indeterminate) && (
        <svg 
          className={cn(
            "w-3.5 h-3.5",
            checked ? "text-white dark:text-slate-900" : "text-white dark:text-slate-900"
          )} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth={3}
        >
          {indeterminate && !checked ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          )}
        </svg>
      )}
    </button>
  );
}
