'use client'

import { useTranslations } from 'next-intl'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useMemberSummaries } from '@/hooks/use-member-summaries'
import { calculateExpectedMonthlyHours } from '@/lib/time-utils'
import type { TeamMember } from '@/lib/types'
import { maskEmail } from '@/lib/utils'

interface TeamReportsGridProps {
  members: TeamMember[]
  selectedMonth: Date
  onMemberClick: (memberId: string) => void
}

export function TeamReportsGrid({
  members,
  selectedMonth,
  onMemberClick,
}: TeamReportsGridProps) {
  const t = useTranslations()
  const { sortedSummaries } = useMemberSummaries(members, selectedMonth)

  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          {t('reports.noMembers')}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sortedSummaries.map((summary) => (
        <Card
          key={summary.member.id}
          className="cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => onMemberClick(summary.member.id)}
          data-testid={`member-card-${summary.member.id}`}
        >
          <CardContent className="p-6">
            {summary.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">
                  {(summary.userSettings?.displayName ?? '').trim() ||
                    maskEmail(summary.member.email)}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t('export.footerExpectedHours')}:
                    </span>
                    <span className="font-medium">
                      {summary.userSettings
                        ? calculateExpectedMonthlyHours(
                            summary.userSettings,
                          ).toFixed(2)
                        : '0.00'}
                      h
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t('reports.hoursWorked')}:
                    </span>
                    <span className="font-medium">
                      {summary.hoursWorked.toFixed(2)}h
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t('export.footerOvertime')}:
                    </span>
                    <span
                      className={`font-medium ${
                        summary.overtime > 0
                          ? 'text-green-600'
                          : summary.overtime < 0
                            ? 'text-red-600'
                            : ''
                      }`}
                    >
                      {summary.overtime > 0 ? '+' : ''}
                      {summary.overtime.toFixed(2)}h
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t('reports.percentage')}:
                    </span>
                    <span className="font-medium">
                      {summary.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
