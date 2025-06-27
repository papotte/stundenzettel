
"use client";

import React, { useMemo, useCallback } from "react";
import type { User } from "firebase/auth";
import {
  format,
  isSameMonth,
  getDay,
  Locale,
  differenceInMinutes,
} from "date-fns";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { TimeEntry, UserSettings } from "@/lib/types";
import { getWeeksForMonth, formatDecimalHours } from "@/lib/utils";
import TimesheetHeader from "./timesheet-header";

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
    userSettings: UserSettings | null;
    getEntriesForDay: (day: Date) => TimeEntry[];
    calculateWeekTotal: (week: Date[]) => number;
    getLocationDisplayName: (location: string) => string;
    onEdit: (entry: TimeEntry) => void;
    onAdd: (date: Date) => void;
}

export default function TimesheetPreview({ selectedMonth, user, entries, t, locale, userSettings, getEntriesForDay, calculateWeekTotal, getLocationDisplayName, onEdit, onAdd }: TimesheetPreviewProps) {
  const weeksInMonth = useMemo(
    () => getWeeksForMonth(selectedMonth),
    [selectedMonth]
  );

  const weekHasEntries = useCallback((week: Date[]): boolean => {
    return week.some(day => {
      const isWorkingDay = getDay(day) !== 0;
      return isSameMonth(day, selectedMonth) && isWorkingDay
    });
  }, [selectedMonth]);

  const relevantWeeks = useMemo(() => weeksInMonth.filter(weekHasEntries), [weeksInMonth, weekHasEntries]);
  
  const monthTotal = useMemo(() => {
    return relevantWeeks.reduce((acc, week) => acc + calculateWeekTotal(week), 0);
  }, [relevantWeeks, calculateWeekTotal]);

  return (
    <div className="bg-white p-8 rounded-md shadow-md printable-area font-body print:p-2 print:shadow-none print:text-xs">
      <TimesheetHeader userSettings={userSettings} t={t} />
      <header className="flex justify-between items-start mb-4 print:mb-2">
        <h1 className="text-xl font-bold print:text-base">
          {t('export_preview.timesheetTitle', {month: format(selectedMonth, "MMMM", { locale })})}
        </h1>
        <div className="text-right font-semibold print:text-sm">{user?.displayName || user?.email}</div>
      </header>

      <main>
        {relevantWeeks.map((week, weekIndex) => (
          <div key={weekIndex} className="mb-6 print:mb-3">
            <Table className="border-collapse border border-black">
              <TableHeader>
                <TableRow className="bg-table-header hover:bg-table-header text-left text-black border-b-0 border-black">
                  <TableHead rowSpan={2} className="w-[5%] align-middle border-r border-black print:p-1 print:h-auto">
                    {t('export_preview.headerWeek')}
                  </TableHead>
                  <TableHead rowSpan={2} className="w-[8%] align-middle border-r border-black print:p-1 print:h-auto">
                    {t('export_preview.headerDate')}
                  </TableHead>
                  <TableHead rowSpan={2} className="w-auto text-left border-r border-black print:p-1 print:h-auto">
                    {t('export_preview.headerLocation')}
                  </TableHead>
                  <TableHead colSpan={2} className="w-[18%] print:p-1 print:h-auto">
                    {t('export_preview.headerWorkTime')}
                  </TableHead>
                  <TableHead rowSpan={2} className="w-[8%] align-middle border-l border-r border-black print:p-1 print:h-auto">{t('export_preview.headerPauseDuration')}</TableHead>
                  <TableHead rowSpan={2} className="w-[8%] align-middle border-r border-black print:p-1 print:h-auto">{t('export_preview.headerTravelTime')}</TableHead>
                  <TableHead rowSpan={2} className="w-[8%] align-middle border-r border-black print:p-1 print:h-auto">{t('export_preview.headerCompensatedTime')}</TableHead>
                  <TableHead rowSpan={2} className="w-[5%] align-middle border-r border-black print:p-1 print:h-auto">{t('export_preview.headerDriver')}</TableHead>
                  <TableHead rowSpan={2} className="w-[8%] align-middle print:p-1 print:h-auto">{t('export_preview.headerMileage')}</TableHead>
                </TableRow>
                 <TableRow className="bg-table-header hover:bg-table-header text-black border-b border-black">
                    <TableHead className="border-r-0 print:p-1 print:h-auto">{t('export_preview.headerFrom')}</TableHead>
                    <TableHead className="print:p-1 print:h-auto">{t('export_preview.headerTo')}</TableHead>
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
                       <TableRow key={day.toISOString()} className="border-b border-black last:border-b-0">
                          <TableCell className="bg-table-header font-medium border-r border-black text-left print:p-1">{dayOfWeekMap[getDay(day)]}</TableCell>
                          <TableCell className="group relative align-middle border-r border-black text-right cursor-default print:p-1">
                              {format(day, "d/M/yyyy")}
                              <Button variant="ghost" size="icon" className="absolute top-1/2 right-0.5 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 print:hidden" onClick={() => onAdd(day)}>
                                  <Plus className="h-4 w-4" />
                                  <span className="sr-only">Add entry</span>
                              </Button>
                          </TableCell>
                          <TableCell className="text-muted-foreground border-r border-black text-left print:p-1"></TableCell>
                          <TableCell className="text-right print:p-1"></TableCell>
                          <TableCell className="text-right print:p-1"></TableCell>
                          <TableCell className="text-right border-l border-r border-black print:p-1"></TableCell>
                          <TableCell className="text-right border-r border-black print:p-1"></TableCell>
                          <TableCell className="text-right border-r border-black print:p-1"></TableCell>
                          <TableCell className="text-left border-r border-black print:p-1"></TableCell>
                          <TableCell className="text-right print:p-1"></TableCell>
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
                    <TableRow 
                      key={entry.id} 
                      className="border-b border-black last:border-b-0 hover:bg-muted/50 cursor-pointer"
                      onClick={() => onEdit(entry)}
                    >
                      {entryIndex === 0 && <TableCell onClick={(e) => e.stopPropagation()} rowSpan={dayEntries.length} className="bg-table-header font-medium align-middle border-r border-black text-left cursor-default print:p-1">{dayOfWeekMap[getDay(day)]}</TableCell>}
                      {entryIndex === 0 && 
                        <TableCell onClick={(e) => e.stopPropagation()} rowSpan={dayEntries.length} className="group relative align-middle border-r border-black text-right cursor-default print:p-1">
                            {format(day, "d/M/yyyy")}
                            <Button variant="ghost" size="icon" className="absolute top-1/2 right-0.5 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 print:hidden" onClick={(e) => { e.stopPropagation(); onAdd(day); }}>
                                <Plus className="h-4 w-4" />
                                <span className="sr-only">Add entry</span>
                            </Button>
                        </TableCell>
                      }
                      <TableCell className="border-r border-black text-left print:p-1">{getLocationDisplayName(entry.location)}</TableCell>
                      <TableCell className="text-right print:p-1">{entry.startTime ? format(entry.startTime, 'HH:mm') : ''}</TableCell>
                      <TableCell className="text-right print:p-1">{entry.endTime ? format(entry.endTime, 'HH:mm') : ''}</TableCell>
                      <TableCell className="text-right border-l border-r border-black print:p-1">{formatDecimalHours(entry.pauseDuration)}</TableCell>
                      <TableCell className="text-right border-r border-black print:p-1">{(entry.travelTime || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right border-r border-black print:p-1">{compensatedHours.toFixed(2)}</TableCell>
                      <TableCell className="text-left border-r border-black print:p-1">{entry.isDriver ? t('export_preview.driverMark') : ''}</TableCell>
                      <TableCell className="text-right print:p-1"></TableCell>
                    </TableRow>
                  )});
                })}
              </TableBody>
            </Table>
             <div className="flex w-1/2 mt-2 justify-self-end justify-between print:text-xs print:mt-1">
                <div className="text-right">{t('export_preview.footerTotalPerWeek')}</div>
                <div className="text-right w-[20%] border-b-2 border-black pb-1 print:pb-0.5">{calculateWeekTotal(week).toFixed(2)}</div>
            </div>
          </div>
        ))}
        <div className="flex w-1/2 mt-8 justify-between justify-self-end print:text-xs print:mt-4">
            <div className="text-right">{t('export_preview.footerTotalHours')}</div>
            <div className="text-right border-b-4 border-double border-black pb-2 print:pb-1" style={{ flex: '0 0 calc(8% + 12%)' }}>{monthTotal.toFixed(2)}</div>
        </div>
        <div className="flex w-1/2 justify-end">
          <div className="mt-24 text-right print:text-sm print:mt-12">
              <p className="mt-2">{t('export_preview.signatureLine')}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
