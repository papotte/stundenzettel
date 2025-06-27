
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay,
  differenceInMinutes,
  getDay,
} from "date-fns";
import { de, enUS } from "date-fns/locale";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableFooter,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import type { TimeEntry } from "@/lib/types";
import { getWeeksForMonth, formatDecimalHours } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { getTimeEntries } from "@/services/time-entry-service";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/context/i18n-context";
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

export default function ExportPreview() {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<Date>();
  const [employeeName, setEmployeeName] = useState("Raquel Crespillo Andujar");

  const locale = useMemo(() => (language === 'de' ? de : enUS), [language]);

  useEffect(() => {
    if (!user) return;
    const fetchAndSetEntries = async () => {
      setIsLoading(true);
      try {
        const fetchedEntries = await getTimeEntries(user.uid);
        setEntries(fetchedEntries);
      } catch (error) {
        console.error("Failed to load time entries from Firestore.", error);
      }
      setSelectedMonth(new Date());
      setIsLoading(false);
    };
    fetchAndSetEntries();
  }, [user]);

  const weeksInMonth = useMemo(
    () => (selectedMonth ? getWeeksForMonth(selectedMonth) : []),
    [selectedMonth]
  );

  const getEntriesForDay = useCallback((day: Date) => {
    return entries
      .filter((entry) => entry.startTime && isSameDay(entry.startTime, day))
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [entries]);

  const calculateWeekTotal = useCallback((week: Date[]) => {
    if (!selectedMonth) return 0;
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
    if (!selectedMonth) return false;
    return week.some(day => {
      return isSameMonth(day, selectedMonth) && getEntriesForDay(day).length > 0;
    });
  }, [selectedMonth, getEntriesForDay]);

  const relevantWeeks = useMemo(() => weeksInMonth.filter(weekHasEntries), [weeksInMonth, weekHasEntries]);
  
  const monthTotal = useMemo(() => {
    if (!selectedMonth) return 0;
    return relevantWeeks.reduce((acc, week) => acc + calculateWeekTotal(week), 0);
  }, [relevantWeeks, calculateWeekTotal, selectedMonth]);

  const getLocationDisplayName = (location: string) => {
    if (SPECIAL_LOCATION_KEYS.includes(location as any)) {
      return t(`special_locations.${location}`);
    }
    return location;
  };

  const handleExport = () => {
    if (!selectedMonth) return;

    const headerRow1 = [
        t('export_preview.headerWeek'),
        t('export_preview.headerDate'),
        t('export_preview.headerLocation'),
        t('export_preview.headerWorkTime'),
        null,
        t('export_preview.headerPauseDuration'),
        t('export_preview.headerTravelTime'),
        t('export_preview.headerCompensatedTime'),
        t('export_preview.headerDriver'),
        t('export_preview.headerMileage'),
    ];

    const headerRow2 = [
        null, null, null,
        t('export_preview.headerFrom'),
        t('export_preview.headerTo'),
        null, null, null, null, null
    ];
    
    const data: (string | number)[][] = [];

    relevantWeeks.forEach(week => {
      week.forEach(day => {
        if (isSameMonth(day, selectedMonth)) {
            const dayEntries = getEntriesForDay(day);
            if (dayEntries.length > 0) {
              dayEntries.forEach(entry => {
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
                const pauseDecimal = formatDecimalHours(entry.pauseDuration);
                
                data.push([
                    dayOfWeekMap[getDay(day)],
                    format(day, 'd/M/yyyy'),
                    getLocationDisplayName(entry.location),
                    entry.startTime ? format(entry.startTime, 'HH:mm') : '',
                    entry.endTime ? format(entry.endTime, 'HH:mm') : '',
                    parseFloat(pauseDecimal),
                    entry.travelTime || '',
                    parseFloat(compensatedHours.toFixed(2)),
                    entry.isDriver ? t('export_preview.driverMark') : '',
                    '',
                ]);
              });
            } else if (getDay(day) !== 0 && getDay(day) !== 6) { // Not Sunday or Saturday
                data.push([
                    dayOfWeekMap[getDay(day)],
                    format(day, 'd/M/yyyy'),
                    '', '', '', '', '', '', '', '',
                ]);
            }
        }
      });
      const weeklyTotal = calculateWeekTotal(week);
      data.push(['', '', '', '', '', '', t('export_preview.footerTotalPerWeek'), weeklyTotal.toFixed(2), '', '']);
      data.push([]); // Empty row
    });

    data.push([]);
    data.push(['', '', '', '', '', '', t('export_preview.footerTotalHours'), monthTotal.toFixed(2), '', '']);

    const worksheetData = [
      [t('export_preview.timesheetTitle', {month: format(selectedMonth, "MMMM yyyy", { locale })}), '', '', '', '', '', '', '', '', user?.displayName || employeeName],
      [],
      headerRow1,
      headerRow2,
      ...data
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Define merges for the two-row header
    if (!worksheet['!merges']) worksheet['!merges'] = [];
    worksheet['!merges'].push(
      { s: { r: 2, c: 0 }, e: { r: 3, c: 0 } }, // Week
      { s: { r: 2, c: 1 }, e: { r: 3, c: 1 } }, // Date
      { s: { r: 2, c: 2 }, e: { r: 3, c: 2 } }, // Location
      { s: { r: 2, c: 3 }, e: { r: 2, c: 4 } }, // Work Time
      { s: { r: 2, c: 5 }, e: { r: 3, c: 5 } }, // Pause
      { s: { r: 2, c: 6 }, e: { r: 3, c: 6 } }, // Travel
      { s: { r: 2, c: 7 }, e: { r: 3, c: 7 } }, // Compensated
      { s: { r: 2, c: 8 }, e: { r: 3, c: 8 } }, // Driver
      { s: { r: 2, c: 9 }, e: { r: 3, c: 9 } }  // New Column
    );
    
    const headerStyle = { fill: { fgColor: { rgb: "99CCFF" } }, font: { bold: true }, alignment: { vertical: 'center', horizontal: 'center' } };
    const dayColStyle = { fill: { fgColor: { rgb: "99CCFF" } } };

    // Apply style to all header cells
    for (let R = 2; R <= 3; ++R) {
        for (let C = 0; C <= 9; ++C) {
            const address = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = worksheet[address];
            if (cell) {
              if (!cell.s) cell.s = {};
              cell.s = { ...cell.s, ...headerStyle };
            } else {
              worksheet[address] = { s: headerStyle };
            }
        }
    }
    
    // Apply style to day column in data rows
    data.forEach((rowData, index) => {
        const firstCell = rowData[0];
        if (Object.values(dayOfWeekMap).includes(firstCell as string)) {
            const address = `A${index + 5}`;
            if (worksheet[address]) {
                if (!worksheet[address].s) worksheet[address].s = {};
                worksheet[address].s.fill = dayColStyle.fill;
            }
        }
    });

    const colWidths = [
        { wch: 8 }, { wch: 12 }, { wch: 20 }, { wch: 8 }, { wch: 8 }, 
        { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 8 }, { wch: 20 }
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stundenzettel");
    XLSX.writeFile(workbook, `Stundenzettel_${format(selectedMonth, "MMMM_yyyy", { locale })}.xlsx`);
  };
  
  if (isLoading || !selectedMonth) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 print:hidden">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-10" />
            </div>
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="bg-white p-8 rounded-md shadow-md printable-area">
            <header className="flex justify-between items-start mb-4 border-b pb-4">
                <Skeleton className="h-7 w-2/5" />
                <Skeleton className="h-7 w-1/4" />
            </header>
            <main>
                <div className="space-y-6">
                    <Skeleton className="h-56 w-full" />
                    <Skeleton className="h-56 w-full" />
                </div>
            </main>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 print:hidden">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-2xl font-bold text-center font-headline">
              {format(selectedMonth, "MMMM yyyy", { locale })}
            </h2>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={handleExport} className="mt-4 sm:mt-0">
            <Download className="mr-2 h-4 w-4" />
            {t('export_preview.exportButton')}
          </Button>
        </div>

        <div className="bg-white p-8 rounded-md shadow-md printable-area">
          <header className="flex justify-between items-start mb-4 border-b pb-4">
            <h1 className="text-xl font-bold font-headline">
              {t('export_preview.timesheetTitle', {month: format(selectedMonth, "MMMM yyyy", { locale })})}
            </h1>
            <div className="text-right font-semibold">{user?.displayName || user?.email || employeeName}</div>
          </header>

          <main>
            {relevantWeeks.map((week, weekIndex) => (
              <div key={weekIndex} className="mb-6">
                <Table className="border-t border-x border-black [&_tr]:border-black">
                  <TableHeader>
                    <TableRow className="bg-table-header hover:bg-table-header border-b-0 text-black">
                      <TableHead rowSpan={2} className="w-[8%] align-middle">{t('export_preview.headerWeek')}</TableHead>
                      <TableHead rowSpan={2} className="w-[10%] align-middle">{t('export_preview.headerDate')}</TableHead>
                      <TableHead rowSpan={2} className="w-[18%] align-middle">{t('export_preview.headerLocation')}</TableHead>
                      <TableHead colSpan={2} className="w-[14%] text-center">{t('export_preview.headerWorkTime')}</TableHead>
                      <TableHead rowSpan={2} className="w-[10%] text-center align-middle">{t('export_preview.headerPauseDuration')}</TableHead>
                      <TableHead rowSpan={2} className="w-[8%] text-center align-middle">{t('export_preview.headerTravelTime')}</TableHead>
                      <TableHead rowSpan={2} className="w-[10%] text-center align-middle">{t('export_preview.headerCompensatedTime')}</TableHead>
                      <TableHead rowSpan={2} className="w-[8%] text-center align-middle">{t('export_preview.headerDriver')}</TableHead>
                      <TableHead rowSpan={2} className="w-[12%] text-center align-middle">{t('export_preview.headerMileage')}</TableHead>
                    </TableRow>
                     <TableRow className="bg-table-header hover:bg-table-header text-black">
                        <TableHead className="text-center">{t('export_preview.headerFrom')}</TableHead>
                        <TableHead className="text-center">{t('export_preview.headerTo')}</TableHead>
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
                           <TableRow key={day.toISOString()}>
                              <TableCell className="bg-table-header font-medium">{dayOfWeekMap[getDay(day)]}</TableCell>
                              <TableCell>{format(day, "d/M/yyyy")}</TableCell>
                              <TableCell className="text-muted-foreground">..................................................</TableCell>
                              <TableCell></TableCell>
                              <TableCell></TableCell>
                              <TableCell></TableCell>
                              <TableCell></TableCell>
                              <TableCell></TableCell>
                              <TableCell></TableCell>
                              <TableCell></TableCell>
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
                        <TableRow key={entry.id}>
                          {entryIndex === 0 && <TableCell rowSpan={dayEntries.length} className="bg-table-header font-medium align-middle">{dayOfWeekMap[getDay(day)]}</TableCell>}
                          {entryIndex === 0 && <TableCell rowSpan={dayEntries.length} className="align-middle">{format(day, "d/M/yyyy")}</TableCell>}
                          <TableCell>{getLocationDisplayName(entry.location)}</TableCell>
                          <TableCell className="text-center">{entry.startTime ? format(entry.startTime, 'HH:mm') : ''}</TableCell>
                          <TableCell className="text-center">{entry.endTime ? format(entry.endTime, 'HH:mm') : ''}</TableCell>
                          <TableCell className="text-center">{formatDecimalHours(entry.pauseDuration)}</TableCell>
                          <TableCell className="text-center">{(entry.travelTime || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-center">{compensatedHours.toFixed(2)}</TableCell>
                          <TableCell className="text-center">{entry.isDriver ? t('export_preview.driverMark') : ''}</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      )});
                    })}
                  </TableBody>
                  <TableFooter className="border-t-0 bg-transparent">
                    <TableRow className="hover:bg-transparent border-b-0">
                        <TableCell colSpan={7} className="text-right font-bold">{t('export_preview.footerTotalPerWeek')}</TableCell>
                        <TableCell className="text-center font-bold">{calculateWeekTotal(week).toFixed(2)}</TableCell>
                        <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            ))}
            <div className="flex justify-end mt-8">
                <div className="w-1/3">
                    <div className="flex justify-between font-bold text-lg border-b-2 border-black pb-1">
                        <span>{t('export_preview.footerTotalHours')}</span>
                        <span>{monthTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>
          </main>
        </div>
      </CardContent>
    </Card>
  );
}
