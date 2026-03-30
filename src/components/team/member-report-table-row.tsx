'use client'

import type { ReactNode } from 'react'

import { useTranslations } from 'next-intl'

import { Skeleton } from '@/components/ui/skeleton'
import { TableCell, TableRow } from '@/components/ui/table'
import { calculateExpectedMonthlyHours } from '@/lib/time-utils'
import type { MemberSummary } from '@/lib/types'
import { maskEmail, overtimeTextColorClass } from '@/lib/utils'

function MemberReportMetricCell({
  summary,
  children,
}: {
  summary: MemberSummary
  children: ReactNode
}) {
  const t = useTranslations()
  if (summary.isLoading) {
    return <Skeleton className="h-4 w-16 ml-auto" />
  }
  if (!summary.isPublished) {
    return t('reports.notPublished')
  }
  return children
}

export interface MemberReportTableRowProps {
  summary: MemberSummary
  displayNames: Map<string, string>
  onMemberClick: (memberId: string) => void
}

export function MemberReportTableRow({
  summary,
  displayNames,
  onMemberClick,
}: MemberReportTableRowProps) {
  const nameColumn = summary.isLoading ? (
    <Skeleton className="h-4 w-48" />
  ) : (
    displayNames.get(summary.member.id) ||
    (summary.userSettings?.displayName ?? '').trim() ||
    maskEmail(summary.member.email) ||
    summary.member.email
  )

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => onMemberClick(summary.member.id)}
      data-testid={`member-row-${summary.member.id}`}
    >
      <TableCell className="font-medium">{nameColumn}</TableCell>
      <TableCell className="text-right">
        <MemberReportMetricCell summary={summary}>
          {summary.userSettings
            ? calculateExpectedMonthlyHours(summary.userSettings).toFixed(2) +
              'h'
            : '0.00h'}
        </MemberReportMetricCell>
      </TableCell>
      <TableCell className="text-right">
        <MemberReportMetricCell summary={summary}>
          {`${summary.hoursWorked.toFixed(2)}h`}
        </MemberReportMetricCell>
      </TableCell>
      <TableCell className="text-right">
        <MemberReportMetricCell summary={summary}>
          <span className={overtimeTextColorClass(summary.overtime)}>
            {summary.overtime > 0 ? '+' : ''}
            {summary.overtime.toFixed(2)}h
          </span>
        </MemberReportMetricCell>
      </TableCell>
      <TableCell className="text-right">
        <MemberReportMetricCell summary={summary}>
          {`${summary.percentage.toFixed(1)}%`}
        </MemberReportMetricCell>
      </TableCell>
    </TableRow>
  )
}
