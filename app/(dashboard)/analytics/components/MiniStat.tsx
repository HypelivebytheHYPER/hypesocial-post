"use client";

import { formatNumber } from "@/lib/metrics";

interface MiniStatProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  available?: boolean;
}

export function MiniStat({
  icon: Icon,
  label,
  value,
  color,
  available = true,
}: MiniStatProps) {
  return (
    <div className="bg-slate-50 rounded-lg p-2 text-center">
      <Icon
        className={`w-3.5 h-3.5 mx-auto mb-0.5 ${available ? color : "text-slate-300"}`}
      />
      <p
        className={`text-sm font-semibold ${available ? "text-slate-800" : "text-slate-300"}`}
      >
        {available ? formatNumber(value) : "N/A"}
      </p>
      <p className="text-[10px] text-slate-400">{label}</p>
    </div>
  );
}
