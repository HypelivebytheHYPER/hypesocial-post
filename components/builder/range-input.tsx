"use client";

import { useRanger } from "@tanstack/react-ranger";
import { useRef } from "react";

interface RangeInputProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function RangeInput({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
}: RangeInputProps) {
  const rangerRef = useRef<HTMLDivElement>(null);
  const rangerInstance = useRanger<HTMLDivElement>({
    getRangerElement: () => rangerRef.current,
    values: [value],
    min,
    max,
    stepSize: step,
    onChange: (instance) => {
      const next = instance.sortedValues[0];
      if (typeof next === "number") onChange(next);
    },
  });

  return (
    <div
      ref={rangerRef}
      className="relative h-5 w-full cursor-pointer select-none touch-none"
    >
      <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 overflow-hidden rounded-full bg-muted">
        {/* Filled track */}
        <div
          className="h-full bg-primary"
          style={{ width: `${rangerInstance.getPercentageForValue(value)}%` }}
        />
      </div>

      {rangerInstance.handles().map(({ value: handleValue, onKeyDownHandler, onMouseDownHandler, onTouchStart }, idx) => (
        <button
          key={idx}
          onKeyDown={onKeyDownHandler}
          onMouseDown={onMouseDownHandler}
          onTouchStart={onTouchStart}
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={handleValue}
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-background shadow-sm transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/40"
          style={{ left: `${rangerInstance.getPercentageForValue(handleValue)}%` }}
          type="button"
        >
          <span className="absolute inset-0 m-auto block h-1.5 w-1.5 rounded-full bg-primary" />
        </button>
      ))}
    </div>
  );
}
