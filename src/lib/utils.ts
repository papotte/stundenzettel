import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import {
  eachDayOfInterval,
  eachWeekOfInterval,
  endOfMonth,
  endOfWeek,
  startOfMonth,
} from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00:00";
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map((v) => (v < 10 ? "0" + v : v)).join(":");
}

export function getWeeksForMonth(date: Date) {
  const firstDayOfMonth = startOfMonth(date);
  const lastDayOfMonth = endOfMonth(date);

  const weeks = eachWeekOfInterval(
    {
      start: firstDayOfMonth,
      end: lastDayOfMonth,
    },
    { weekStartsOn: 1 } // Monday as the first day of the week
  );

  return weeks.map((weekStart) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  });
}

export function formatDecimalHours(totalMinutes: number | undefined | null) {
  if (!totalMinutes) return '0.00';
  return (totalMinutes / 60).toFixed(2);
}

export function timeStringToMinutes(timeStr: string | undefined | null): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  if (parts.length !== 2) return 0;
  const [hours, minutes] = parts.map(Number);
  if (isNaN(hours) || isNaN(minutes)) return 0;
  return hours * 60 + minutes;
}
