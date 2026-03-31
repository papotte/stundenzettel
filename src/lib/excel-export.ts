import { differenceInMinutes, getDay, isSameMonth } from 'date-fns'
import ExcelJS from 'exceljs'
import { useTranslations } from 'next-intl'

import { useFormatter } from '@/lib/date-formatter'
import {
  calculateExpectedMonthlyHours,
  calculateWeekCompensatedTime,
  calculateWeekPassengerTime,
} from '@/lib/time-utils'
import type { AuthenticatedUser, TimeEntry, UserSettings } from '@/lib/types'
import { formatDecimalHours, getWeeksForMonth } from '@/lib/utils'

interface ExportParams {
  selectedMonth: Date
  user: AuthenticatedUser | null
  userSettings: UserSettings
  entries: TimeEntry[]
  t: ReturnType<typeof useTranslations>
  format: ReturnType<typeof useFormatter>
  getEntriesForDay: (day: Date) => TimeEntry[]
  getLocationDisplayName: (location: string) => string
}

type ExcelFormatter = ExportParams['format']

/** 1-based Excel column indices for timesheet grid (driver/passenger optional). */
export type ExcelExportColumnLayout = {
  week: number
  date: number
  location: number
  from: number
  to: number
  pause: number
  driver: number | null
  compensated: number
  passenger: number | null
  mileage: number
  columnCount: number
  showDriver: boolean
  showPassenger: boolean
}

export function buildExcelExportColumnLayout(
  userSettings: UserSettings,
): ExcelExportColumnLayout {
  const showDriver = userSettings.exportIncludeDriverTime !== false
  const showPassenger = userSettings.exportIncludePassengerTime !== false
  let c = 1
  const week = c++
  const date = c++
  const location = c++
  const from = c++
  const to = c++
  const pause = c++
  const driver = showDriver ? c++ : null
  const compensated = c++
  const passenger = showPassenger ? c++ : null
  const mileage = c++
  return {
    week,
    date,
    location,
    from,
    to,
    pause,
    driver,
    compensated,
    passenger,
    mileage,
    columnCount: c - 1,
    showDriver,
    showPassenger,
  }
}

function buildExcelHeaderRow1(
  layout: ExcelExportColumnLayout,
  t: ExportParams['t'],
): ExcelJS.CellValue[] {
  const row: ExcelJS.CellValue[] = Array(layout.columnCount).fill('')
  row[layout.week - 1] = t('export.headerWeek')
  row[layout.date - 1] = t('export.headerDate')
  row[layout.location - 1] = t('export.headerLocation')
  row[layout.from - 1] = t('export.headerWorkTime')
  row[layout.to - 1] = ''
  row[layout.pause - 1] = t('export.headerPauseDuration')
  if (layout.driver != null) {
    row[layout.driver - 1] = t('export.headerDriverTime')
  }
  row[layout.compensated - 1] = t('export.headerCompensatedTime')
  if (layout.passenger != null) {
    row[layout.passenger - 1] = t('export.headerPassengerTime')
  }
  row[layout.mileage - 1] = t('export.headerMileage')
  return row
}

function buildExcelHeaderRow2(
  layout: ExcelExportColumnLayout,
  t: ExportParams['t'],
): ExcelJS.CellValue[] {
  const row: ExcelJS.CellValue[] = Array(layout.columnCount).fill('')
  row[layout.from - 1] = t('export.headerFrom')
  row[layout.to - 1] = t('export.headerTo')
  return row
}

function styleTimesheetDataRow(
  dataRow: ExcelJS.Row,
  layout: ExcelExportColumnLayout,
  defaultBorder: ExcelJS.Border,
  allBorders: Partial<ExcelJS.Borders>,
): void {
  applyExcelRowStyles(dataRow, defaultBorder, allBorders)
  dataRow.getCell(layout.location).alignment = {
    horizontal: 'left',
    wrapText: true,
  }
  dataRow.getCell(layout.from).alignment = { horizontal: 'right' }
  dataRow.getCell(layout.to).alignment = { horizontal: 'right' }
  dataRow.getCell(layout.pause).alignment = { horizontal: 'right' }
  dataRow.getCell(layout.pause).numFmt = '0.00'
  if (layout.driver != null) {
    dataRow.getCell(layout.driver).alignment = { horizontal: 'right' }
    dataRow.getCell(layout.driver).numFmt = '0.00'
  }
  dataRow.getCell(layout.compensated).alignment = { horizontal: 'right' }
  dataRow.getCell(layout.compensated).numFmt = '0.00'
  if (layout.passenger != null) {
    dataRow.getCell(layout.passenger).alignment = { horizontal: 'right' }
    dataRow.getCell(layout.passenger).numFmt = '0.00'
  }
  dataRow.getCell(layout.mileage).alignment = { horizontal: 'left' }
}

