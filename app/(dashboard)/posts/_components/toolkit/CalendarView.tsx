"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  MoreHorizontal
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CalendarEvent } from "./types";

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onEventMove?: (eventId: string, newDate: Date) => void;
  onSlotClick?: (date: Date) => void;
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
  viewMode?: "month" | "week" | "day";
}

export function CalendarView({
  events,
  onEventClick,
  onEventMove,
  onSlotClick,
  currentDate: propDate,
  onDateChange,
  viewMode = "month",
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(propDate || new Date());
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);

  const displayDate = propDate || currentDate;
  const setDisplayDate = onDateChange || setCurrentDate;

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(displayDate));
    const end = endOfWeek(endOfMonth(displayDate));
    return eachDayOfInterval({ start, end });
  }, [displayDate]);

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(event.start, day));
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setDisplayDate(direction === "prev" ? subMonths(displayDate, 1) : addMonths(displayDate, 1));
  };

  const goToToday = () => {
    setDisplayDate(new Date());
  };

  const handleDragStart = (event: CalendarEvent) => {
    setDraggedEvent(event);
  };

  const handleDragEnd = () => {
    setDraggedEvent(null);
  };

  const handleDayDrop = (day: Date) => {
    if (draggedEvent && onEventMove) {
      onEventMove(draggedEvent.id, day);
    }
    setDraggedEvent(null);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {format(displayDate, "MMMM yyyy")}
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateMonth("next")}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            {(["month", "week", "day"] as const).map((mode) => (
              <button
                key={mode}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-all",
                  viewMode === mode
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="px-2 py-2 text-center text-xs font-semibold text-slate-500 uppercase">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr">
        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, displayDate);
          const isTodayDate = isToday(day);
          
          return (
            <motion.div
              key={day.toISOString()}
              layout
              onClick={() => onSlotClick?.(day)}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDayDrop(day);
              }}
              className={cn(
                "relative min-h-[100px] p-2 border-b border-r border-slate-100 dark:border-slate-800",
                "transition-colors duration-150",
                !isCurrentMonth && "bg-slate-50/50 dark:bg-slate-900/30",
                isTodayDate && "bg-blue-50/30 dark:bg-blue-500/5",
                draggedEvent && "hover:bg-blue-50/50 dark:hover:bg-blue-500/10"
              )}
            >
              {/* Date Number */}
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                  isTodayDate 
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" 
                    : "text-slate-700 dark:text-slate-300",
                  !isCurrentMonth && "text-slate-400 dark:text-slate-600"
                )}>
                  {format(day, "d")}
                </span>
                {dayEvents.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] h-5">
                    {dayEvents.length}
                  </Badge>
                )}
              </div>

              {/* Events */}
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <motion.div
                    key={event.id}
                    layoutId={event.id}
                    draggable
                    onDragStart={() => handleDragStart(event)}
                    onDragEnd={handleDragEnd}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                    className={cn(
                      "px-2 py-1.5 rounded-lg text-xs cursor-pointer",
                      "border-l-2 bg-white dark:bg-slate-800 shadow-sm",
                      "hover:shadow-md hover:scale-[1.02] transition-all",
                      "group"
                    )}
                    style={{ borderLeftColor: event.color }}
                  >
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className="font-medium truncate">{event.title}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-500">
                      <span>{format(event.start, "h:mm a")}</span>
                      <span>•</span>
                      <span className="capitalize">{event.platform}</span>
                    </div>
                  </motion.div>
                ))}
                
                {dayEvents.length > 3 && (
                  <button className="text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 py-1">
                    +{dayEvents.length - 3} more
                  </button>
                )}
              </div>

              {/* Drop Indicator */}
              {draggedEvent && (
                <div className="absolute inset-1 border-2 border-dashed border-blue-400/50 rounded-lg pointer-events-none opacity-0 hover:opacity-100 transition-opacity" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <span className="text-xs text-slate-500">Status:</span>
        {[
          { label: "Draft", color: "bg-amber-400" },
          { label: "Scheduled", color: "bg-blue-400" },
          { label: "Published", color: "bg-emerald-400" },
          { label: "Failed", color: "bg-red-400" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={cn("w-2 h-2 rounded-full", item.color)} />
            <span className="text-xs text-slate-600 dark:text-slate-400">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
