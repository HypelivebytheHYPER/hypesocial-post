"use client";

import { Info } from "lucide-react";

export function MetricInfo() {
  return (
    <div className="card-premium p-4 bg-gradient-to-br from-blue-50 to-white border-blue-100">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Info className="w-4 h-4 text-blue-600" />
        </div>
        <div className="space-y-3 flex-1">
          <div>
            <h3 className="text-slate-800 font-semibold text-sm mb-1">
              About These Metrics
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              All metrics are lifetime cumulative values fetched directly from
              each platform&apos;s API. Numbers may differ from in-app
              dashboards due to processing delays, metric availability, and
              platform constraints.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Processing & Delays */}
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Processing &amp; Delays
              </p>
              <ul className="text-[10px] text-slate-400 space-y-0.5">
                <li>&bull; Instagram/Facebook: up to 48-hour delay</li>
                <li>
                  &bull; YouTube: views may lag real-time (estimated/verified)
                </li>
                <li>
                  &bull; All platforms: lifetime counts, not periodic
                  snapshots
                </li>
              </ul>
            </div>

            {/* Unavailable Metrics */}
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Unavailable Metrics
              </p>
              <ul className="text-[10px] text-slate-400 space-y-0.5">
                <li>&bull; Bluesky: no view/impression counts via API</li>
                <li>&bull; YouTube: share counts not available via API</li>
                <li>&bull; Shown as &quot;N/A&quot; in per-account cards</li>
              </ul>
            </div>

            {/* Platform Constraints */}
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Platform Constraints
              </p>
              <ul className="text-[10px] text-slate-400 space-y-0.5">
                <li>&bull; LinkedIn: metrics only for Company Pages</li>
                <li>
                  &bull; Meta (IG/FB): organic only, 2-year data retention
                </li>
                <li>
                  &bull; Pinterest: 90-day and lifetime provided separately
                </li>
              </ul>
            </div>

            {/* Data Sources */}
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Data Sources
              </p>
              <ul className="text-[10px] text-slate-400 space-y-0.5">
                <li>&bull; X: impressions include organic + paid traffic</li>
                <li>
                  &bull; TikTok Business: extended watch time &amp;
                  demographics
                </li>
                <li>&bull; All platforms: ad/paid interactions excluded</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
