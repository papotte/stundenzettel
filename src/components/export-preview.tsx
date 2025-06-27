
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
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Download, Printer } from "lucide-react";
import type { TimeEntry, UserSettings } from "@/lib/types";
import { getWeeksForMonth, formatDecimalHours } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { getTimeEntries } from "@/services/time-entry-service";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/context/i18n-context";
import { SPECIAL_LOCATION_KEYS } from "@/lib/constants";
import TimesheetPreview from "./timesheet-preview";
import { getUserSettings } from "@/services/user-settings-service";

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
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<Date>();

  const locale = useMemo(() => (language === 'de' ? de : enUS), [language]);

  useEffect(() => {
    if (!user) return;
    const fetchAndSetEntries = async () => {
      setIsLoading(true);
      try {
        const [fetchedEntries, settings] = await Promise.all([
          getTimeEntries(user.uid),
          getUserSettings(user.uid),
        ]);
        setEntries(fetchedEntries);
        setUserSettings(settings);
      } catch (error) {
        console.error("Failed to load initial data from Firestore.", error);
      }
      setSelectedMonth(new Date());
      setIsLoading(false);
    };
    fetchAndSetEntries();
  }, [user]);

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

  const getLocationDisplayName = (location: string) => {
    if (SPECIAL_LOCATION_KEYS.includes(location as any)) {
      return t(`special_locations.${location}`);
    }
    return location;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!selectedMonth || !userSettings) return;
    
    // Format company header for Excel
    const companyName = userSettings?.companyName || '';
    const email = userSettings?.companyEmail || '';
    const phone1 = userSettings?.companyPhone1 || '';
    const phone2 = userSettings?.companyPhone2 || '';
    const fax = userSettings?.companyFax || '';

    const phoneNumbers = [phone1, phone2].filter(Boolean).join(' / ');
    const contactParts = [
      companyName,
      email,
      phoneNumbers ? `Tel.: ${phoneNumbers}` : '',
      fax ? `FAX: ${fax}` : ''
    ].filter(Boolean);

    const companyHeader = contactParts.length > 0 ? t('export_preview.headerCompany', { details: contactParts.join(' ') }) : null;
    
    const weeksInMonth = getWeeksForMonth(selectedMonth);
    const weekHasEntries = (week: Date[]): boolean => {
      return week.some(day => {
        return isSameMonth(day, selectedMonth) && getEntriesForDay(day).length > 0;
      });
    };
    const relevantWeeks = weeksInMonth.filter(weekHasEntries);
    const monthTotal = relevantWeeks.reduce((acc, week) => acc + calculateWeekTotal(week), 0);

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
    
    const data: (string | number | null)[][] = [];

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
      data.push([null, null, null, null, null, t('export_preview.footerTotalPerWeek'), null, null, null, weeklyTotal.toFixed(2)]);
      data.push([]); // Empty row
    });

    data.push([]);
    data.push([null, null, null, null, null, t('export_preview.footerTotalHours'), null, null, null, monthTotal.toFixed(2)]);
    
    const signatureRow = [null, null, null, null, null, null, null, null, null, t('export_preview.signatureLine')];

    const worksheetData = [
      ...(companyHeader ? [[companyHeader]] : []),
      ...(companyHeader ? [[]] : []),
      [t('export_preview.timesheetTitle', {month: format(selectedMonth, "MMMM", { locale })})],
      [],
      headerRow1,
      headerRow2,
      ...data,
      [], [], [],
      signatureRow
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    if (!worksheet['!merges']) worksheet['!merges'] = [];
    worksheet['!merges'].push(
      { s: { r: 4, c: 0 }, e: { r: 5, c: 0 } }, // Week
      { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } }, // Date
      { s: { r: 4, c: 2 }, e: { r: 5, c: 2 } }, // Location
      { s: { r: 4, c: 3 }, e: { r: 4, c: 4 } }, // Work Time
      { s: { r: 4, c: 5 }, e: { r: 5, c: 5 } }, // Pause
      { s: { r: 4, c: 6 }, e: { r: 5, c: 6 } }, // Travel
      { s: { r: 4, c: 7 }, e: { r: 5, c: 7 } }, // Compensated
      { s: { r: 4, c: 8 }, e: { r: 5, c: 8 } }, // Driver
      { s: { r: 4, c: 9 }, e: { r: 5, c: 9 } }  // Mileage
    );
    if (companyHeader) {
      worksheet['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }); // Company Header
    }
    
    const headerBaseStyle = { fill: { fgColor: { rgb: "99CCFF" } }, font: { bold: true, color: { rgb: "000000" } }, alignment: { vertical: 'center' } };
    const headerStyles = {
        left: {...headerBaseStyle, alignment: {...headerBaseStyle.alignment, horizontal: 'left'}},
        right: {...headerBaseStyle, alignment: {...headerBaseStyle.alignment, horizontal: 'right'}},
        center: {...headerBaseStyle, alignment: {...headerBaseStyle.alignment, horizontal: 'center'}},
    };

    for (let R = 4; R <= 5; ++R) {
        for (let C = 0; C <= 9; ++C) {
            const address = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = worksheet[address];
            if (!cell) continue;

            let style;
            if ([1, 3, 4, 5, 6, 7].includes(C)) {
                style = headerStyles.right;
            } else if (C === 8) {
                style = headerStyles.center;
            } else {
                style = headerStyles.left;
            }
            cell.s = style;
        }
    }
    
    const dayColStyle = { fill: { fgColor: { rgb: "99CCFF" } } };

    data.forEach((rowData, index) => {
        const firstCell = rowData[0];
        if (Object.values(dayOfWeekMap).includes(firstCell as string)) {
            const address = `A${index + 7}`;
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
    XLSX.writeFile(workbook, `Stundenzettel_${format(selectedMonth, "MMMM", { locale })}.xlsx`);
  };
  
  if (isLoading || !selectedMonth || !userSettings) {
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
            <header className="flex justify-between items-start mb-4">
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
            <h2 className="text-2xl font-bold">
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
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <Button onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              {t('export_preview.exportButton')}
            </Button>
            <Button onClick={handlePrint} variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              {t('export_preview.exportPdfButton')}
            </Button>
          </div>
        </div>

        <TimesheetPreview
            selectedMonth={selectedMonth}
            user={user}
            entries={entries}
            t={t}
            locale={locale}
            userSettings={userSettings}
        />
      </CardContent>
    </Card>
  );
}
