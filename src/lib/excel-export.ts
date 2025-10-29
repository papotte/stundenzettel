import { differenceInMinutes, getDay, isSameMonth } from 'date-fns'
import ExcelJS from 'exceljs'
import { useTranslations } from 'next-intl'

import { useFormatter } from '@/lib/date-formatter'
import {
  calculateExpectedMonthlyHours,
  calculateWeekCompensatedTime,
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
  visibleColumns?: {
    includeLocation?: boolean
    includePauseDuration?: boolean
    includeDrivingTime?: boolean
    includeMileage?: boolean
  }
}

export const exportToExcel = async ({
  selectedMonth,
  user,
  userSettings,
  getEntriesForDay,
  getLocationDisplayName,
  visibleColumns,
  t,
  format,
}: ExportParams) => {
  const showLocation = visibleColumns?.includeLocation ?? true
  const showPause = visibleColumns?.includePauseDuration ?? true
  const showDriving = visibleColumns?.includeDrivingTime ?? true
  const showMileage = visibleColumns?.includeMileage ?? true
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Stundenzettel')

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

  // --- COLUMN WIDTHS ---
  worksheet.columns = [
    { key: 'week', width: 5 },
    { key: 'date', width: 12 },
    ...(showLocation ? [{ key: 'location', width: 16 }] : []),
    { key: 'from', width: 8 },
    { key: 'to', width: 8 },
    ...(showPause ? [{ key: 'pause', width: 8 }] : []),
    ...(showDriving ? [{ key: 'driverTime', width: 8 }] : []),
    { key: 'compensated', width: 8 },
    ...(showDriving ? [{ key: 'passengerTime', width: 8 }] : []),
    ...(showMileage ? [{ key: 'mileage', width: 12 }] : []),
  ]

  // --- IN-SHEET TITLE AND USER NAME ---
  const titleRow = worksheet.addRow([])
  titleRow.getCell('A').value = t('export.timesheetTitle', {
    month: format.dateTime(selectedMonth, 'month'),
  })
  titleRow.getCell('A').font = { bold: true, size: 12 }

  // Merge title across first 5 columns (week, date, [location], from, to)
  const titleEndCol = 5 + (showLocation ? 1 : 0)
  worksheet.mergeCells(titleRow.number, 1, titleRow.number, titleEndCol)

  const userExportName =
    userSettings.displayName?.trim() || user?.displayName || user?.email || ''
  // Place user cell to the far right of current columns
  const lastColIndex = worksheet.columns.length
  const userCell = titleRow.getCell(lastColIndex)
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
    headerRow1.values = [
      t('export.headerWeek'),
      t('export.headerDate'),
      ...(showLocation ? [t('export.headerLocation')] : []),
      t('export.headerWorkTime'),
      '',
      ...(showPause ? [t('export.headerPauseDuration')] : []),
      ...(showDriving ? [t('export.headerDriverTime')] : []),
      t('export.headerCompensatedTime'),
      ...(showDriving ? [t('export.headerPassengerTime')] : []),
      ...(showMileage ? [t('export.headerMileage')] : []),
    ]

    const headerRow2 = worksheet.getRow(headerRow2Num)
    headerRow2.values = [
      '',
      '',
      '',
      t('export.headerFrom'),
      t('export.headerTo'),
    ]

    const baseColIndex = 1
    let col = baseColIndex
    worksheet.mergeCells(headerRow1Num, col, headerRow2Num, col); col++ // week
    worksheet.mergeCells(headerRow1Num, col, headerRow2Num, col); col++ // date
    if (showLocation) { worksheet.mergeCells(headerRow1Num, col, headerRow2Num, col); col++ }
    const workTimeStart = col
    const workTimeEnd = col + 1
    worksheet.mergeCells(headerRow1Num, workTimeStart, headerRow1Num, workTimeEnd); col = workTimeEnd + 1
    if (showPause) { worksheet.mergeCells(headerRow1Num, col, headerRow2Num, col); col++ }
    if (showDriving) { worksheet.mergeCells(headerRow1Num, col, headerRow2Num, col); col++ }
    worksheet.mergeCells(headerRow1Num, col, headerRow2Num, col); col++ // compensated
    if (showDriving) { worksheet.mergeCells(headerRow1Num, col, headerRow2Num, col); col++ }
    if (showMileage) { worksheet.mergeCells(headerRow1Num, col, headerRow2Num, col); col++ }

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

      const applyRowStyles = (row: ExcelJS.Row) => {
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          let border: Partial<ExcelJS.Borders>
          if (colNumber === 4) {
            // von
            border = {
              top: defaultBorder,
              left: defaultBorder,
              bottom: defaultBorder,
            }
          } else if (colNumber === 5) {
            // bis
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

       if (dayEntries.length > 0) {
        dayEntries.forEach((entry) => {
          let compensatedHours = 0
          let fromValue = ''
          let toValue = ''
          if (typeof entry.durationMinutes === 'number') {
            compensatedHours = entry.durationMinutes / 60
            fromValue = ''
            toValue = ''
          } else if (entry.endTime) {
            const workDuration = differenceInMinutes(
              entry.endTime,
              entry.startTime!,
            )
            const isCompensatedSpecialDay = [
              'SICK_LEAVE',
              'PTO',
              'BANK_HOLIDAY',
            ].includes(entry.location)
            if (isCompensatedSpecialDay) {
              compensatedHours = workDuration / 60
            } else if (entry.location !== 'TIME_OFF_IN_LIEU') {
              const compensatedMinutes =
                workDuration -
                (entry.pauseDuration || 0) +
                ((entry.driverTimeHours || 0) *
                  60 *
                  (userSettings.driverCompensationPercent ?? 100)) /
                  100
              compensatedHours =
                compensatedMinutes > 0 ? compensatedMinutes / 60 : 0
            }
            fromValue = entry.startTime
              ? format.dateTime(entry.startTime, 'shortTime')
              : ''
            toValue = entry.endTime
              ? format.dateTime(entry.endTime, 'shortTime')
              : ''
          }
          const pauseDecimal = parseFloat(
            formatDecimalHours(entry.pauseDuration),
          )

          // If pauseDecimal is 0, use blank; otherwise, use the value
          const pauseCellValue =
            !entry.pauseDuration || pauseDecimal === 0 ? '' : pauseDecimal
          // If travelTime is 0, use blank; otherwise, use the value
          const driverTimeCellValue =
            entry.driverTimeHours && entry.driverTimeHours !== 0
              ? entry.driverTimeHours
              : ''
          const passengerTimeCellValue =
            entry.passengerTimeHours && entry.passengerTimeHours !== 0
              ? entry.passengerTimeHours
              : ''

          const rowData = [
            '',
            '',
            ...(showLocation ? [getLocationDisplayName(entry.location)] : []),
            fromValue,
            toValue,
            ...(showPause ? [pauseCellValue] : []),
            ...(showDriving ? [driverTimeCellValue] : []),
            compensatedHours,
            ...(showDriving ? [passengerTimeCellValue] : []),
            ...(showMileage ? [''] : []),
          ]
          const dataRow = worksheet.addRow(rowData)
          applyRowStyles(dataRow)
          // Set specific alignments after applying common styles
          let c = 1
          c++ // week
          c++ // date
          if (showLocation) {
            dataRow.getCell(c).alignment.horizontal = 'left';
            dataRow.getCell(c).alignment.wrapText = true;
            c++
          }
          dataRow.getCell(c++).alignment.horizontal = 'right' // from
          dataRow.getCell(c++).alignment.horizontal = 'right' // to
          if (showPause) { dataRow.getCell(c++).alignment.horizontal = 'right' }
          if (showDriving) { dataRow.getCell(c++).alignment.horizontal = 'right' }
          dataRow.getCell(c++).alignment.horizontal = 'right' // compensated
          if (showDriving) { dataRow.getCell(c++).alignment.horizontal = 'right' }
          if (showMileage) { dataRow.getCell(c).alignment.horizontal = 'left' }
          // number formats for right-aligned numeric cells
          // rebuild indexes similarly for formats
          let f = 1
          f += 2 // week, date
          if (showLocation) f += 1
          f += 2 // from, to
          if (showPause) { dataRow.getCell(f).numFmt = '0.00'; f += 1 }
          if (showDriving) { dataRow.getCell(f).numFmt = '0.00'; f += 1 }
          dataRow.getCell(f).numFmt = '0.00'; f += 1 // compensated
          if (showDriving) { dataRow.getCell(f).numFmt = '0.00'; f += 1 }
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
        const emptyRow = worksheet.addRow([
          format.dateTime(day, 'weekday'),
          format.dateTime(day, 'short'),
          ...(showLocation ? [''] : []),
          '',
          '',
          ...(showPause ? [''] : []),
          ...(showDriving ? [''] : []),
          '',
          ...(showDriving ? [''] : []),
          ...(showMileage ? [''] : []),
        ])
        applyRowStyles(emptyRow)
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
    const weekEntries = week.flatMap(getEntriesForDay)
    const weekCompTotal = calculateWeekCompensatedTime(
      week,
      getEntriesForDay,
      userSettings,
      selectedMonth,
    )
    const weekPassengerTotal = weekEntries.reduce(
      (acc, entry) => acc + (entry.passengerTimeHours || 0),
      0,
    )
    const totalRow = worksheet.addRow([])
    let totalLabelCol = 7
    if (showLocation) totalLabelCol += 1
    if (showPause) totalLabelCol += 1
    if (showDriving) totalLabelCol += 1
    worksheet.mergeCells(totalRow.number, 1, totalRow.number, totalLabelCol)
    const totalLabelCell = totalRow.getCell(1)
    totalLabelCell.value = t('export.footerTotalPerWeek')
    totalLabelCell.alignment = { horizontal: 'right' }

    const totalCompCell = totalRow.getCell(totalLabelCol + 2)
    totalCompCell.value = weekCompTotal
    totalCompCell.numFmt = '0.00'
    totalCompCell.border = {
      bottom: { style: 'medium', color: { argb: 'FF000000' } },
    }
    totalCompCell.alignment = { horizontal: 'right' }
    if (showDriving) {
      const totalPassengerCell = totalRow.getCell(totalLabelCol + 3)
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
  const grandTotalRow = worksheet.addRow([])

  // --- EXPECTED HOURS  ---
  const expectedHours = calculateExpectedMonthlyHours(userSettings)
  worksheet.mergeCells(grandTotalRow.number, 1, grandTotalRow.number, 2)
  grandTotalRow.getCell(1).value = t('export.footerExpectedHours')
  const expectedHoursCell = grandTotalRow.getCell(3)
  expectedHoursCell.value = expectedHours
  expectedHoursCell.numFmt = '0'
  expectedHoursCell.alignment = { horizontal: 'left' }

  // --- GRAND TOTAL ---
  const monthEntries = weeksInMonth.flatMap((week) =>
    week.flatMap(getEntriesForDay),
  )
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
  const monthPassengerTotal = monthEntries.reduce(
    (acc, entry) => acc + (entry.passengerTimeHours || 0),
    0,
  )

  worksheet.mergeCells(grandTotalRow.number, 4, grandTotalRow.number, 7)
  const grandTotalLabelCell = grandTotalRow.getCell(4)
  grandTotalLabelCell.value = t('export.footerTotalHours')
  grandTotalLabelCell.alignment = { horizontal: 'right' }
  const grandTotalCompCell = grandTotalRow.getCell(8)
  grandTotalCompCell.value = monthCompTotal
  grandTotalCompCell.numFmt = '0.00'
  grandTotalCompCell.border = {
    bottom: { style: 'double', color: { argb: 'FF000000' } },
  }
  grandTotalCompCell.alignment = { horizontal: 'right' }
  const grandTotalPassengerCell = grandTotalRow.getCell(9)
  grandTotalPassengerCell.value = monthPassengerTotal
  grandTotalPassengerCell.numFmt = '0.00'
  grandTotalPassengerCell.border = {
    bottom: { style: 'double', color: { argb: 'FF000000' } },
  }
  grandTotalPassengerCell.alignment = { horizontal: 'right' }

  // -- GRAND TOTAL AND OVERTIME ROW --
  const afterConversionRow = worksheet.addRow([])
  const passengerCompPercent = userSettings.passengerCompensationPercent ?? 90
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
    4,
    afterConversionRow.number,
    7,
  )
  const afterConversionLabelCell = afterConversionRow.getCell(4)
  afterConversionLabelCell.value = t('export.footerTotalAfterConversion')
  afterConversionLabelCell.alignment = { horizontal: 'right' }

  const afterConversionValueCell = afterConversionRow.getCell(8)
  afterConversionValueCell.value = monthCompTotal + compensatedPassengerHours
  afterConversionValueCell.numFmt = '0.00'
  afterConversionRow.getCell(9).value = compensatedPassengerHours
  afterConversionRow.getCell(9).numFmt = '0.00'

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
