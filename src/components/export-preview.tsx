"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay,
  differenceInMinutes,
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

const dayOfWeekMap: { [key: string]: string } = {
  Monday: "Mo",
  Tuesday: "Di",
  Wednesday: "Mi",
  Thursday: "Do",
  Friday: "Fr",
  Saturday: "Sa",
  Sunday: "So",
};

export default function ExportPreview() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<Date>();
  const [employeeName, setEmployeeName] = useState("Raquel Crespillo Andujar");

  useEffect(() => {
    const storedEntries = localStorage.getItem("timeEntries");
    if (storedEntries) {
      setEntries(
        JSON.parse(storedEntries, (key, value) =>
          key === "startTime" || key === "endTime" ? new Date(value) : value
        )
      );
    }
    setSelectedMonth(new Date());
  }, []);

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
            const compensatedMinutes = workDuration - (entry.pauseDuration || 0);
            total += (compensatedMinutes / 60) + (entry.travelTime || 0);
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


  const handleExport = () => {
    if (!selectedMonth) return;
    const header = [
      "Woche",
      "Datum",
      "Einsatzort",
      "von",
      "bis",
      "Pause (time)",
      "abzgl. Pause",
      "zzgl. Fahrtzeit",
      "vergütete AZ",
      "Fahrer",
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
                    dayOfWeekMap[format(day, 'EEEE')],
                    format(day, 'd/M/yyyy'),
                    entry.location,
                    entry.startTime ? format(entry.startTime, 'HH:mm') : '',
                    entry.endTime ? format(entry.endTime, 'HH:mm') : '',
                    pauseTime,
                    parseFloat(pauseDecimal),
                    entry.travelTime || '',
                    parseFloat(compensatedHours.toFixed(2)),
                    entry.isDriver ? 'F' : '',
                ]);
              });
            } else if (parseInt(format(day, 'i')) <= 6) { // Not sunday
                data.push([
                    dayOfWeekMap[format(day, 'EEEE')],
                    format(day, 'd/M/yyyy'),
                    '', '', '', '', '', '', '', '',
                ]);
            }
        }
      });
      const weeklyTotal = calculateWeekTotal(week);
      if (weeklyTotal > 0 || week.some(d => isSameMonth(d, selectedMonth))) {
        data.push(['', '', '', '', '', '', '', 'Gesamt pro Woche:', weeklyTotal.toFixed(2), '']);
        data.push([]); // Empty row
      }
    });

    data.push([]);
    data.push(['', '', '', '', '', '', '', '', 'Stunden insgesamt:', monthTotal.toFixed(2)]);

    const worksheetData = [
      [`Stundenzettel für den Monat: ${format(selectedMonth, "MMMM yyyy")}`, '', '', '', '', '', '', '', '', `Raquel Crespillo Andujar`],
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
  
  if (!selectedMonth) {
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
            <h2 className="text-2xl font-bold text-center">
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
            Export to Excel
          </Button>
        </div>

        <div className="bg-white p-8 rounded-md shadow-md printable-area">
          <header className="flex justify-between items-start mb-4 border-b pb-4">
            <h1 className="text-xl font-bold">
              Stundenzettel für den Monat: {format(selectedMonth, "MMMM")}
            </h1>
            <div className="text-right font-semibold">{employeeName}</div>
          </header>

          <main>
            {weeksInMonth.map((week, weekIndex) => {
              const weeklyTotal = calculateWeekTotal(week);
              if (weeklyTotal === 0 && !week.some(d => isSameMonth(d, selectedMonth))) {
                return null;
              }

              return (
              <div key={weekIndex} className="mb-6">
                <Table className="border">
                  <TableHeader>
                    <TableRow className="bg-blue-100 hover:bg-blue-100">
                      <TableHead className="w-[8%]">Woche</TableHead>
                      <TableHead className="w-[12%]">Datum</TableHead>
                      <TableHead className="w-[15%]">Einsatzort</TableHead>
                      <TableHead colSpan={2} className="text-center">
                        tatsächliche Arbeitszeit
                      </TableHead>
                      <TableHead colSpan={2} className="text-center">Pause</TableHead>
                      <TableHead className="w-[10%]">zzgl. Fahrtzeit</TableHead>
                      <TableHead className="w-[10%]">vergütete AZ</TableHead>
                      <TableHead className="w-[8%]">Fahrer</TableHead>
                    </TableRow>
                    <TableRow className="bg-blue-100 hover:bg-blue-100">
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                      <TableHead className="w-[7%] text-center border-l">von</TableHead>
                      <TableHead className="w-[7%] text-center">bis</TableHead>
                      <TableHead className="w-[7%] text-center border-l">(time)</TableHead>
                      <TableHead className="w-[7%] text-center">abzgl.</TableHead>
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {week.map((day, dayIndex) => {
                       if (!isSameMonth(day, selectedMonth) || format(day, 'EEEE') === 'Sunday') {
                        return null;
                      }

                      const dayEntries = getEntriesForDay(day);

                      if (dayEntries.length === 0) {
                        return (
                           <TableRow key={day.toISOString()}>
                              <TableCell>{dayOfWeekMap[format(day, 'EEEE')]}</TableCell>
                              <TableCell>{format(day, "d/M/yyyy")}</TableCell>
                              <TableCell className="text-gray-400">..................................................</TableCell>
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
                          {entryIndex === 0 ? <TableCell>{dayOfWeekMap[format(day, 'EEEE')]}</TableCell> : <TableCell></TableCell>}
                          {entryIndex === 0 ? <TableCell>{format(day, "d/M/yyyy")}</TableCell> : <TableCell></TableCell>}
                          <TableCell>{entry.location}</TableCell>
                          <TableCell className="text-center">{entry.startTime ? format(entry.startTime, 'HH:mm') : ''}</TableCell>
                          <TableCell className="text-center">{entry.endTime ? format(entry.endTime, 'HH:mm') : ''}</TableCell>
                          <TableCell className="text-center">{entry.pauseDuration ? `${String(Math.floor(entry.pauseDuration / 60)).padStart(2, '0')}:${String(entry.pauseDuration % 60).padStart(2, '0')}` : ''}</TableCell>
                          <TableCell className="text-center">{formatDecimalHours(entry.pauseDuration)}</TableCell>
                          <TableCell className="text-center">{(entry.travelTime || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-center">{compensatedHours.toFixed(2)}</TableCell>
                          <TableCell className="text-center">{entry.isDriver ? 'F' : ''}</TableCell>
                        </TableRow>
                      )});
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                        <TableCell colSpan={8} className="text-right font-bold">Gesamt pro Woche:</TableCell>
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
                        <span>Stunden insgesamt:</span>
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
