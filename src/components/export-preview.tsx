
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay,
  differenceInMinutes,
  getDay,
} from "date-fns";
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
  const { t } = useTranslation();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<Date>();
  const [employeeName, setEmployeeName] = useState("Raquel Crespillo Andujar");

  useEffect(() => {
    if (!user) return;
    const fetchAndSetEntries = async () => {
      setIsLoading(true);
      try {
        const fetchedEntries = await getTimeEntries(user.uid);
        setEntries(fetchedEntries);
      } catch (error) => {
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

  const getEntriesForDay = (day: Date) => {
    return entries
      .filter((entry) => entry.startTime && isSameDay(entry.startTime, day))
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  };

  const calculateWeekTotal = (week: Date[]) => {
    if (!selectedMonth) return 0;
    let total = 0;
    week.forEach((day) => {
      if (isSameMonth(day, selectedMonth)) {
        getEntriesForDay(day).forEach((entry) => {
          if (entry.endTime) {
            const workDuration = differenceInMinutes(entry.endTime, entry.startTime);
            const compensatedMinutes = workDuration - (entry.pauseDuration || 0) + (entry.travelTime || 0) * 60;
            total += compensatedMinutes / 60;
          }
        });
      }
    });
    return total;
  };
  
  const monthTotal = useMemo(() => {
    if (!selectedMonth) return 0;
    return weeksInMonth.reduce((acc, week) => acc + calculateWeekTotal(week), 0);
  }, [weeksInMonth, entries, selectedMonth]);

  const getLocationDisplayName = (location: string) => {
    if (SPECIAL_LOCATION_KEYS.includes(location as any)) {
      return t(`special_locations.${location}`);
    }
    return location;
  };

  const handleExport = () => {
    if (!selectedMonth) return;
    const header = [
      t('export_preview.headerWeek'),
      t('export_preview.headerDate'),
      t('export_preview.headerLocation'),
      t('export_preview.headerFrom'),
      t('export_preview.headerTo'),
      t('export_preview.headerPauseTime'),
      t('export_preview.headerPauseDecimal'),
      t('export_preview.headerTravelTime'),
      t('export_preview.headerCompensatedTime'),
      t('export_preview.headerDriver'),
    ];
    
    const data: (string | number)[][] = [];

    weeksInMonth.forEach(week => {
      week.forEach(day => {
        if (isSameMonth(day, selectedMonth)) {
            const dayEntries = getEntriesForDay(day);
            if (dayEntries.length > 0) {
              dayEntries.forEach(entry => {
                const workDuration = entry.endTime ? differenceInMinutes(entry.endTime, entry.startTime) : 0;
                const compensatedHours = entry.endTime ? (workDuration - (entry.pauseDuration || 0)) / 60 + (entry.travelTime || 0) : 0;
                const pauseDecimal = formatDecimalHours(entry.pauseDuration);
                const pauseTime = entry.pauseDuration ? `${String(Math.floor(entry.pauseDuration / 60)).padStart(2, '0')}:${String(entry.pauseDuration % 60).padStart(2, '0')}` : '';
                
                data.push([
                    dayOfWeekMap[getDay(day)],
                    format(day, 'd/M/yyyy'),
                    getLocationDisplayName(entry.location),
                    entry.startTime ? format(entry.startTime, 'HH:mm') : '',
                    entry.endTime ? format(entry.endTime, 'HH:mm') : '',
                    pauseTime,
                    parseFloat(pauseDecimal),
                    entry.travelTime || '',
                    parseFloat(compensatedHours.toFixed(2)),
                    entry.isDriver ? t('export_preview.driverMark') : '',
                ]);
              });
            } else if (getDay(day) !== 0) { // Not sunday
                data.push([
                    dayOfWeekMap[getDay(day)],
                    format(day, 'd/M/yyyy'),
                    '', '', '', '', '', '', '', '',
                ]);
            }
        }
      });
      const weeklyTotal = calculateWeekTotal(week);
      if (weeklyTotal > 0 || week.some(d => isSameMonth(d, selectedMonth))) {
        data.push(['', '', '', '', '', '', '', t('export_preview.footerTotalPerWeek'), weeklyTotal.toFixed(2), '']);
        data.push([]); // Empty row
      }
    });

    data.push([]);
    data.push(['', '', '', '', '', '', '', '', t('export_preview.footerTotalHours'), monthTotal.toFixed(2)]);

    const worksheetData = [
      [t('export_preview.timesheetTitle', {month: format(selectedMonth, "MMMM yyyy")}), '', '', '', '', '', '', '', '', user?.displayName || employeeName],
      [],
      header,
      ...data
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    const colWidths = [
        { wch: 8 }, { wch: 12 }, { wch: 20 }, { wch: 8 }, { wch: 8 }, 
        { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 8 }
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stundenzettel");
    XLSX.writeFile(workbook, `Stundenzettel_${format(selectedMonth, "MMMM_yyyy")}.xlsx`);
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
              {format(selectedMonth, "MMMM yyyy")}
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
              {t('export_preview.timesheetTitle', {month: format(selectedMonth, "MMMM")})}
            </h1>
            <div className="text-right font-semibold">{user?.displayName || user?.email || employeeName}</div>
          </header>

          <main>
            {weeksInMonth.map((week, weekIndex) => {
              if (!week.some(d => isSameMonth(d, selectedMonth))) {
                return null;
              }

              return (
              <div key={weekIndex} className="mb-6">
                <Table className="border">
                  <TableHeader>
                    <TableRow className="bg-secondary hover:bg-secondary">
                      <TableHead className="w-[8%]">{t('export_preview.headerWeek')}</TableHead>
                      <TableHead className="w-[12%]">{t('export_preview.headerDate')}</TableHead>
                      <TableHead className="w-[15%]">{t('export_preview.headerLocation')}</TableHead>
                      <TableHead colSpan={2} className="text-center">
                        {t('export_preview.headerWorkTime')}
                      </TableHead>
                      <TableHead colSpan={2} className="text-center">{t('export_preview.headerPause')}</TableHead>
                      <TableHead className="w-[10%]">{t('export_preview.headerTravelTime')}</TableHead>
                      <TableHead className="w-[10%]">{t('export_preview.headerCompensatedTime')}</TableHead>
                      <TableHead className="w-[8%]">{t('export_preview.headerDriver')}</TableHead>
                    </TableRow>
                    <TableRow className="bg-secondary hover:bg-secondary">
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                      <TableHead className="w-[7%] text-center border-l">{t('export_preview.headerFrom')}</TableHead>
                      <TableHead className="w-[7%] text-center">{t('export_preview.headerTo')}</TableHead>
                      <TableHead className="w-[7%] text-center border-l">{t('export_preview.headerPauseTime')}</TableHead>
                      <TableHead className="w-[7%] text-center">{t('export_preview.headerPauseDecimal')}</TableHead>
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                      <TableHead></TableHead>
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
                              <TableCell>{dayOfWeekMap[getDay(day)]}</TableCell>
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
                         const workDuration = entry.endTime ? differenceInMinutes(entry.endTime, entry.startTime) : 0;
                         const compensatedHours = entry.endTime ? (workDuration - (entry.pauseDuration || 0)) / 60 + (entry.travelTime || 0) : 0;

                        return (
                        <TableRow key={entry.id}>
                          {entryIndex === 0 ? <TableCell>{dayOfWeekMap[getDay(day)]}</TableCell> : <TableCell></TableCell>}
                          {entryIndex === 0 ? <TableCell>{format(day, "d/M/yyyy")}</TableCell> : <TableCell></TableCell>}
                          <TableCell>{getLocationDisplayName(entry.location)}</TableCell>
                          <TableCell className="text-center">{entry.startTime ? format(entry.startTime, 'HH:mm') : ''}</TableCell>
                          <TableCell className="text-center">{entry.endTime ? format(entry.endTime, 'HH:mm') : ''}</TableCell>
                          <TableCell className="text-center">{entry.pauseDuration ? `${String(Math.floor(entry.pauseDuration / 60)).padStart(2, '0')}:${String(entry.pauseDuration % 60).padStart(2, '0')}` : ''}</TableCell>
                          <TableCell className="text-center">{formatDecimalHours(entry.pauseDuration)}</TableCell>
                          <TableCell className="text-center">{(entry.travelTime || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-center">{compensatedHours.toFixed(2)}</TableCell>
                          <TableCell className="text-center">{entry.isDriver ? t('export_preview.driverMark') : ''}</TableCell>
                        </TableRow>
                      )});
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                        <TableCell colSpan={8} className="text-right font-bold">{t('export_preview.footerTotalPerWeek')}</TableCell>
                        <TableCell className="text-center font-bold">{calculateWeekTotal(week).toFixed(2)}</TableCell>
                        <TableCell colSpan={1}></TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            )})}
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
