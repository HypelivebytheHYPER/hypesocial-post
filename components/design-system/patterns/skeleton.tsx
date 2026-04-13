/**
 * Skeleton Loading Components
 * Boneyard-style loading placeholders with animations
 */

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

/* ==================== BASE SKELETON ==================== */

const skeletonVariants = cva(
  "animate-pulse bg-slate-200 dark:bg-slate-800 rounded-md",
  {
    variants: {
      variant: {
        default: "",
        card: "rounded-2xl",
        circle: "rounded-full",
        text: "rounded",
        avatar: "rounded-full",
        button: "rounded-full",
        image: "rounded-xl",
      },
      size: {
        xs: "h-2",
        sm: "h-3",
        base: "h-4",
        lg: "h-6",
        xl: "h-8",
        "2xl": "h-10",
        "3xl": "h-12",
      },
      width: {
        full: "w-full",
        "3/4": "w-3/4",
        "2/3": "w-2/3",
        "1/2": "w-1/2",
        "1/3": "w-1/3",
        "1/4": "w-1/4",
        "5/6": "w-5/6",
        "4/5": "w-4/5",
        auto: "w-auto",
        sm: "w-16",
        md: "w-24",
        lg: "w-32",
        xl: "w-48",
        "2xl": "w-64",
      },
      animation: {
        pulse: "animate-pulse",
        shimmer: "animate-shimmer bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 bg-[length:200%_100%]",
        wave: "animate-wave",
        none: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "base",
      width: "full",
      animation: "pulse",
    },
  }
);

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  /** Fixed height in pixels (overrides size) */
  height?: number;
  /** Fixed width in pixels (overrides width) */
  widthPx?: number;
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  (
    { className, variant, size, width, animation, height, widthPx, style, ...props },
    ref
  ) => {
    const customStyle = {
      ...(height && { height: `${height}px` }),
      ...(widthPx && { width: `${widthPx}px` }),
      ...style,
    };

    return (
      <div
        ref={ref}
        className={cn(skeletonVariants({ variant, size, width, animation }), className)}
        style={Object.keys(customStyle).length > 0 ? customStyle : undefined}
        {...props}
      />
    );
  }
);
Skeleton.displayName = "Skeleton";

/* ==================== SKELETON CARD ==================== */

interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of content lines */
  lines?: number;
  /** Show image placeholder */
  hasImage?: boolean;
  /** Image aspect ratio */
  imageRatio?: "1:1" | "16:9" | "4:3" | "3:2";
  /** Show avatar */
  hasAvatar?: boolean;
  /** Show action button */
  hasAction?: boolean;
}

function SkeletonCard({
  className,
  lines = 2,
  hasImage = true,
  imageRatio = "16:9",
  hasAvatar = false,
  hasAction = false,
  ...props
}: SkeletonCardProps) {
  const ratioClasses = {
    "1:1": "aspect-square",
    "16:9": "aspect-video",
    "4:3": "aspect-[4/3]",
    "3:2": "aspect-[3/2]",
  };

  return (
    <div
      className={cn(
        "p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900",
        className
      )}
      {...props}
    >
      {/* Image */}
      {hasImage && (
        <Skeleton
          variant="image"
          className={cn("w-full mb-4", ratioClasses[imageRatio])}
          animation="shimmer"
        />
      )}

      {/* Header with Avatar */}
      {(hasAvatar || hasAction) && (
        <div className="flex items-center gap-3 mb-3">
          {hasAvatar && (
            <Skeleton variant="avatar" size="lg" width="auto" className="w-10 h-10" />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton size="sm" width="2xl" />
            <Skeleton size="xs" width="lg" />
          </div>
          {hasAction && <Skeleton variant="button" size="base" width="sm" />}
        </div>
      )}

      {/* Content Lines */}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            size="sm"
            width={i === lines - 1 ? "3/4" : "full"}
            animation="shimmer"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ==================== SKELETON LIST ==================== */

interface SkeletonListProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of list items */
  count?: number;
  /** Show avatar on items */
  hasAvatar?: boolean;
  /** Show metadata line */
  hasMeta?: boolean;
}

function SkeletonList({
  className,
  count = 5,
  hasAvatar = true,
  hasMeta = true,
  ...props
}: SkeletonListProps) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
        >
          {hasAvatar && (
            <Skeleton variant="avatar" className="w-10 h-10 flex-shrink-0" animation="shimmer" />
          )}
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton size="sm" width="full" animation="shimmer" />
            {hasMeta && <Skeleton size="xs" width="2/3" animation="shimmer" />}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ==================== SKELETON GRID ==================== */

interface SkeletonGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of items */
  count?: number;
  /** Columns on desktop */
  columns?: 2 | 3 | 4 | 6;
  /** Item height */
  itemHeight?: number;
}

function SkeletonGrid({
  className,
  count = 6,
  columns = 3,
  itemHeight = 200,
  ...props
}: SkeletonGridProps) {
  const columnClasses = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
    6: "grid-cols-3 md:grid-cols-6",
  };

  return (
    <div className={cn("grid gap-4", columnClasses[columns], className)} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          variant="card"
          animation="shimmer"
          height={itemHeight}
          style={{ animationDelay: `${i * 50}ms` }}
        />
      ))}
    </div>
  );
}