function applyExcelRowStyles(
  row: ExcelJS.Row,
  defaultBorder: ExcelJS.Border,
  allBorders: Partial<ExcelJS.Borders>,
): void {
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    let border: Partial<ExcelJS.Borders>
    if (colNumber === 4) {
      border = {
        top: defaultBorder,
        left: defaultBorder,
        bottom: defaultBorder,
      }
    } else if (colNumber === 5) {
      border = {
        top: defaultBorder,
        right: defaultBorder,
        bottom: defaultBorder,
      }
    } else {
      border = allBorders
    }
    cell.border = border
    cell.alignment = { vertical: 'middle' }
  })
}

function compensatedHoursForIntervalEntry(
  entry: TimeEntry,
  workDurationMinutes: number,
  userSettings: UserSettings,
): number {
  if (['SICK_LEAVE', 'PTO', 'BANK_HOLIDAY'].includes(entry.location)) {
    return workDurationMinutes / 60
  }
  if (entry.location === 'TIME_OFF_IN_LIEU') {
    return 0
  }
  const compensatedMinutes =
    workDurationMinutes -
    (entry.pauseDuration || 0) +
    ((entry.driverTimeHours || 0) *
      60 *
      (userSettings.driverCompensationPercent ?? 100)) /
      100
  return compensatedMinutes > 0 ? compensatedMinutes / 60 : 0
}

function getExcelRowValues(
  entry: TimeEntry,
  userSettings: UserSettings,
  format: ExcelFormatter,
): {
  compensatedHours: number
  fromValue: string
  toValue: string
  pauseCellValue: number | ''
  driverTimeCellValue: number | ''
  passengerTimeCellValue: number | ''
} {
  let compensatedHours = 0
  let fromValue = ''
  let toValue = ''

  if (typeof entry.durationMinutes === 'number') {
    compensatedHours = entry.durationMinutes / 60
  } else if (entry.endTime) {
    const workDuration = differenceInMinutes(entry.endTime, entry.startTime!)
    compensatedHours = compensatedHoursForIntervalEntry(
      entry,
      workDuration,
      userSettings,
    )
    fromValue = entry.startTime
      ? format.dateTime(entry.startTime, 'shortTime')
      : ''
    toValue = entry.endTime ? format.dateTime(entry.endTime, 'shortTime') : ''
  }

  const pauseDecimal = parseFloat(formatDecimalHours(entry.pauseDuration))
  const pauseCellValue =
    !entry.pauseDuration || pauseDecimal === 0 ? '' : pauseDecimal
  const driverTimeCellValue =
    entry.driverTimeHours && entry.driverTimeHours !== 0
      ? entry.driverTimeHours
      : ''
  const passengerTimeCellValue =
    entry.passengerTimeHours && entry.passengerTimeHours !== 0
      ? entry.passengerTimeHours
      : ''

  return {
    compensatedHours,
    fromValue,
    toValue,
    pauseCellValue,
    driverTimeCellValue,
    passengerTimeCellValue,
  }
}

