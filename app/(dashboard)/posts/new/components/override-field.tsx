"use client";

import { cn } from "@/lib/utils";

type OverrideFieldConfig = {
  key: string;
  label: string;
  type: "select" | "boolean";
  options?: { value: string; label: string }[];
};

export function OverrideField({
  field,
  isEnabled,
  value,
  platformValue,
  onToggle,
  onChange,
}: {
  field: OverrideFieldConfig;
  isEnabled: boolean;
  value: unknown;
  platformValue: unknown;
  onToggle: (enabled: boolean) => void;
  onChange: (value: unknown) => void;
}) {
  const displayValue = isEnabled ? value : platformValue;

  return (
    <div className="flex items-center gap-2 py-1">
      <button
        type="button"
        onClick={() => onToggle(!isEnabled)}
        className={cn(
          "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
          isEnabled ? "bg-slate-700" : "bg-slate-200",
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform",
            isEnabled ? "translate-x-3" : "translate-x-0",
          )}
        />
      </button>
      <span
        className={cn(
          "text-xs min-w-[80px]",
          isEnabled ? "text-slate-700 font-medium" : "text-slate-400",
        )}
      >
        {field.label}
      </span>
      {field.type === "select" ? (
        <select
          value={String(displayValue ?? "")}
          onChange={(e) => onChange(e.target.value)}
          disabled={!isEnabled}
          className={cn(
            "flex-1 px-2 py-1 rounded text-xs border border-slate-200",
            isEnabled
              ? "bg-white text-slate-700"
              : "bg-slate-50 text-slate-400 cursor-not-allowed",
          )}
        >
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="checkbox"
          checked={Boolean(displayValue)}
          onChange={(e) => onChange(e.target.checked)}
          disabled={!isEnabled}
          className={cn(
            "rounded border-slate-300 text-slate-800 focus:ring-slate-200",
            !isEnabled && "opacity-40 cursor-not-allowed",
          )}
        />
      )}
    </div>
  );
}