/* ==================== SKELETON STAT ==================== */

interface SkeletonStatProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of stat cards */
  count?: number;
}

function SkeletonStat({ className, count = 4, ...props }: SkeletonStatProps) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-3"
        >
          <Skeleton size="xs" width="lg" animation="shimmer" />
          <Skeleton size="2xl" width="full" animation="shimmer" />
          <Skeleton size="xs" width="1/2" animation="shimmer" />
        </div>
      ))}
    </div>
  );
}

/* ==================== SKELETON TEXT BLOCK ==================== */

interface SkeletonTextProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of lines */
  lines?: number;
  /** Line heights vary */
  randomize?: boolean;
}

function SkeletonText({
  className,
  lines = 4,
  randomize = true,
  ...props
}: SkeletonTextProps) {
  const widths = randomize
    ? ["full", "3/4", "5/6", "1/2", "2/3", "4/5"]
    : Array(lines).fill("full");

  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          size="sm"
          width={widths[i % widths.length] as SkeletonProps["width"]}
          animation="shimmer"
          style={{ animationDelay: `${i * 75}ms` }}
        />
      ))}
    </div>
  );
}

/* ==================== COMPLEX LAYOUT SKELETONS ==================== */

/** Dashboard page skeleton with sidebar layout */
function SkeletonDashboard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-8", className)} {...props}>
      {/* Header */}
      <div className="space-y-2">
        <Skeleton size="2xl" width="2xl" className="h-10" />
        <Skeleton size="sm" width="lg" />
      </div>

      {/* Stats Row */}
      <SkeletonStat count={4} />

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <SkeletonCard hasImage lines={3} />
          <SkeletonCard hasImage lines={2} />
        </div>
        <div className="space-y-4">
          <SkeletonList count={5} />
        </div>
      </div>
    </div>
  );
}

/** Post creation page skeleton */
function SkeletonPostEditor({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <Skeleton variant="button" size="base" width="sm" />
        <Skeleton variant="button" size="base" width="sm" />
        <div className="flex-1" />
        <Skeleton variant="button" size="lg" width="lg" />
      </div>

      {/* Content Area */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="space-y-4">
          <Skeleton variant="card" className="h-48" />
          <div className="flex gap-2">
            <SkeletonGrid count={4} columns={4} itemHeight={80} />
          </div>
        </div>

        {/* Preview */}
        <SkeletonCard hasImage lines={4} imageRatio="1:1" />
      </div>
    </div>
  );
}

/* ==================== EXPORTS ==================== */

export {
  Skeleton,
  skeletonVariants,
  SkeletonCard,
  SkeletonList,
  SkeletonGrid,
  SkeletonStat,
  SkeletonText,
  SkeletonDashboard,
  SkeletonPostEditor,
};
