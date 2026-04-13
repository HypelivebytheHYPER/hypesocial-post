/**
 * Surface Component
 * Foundation layer for elevated containers
 * Elevation levels: 0 (flat) to 4 (overlay)
 */

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

const surfaceVariants = cva(
  // Base styles
  "relative rounded-xl transition-shadow duration-150",
  {
    variants: {
      elevation: {
        0: "bg-transparent",
        1: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm",
        2: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md",
        3: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg",
        4: "bg-white dark:bg-slate-900 shadow-xl",
      },
      padding: {
        none: "",
        xs: "p-2",
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
        xl: "p-8",
      },
      interactive: {
        false: "",
        true: "cursor-pointer hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 active:scale-[0.98]",
      },
    },
    defaultVariants: {
      elevation: 1,
      padding: "md",
      interactive: false,
    },
  }
);

export interface SurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof surfaceVariants> {
  as?: "div" | "article" | "section" | "aside" | "main";
}

const Surface = forwardRef<HTMLDivElement, SurfaceProps>(
  (
    {
      className,
      elevation,
      padding,
      interactive,
      as: Component = "div",
      ...props
    },
    ref
  ) => {
    return (
      <Component
        ref={ref}
        className={cn(
          surfaceVariants({ elevation, padding, interactive }),
          className
        )}
        {...props}
      />
    );
  }
);
Surface.displayName = "Surface";

export { Surface, surfaceVariants };
