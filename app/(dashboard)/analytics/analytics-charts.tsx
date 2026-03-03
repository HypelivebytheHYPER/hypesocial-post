"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  Clock,
  TrendingUp,
  UserPlus,
  Globe,
} from "lucide-react";
import { formatNumber, formatDuration } from "@/lib/metrics";

interface TikTokBusinessInsightsData {
  postCount: number;
  totalWatchTime: number;
  avgWatchTime: number;
  totalNewFollowers: number;
  totalReach: number;
  totalWebsiteClicks: number;
  retentionData: { second: string; percentage: number }[];
  genderData: { gender: string; percentage: number }[];
  countryData: { country: string; percentage: number }[];
  impressionData: { source: string; percentage: number }[];
}

export default function TikTokInsightsCharts({
  data,
}: {
  data: TikTokBusinessInsightsData;
}) {
  return (
    <div>
      <h2 className="section-title mb-4 flex items-center gap-2">
        <span className="inline-block w-5 h-5 rounded-md bg-gradient-to-r from-cyan-500 to-pink-500" />
        TikTok Business Insights
        <span className="text-xs text-slate-400 font-normal">
          {data.postCount} posts
        </span>
      </h2>

      {/* Watch Time Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card-premium p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-cyan-600" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-800">
            {formatDuration(data.totalWatchTime)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Total Watch Time
          </p>
        </div>
        <div className="card-premium p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-800">
            {formatDuration(data.avgWatchTime)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Avg Watch Time
          </p>
        </div>
        <div className="card-premium p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-pink-600" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-800">
            {formatNumber(data.totalNewFollowers)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            New Followers
          </p>
        </div>
        <div className="card-premium p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Globe className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-800">
            {formatNumber(data.totalReach)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Reach</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Video Retention */}
        {data.retentionData.length > 0 && (
          <div className="card-premium p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Video Retention (Best Post)
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.retentionData}>
                  <XAxis
                    dataKey="second"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                    }}
                    formatter={(value: number) => [`${value}%`, "Retained"]}
                    labelFormatter={(label) => `${label}s`}
                  />
                  <Line
                    type="monotone"
                    dataKey="percentage"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Audience Gender */}
        {data.genderData.length > 0 && (
          <div className="card-premium p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Audience Gender
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.genderData}
                  layout="vertical"
                  margin={{ left: 60 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="gender"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    width={55}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                    }}
                    formatter={(value: number) => [`${value}%`, "Share"]}
                  />
                  <Bar dataKey="percentage" fill="#ec4899" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Top Countries */}
        {data.countryData.length > 0 && (
          <div className="card-premium p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Top Countries
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.countryData}
                  layout="vertical"
                  margin={{ left: 60 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, "auto"]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="country"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    width={55}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                    }}
                    formatter={(value: number) => [`${value}%`, "Share"]}
                  />
                  <Bar dataKey="percentage" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Impression Sources */}
        {data.impressionData.length > 0 && (
          <div className="card-premium p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Impression Sources
            </h3>
            <div className="space-y-3">
              {data.impressionData.map(
                ({ source, percentage }) => {
                  const maxPct =
                    data.impressionData[0]?.percentage || 1;
                  const barWidth = Math.max(
                    (percentage / maxPct) * 100,
                    2,
                  );
                  return (
                    <div key={source}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-600 capitalize">
                          {source.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">
                          {percentage}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-pink-500"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
