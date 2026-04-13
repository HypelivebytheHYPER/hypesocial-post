/**
 * Virtual List Component using TanStack Virtual
 * @module components/ui/virtual-list
 *
 * Efficiently renders large lists by only mounting visible items.
 * Use for: accounts lists, post feeds, media galleries with 50+ items.
 *
 * @example
 * ```tsx
 * <VirtualList
 *   items={accounts}
 *   renderItem={(account) => <AccountCard account={account} />}
 *   itemHeight={80}
 *   overscan={5}
 * />
 * ```
 */

"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";

interface VirtualListProps<T> {
  /** Array of items to render */
  items: T[];
  /** Render function for each item */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Height of each item in pixels */
  itemHeight: number;
  /** Number of items to render outside viewport (default: 5) */
  overscan?: number;
  /** Container height (default: 600px) */
  height?: number | string;
  /** Optional className for container */
  className?: string;
  /** Optional empty state */
  emptyState?: React.ReactNode;
  /** Optional loading state */
  isLoading?: boolean;
  /** Optional loading skeleton */
  loadingSkeleton?: React.ReactNode;
}

export function VirtualList<T>({
  items,
  renderItem,
  itemHeight,
  overscan = 5,
  height = 600,
  className,
  emptyState,
  isLoading,
  loadingSkeleton,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();

  if (isLoading && loadingSkeleton) {
    return (
      <div
        ref={parentRef}
        className={cn("overflow-auto", className)}
        style={{ height }}
      >
        {loadingSkeleton}
      </div>
    );
  }

  if (items.length === 0 && emptyState) {
    return (
      <div
        className={cn("flex items-center justify-center", className)}
        style={{ height }}
      >
        {emptyState}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className={cn("overflow-auto", className)}
      style={{ height }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {items[virtualItem.index] && renderItem(items[virtualItem.index]!, virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Virtual Grid for media galleries
 * Renders items in a grid layout with virtualization
 */
interface VirtualGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Number of columns */
  columns: number;
  /** Height of each row in pixels */
  rowHeight: number;
  /** Container height */
  height?: number | string;
  overscan?: number;
  className?: string;
  emptyState?: React.ReactNode;
}

export function VirtualGrid<T>({
  items,
  renderItem,
  columns,
  rowHeight,
  height = 600,
  overscan = 3,
  className,
  emptyState,
}: VirtualGridProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowCount = Math.ceil(items.length / columns);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();

  if (items.length === 0 && emptyState) {
    return (
      <div
        className={cn("flex items-center justify-center", className)}
        style={{ height }}
      >
        {emptyState}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className={cn("overflow-auto", className)}
      style={{ height }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map((virtualRow) => {
          const rowIndex = virtualRow.index;
          const startIndex = rowIndex * columns;
          const rowItems = items.slice(startIndex, startIndex + columns);

          return (
            <div
              key={virtualRow.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                display: "grid",
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: "1rem",
              }}
            >
              {rowItems.map((item, colIndex) => (
                <div key={startIndex + colIndex}>
                  {renderItem(item, startIndex + colIndex)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
