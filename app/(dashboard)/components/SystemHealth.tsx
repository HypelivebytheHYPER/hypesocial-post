"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, RefreshCw, ChevronRight, ChevronDown, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Variants } from "framer-motion";
import type { DiagnosticTest } from "../hooks/useDiagnostics";

interface SystemHealthProps {
  tests: DiagnosticTest[];
  isRunning: boolean;
  successCount: number;
  errorCount: number;
  warningCount: number;
  hasIssues: boolean;
  onRunDiagnostics: () => void;
  fadeUp: Variants;
}

export function SystemHealth({
  tests,
  isRunning,
  successCount,
  errorCount,
  warningCount,
  hasIssues,
  onRunDiagnostics,
  fadeUp,
}: SystemHealthProps) {
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  const healthColor =
    errorCount > 0 ? "text-red-500" : warningCount > 0 ? "text-amber-500" : "text-emerald-500";
  const healthBg =
    errorCount > 0
      ? "bg-red-500/10"
      : warningCount > 0
      ? "bg-amber-500/10"
      : "bg-emerald-500/10";

  const statusText =
    errorCount > 0
      ? "Connection Issues"
      : warningCount > 0
      ? "Partially Connected"
      : "All Systems Operational";

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
              {statusText} ({successCount}/{tests.length})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRunDiagnostics}
            disabled={isRunning}
            className="text-slate-400 hover:text-slate-600 h-7 w-7 p-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-slate-600 h-7 text-xs px-2"
            asChild
          >
            <Link href="/diagnostics">
              Details <ChevronRight className="ml-0.5 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Segmented bar */}
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

      {/* Indicators */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-x-3 gap-y-2 mt-auto">
        {tests.map((test) => {
          const Icon = test.icon;
          const linkMap: Record<string, string> = {
            accounts: "/accounts/connect",
            webhooks: "/diagnostics",
          };
          const href = linkMap[test.id];
          const dot = (
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                test.status === "success"
                  ? "bg-emerald-500"
                  : test.status === "error"
                  ? "bg-red-500"
                  : test.status === "warning"
                  ? "bg-amber-500"
                  : test.status === "running"
                  ? "bg-blue-400 animate-pulse"
                  : "bg-slate-300"
              }`}
            />
          );
          const cls = "flex items-center gap-1.5 text-[11px] text-slate-500 transition-colors";
          return href ? (
            <Link key={test.id} href={href} className={`${cls} hover:text-slate-700`}>
              <Icon className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{test.name}</span>
              {dot}
            </Link>
          ) : (
            <div key={test.id} className={cls}>
              <Icon className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{test.name}</span>
              {dot}
            </div>
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
            {errorCount > 0
              ? `${errorCount} error${errorCount > 1 ? "s" : ""}`
              : `${warningCount} warning${warningCount > 1 ? "s" : ""}`}
            <ChevronDown
              className={`w-3 h-3 transition-transform ${showTroubleshooting ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      )}
    </motion.section>
  );
}
