/**
 * Stack Component - Consistent vertical/horizontal spacing
 * Linear-style 4px grid system
 */

"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

const stackVariants = cva("flex", {
  variants: {
    direction: {
      vertical: "flex-col",
      horizontal: "flex-row",
    },
    gap: {
      0: "gap-0",
      1: "gap-1",    // 4px
      2: "gap-2",    // 8px
      3: "gap-3",    // 12px
      4: "gap-4",    // 16px
      6: "gap-6",    // 24px
      8: "gap-8",    // 32px
      10: "gap-10",  // 40px
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
    },
    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
    },
    wrap: {
      true: "flex-wrap",
      false: "flex-nowrap",
    },
  },
  defaultVariants: {
    direction: "vertical",
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
    { className, direction, gap, align, justify, wrap, children, ...props },
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
      >
        {children}
      </div>
    );
  }
);
Stack.displayName = "Stack";

// Convenience components
const VStack = forwardRef<HTMLDivElement, Omit<StackProps, "direction">>(
  (props, ref) => <Stack ref={ref} direction="vertical" {...props} />
);
VStack.displayName = "VStack";

const HStack = forwardRef<HTMLDivElement, Omit<StackProps, "direction">>(
  (props, ref) => <Stack ref={ref} direction="horizontal" {...props} />
);
HStack.displayName = "HStack";

export { Stack, VStack, HStack, stackVariants };
