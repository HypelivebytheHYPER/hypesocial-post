"use client";

import { useState, useCallback, useMemo } from "react";
import type { CalendarViewMode, CalendarEvent } from "../types";

export function useCalendar<T extends CalendarEvent>() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarViewMode>("month");

  const navigate = useCallback((direction: "prev" | "next" | "today") => {
    if (direction === "today") {
      setCurrentDate(new Date());
      return;
    }

    setCurrentDate(prev => {
      const next = new Date(prev);
      const multiplier = direction === "prev" ? -1 : 1;

      switch (view) {
        case "month":
          next.setMonth(next.getMonth() + multiplier);
          break;
        case "week":
          next.setDate(next.getDate() + 7 * multiplier);
          break;
        case "day":
          next.setDate(next.getDate() + multiplier);
          break;
        case "agenda":
          next.setMonth(next.getMonth() + multiplier);
          break;
      }

      return next;
    });
  }, [view]);

  const getEventsForDate = useCallback((events: T[], date: Date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return eventStart <= endOfDay && eventEnd >= startOfDay;
    });
  }, []);

  const getEventsForMonth = useCallback((events: T[], date: Date) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return eventStart <= endOfMonth && eventEnd >= startOfMonth;
    });
  }, []);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    const days: Date[] = [];
    
    // Previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthDays - i));
    }
    
    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    // Next month padding to complete grid
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  }, [currentDate]);

  return {
    currentDate,
    view,
    setView,
    navigate,
    calendarDays,
    getEventsForDate,
    getEventsForMonth,
  };
}
