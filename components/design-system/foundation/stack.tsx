/**
 * Stack Component
 * Flex and Grid layout utilities
 */

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

/* ==================== FLEX STACK ==================== */

const stackVariants = cva("flex", {
  variants: {
    direction: {
      row: "flex-row",
      column: "flex-col",
      "row-reverse": "flex-row-reverse",
      "column-reverse": "flex-col-reverse",
    },
    gap: {
      0: "gap-0",
      1: "gap-1",
      2: "gap-2",
      3: "gap-3",
      4: "gap-4",
      5: "gap-5",
      6: "gap-6",
      8: "gap-8",
      10: "gap-10",
      12: "gap-12",
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
      baseline: "items-baseline",
    },
    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly",
    },
    wrap: {
      true: "flex-wrap",
      false: "flex-nowrap",
    },
  },
  defaultVariants: {
    direction: "column",
    gap: 4,
    align: "stretch",
    justify: "start",
    wrap: false,
  },
});

export interface StackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stackVariants> {}

const Stack = forwardRef<HTMLDivElement, StackProps>(
  (
    {
      className,
      direction,
      gap,
      align,
      justify,
      wrap,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          stackVariants({ direction, gap, align, justify, wrap }),
          className
        )}
        {...props}
      />
    );
  }
);
Stack.displayName = "Stack";

/* ==================== INLINE (Horizontal Stack) ==================== */

const Inline = forwardRef<HTMLDivElement, Omit<StackProps, "direction">>(
  (props, ref) => <Stack ref={ref} direction="row" {...props} />
);
Inline.displayName = "Inline";

/* ==================== GRID ==================== */

const gridVariants = cva("grid", {
  variants: {
    columns: {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
      5: "grid-cols-5",
      6: "grid-cols-6",
      12: "grid-cols-12",
      none: "grid-cols-none",
    },
    gap: {
      0: "gap-0",
      1: "gap-1",
      2: "gap-2",
      3: "gap-3",
      4: "gap-4",
      5: "gap-5",
      6: "gap-6",
      8: "gap-8",
      10: "gap-10",
      12: "gap-12",
    },
  },
  defaultVariants: {
    columns: 1,
    gap: 4,
  },
});

export interface GridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridVariants> {}

const Grid = forwardRef<HTMLDivElement, GridProps>(
  ({ className, columns, gap, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(gridVariants({ columns, gap }), className)}
        {...props}
      />
    );
  }
);
Grid.displayName = "Grid";

/* ==================== EXPORT ==================== */

export { Stack, Inline, Grid, stackVariants, gridVariants };
