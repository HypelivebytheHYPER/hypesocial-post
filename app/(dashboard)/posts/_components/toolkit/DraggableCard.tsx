"use client";

import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import type { DragItem } from "./types";

interface DraggableCardProps {
  item: DragItem;
  children: React.ReactNode;
  className?: string;
  onDragStart?: () => void;
  onDragEnd?: (didDrop: boolean) => void;
  disabled?: boolean;
  dragHandle?: boolean;
}

export function DraggableCard({
  item,
  children,
  className,
  onDragStart,
  onDragEnd,
  disabled = false,
  dragHandle = false,
}: DraggableCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLifted, setIsLifted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-100, 100], [-5, 5]);
  const scale = useTransform(
    [x, y],
    (values: number[]) => {
      const [latestX, latestY] = values;
      const distance = Math.sqrt((latestX ?? 0) ** 2 + (latestY ?? 0) ** 2);
      return 1 + Math.min(distance / 500, 0.1);
    }
  );

  const handleDragStart = () => {
    setIsDragging(true);
    setIsLifted(true);
    onDragStart?.();
  };

  const handleDragEnd = (_: unknown, info: { offset: { x: number; y: number } }) => {
    setIsDragging(false);
    setIsLifted(false);
    
    // Check if dropped on a valid target (simplified logic)
    const didDrop = Math.abs(info.offset.x) > 50 || Math.abs(info.offset.y) > 50;
    onDragEnd?.(didDrop);
  };

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      drag
      dragMomentum={false}
      dragElastic={0.1}
      dragConstraints={{ left: -200, right: 200, top: -200, bottom: 200 }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{ x, y, rotate, scale }}
      whileHover={{ scale: 1.02, cursor: "grab" }}
      whileDrag={{ 
        scale: 1.05, 
        cursor: "grabbing",
        zIndex: 100,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)"
      }}
      className={cn(
        "relative transition-shadow",
        isDragging && "opacity-90",
        isLifted && "shadow-2xl z-50",
        className
      )}
      data-draggable-id={item.id}
      data-draggable-type={item.type}
    >
      {dragHandle && (
        <div className="absolute top-2 right-2 p-1.5 rounded-md bg-white/80 dark:bg-slate-900/80 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>
      )}
      {children}
      
      {/* Drag Preview Overlay */}
      {isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-slate-900/5 dark:bg-white/5 rounded-lg pointer-events-none"
        />
      )}
    </motion.div>
  );
}

// Droppable Zone Component
interface DroppableZoneProps {
  id: string;
  accepts: string[];
  children: React.ReactNode;
  className?: string;
  onDrop?: (item: DragItem) => void;
  onDragOver?: (isOver: boolean) => void;
  highlightOnDrag?: boolean;
}

export function DroppableZone({
  id,
  accepts,
  children,
  className,
  onDrop,
  onDragOver,
  highlightOnDrag = true,
}: DroppableZoneProps) {
  const [isOver, setIsOver] = useState(false);
  const [canAccept, setCanAccept] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedType = e.dataTransfer.getData("draggable-type");
    const canDrop = accepts.includes(draggedType);
    
    setCanAccept(canDrop);
    setIsOver(true);
    onDragOver?.(canDrop);
  };

  const handleDragLeave = () => {
    setIsOver(false);
    setCanAccept(false);
    onDragOver?.(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    setCanAccept(false);
    
    const draggedId = e.dataTransfer.getData("draggable-id");
    const draggedType = e.dataTransfer.getData("draggable-type");
    const draggedData = JSON.parse(e.dataTransfer.getData("draggable-data") || "{}");
    
    if (accepts.includes(draggedType)) {
      onDrop?.({ id: draggedId, type: draggedType as DragItem["type"], data: draggedData });
    }
  };

  return (
    <div
      id={id}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "transition-all duration-200",
        highlightOnDrag && isOver && canAccept && "ring-2 ring-blue-500/50 bg-blue-50/30 dark:bg-blue-500/10",
        highlightOnDrag && isOver && !canAccept && "ring-2 ring-red-500/50 bg-red-50/30",
        className
      )}
    >
      {children}
      
      {/* Drop Indicator */}
      {isOver && canAccept && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 border-2 border-dashed border-blue-400/50 rounded-lg pointer-events-none flex items-center justify-center"
        >
          <span className="text-xs font-medium text-blue-500 bg-white/90 dark:bg-slate-900/90 px-3 py-1 rounded-full shadow-sm">
            Drop here
          </span>
        </motion.div>
      )}
    </div>
  );
}
