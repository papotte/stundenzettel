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

  // --- PAGE SETUP & HEADERS/FOOTERS ---
  const companyName = userSettings?.companyName || '';
  const email = userSettings?.companyEmail || '';
  const phone1 = userSettings?.companyPhone1 || '';
  const phone2 = userSettings?.companyPhone2 || '';
  const fax = userSettings?.companyFax || '';
  const phoneNumbers = [phone1, phone2].filter(Boolean).join(' / ');
  const contactParts = [companyName, email, phoneNumbers ? `Tel.: ${phoneNumbers}` : '', fax ? `FAX: ${fax}` : ''].filter(Boolean);

  if (contactParts.length > 0) {
    worksheet.headerFooter.oddHeader = `&L${t('export_preview.headerCompany')}&R${contactParts.join(' ')}`;
  }

  const signatureString = t('export_preview.signatureLine');
  worksheet.headerFooter.oddFooter = `&R${signatureString}`;


  // --- STYLES ---
  const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF99CCFF' } };
  const dayColFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF99CCFF' } };
  const headerFont: Partial<ExcelJS.Font> = { bold: false, color: { argb: 'FF000000' } };
  const defaultBorder: ExcelJS.Border = { style: 'thin', color: { argb: 'FF000000' } };
  const allBorders: Partial<ExcelJS.Borders> = {
    top: defaultBorder,
    left: defaultBorder,
    bottom: defaultBorder,
    right: defaultBorder,
  };

  // --- COLUMN WIDTHS ---
  worksheet.columns = [
    { key: 'week', width: 5 },
    { key: 'date', width: 12 },
    { key: 'location', width: 30 },
    { key: 'from', width: 8 },
    { key: 'to', width: 8 },
    { key: 'pause', width: 8 },
    { key: 'travel', width: 8 },
    { key: 'compensated', width: 12 },
    { key: 'driver', width: 5 },
    { key: 'mileage', width: 10 },
  ];

  // --- IN-SHEET TITLE AND USER NAME ---
  const titleRow = worksheet.addRow([]);
  titleRow.getCell('A').value = t('export_preview.timesheetTitle', { month: format(selectedMonth, "MMMM", { locale }) });
  titleRow.getCell('A').font = { bold: true, size: 12 };

  worksheet.mergeCells(titleRow.number, 1, titleRow.number, 5);

  const userCell = titleRow.getCell('J')
  userCell.value = user?.displayName || user?.email;
  userCell.font = { bold: true, size: 10 };
  userCell.alignment = { horizontal: 'right' };

  worksheet.addRow([]); // blank row

  // --- DATA ROWS ---
  const weeksInMonth = getWeeksForMonth(selectedMonth);
  const monthTotal = weeksInMonth.reduce((acc, week) => acc + calculateWeekTotal(week), 0);

  weeksInMonth.forEach(week => {
    const weekHasContent = week.some(day => {
      if (!isSameMonth(day, selectedMonth)) return false;
      const dayEntries = getEntriesForDay(day);
      const isSunday = getDay(day) === 0;
      return dayEntries.length > 0 || !isSunday;
    });

    if (!weekHasContent) {
      return;
    }

    // --- RENDER TABLE HEADERS FOR THE WEEK ---
    const headerRow1Num = worksheet.rowCount + 1;
    const headerRow2Num = headerRow1Num + 1;
    
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
    
    const headerRow2 = worksheet.getRow(headerRow2Num);
    headerRow2.values = ['', '', '', t('export_preview.headerFrom'), t('export_preview.headerTo')];

    worksheet.mergeCells(headerRow1Num, 1, headerRow2Num, 1);
    worksheet.mergeCells(headerRow1Num, 2, headerRow2Num, 2);
    worksheet.mergeCells(headerRow1Num, 3, headerRow2Num, 3);
    worksheet.mergeCells(headerRow1Num, 4, headerRow1Num, 5);
    worksheet.mergeCells(headerRow1Num, 6, headerRow2Num, 6);
    worksheet.mergeCells(headerRow1Num, 7, headerRow2Num, 7);
    worksheet.mergeCells(headerRow1Num, 8, headerRow2Num, 8);
    worksheet.mergeCells(headerRow1Num, 9, headerRow2Num, 9);
    worksheet.mergeCells(headerRow1Num, 10, headerRow2Num, 10);

    // Apply styles to header rows
    [headerRow1, headerRow2].forEach(row => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = headerFill;
        cell.font = headerFont;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = allBorders;
      });
    });
    
    // --- Custom border logic for "Arbeitszeit" and "von/bis" headers ---
    const arbeitszeitCell = worksheet.getCell(headerRow1Num, 4);
    const vonCell = worksheet.getCell(headerRow2Num, 4);
    const bisCell = worksheet.getCell(headerRow2Num, 5);

    // Remove bottom border from merged "tatsächliche Arbeitszeit" cell
    arbeitszeitCell.border = { top: defaultBorder, left: defaultBorder, right: defaultBorder };

    // Remove top & right border from "von" cell
    vonCell.border = { left: defaultBorder, bottom: defaultBorder };

    // Remove top & left border from "bis" cell
    bisCell.border = { right: defaultBorder, bottom: defaultBorder };

    // --- RENDER DATA ROWS FOR THE WEEK ---
    week.forEach(day => {
      const dayEntries = getEntriesForDay(day);
      const isSunday = getDay(day) === 0;
      const startRowForDay = worksheet.rowCount + 1;

      if (!isSameMonth(day, selectedMonth)) return;

      const applyRowStyles = (row: ExcelJS.Row) => {
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            let border: Partial<ExcelJS.Borders> = {};
            if (colNumber === 4) { // von
                border = { top: defaultBorder, left: defaultBorder, bottom: defaultBorder };
            } else if (colNumber === 5) { // bis
                border = { top: defaultBorder, right: defaultBorder, bottom: defaultBorder };
            } else {
                border = allBorders;
            }
            cell.border = border;
            cell.alignment = { vertical: 'middle' };
        });
      };

      if (dayEntries.length > 0) {
        dayEntries.forEach((entry) => {
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
            '', // Weekday gets merged
            '', // Date gets merged
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
          applyRowStyles(dataRow);
           // Set specific alignments after applying common styles
          dataRow.getCell(3).alignment.horizontal = 'left';
          dataRow.getCell(4).alignment.horizontal = 'right';
          dataRow.getCell(5).alignment.horizontal = 'right';
          dataRow.getCell(6).alignment.horizontal = 'right';
          dataRow.getCell(7).alignment.horizontal = 'right';
          dataRow.getCell(8).alignment.horizontal = 'right';
          dataRow.getCell(9).alignment.horizontal = 'left';
          dataRow.getCell(6).numFmt = '0.00';
          dataRow.getCell(7).numFmt = '0.00';
          dataRow.getCell(8).numFmt = '0.00';
        });

        // Set and merge weekday and date cells
        const dayCell = worksheet.getCell(startRowForDay, 1);
        dayCell.value = dayOfWeekMap[getDay(day)];
        dayCell.fill = dayColFill;
        dayCell.alignment = { vertical: 'middle', horizontal: 'left' };
        worksheet.mergeCells(startRowForDay, 1, startRowForDay + dayEntries.length - 1, 1);

        const dateCell = worksheet.getCell(startRowForDay, 2);
        dateCell.value = format(day, 'dd.MM.yyyy');
        dateCell.alignment = { vertical: 'middle', horizontal: 'right' };
        worksheet.mergeCells(startRowForDay, 2, startRowForDay + dayEntries.length - 1, 2);

      } else if (!isSunday) {
        const emptyRow = worksheet.addRow([dayOfWeekMap[getDay(day)], format(day, 'dd.MM.yyyy'), '', '', '', '', '', '', '', '']);
        applyRowStyles(emptyRow);
        emptyRow.getCell(1).fill = dayColFill;
        emptyRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
        emptyRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'right' };
      }
    });

    // --- RENDER WEEKLY TOTAL ---
    const weeklyTotal = calculateWeekTotal(week);
    const totalRow = worksheet.addRow([]);
    worksheet.mergeCells(totalRow.number, 1, totalRow.number, 6);
    const totalLabelCell = totalRow.getCell(7);
    totalLabelCell.value = t('export_preview.footerTotalPerWeek');
    totalLabelCell.alignment = { horizontal: 'right' };
    const totalValueCell = totalRow.getCell(8);
    totalValueCell.value = weeklyTotal;
    totalValueCell.numFmt = '0.00';
    totalValueCell.border = { bottom: { style: 'medium', color: { argb: 'FF000000' } } };
    totalValueCell.alignment = { horizontal: 'right' };

    worksheet.addRow([]); // Blank row for spacing
  });

  // --- GRAND TOTAL ---
  const grandTotalRow = worksheet.addRow([]);
  worksheet.mergeCells(grandTotalRow.number, 1, grandTotalRow.number, 6);
  const grandTotalLabelCell = grandTotalRow.getCell(7);
  grandTotalLabelCell.value = t('export_preview.footerTotalHours');
  grandTotalLabelCell.alignment = { horizontal: 'right' };
  const grandTotalValueCell = grandTotalRow.getCell(8);
  grandTotalValueCell.value = monthTotal;
  grandTotalValueCell.numFmt = '0.00';
  grandTotalValueCell.border = { bottom: { style: 'double', color: { argb: 'FF000000' } } };
  grandTotalValueCell.alignment = { horizontal: 'right' };
  
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
