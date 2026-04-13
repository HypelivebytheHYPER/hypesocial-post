/**
 * Surface Component - Linear-inspired clean surfaces
 * No heavy shadows, minimal borders, focus on content
 */

"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

const surfaceVariants = cva("relative", {
  variants: {
    elevation: {
      0: "",
      1: "shadow-sm",
      2: "shadow-md",
      3: "shadow-lg",
    },
    variant: {
      // Main app background
      app: "bg-[#fafafa] dark:bg-[#0a0a0a]",
      // Elevated surface - subtle, no heavy shadow
      elevated: [
        "bg-white dark:bg-[#111111]",
        "border border-slate-200/60 dark:border-slate-800/60",
        "rounded-xl",
      ],
      // Floating surface - for modals, panels
      floating: [
        "bg-white dark:bg-[#111111]",
        "border border-slate-200 dark:border-slate-800",
        "rounded-xl",
        "shadow-sm",
      ],
      // Subtle background variation
      subtle: "bg-slate-50/50 dark:bg-slate-900/30",
      // Interactive surface - hover states
      interactive: [
        "bg-white dark:bg-[#111111]",
        "border border-slate-200/60 dark:border-slate-800/60",
        "rounded-xl",
        "hover:border-slate-300 dark:hover:border-slate-700",
        "hover:bg-slate-50/50 dark:hover:bg-slate-800/50",
        "transition-colors duration-150",
      ],
    },
    padding: {
      none: "",
      xs: "p-2",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
      xl: "p-8",
    },
  },
  defaultVariants: {
    elevation: 0,
    variant: "elevated",
    padding: "md",
  },
});

export interface SurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof surfaceVariants> {}

const Surface = forwardRef<HTMLDivElement, SurfaceProps>(
  ({ className, variant, elevation, padding, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(surfaceVariants({ variant, elevation, padding }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Surface.displayName = "Surface";

/**
 * Divider - Subtle separator
 */
const Divider = forwardRef<
  HTMLHRElement,
  React.HTMLAttributes<HTMLHRElement> & { vertical?: boolean }
>(({ className, vertical, ...props }, ref) => {
  if (vertical) {
    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        className={cn(
          "w-px h-full bg-slate-200 dark:bg-slate-800",
          className
        )}
        {...props}
      />
    );
  }
  
  return (
    <hr
      ref={ref}
      className={cn(
        "h-px w-full bg-slate-200 dark:bg-slate-800 border-0",
        className
      )}
      {...props}
    />
  );
});
Divider.displayName = "Divider";

export { Surface, surfaceVariants, Divider };
