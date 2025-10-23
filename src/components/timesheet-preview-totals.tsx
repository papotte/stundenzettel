'use client'

import React, { useMemo } from 'react'

import { useTranslations } from 'next-intl'

import {
  calculateExpectedMonthlyHours,
  calculateWeekCompensatedTime,
} from '@/lib/time-utils'
import type { TimeEntry, UserSettings } from '@/lib/types'

interface TotalsRowData {
  label: string
  value: string | number
  testId?: string
  className?: string
}

interface TotalsRowValue {
  value: string | number
  testId?: string
}

interface TotalsRow {
  leftColumn: TotalsRowData
  rightColumn: {
    label: string
    values: TotalsRowValue[]
    className?: string
  }
}

interface TimesheetPreviewTotalsProps {
  selectedMonth: Date
  relevantWeeks: Date[][]
  getEntriesForDay: (day: Date) => TimeEntry[]
  userSettings: UserSettings
}

export default function TimesheetPreviewTotals({
  selectedMonth,
  relevantWeeks,
  getEntriesForDay,
  userSettings,
}: TimesheetPreviewTotalsProps) {
  const t = useTranslations()

  // Calculate totals using the same logic as the main component
  const monthCompTotal = useMemo(
    () =>
      relevantWeeks.reduce(
        (acc: number, week: Date[]) =>
          acc +
          calculateWeekCompensatedTime(
            week,
            getEntriesForDay,
            userSettings,
            selectedMonth,
          ),
        0,
      ),
    [relevantWeeks, getEntriesForDay, userSettings, selectedMonth],
  )

  const monthPassengerTotal = useMemo(() => {
    const monthEntries = relevantWeeks.flatMap((week: Date[]) =>
      week.flatMap(getEntriesForDay),
    )
    return monthEntries.reduce((total, entry) => {
      return total + (entry.passengerTimeHours || 0)
    }, 0)
  }, [relevantWeeks, getEntriesForDay])

  const passengerCompPercent = userSettings?.passengerCompensationPercent ?? 90
  const compensatedPassengerHours =
    monthPassengerTotal * (passengerCompPercent / 100)

  const expectedHours = useMemo(
    () => calculateExpectedMonthlyHours(userSettings),
    [userSettings],
  )

  const actualHours = monthCompTotal + compensatedPassengerHours
  const overtime = actualHours - expectedHours

  // Rows data structure
  const rowsData: TotalsRow[] = [
    {
      leftColumn: {
        label: t('export.footerExpectedHours'),
        value: expectedHours.toFixed(2),
        testId: 'timesheet-expected-hours',
      },
      rightColumn: {
        label: t('export.footerTotalHours'),
        values: [
          {
            value: monthCompTotal.toFixed(2),
            testId: 'timesheet-month-total',
          },
          {
            value: monthPassengerTotal.toFixed(2),
            testId: 'timesheet-month-passenger-total',
          },
          {
            value: 'Km:',
          },
          {
            value: '',
          },
        ],
        className: 'border-b-4 border-double border-black pb-2',
      },
    },
    {
      leftColumn: {
        label: t('export.footerOvertime'),
        value: `${overtime > 0 ? '+' : ''}${overtime.toFixed(2)}`,
        testId: 'timesheet-overtime',
        className: `${
          overtime > 0 ? 'text-green-600' : overtime < 0 ? 'text-red-600' : ''
        }`,
      },
      rightColumn: {
        label: t('export.footerTotalAfterConversion'),
        values: [
          {
            value: (monthCompTotal + compensatedPassengerHours).toFixed(2),
            testId: 'timesheet-month-adjusted',
          },
          {
            value: compensatedPassengerHours.toFixed(2),
          },
          {
            value: '',
          },
          {
            value: '',
          },
        ],
        className: 'pb-2',
      },
    },
  ]

  const renderTotalsRow = (row: TotalsRow, index: number) => {
    // Helper function to generate responsive order classes
    const getOrderClasses = (baseOrder: number) => {
      const orderValue = baseOrder + index * 3
      return `sm:order-${orderValue} print:order-${orderValue}`
    }

    return (
      <>
        {/* Right column - single label with 4 values */}
        <div
          className={`col-span-full sm:col-span-6 print:col-span-6 flex gap-8 justify-between order-1 ${getOrderClasses(3)}`}
        >
          <div className="flex-1 text-right font-semibold">
            {row.rightColumn.label}
          </div>
          <div
            className={`flex flex-1 gap-2 md:gap-0 ${row.rightColumn.className || ''}`}
          >
            {row.rightColumn.values.map((item, index) => (
              <div
                key={index}
                className="flex-1 text-right print:pb-1"
                data-testid={item.testId}
              >
                {item.value}
              </div>
            ))}
          </div>
        </div>

        {/* Spacer for desktop */}
        <div
          className={`hidden sm:block print:block sm:col-span-3 print:col-span-3 ${getOrderClasses(2)}`}
        />

        {/* Left column */}
        <div
          className={`col-span-full sm:col-span-3 print:col-span-3 flex gap-8 justify-between order-2 ${getOrderClasses(1)}`}
        >
          <div className="text-right flex-1 font-semibold">
            {row.leftColumn.label}
          </div>
          <div
            className={`text-right print:pb-1 ${row.leftColumn.className || ''}`}
            data-testid={row.leftColumn.testId}
          >
            {row.leftColumn.value}
          </div>
        </div>
      </>
    )
  }

  return (
    <div
      className={
        'grid grid-cols-none sm:grid-cols-12 print:grid-cols-12 w-full gap-2 mt-8'
      }
    >
      {rowsData.map((row, index) => (
        <React.Fragment key={index}>
          {renderTotalsRow(row, index)}
        </React.Fragment>
      ))}
    </div>
  )
}
