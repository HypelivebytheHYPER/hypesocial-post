"use client";

import { useState, useCallback } from "react";
import type { DragAndDropState, DragItem } from "../types";

export function useDragAndDrop<T extends DragItem>(): DragAndDropState<T> {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<T | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const handleDragStart = useCallback((item: T) => {
    setDraggedItem(item);
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggedItem(null);
    setDragOverId(null);
    setDragOverColumn(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, targetId?: string, columnId?: string) => {
    e.preventDefault();
    if (targetId) setDragOverId(targetId);
    if (columnId) setDragOverColumn(columnId);
  }, []);

  const handleDrop = useCallback((
    e: React.DragEvent, 
    targetId?: string, 
    columnId?: string
  ): { item: T; targetId?: string; columnId?: string } | null => {
    e.preventDefault();
    if (!draggedItem) return null;
    
    handleDragEnd();
    
    return {
      item: draggedItem,
      targetId,
      columnId,
    };
  }, [draggedItem, handleDragEnd]);

  return {
    isDragging,
    draggedItem,
    dragOverId,
    dragOverColumn,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
  };
}
