
import ExcelJS from "exceljs";
import { format, getDay, isSameMonth, differenceInMinutes, type Locale } from "date-fns";
import type { User } from "firebase/auth";
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
  user: User | null;
  userSettings: UserSettings;
  entries: TimeEntry[];
  t: (key: string, replacements?: Record<string, string | number>) => string;
  locale: Locale;
  getEntriesForDay: (day: Date) => TimeEntry[];
  calculateWeekTotal: (week: Date[]) => number;
  getLocationDisplayName: (location: string) => string;
}

export const exportToExcel = async ({
  selectedMonth,
  user,
  userSettings,
  entries,
  t,
  locale,
  getEntriesForDay,
  calculateWeekTotal,
  getLocationDisplayName,
}: ExportParams) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Stundenzettel");

  // --- STYLES ---
  const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBFD7FF' } };
  const dayColFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBFD7FF' } };
  const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FF000000' } };
  const allBorders: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } },
  };

  // --- COLUMN WIDTHS ---
  worksheet.columns = [
      { key: 'week', width: 5 },
      { key: 'date', width: 12 },
      { key: 'location', width: 30 },
      { key: 'from', width: 8 },
      { key: 'to', width: 8 },
      { key: 'pause', width: 12 },
      { key: 'travel', width: 12 },
      { key: 'compensated', width: 12 },
      { key: 'driver', width: 8 },
      { key: 'mileage', width: 20 },
  ];

  let currentRow = 1;

  // --- COMPANY HEADER ---
  const companyName = userSettings?.companyName || '';
  const email = userSettings?.companyEmail || '';
  const phone1 = userSettings?.companyPhone1 || '';
  const phone2 = userSettings?.companyPhone2 || '';
  const fax = userSettings?.companyFax || '';
  const phoneNumbers = [phone1, phone2].filter(Boolean).join(' / ');
  const contactParts = [companyName, email, phoneNumbers ? `Tel.: ${phoneNumbers}` : '', fax ? `FAX: ${fax}` : ''].filter(Boolean);
  if (contactParts.length > 0) {
      const companyHeader = t('export_preview.headerCompany') + " " + contactParts.join(' ');
      worksheet.mergeCells(`A${currentRow}:J${currentRow}`);
      const companyCell = worksheet.getCell(`A${currentRow}`);
      companyCell.value = companyHeader;
      companyCell.font = { size: 10 };
      companyCell.alignment = { horizontal: 'left' };
      currentRow += 2; // Add a blank row after
  }

  // --- TITLE HEADER ---
  worksheet.mergeCells(`A${currentRow}:J${currentRow}`);
  const titleCell = worksheet.getCell(`A${currentRow}`);
  titleCell.value = t('export_preview.timesheetTitle', {month: format(selectedMonth, "MMMM", { locale })});
  titleCell.font = { bold: true, size: 12 };
  titleCell.alignment = { horizontal: 'left' };

  worksheet.mergeCells(`A${currentRow+1}:J${currentRow+1}`);
  const userCell = worksheet.getCell(`A${currentRow+1}`);
  userCell.value = user?.displayName || user?.email;
  userCell.font = { bold: true, size: 10 };
  userCell.alignment = { horizontal: 'right' };
  currentRow += 3; // Add blank row after

  // --- TABLE HEADERS ---
  const headerRow1Num = currentRow;
  const headerRow2Num = currentRow + 1;
  const headerRow1 = worksheet.getRow(headerRow1Num);
  headerRow1.values = [
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
  worksheet.getRow(headerRow2Num).values = ['', '', '', t('export_preview.headerFrom'), t('export_preview.headerTo')];

  // Merging header cells
  worksheet.mergeCells(headerRow1Num, 1, headerRow2Num, 1);
  worksheet.mergeCells(headerRow1Num, 2, headerRow2Num, 2);
  worksheet.mergeCells(headerRow1Num, 3, headerRow2Num, 3);
  worksheet.mergeCells(headerRow1Num, 4, headerRow1Num, 5);
  worksheet.mergeCells(headerRow1Num, 6, headerRow2Num, 6);
  worksheet.mergeCells(headerRow1Num, 7, headerRow2Num, 7);
  worksheet.mergeCells(headerRow1Num, 8, headerRow2Num, 8);
  worksheet.mergeCells(headerRow1Num, 9, headerRow2Num, 9);
  worksheet.mergeCells(headerRow1Num, 10, headerRow2Num, 10);
  
  // Style header cells
  [headerRow1Num, headerRow2Num].forEach(rowNum => {
      worksheet.getRow(rowNum).eachCell({ includeEmpty: true }, cell => {
          cell.fill = headerFill;
          cell.font = headerFont;
          cell.border = allBorders;
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
  });
  
  // Specific alignments for headers
  worksheet.getCell(headerRow1Num, 3).alignment = { vertical: 'middle', horizontal: 'left' }; // Location
  worksheet.getCell(headerRow1Num, 1).alignment = { vertical: 'middle', horizontal: 'left' }; // Week
  worksheet.getCell(headerRow1Num, 2).alignment = { vertical: 'middle', horizontal: 'left' }; // Date

  currentRow += 2;

  // --- DATA ROWS ---
  const weeksInMonth = getWeeksForMonth(selectedMonth);
  const monthTotal = weeksInMonth.reduce((acc, week) => acc + calculateWeekTotal(week), 0);

  weeksInMonth.forEach(week => {
    let weekHasRenderedData = false;
    week.forEach(day => {
      if (isSameMonth(day, selectedMonth)) {
        const dayEntries = getEntriesForDay(day);
        const isSunday = getDay(day) === 0;

        if (dayEntries.length > 0) {
            weekHasRenderedData = true;
            dayEntries.forEach((entry, entryIndex) => {
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
              const pauseDecimal = parseFloat(formatDecimalHours(entry.pauseDuration));
              
              const rowData = [
                  entryIndex === 0 ? dayOfWeekMap[getDay(day)] : '',
                  entryIndex === 0 ? format(day, 'dd.MM.yyyy') : '',
                  getLocationDisplayName(entry.location),
                  entry.startTime ? format(entry.startTime, 'HH:mm') : '',
                  entry.endTime ? format(entry.endTime, 'HH:mm') : '',
                  pauseDecimal,
                  entry.travelTime || 0,
                  compensatedHours,
                  entry.isDriver ? t('export_preview.driverMark') : '',
                  '', // Mileage
              ];
              const dataRow = worksheet.addRow(rowData);

              dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                  cell.border = allBorders;
                  cell.alignment = { vertical: 'middle' };
                  if ([2, 4, 5, 6, 7, 8].includes(colNumber)) {
                      cell.alignment.horizontal = 'right';
                  } else {
                      cell.alignment.horizontal = 'left';
                  }
                  if ([6, 7, 8].includes(colNumber)) {
                    cell.numFmt = '0.00';
                  }
              });

              dataRow.getCell(1).fill = dayColFill;
              currentRow++;
            });
        } else if (!isSunday) {
            weekHasRenderedData = true;
            const emptyRow = worksheet.addRow([dayOfWeekMap[getDay(day)], format(day, 'dd.MM.yyyy'), '', '', '', '', '', '', '', '']);
            emptyRow.eachCell({ includeEmpty: true }, cell => cell.border = allBorders);
            emptyRow.getCell(1).fill = dayColFill;
            emptyRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
            emptyRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
            currentRow++;
        }
      }
    });
    
    if (weekHasRenderedData) {
        const weeklyTotal = calculateWeekTotal(week);
        const totalRow = worksheet.addRow(['', '', '', '', '', t('export_preview.footerTotalPerWeek'), '', weeklyTotal, '', '']);
        totalRow.getCell(8).numFmt = '0.00';
        totalRow.getCell(6).font = { bold: true };
        totalRow.getCell(8).font = { bold: true };
        worksheet.addRow([]);
        currentRow += 2;
    }
  });

  // --- FOOTER ---
  const grandTotalRow = worksheet.addRow(['', '', '', '', '', t('export_preview.footerTotalHours'), '', monthTotal, '', '']);
  grandTotalRow.getCell(8).numFmt = '0.00';
  grandTotalRow.getCell(6).font = { bold: true };
  grandTotalRow.getCell(8).font = { bold: true };

  currentRow += 5; // spacing
  const signatureRow = worksheet.addRow(['', '', '', '', '', '', '', '', t('export_preview.signatureLine')]);
  signatureRow.getCell(9).border = { top: { style: 'thin', color: { argb: 'FF000000' } } };
  

  // --- SAVE FILE ---
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Stundenzettel_${user?.displayName || 'Export'}_${format(selectedMonth, "yyyy-MM")}.xlsx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
