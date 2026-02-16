'use client'

import { useTranslations } from 'next-intl'

import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useMemberDisplayNames } from '@/hooks/use-member-display-names'
import { useMemberSummaries } from '@/hooks/use-member-summaries'
import { calculateExpectedMonthlyHours } from '@/lib/time-utils'
import type { TeamMember } from '@/lib/types'
import { maskEmail } from '@/lib/utils'

interface TeamReportsListProps {
  teamId: string | null
  members: TeamMember[]
  selectedMonth: Date
  onMemberClick: (memberId: string) => void
}

export function TeamReportsList({
  teamId,
  members,
  selectedMonth,
  onMemberClick,
}: TeamReportsListProps) {
  const t = useTranslations()
  const { displayNames } = useMemberDisplayNames(members.map((m) => m.id))
  const { sortedSummaries, memberSummaries } = useMemberSummaries(
    teamId,
    members,
    selectedMonth,
  )

  if (members.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        {t('reports.noMembers')}
      </div>
    )
  }

  const hasLoading = Array.from(memberSummaries.values()).some(
    (s) => s.isLoading,
  )

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('reports.memberName')}</TableHead>
            <TableHead className="text-right">
              {t('export.footerExpectedHours')}
            </TableHead>
            <TableHead className="text-right">
              {t('reports.hoursWorked')}
            </TableHead>
            <TableHead className="text-right">
              {t('export.footerOvertime')}
            </TableHead>
            <TableHead className="text-right">
              {t('reports.percentage')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {hasLoading && sortedSummaries.length === 0
            ? Array.from({ length: members.length }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            : sortedSummaries.map((summary) => (
                <TableRow
                  key={summary.member.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onMemberClick(summary.member.id)}
                  data-testid={`member-row-${summary.member.id}`}
                >
                  <TableCell className="font-medium">
                    {summary.isLoading ? (
                      <Skeleton className="h-4 w-48" />
                    ) : (
                      displayNames.get(summary.member.id) ||
                      (summary.userSettings?.displayName ?? '').trim() ||
                      maskEmail(summary.member.email) ||
                      summary.member.email
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {summary.isLoading ? (
                      <Skeleton className="h-4 w-16 ml-auto" />
                    ) : !summary.isPublished ? (
                      t('reports.notPublished')
                    ) : summary.userSettings ? (
                      calculateExpectedMonthlyHours(
                        summary.userSettings,
                      ).toFixed(2) + 'h'
                    ) : (
                      '0.00h'
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {summary.isLoading ? (
                      <Skeleton className="h-4 w-16 ml-auto" />
                    ) : !summary.isPublished ? (
                      t('reports.notPublished')
                    ) : (
                      `${summary.hoursWorked.toFixed(2)}h`
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {summary.isLoading ? (
                      <Skeleton className="h-4 w-16 ml-auto" />
                    ) : !summary.isPublished ? (
                      t('reports.notPublished')
                    ) : (
                      <span
                        className={
                          summary.overtime > 0
                            ? 'text-green-600'
                            : summary.overtime < 0
                              ? 'text-red-600'
                              : ''
                        }
                      >
                        {summary.overtime > 0 ? '+' : ''}
                        {summary.overtime.toFixed(2)}h
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {summary.isLoading ? (
                      <Skeleton className="h-4 w-16 ml-auto" />
                    ) : !summary.isPublished ? (
                      t('reports.notPublished')
                    ) : (
                      `${summary.percentage.toFixed(1)}%`
                    )}
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  )
}
