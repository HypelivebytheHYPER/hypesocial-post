import {
  FileEdit,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export type ViewMode = "board" | "list";
export type StatusFilter =
  | "all"
  | "draft"
  | "scheduled"
  | "processing"
  | "processed"
  | "failed";

export const statusConfig = {
  draft: {
    label: "Draft",
    icon: FileEdit,
    color: "bg-slate-100 text-slate-600 border-slate-200",
    accent: "border-slate-300",
    bg: "bg-slate-50/50",
  },
  scheduled: {
    label: "Scheduled",
    icon: Clock,
    color: "bg-blue-50 text-blue-600 border-blue-200",
    accent: "border-blue-300",
    bg: "bg-blue-50/30",
  },
  processing: {
    label: "Processing",
    icon: RefreshCw,
    color: "bg-amber-50 text-amber-600 border-amber-200",
    accent: "border-amber-300",
    bg: "bg-amber-50/30",
  },
  processed: {
    label: "Published",
    icon: CheckCircle2,
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    accent: "border-emerald-300",
    bg: "bg-emerald-50/30",
  },
  failed: {
    label: "Failed",
    icon: AlertCircle,
    color: "bg-red-50 text-red-600 border-red-200",
    accent: "border-red-300",
    bg: "bg-red-50/30",
  },
} as const;

// Animation variants
export const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};
