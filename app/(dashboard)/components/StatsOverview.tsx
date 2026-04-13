"use client";

import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { SectionSkeleton } from "./SectionSkeleton";

import type { Variants } from "framer-motion";

interface StatsOverviewProps {
  totalPosts: number;
  publishedPosts: number;
  scheduledPosts: number;
  successRate: number;
  failedResults: number;
  resultsFetching: boolean;
  resultsLength: number;
  fadeUp: Variants;
}

export function StatsOverview({
  totalPosts,
  publishedPosts,
  scheduledPosts,
  successRate,
  failedResults,
  resultsFetching,
  resultsLength,
  fadeUp,
}: StatsOverviewProps) {
  return (
    <>
      {/* KPI: Total Posts */}
      <motion.div
        variants={fadeUp}
        className="col-span-1 card-premium p-5 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Posts
          </span>
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
          </div>
        </div>
        <div className="mt-auto">
          <p className="text-3xl font-bold text-slate-800 tracking-tight">{totalPosts}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-emerald-600 font-medium">{publishedPosts} published</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-400">{scheduledPosts} scheduled</span>
          </div>
        </div>
      </motion.div>

      {/* KPI: Success Rate */}
      <motion.div
        variants={fadeUp}
        className="col-span-1 card-premium p-5 flex flex-col items-center justify-center"
      >
        {resultsFetching && resultsLength === 0 ? (
          <SectionSkeleton height="h-20" />
        ) : (
          <>
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="6"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  className="stroke-emerald-500"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - successRate / 100)}`}
                  style={{ transition: "stroke-dashoffset 1s ease-out" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-slate-800">
                  {resultsLength > 0 ? `${successRate}%` : "—"}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">Success Rate</p>
            {failedResults > 0 && <p className="text-xs text-red-400 mt-0.5">{failedResults} failed</p>}
          </>
        )}
      </motion.div>
    </>
  );
}
