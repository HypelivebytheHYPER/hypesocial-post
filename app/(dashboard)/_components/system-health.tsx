"use client";

import { motion } from "framer-motion";
import { Activity, RefreshCw, ChevronRight, AlertCircle, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export interface DiagnosticTest {
  id: string;
  name: string;
  status: "pending" | "running" | "success" | "error" | "warning";
  message?: string;
  icon: React.ElementType;
}

interface SystemHealthProps {
  tests: DiagnosticTest[];
  isRunning: boolean;
  onRun: () => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export function SystemHealth({ tests, isRunning, onRun }: SystemHealthProps) {
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  const successCount = tests.filter((t) => t.status === "success").length;
  const errorCount = tests.filter((t) => t.status === "error").length;
  const warningCount = tests.filter((t) => t.status === "warning").length;
  const hasIssues = errorCount > 0 || warningCount > 0;

  const healthColor = errorCount > 0
    ? "text-red-500"
    : warningCount > 0
      ? "text-amber-500"
      : "text-emerald-500";

  const healthBg = errorCount > 0
    ? "bg-red-500/10"
    : warningCount > 0
      ? "bg-amber-500/10"
      : "bg-emerald-500/10";

  const getStatusText = useCallback(() => {
    if (errorCount > 0) return "Connection Issues";
    if (warningCount > 0) return "Partially Connected";
    return "All Systems Operational";
  }, [errorCount, warningCount]);

  return (
    <motion.section
      variants={fadeUp}
      className="col-span-2 card-premium p-5 flex flex-col"
      data-testid="system-health"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${healthBg}`}>
            <Activity className={`w-4 h-4 ${healthColor}`} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">System Health</h2>
            <p className="text-xs text-slate-400">
              {getStatusText()} ({successCount}/{tests.length})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRun}
            disabled={isRunning}
            className="text-slate-400 hover:text-slate-600 h-7 w-7 p-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600 h-7 text-xs px-2" asChild>
            <Link href="/diagnostics">
              Details <ChevronRight className="ml-0.5 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Segmented progress bar */}
      <div className="flex gap-1 mb-3">
        {tests.map((test) => (
          <div
            key={test.id}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              test.status === "success"
                ? "bg-emerald-500"
                : test.status === "error"
                  ? "bg-red-500"
                  : test.status === "warning"
                    ? "bg-amber-500"
                    : test.status === "running"
                      ? "bg-blue-400 animate-pulse"
                      : "bg-slate-200"
            }`}
          />
        ))}
      </div>

      {/* Test indicators */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-x-3 gap-y-2 mt-auto">
        {tests.map((test) => {
          const Icon = test.icon;
          const linkMap: Record<string, string> = {
            accounts: "/accounts/connect",
            webhooks: "/diagnostics",
          };
          const href = linkMap[test.id];
          const dotColor = test.status === "success"
            ? "bg-emerald-500"
            : test.status === "error"
              ? "bg-red-500"
              : test.status === "warning"
                ? "bg-amber-500"
                : test.status === "running"
                  ? "bg-blue-400 animate-pulse"
                  : "bg-slate-300";

          const content = (
            <>
              <Icon className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{test.name}</span>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
            </>
          );

          const className = "flex items-center gap-1.5 text-[11px] text-slate-500 transition-colors";

          return href ? (
            <Link key={test.id} href={href} className={`${className} hover:text-slate-700`}>
              {content}
            </Link>
          ) : (
            <div key={test.id} className={className}>{content}</div>
          );
        })}
      </div>

      {/* Troubleshooting */}
      {hasIssues && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setShowTroubleshooting(!showTroubleshooting)}
            className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 transition-colors"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            {errorCount > 0 ? `${errorCount} error${errorCount > 1 ? "s" : ""}` : `${warningCount} warning${warningCount > 1 ? "s" : ""}`}
            <ChevronDown className={`w-3 h-3 transition-transform ${showTroubleshooting ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {showTroubleshooting && (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden mt-2 space-y-1 text-xs text-slate-500"
              >
                {tests
                  .filter((t) => t.status === "error" || t.status === "warning")
                  .map((t) => (
                    <li key={t.id} className="flex items-start gap-1.5">
                      <ChevronRight className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span><strong>{t.name}:</strong> {t.message}</span>
                    </li>
                  ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.section>
  );
}
