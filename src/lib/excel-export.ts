
import * as XLSX from "xlsx";
import { format, getDay, isSameMonth, differenceInMinutes, type Locale } from "date-fns";
import type { TimeEntry, UserSettings } from "@/lib/types";
import { getWeeksForMonth, formatDecimalHours } from "@/lib/utils";

const dayOfWeekMap: { [key: number]: string } = {
  1: "Mo",
  2: "Di",
  3: "Mi",
  4: "Do",
  5: "Fr",
  6: "Sa",
  0: "So",
};

interface ExportParams {
  selectedMonth: Date;
  userSettings: UserSettings;
  entries: TimeEntry[];
  t: (key: string, replacements?: Record<string, string | number>) => string;
  locale: Locale;
  getEntriesForDay: (day: Date) => TimeEntry[];
  calculateWeekTotal: (week: Date[]) => number;
  getLocationDisplayName: (location: string) => string;
}

export const exportToExcel = ({
  selectedMonth,
  userSettings,
  entries,
  t,
  locale,
  getEntriesForDay,
  calculateWeekTotal,
  getLocationDisplayName,
}: ExportParams) => {
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
      '',
      t('export_preview.headerPauseDuration'),
      t('export_preview.headerTravelTime'),
      t('export_preview.headerCompensatedTime'),
      t('export_preview.headerDriver'),
      t('export_preview.headerMileage'),
  ];

  const headerRow2 = [
      '', '', '',
      t('export_preview.headerFrom'),
      t('export_preview.headerTo'),
      '', '', '', '', '',
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

  const worksheetData: (string | number | null)[][] = [];
  if (companyHeader) {
    worksheetData.push([companyHeader]);
    worksheetData.push([]);
  }
  worksheetData.push([t('export_preview.timesheetTitle', {month: format(selectedMonth, "MMMM", { locale })})]);
  worksheetData.push([]);
  worksheetData.push(headerRow1);
  worksheetData.push(headerRow2);
  worksheetData.push(...data);
  worksheetData.push([], [], [], signatureRow);

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  const mainHeaderRow = companyHeader ? 4 : 2;
  const dataStartRow = companyHeader ? 6 : 4;
  
  if (!worksheet['!merges']) worksheet['!merges'] = [];

  // Company Header Merge
  if (companyHeader) {
    worksheet['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } });
  }
  // Timesheet Title Merge
  worksheet['!merges'].push({ s: { r: mainHeaderRow - 2, c: 0 }, e: { r: mainHeaderRow - 2, c: 9 } });

  // Main Header Merges
  worksheet['!merges'].push(
    { s: { r: mainHeaderRow, c: 0 }, e: { r: mainHeaderRow + 1, c: 0 } }, // Week
    { s: { r: mainHeaderRow, c: 1 }, e: { r: mainHeaderRow + 1, c: 1 } }, // Date
    { s: { r: mainHeaderRow, c: 2 }, e: { r: mainHeaderRow + 1, c: 2 } }, // Location
    { s: { r: mainHeaderRow, c: 3 }, e: { r: mainHeaderRow, c: 4 } },     // Work Time
    { s: { r: mainHeaderRow, c: 5 }, e: { r: mainHeaderRow + 1, c: 5 } }, // Pause
    { s: { r: mainHeaderRow, c: 6 }, e: { r: mainHeaderRow + 1, c: 6 } }, // Travel
    { s: { r: mainHeaderRow, c: 7 }, e: { r: mainHeaderRow + 1, c: 7 } }, // Compensated
    { s: { r: mainHeaderRow, c: 8 }, e: { r: mainHeaderRow + 1, c: 8 } }, // Driver
    { s: { r: mainHeaderRow, c: 9 }, e: { r: mainHeaderRow + 1, c: 9 } }  // Mileage
  );
  
  // --- STYLING ---
  const companyHeaderStyle = { font: { sz: 10 }, alignment: { horizontal: 'left' } };
  const titleStyle = { font: { bold: true, sz: 12 }, alignment: { horizontal: 'left' } };
  const headerBaseStyle = { fill: { fgColor: { rgb: "99CCFF" } }, font: { bold: true, color: { rgb: "000000" } }, alignment: { vertical: 'center' } };
  const headerStyles = {
      left: {...headerBaseStyle, alignment: {...headerBaseStyle.alignment, horizontal: 'left'}},
      right: {...headerBaseStyle, alignment: {...headerBaseStyle.alignment, horizontal: 'right'}},
      center: {...headerBaseStyle, alignment: {...headerBaseStyle.alignment, horizontal: 'center'}},
  };

  if (companyHeader) {
      const companyHeaderCellAddress = XLSX.utils.encode_cell({ r: 0, c: 0 });
      if(worksheet[companyHeaderCellAddress]) worksheet[companyHeaderCellAddress].s = companyHeaderStyle;
  }
  
  const titleCellAddress = XLSX.utils.encode_cell({r: mainHeaderRow - 2, c: 0});
  if(worksheet[titleCellAddress]) worksheet[titleCellAddress].s = titleStyle;

  // Apply styles after ensuring cells exist
  for (let R = mainHeaderRow; R <= mainHeaderRow + 1; ++R) {
      for (let C = 0; C <= 9; ++C) {
          const address = XLSX.utils.encode_cell({ r: R, c: C });
          if (!worksheet[address]) {
            // Create a placeholder cell if it doesn't exist, e.g. for merged cells
            worksheet[address] = { v: '' };
          }
          let style;
          if ([1, 3, 4, 5, 6, 7, 9].includes(C)) {
              style = headerStyles.right;
          } else if (C === 8) {
              style = headerStyles.center;
          } else {
              style = headerStyles.left;
          }
          worksheet[address].s = style;
      }
  }
  
  const dayColStyle = { fill: { fgColor: { rgb: "99CCFF" } }, alignment: { horizontal: 'left' } };

  data.forEach((rowData, index) => {
      const firstCell = rowData[0];
      if (Object.values(dayOfWeekMap).includes(firstCell as string)) {
          const address = XLSX.utils.encode_cell({ r: index + dataStartRow, c: 0 });
          if (worksheet[address]) {
              worksheet[address].s = dayColStyle;
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