export const exportToExcel = async ({
  selectedMonth,
  user,
  userSettings,
  getEntriesForDay,
  getLocationDisplayName,
  t,
  format,
}: ExportParams) => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Stundenzettel')
  const layout = buildExcelExportColumnLayout(userSettings)

  // --- PAGE SETUP & HEADERS/FOOTERS ---
  const companyName = userSettings?.companyName || ''
  const email = userSettings?.companyEmail || ''
  const phone1 = userSettings?.companyPhone1 || ''
  const phone2 = userSettings?.companyPhone2 || ''
  const fax = userSettings?.companyFax || ''
  const phoneNumbers = [phone1, phone2].filter(Boolean).join(' / ')
  const contactParts = [
    companyName,
    email,
    phoneNumbers ? `Tel.: ${phoneNumbers}` : '',
    fax ? `FAX: ${fax}` : '',
  ].filter(Boolean)

  if (contactParts.length > 0) {
    worksheet.headerFooter.oddHeader = `&L${t('export.headerCompany')}&R${contactParts.join(' ')}`
  }

  const signatureString = t('export.signatureLine')
  worksheet.headerFooter.oddFooter = `&C${signatureString}`

  // --- STYLES ---
  const headerFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF99CCFF' },
  }
  const dayColFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF99CCFF' },
  }
  const headerFont: Partial<ExcelJS.Font> = {
    bold: false,
    color: { argb: 'FF000000' },
  }
  const defaultBorder: ExcelJS.Border = {
    style: 'thin',
    color: { argb: 'FF000000' },
  }
  const allBorders: Partial<ExcelJS.Borders> = {
    top: defaultBorder,
    left: defaultBorder,
    bottom: defaultBorder,
    right: defaultBorder,
  }

  const colWidths: Record<string, number> = {
    week: 5,
    date: 12,
    location: 16,
    from: 8,
    to: 8,
    pause: 8,
    driverTime: 8,
    compensated: 8,
    passengerTime: 8,
    mileage: 12,
  }
  worksheet.columns = Array.from({ length: layout.columnCount }, (_, i) => {
    const keys = [
      'week',
      'date',
      'location',
      'from',
      'to',
      'pause',
      ...(layout.showDriver ? (['driverTime'] as const) : []),
      'compensated',
      ...(layout.showPassenger ? (['passengerTime'] as const) : []),
      'mileage',
    ] as const
    const key = keys[i] ?? 'mileage'
    return { key, width: colWidths[key] ?? 8 }
  })

  // --- IN-SHEET TITLE AND USER NAME ---
  const titleRow = worksheet.addRow([])
  titleRow.getCell('A').value = t('export.timesheetTitle', {
    month: format.dateTime(selectedMonth, 'month'),
  })
  titleRow.getCell('A').font = { bold: true, size: 12 }

  worksheet.mergeCells(titleRow.number, 1, titleRow.number, layout.to)

  const userExportName =
    userSettings.displayName?.trim() || user?.displayName || user?.email || ''
  const userCell = titleRow.getCell(layout.columnCount)
  userCell.value = userExportName
  userCell.font = { bold: true, size: 10 }
  userCell.alignment = { horizontal: 'right' }

  worksheet.addRow([]) // blank row

  // --- DATA ROWS ---
  const weeksInMonth = getWeeksForMonth(selectedMonth)

  weeksInMonth.forEach((week) => {
    const weekHasContent = week.some((day) => {
      if (!isSameMonth(day, selectedMonth)) return false
      const dayEntries = getEntriesForDay(day)
      const isSunday = getDay(day) === 0
      return dayEntries.length > 0 || !isSunday
    })

    if (!weekHasContent) {
      return
    }

    // --- RENDER TABLE HEADERS FOR THE WEEK ---
    const headerRow1Num = worksheet.rowCount + 1
    const headerRow2Num = headerRow1Num + 1

    const headerRow1 = worksheet.getRow(headerRow1Num)
    headerRow1.values = buildExcelHeaderRow1(layout, t)

    const headerRow2 = worksheet.getRow(headerRow2Num)
    headerRow2.values = buildExcelHeaderRow2(layout, t)

    const mergeHeaderVertical = (col: number) => {
      worksheet.mergeCells(headerRow1Num, col, headerRow2Num, col)
    }
    mergeHeaderVertical(layout.week)
    mergeHeaderVertical(layout.date)
    mergeHeaderVertical(layout.location)
    worksheet.mergeCells(headerRow1Num, layout.from, headerRow1Num, layout.to)
    mergeHeaderVertical(layout.pause)
    if (layout.driver != null) mergeHeaderVertical(layout.driver)
    mergeHeaderVertical(layout.compensated)
    if (layout.passenger != null) mergeHeaderVertical(layout.passenger)
    mergeHeaderVertical(layout.mileage)

    // Apply styles to header rows
    ;[headerRow1, headerRow2].forEach((row) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = headerFill
        cell.font = headerFont
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'left',
          wrapText: true,
        }
        cell.border = allBorders
      })
    })

    // --- Custom border logic for "Arbeitszeit" and "von/bis" headers ---
    const arbeitszeitCell = worksheet.getCell(headerRow1Num, 4)
    const vonCell = worksheet.getCell(headerRow2Num, 4)
    const bisCell = worksheet.getCell(headerRow2Num, 5)

    // Remove bottom border from merged "tatsächliche Arbeitszeit" cell
    arbeitszeitCell.border = {
      top: defaultBorder,
      left: defaultBorder,
      right: defaultBorder,
    }

    // Remove top & right border from "von" cell
    vonCell.border = { left: defaultBorder, bottom: defaultBorder }

    // Remove top & left border from "bis" cell
    bisCell.border = { right: defaultBorder, bottom: defaultBorder }

    // --- RENDER DATA ROWS FOR THE WEEK ---
    week.forEach((day) => {
      const dayEntries = getEntriesForDay(day)
      const isSunday = getDay(day) === 0
      const startRowForDay = worksheet.rowCount + 1

      if (!isSameMonth(day, selectedMonth)) return

      if (dayEntries.length > 0) {
        dayEntries.forEach((entry) => {
          const {
            compensatedHours,
            fromValue,
            toValue,
            pauseCellValue,
            driverTimeCellValue,
            passengerTimeCellValue,
          } = getExcelRowValues(entry, userSettings, format)

          const rowData: ExcelJS.CellValue[] = Array(layout.columnCount).fill(
            '',
          )
          rowData[layout.location - 1] = getLocationDisplayName(entry.location)
          rowData[layout.from - 1] = fromValue
          rowData[layout.to - 1] = toValue
          rowData[layout.pause - 1] = pauseCellValue
          if (layout.driver != null) {
            rowData[layout.driver - 1] = driverTimeCellValue
          }
          rowData[layout.compensated - 1] = compensatedHours
          if (layout.passenger != null) {
            rowData[layout.passenger - 1] = passengerTimeCellValue
          }
          rowData[layout.mileage - 1] = ''
          const dataRow = worksheet.addRow(rowData)
          styleTimesheetDataRow(dataRow, layout, defaultBorder, allBorders)
        })

        // Set and merge weekday and date cells
        const dayCell = worksheet.getCell(startRowForDay, 1)
        dayCell.value = format.dateTime(day, 'weekday')
        dayCell.fill = dayColFill
        dayCell.alignment = { vertical: 'middle', horizontal: 'left' }
        worksheet.mergeCells(
          startRowForDay,
          1,
          startRowForDay + dayEntries.length - 1,
          1,
        )

        const dateCell = worksheet.getCell(startRowForDay, 2)
        dateCell.value = format.dateTime(day, 'short')
        dateCell.alignment = { vertical: 'middle', horizontal: 'right' }
        worksheet.mergeCells(
          startRowForDay,
          2,
          startRowForDay + dayEntries.length - 1,
          2,
        )
      } else if (!isSunday) {
        const emptyValues: ExcelJS.CellValue[] = Array(layout.columnCount).fill(
          '',
        )
        emptyValues[layout.week - 1] = format.dateTime(day, 'weekday')
        emptyValues[layout.date - 1] = format.dateTime(day, 'short')
        const emptyRow = worksheet.addRow(emptyValues)
        applyExcelRowStyles(emptyRow, defaultBorder, allBorders)
        emptyRow.getCell(1).fill = dayColFill
        emptyRow.getCell(1).alignment = {
          vertical: 'middle',
          horizontal: 'left',
        }
        emptyRow.getCell(2).alignment = {
          vertical: 'middle',
          horizontal: 'right',
        }
      }
    })

    // --- RENDER WEEKLY TOTAL ---
    const weekCompTotal = calculateWeekCompensatedTime(
      week,
      getEntriesForDay,
      userSettings,
      selectedMonth,
    )
    const weekPassengerTotal = calculateWeekPassengerTime(
      week,
      getEntriesForDay,
      selectedMonth,
    )
    const totalRow = worksheet.addRow(Array(layout.columnCount).fill(''))
    worksheet.mergeCells(
      totalRow.number,
      1,
      totalRow.number,
      layout.compensated - 1,
    )
    const totalLabelCell = totalRow.getCell(1)
    totalLabelCell.value = t('export.footerTotalPerWeek')
    totalLabelCell.alignment = { horizontal: 'right' }

    const totalCompCell = totalRow.getCell(layout.compensated)
    totalCompCell.value = weekCompTotal
    totalCompCell.numFmt = '0.00'
    totalCompCell.border = {
      bottom: { style: 'medium', color: { argb: 'FF000000' } },
    }
    totalCompCell.alignment = { horizontal: 'right' }
    if (layout.passenger != null) {
      const totalPassengerCell = totalRow.getCell(layout.passenger)
      totalPassengerCell.value = weekPassengerTotal
      totalPassengerCell.numFmt = '0.00'
      totalPassengerCell.border = {
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
      }
      totalPassengerCell.alignment = { horizontal: 'right' }
    }
    worksheet.addRow([]) // Blank row for spacing
  })

  // -- GRAND TOTAL AND EXPECTED HOURS ROW --
  const grandTotalRow = worksheet.addRow(Array(layout.columnCount).fill(''))

  // --- EXPECTED HOURS  ---
  const expectedHours = calculateExpectedMonthlyHours(userSettings)
  worksheet.mergeCells(grandTotalRow.number, 1, grandTotalRow.number, 2)
  grandTotalRow.getCell(1).value = t('export.footerExpectedHours')
  const expectedHoursCell = grandTotalRow.getCell(3)
  expectedHoursCell.value = expectedHours
  expectedHoursCell.numFmt = '0.00'
  expectedHoursCell.alignment = { horizontal: 'left' }

  // --- GRAND TOTAL ---
  const monthCompTotal = weeksInMonth.reduce(
    (acc, week) =>
      acc +
      calculateWeekCompensatedTime(
        week,
        getEntriesForDay,
        userSettings,
        selectedMonth,
      ),
    0,
  )
  const monthPassengerTotal = weeksInMonth.reduce(
    (acc, week) =>
      acc + calculateWeekPassengerTime(week, getEntriesForDay, selectedMonth),
    0,
  )

  worksheet.mergeCells(
    grandTotalRow.number,
    layout.from,
    grandTotalRow.number,
    layout.compensated - 1,
  )
  const grandTotalLabelCell = grandTotalRow.getCell(layout.from)
  grandTotalLabelCell.value = t('export.footerTotalHours')
  grandTotalLabelCell.alignment = { horizontal: 'right' }
  const grandTotalCompCell = grandTotalRow.getCell(layout.compensated)
  grandTotalCompCell.value = monthCompTotal
  grandTotalCompCell.numFmt = '0.00'
  grandTotalCompCell.border = {
    bottom: { style: 'double', color: { argb: 'FF000000' } },
  }
  grandTotalCompCell.alignment = { horizontal: 'right' }
  if (layout.passenger != null) {
    const grandTotalPassengerCell = grandTotalRow.getCell(layout.passenger)
    grandTotalPassengerCell.value = monthPassengerTotal
    grandTotalPassengerCell.numFmt = '0.00'
    grandTotalPassengerCell.border = {
      bottom: { style: 'double', color: { argb: 'FF000000' } },
    }
    grandTotalPassengerCell.alignment = { horizontal: 'right' }
  }

  // -- GRAND TOTAL AND OVERTIME ROW --
  const afterConversionRow = worksheet.addRow(
    Array(layout.columnCount).fill(''),
  )
  const passengerCompPercent = userSettings.passengerCompensationPercent ?? 100
  const compensatedPassengerHours =
    monthPassengerTotal * (passengerCompPercent / 100)

  // --- OVERTIME CELLS ---
  const actualHours = monthCompTotal + compensatedPassengerHours
  const overtime = actualHours - expectedHours
  worksheet.mergeCells(
    afterConversionRow.number,
    1,
    afterConversionRow.number,
    2,
  )
  afterConversionRow.getCell(1).value = t('export.footerOvertime')
  const overTimeCell = afterConversionRow.getCell(3)
  overTimeCell.value = overtime
  overTimeCell.numFmt = '0.00'
  overTimeCell.alignment = { horizontal: 'left' }

  // Color code the overtime cell
  if (overtime > 0) {
    overTimeCell.font = { color: { argb: 'FF00AA00' } } // Green
  } else if (overtime < 0) {
    overTimeCell.font = { color: { argb: 'FFAA0000' } } // Red
  }

  // --- SECOND MONTHLY TOTAL CELLS ---
  worksheet.mergeCells(
    afterConversionRow.number,
    layout.from,
    afterConversionRow.number,
    layout.compensated - 1,
  )
  const afterConversionLabelCell = afterConversionRow.getCell(layout.from)
  afterConversionLabelCell.value = t('export.footerTotalAfterConversion')
  afterConversionLabelCell.alignment = { horizontal: 'right' }

  const afterConversionValueCell = afterConversionRow.getCell(
    layout.compensated,
  )
  afterConversionValueCell.value = monthCompTotal + compensatedPassengerHours
  afterConversionValueCell.numFmt = '0.00'
  if (layout.passenger != null) {
    afterConversionRow.getCell(layout.passenger).value =
      compensatedPassengerHours
    afterConversionRow.getCell(layout.passenger).numFmt = '0.00'
  }

  // --- SAVE FILE ---
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Stundenzettel_${userExportName || 'Export'}_${format.dateTime(selectedMonth, 'yearMonth')}.xlsx`
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}
