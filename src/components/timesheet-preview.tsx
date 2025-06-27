
"use client";

import React, { useMemo, useCallback } from "react";
import type { User } from "firebase/auth";
import {
  format,
  isSameMonth,
  isSameDay,
  differenceInMinutes,
  getDay,
  Locale,
} from "date-fns";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import type { TimeEntry } from "@/lib/types";
import { getWeeksForMonth, formatDecimalHours } from "@/lib/utils";
import { SPECIAL_LOCATION_KEYS } from "@/lib/constants";

const dayOfWeekMap: { [key: number]: string } = {
  1: "Mo",
  2: "Di",
  3: "Mi",
  4: "Do",
  5: "Fr",
  6: "Sa",
  0: "So",
};

interface TimesheetPreviewProps {
    selectedMonth: Date;
    user: User | null;
    entries: TimeEntry[];
    t: (key: string, replacements?: Record<string, string | number>) => string;
    locale: Locale;
}

export default function TimesheetPreview({ selectedMonth, user, entries, t, locale }: TimesheetPreviewProps) {
  const weeksInMonth = useMemo(
    () => getWeeksForMonth(selectedMonth),
    [selectedMonth]
  );

  const getEntriesForDay = useCallback((day: Date) => {
    return entries
      .filter((entry) => entry.startTime && isSameDay(entry.startTime, day))
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [entries]);

  const calculateWeekTotal = useCallback((week: Date[]) => {
    let totalMinutes = 0;
    week.forEach((day) => {
      if (isSameMonth(day, selectedMonth)) {
        getEntriesForDay(day).forEach((entry) => {
          if (entry.endTime) {
            const workMinutes = differenceInMinutes(entry.endTime, entry.startTime);
            const isCompensatedSpecialDay = ["SICK_LEAVE", "PTO", "BANK_HOLIDAY"].includes(entry.location);

            if (isCompensatedSpecialDay) {
                totalMinutes += workMinutes;
            } else if (entry.location !== 'TIME_OFF_IN_LIEU') {
                const compensatedMinutes = workMinutes - (entry.pauseDuration || 0) + (entry.travelTime || 0) * 60;
                totalMinutes += compensatedMinutes > 0 ? compensatedMinutes : 0;
            }
          }
        });
      }
    });
    return totalMinutes / 60;
  }, [selectedMonth, getEntriesForDay]);

  const weekHasEntries = useCallback((week: Date[]): boolean => {
    return week.some(day => {
      return isSameMonth(day, selectedMonth) && getEntriesForDay(day).length > 0;
    });
  }, [selectedMonth, getEntriesForDay]);

  const relevantWeeks = useMemo(() => weeksInMonth.filter(weekHasEntries), [weeksInMonth, weekHasEntries]);
  
  const monthTotal = useMemo(() => {
    return relevantWeeks.reduce((acc, week) => acc + calculateWeekTotal(week), 0);
  }, [relevantWeeks, calculateWeekTotal]);

  const getLocationDisplayName = (location: string) => {
    if (SPECIAL_LOCATION_KEYS.includes(location as any)) {
      return t(`special_locations.${location}`);
    }
    return location;
  };
    
  return (
    <div className="bg-white p-8 rounded-md shadow-md printable-area font-body">
      <header className="flex justify-between items-start mb-4">
        <h1 className="text-xl font-bold">
          {t('export_preview.timesheetTitle', {month: format(selectedMonth, "MMMM", { locale })})}
        </h1>
        <div className="text-right font-semibold">{user?.displayName || user?.email}</div>
      </header>

      <main>
        {relevantWeeks.map((week, weekIndex) => (
          <div key={weekIndex} className="mb-6">
            <Table className="border border-black">
              <TableHeader>
                <TableRow className="bg-table-header hover:bg-table-header text-black">
                  <TableHead rowSpan={2} className="w-[8%] align-middle text-left border-r border-black">
                    {t('export_preview.headerWeek')}
                  </TableHead>
                  <TableHead rowSpan={2} className="w-[10%] align-middle text-right border-r border-black">
                    {t('export_preview.headerDate')}
                  </TableHead>
                  <TableHead rowSpan={2} className="w-[18%] align-middle text-left border-r border-black">
                    {t('export_preview.headerLocation')}
                  </TableHead>
                  <TableHead colSpan={2} className="w-[14%] text-center border-b border-black">
                    {t('export_preview.headerWorkTime')}
                  </TableHead>
                  <TableHead rowSpan={2} className="w-[10%] text-right align-middle border-r border-black">{t('export_preview.headerPauseDuration')}</TableHead>
                  <TableHead rowSpan={2} className="w-[8%] text-right align-middle border-r border-black">{t('export_preview.headerTravelTime')}</TableHead>
                  <TableHead rowSpan={2} className="w-[10%] text-right align-middle border-r border-black">{t('export_preview.headerCompensatedTime')}</TableHead>
                  <TableHead rowSpan={2} className="w-[8%] text-center align-middle border-r border-black">{t('export_preview.headerDriver')}</TableHead>
                  <TableHead rowSpan={2} className="w-[12%] text-right align-middle">{t('export_preview.headerMileage')}</TableHead>
                </TableRow>
                 <TableRow className="bg-table-header hover:bg-table-header text-black">
                    <TableHead className="text-right border-r border-black">{t('export_preview.headerFrom')}</TableHead>
                    <TableHead className="text-right border-r border-black">{t('export_preview.headerTo')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {week.map((day) => {
                   if (!isSameMonth(day, selectedMonth)) {
                    return null;
                  }

                  const dayEntries = getEntriesForDay(day);
                  const isSunday = getDay(day) === 0;

                  if (dayEntries.length === 0) {
                    if (isSunday) return null; // Don't render empty Sundays
                    return (
                       <TableRow key={day.toISOString()} className="border-b-0">
                          <TableCell className="bg-table-header font-medium border-r border-black text-left">{dayOfWeekMap[getDay(day)]}</TableCell>
                          <TableCell className="border-r border-black text-right">{format(day, "d/M/yyyy")}</TableCell>
                          <TableCell className="text-muted-foreground border-r border-black text-left"></TableCell>
                          <TableCell className="text-right border-r border-black"></TableCell>
                          <TableCell className="text-right border-r border-black"></TableCell>
                          <TableCell className="text-right border-r border-black"></TableCell>
                          <TableCell className="text-right border-r border-black"></TableCell>
                          <TableCell className="text-right border-r border-black"></TableCell>
                          <TableCell className="text-center border-r border-black"></TableCell>
                          <TableCell className="text-right"></TableCell>
                        </TableRow>
                    )
                  }
                  
                  return dayEntries.map((entry, entryIndex) => {
                     let compensatedHours = 0;
                     if (entry.endTime) {
                        const workDuration = differenceInMinutes(entry.endTime, entry.startTime);
                        const isCompensatedSpecialDay = ["SICK_LEAVE", "PTO", "BANK_HOLIDAY"].includes(entry.location);
                        if (isCompensatedSpecialDay) {
                            compensatedHours = workDuration / 60;
                        } else if (entry.location !== 'TIME_OFF_IN_LIEU') {
                            const compensatedMinutes = workDuration - (entry.pauseDuration || 0) + (entry.travelTime || 0) * 60;
                            compensatedHours = compensatedMinutes > 0 ? compensatedMinutes / 60 : 0;
                        }
                     }

                    return (
                    <TableRow key={entry.id} className="border-b-0">
                      {entryIndex === 0 && <TableCell rowSpan={dayEntries.length} className="bg-table-header font-medium align-middle border-r border-black text-left">{dayOfWeekMap[getDay(day)]}</TableCell>}
                      {entryIndex === 0 && <TableCell rowSpan={dayEntries.length} className="align-middle border-r border-black text-right">{format(day, "d/M/yyyy")}</TableCell>}
                      <TableCell className="border-r border-black text-left">{getLocationDisplayName(entry.location)}</TableCell>
                      <TableCell className="text-right border-r border-black">{entry.startTime ? format(entry.startTime, 'HH:mm') : ''}</TableCell>
                      <TableCell className="text-right border-r border-black">{entry.endTime ? format(entry.endTime, 'HH:mm') : ''}</TableCell>
                      <TableCell className="text-right border-r border-black">{formatDecimalHours(entry.pauseDuration)}</TableCell>
                      <TableCell className="text-right border-r border-black">{(entry.travelTime || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right border-r border-black">{compensatedHours.toFixed(2)}</TableCell>
                      <TableCell className="text-center border-r border-black">{entry.isDriver ? t('export_preview.driverMark') : ''}</TableCell>
                      <TableCell className="text-right"></TableCell>
                    </TableRow>
                  )});
                })}
              </TableBody>
            </Table>
            <div className="flex w-full mt-2 text-sm">
                <div style={{ width: 'calc(8% + 10% + 18% + 14%)' }} />
                <div style={{ width: 'calc(10% + 8% + 10%)' }} className="font-medium text-right pr-4">
                  {t('export_preview.footerTotalPerWeek')}
                </div>
                <div style={{ width: 'calc(8% + 12%)' }} className="text-right">
                    <span className="font-bold border-b-2 border-black pb-1">{calculateWeekTotal(week).toFixed(2)}</span>
                </div>
            </div>
          </div>
        ))}
        <div className="flex w-full mt-8">
            <div style={{ width: 'calc(8% + 10% + 18% + 14%)' }} />
            <div style={{ width: 'calc(10% + 8% + 10%)' }} className="font-bold text-right pr-4">
              {t('export_preview.footerTotalHours')}
            </div>
            <div style={{ width: 'calc(8% + 12%)' }} className="text-right">
                <span className="font-bold border-b-[3px] [border-bottom-style:double] border-black pb-2">{monthTotal.toFixed(2)}</span>
            </div>
        </div>
        <div className="flex justify-end">
          <div className="mt-24 text-sm text-right">
              <div className="border-t border-black w-72"></div>
              <p className="mt-2">{t('export_preview.signatureLine')}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
