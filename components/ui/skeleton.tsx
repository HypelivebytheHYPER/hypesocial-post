"use client";

import { cn } from "@/lib/utils";

/**
 * Base Skeleton Component
 * 
 * Animated placeholder for loading states.
 * Uses pulse animation and gradient shimmer for modern feel.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800",
        className
      )}
      {...props}
    />
  );
}

/**
 * Shimmer Skeleton
 * More modern loading effect with moving gradient
 */
function SkeletonShimmer({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-neutral-200 dark:bg-neutral-800",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10" />
    </div>
  );
}

/**
 * Card Skeleton
 * For post cards, account cards, etc.
 */
function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border-subtle p-4 space-y-4", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <Skeleton className="h-32 w-full rounded-lg" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Post Card Skeleton
 * Specific for social post previews
 */
function PostCardSkeleton() {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-base p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      
      {/* Content */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      
      {/* Media placeholder */}
      <Skeleton className="h-48 w-full rounded-lg" />
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  );
}

/**
 * List Skeleton
 * For posts list, accounts list, etc.
 */
function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Sidebar Skeleton
 * For navigation loading
 */
function SidebarSkeleton() {
  return (
    <div className="w-64 p-4 space-y-6">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-6 w-24" />
      </div>
      
      {/* Nav items */}
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
      
      {/* Footer */}
      <div className="pt-4 border-t border-border-subtle">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Stats Grid Skeleton
 * For analytics dashboard
 */
function StatsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border-subtle bg-bg-base p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  );
}

/**
 * Form Skeleton
 * For forms with multiple inputs
 */
function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-10 w-32 mt-6" />
    </div>
  );
}

/**
 * Media Grid Skeleton
 * For media upload areas
 */
function MediaGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-xl" />
      ))}
    </div>
  );
}

export {
  Skeleton,
  SkeletonShimmer,
  CardSkeleton,
  PostCardSkeleton,
  ListSkeleton,
  SidebarSkeleton,
  StatsGridSkeleton,
  FormSkeleton,
  MediaGridSkeleton,
};
