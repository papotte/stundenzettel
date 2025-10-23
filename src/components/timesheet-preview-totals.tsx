'use client'

import React from 'react'
import { useTranslations } from 'next-intl'

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
  expectedHours: number
  monthCompTotal: number
  monthPassengerTotal: number
  overtime: number
  compensatedPassengerHours: number
}

export default function TimesheetPreviewTotals({
  expectedHours,
  monthCompTotal,
  monthPassengerTotal,
  overtime,
  compensatedPassengerHours,
}: TimesheetPreviewTotalsProps) {
  const t = useTranslations()

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
          overtime > 0
            ? 'text-green-600'
            : overtime < 0
              ? 'text-red-600'
              : ''
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

  const renderTotalsRow = (row: TotalsRow, isFirstRow: boolean = false) => {
    const containerClass = isFirstRow ? 'mt-8 flex w-full print:mt-4 print:text-xs' : 'mt-2 flex w-full print:text-xs'
    
    return (
      <div className={containerClass}>
        <div className="flex w-full justify-between">
          {/* Left column */}
          <div className="flex gap-8 sm:w-1/4 justify-between">
            <div className="flex gap-8 justify-between w-full">
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
          </div>
          
          {/* Spacer */}
          <div className="flex-1"></div>
          
          {/* Right column - single label with 4 values */}
          <div className="flex gap-8 md:w-1/2 justify-between">
            <div className="flex-1 text-right font-semibold">
              {row.rightColumn.label}
            </div>
            <div className={`flex flex-1 gap-8 ${row.rightColumn.className || ''}`}>
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
        </div>
      </div>
    )
  }

  return (
    <>
      {rowsData.map((row, index) => (
        <React.Fragment key={index}>
          {renderTotalsRow(row, index === 0)}
        </React.Fragment>
      ))}
    </>
  )
}
