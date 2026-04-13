"use client";

import { useState, useCallback, useMemo } from "react";
import type { SelectionState } from "../types";

export function useBulkSelection(itemIds: string[]): SelectionState {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isAllSelected = useMemo(() => {
    return itemIds.length > 0 && selectedIds.size === itemIds.length;
  }, [selectedIds, itemIds]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(itemIds));
    }
  }, [isAllSelected, itemIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectRange = useCallback((startId: string, endId: string) => {
    const startIndex = itemIds.indexOf(startId);
    const endIndex = itemIds.indexOf(endId);
    
    if (startIndex === -1 || endIndex === -1) return;
    
    const [min, max] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)];
    const rangeIds = itemIds.slice(min, max + 1);
    
    setSelectedIds(prev => {
      const next = new Set(prev);
      rangeIds.forEach(id => next.add(id));
      return next;
    });
  }, [itemIds]);

  return {
    selectedIds,
    isAllSelected,
    toggleSelection,
    toggleAll,
    clearSelection,
    selectRange,
  };
}
