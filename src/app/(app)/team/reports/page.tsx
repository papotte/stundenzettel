'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { addMonths, parse, subMonths } from 'date-fns'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { TeamMemberReportView } from '@/components/team/team-member-report-view'
import { TeamReportsGrid } from '@/components/team/team-reports-grid'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { useTeamPageData } from '@/hooks/use-team'
import { useToast } from '@/hooks/use-toast'
import { useFormatter } from '@/lib/date-formatter'

export default function TeamReportsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations()
  const format = useFormatter()
  const { toast } = useToast()

  const { data, isLoading: queryLoading, isError } = useTeamPageData(user)
  const team = data?.team ?? null
  const members = useMemo(() => data?.members ?? [], [data?.members])
  const isAuthorized = useMemo(
    () =>
      data?.currentUserRole === 'owner' || data?.currentUserRole === 'admin',
    [data?.currentUserRole],
  )
  // Only block the page on the first load; lack of team data afterwards
  // redirects below.
  const isLoading = queryLoading

  // Get month from URL params or default to current month
  const monthParam = searchParams.get('month')
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => {
    if (monthParam) {
      try {
        const parsed = parse(monthParam, 'yyyy-MM', new Date())
        if (!isNaN(parsed.getTime())) {
          return parsed
        }
      } catch {
        // Invalid date, use current month
      }
    }
    return new Date()
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?returnUrl=/team/reports')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user || isLoading) return
    if (isError) {
      toast({
        title: t('common.error'),
        description: t('teams.failedToLoadTeamData'),
        variant: 'destructive',
      })
      router.replace('/team')
      return
    }
    if (!team) {
      router.replace('/team')
      return
    }
    if (!isAuthorized) {
      toast({
        title: t('common.error'),
        description: t('reports.unauthorized'),
        variant: 'destructive',
      })
      router.replace('/team')
    }
  }, [user, isLoading, isError, team, isAuthorized, router, toast, t])

  const selectedMemberId = searchParams.get('memberId')

  const handleMemberClick = useCallback(
    (memberId: string) => {
      const monthStr = format.dateTime(selectedMonth, 'yearMonthISO')
      router.push(`/team/reports?memberId=${memberId}&month=${monthStr}`)
    },
    [selectedMonth, router, format],
  )

  const handleMonthChange = useCallback(
    (newMonth: Date) => {
      setSelectedMonth(newMonth)
      const monthStr = format.dateTime(newMonth, 'yearMonthISO')
      if (selectedMemberId) {
        router.push(
          `/team/reports?memberId=${selectedMemberId}&month=${monthStr}`,
        )
      } else {
        router.push(`/team/reports?month=${monthStr}`)
      }
    },
    [selectedMemberId, router, format],
  )

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-muted p-4 sm:p-8">
        <div className="mx-auto max-w-7xl">
          <Skeleton className="mb-8 h-10 w-32" />
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-96 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!user || !isAuthorized || !team) {
    return null
  }

  const selectedMember = selectedMemberId
    ? members.find((m) => m.id === selectedMemberId)
    : null

  return (
    <div className="min-h-screen bg-muted p-4 pb-20 sm:p-8 md:pb-8">
      <div className="mx-auto max-w-7xl">
        <Button asChild variant="outline" className="mb-8">
          <Link href="/team">
            <ArrowLeft className="mr-2 size-4" />
            {t('settings.backToTeam')}
          </Link>
        </Button>

        <Card className="shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="mb-6 flex flex-col items-center justify-between sm:flex-row">
              <h1 className="text-2xl font-bold">{t('reports.title')}</h1>
              {!selectedMemberId && (
                <div className="mt-4 flex items-center gap-4 sm:mt-0">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      handleMonthChange(subMonths(selectedMonth, 1))
                    }
                    data-testid="reports-previous-month-button"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <h2
                    className="text-xl font-semibold"
                    data-testid="reports-month"
                  >
                    {format.dateTime(selectedMonth, 'monthYear')}
                  </h2>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      handleMonthChange(addMonths(selectedMonth, 1))
                    }
                    data-testid="reports-next-month-button"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              )}
            </div>

            {selectedMember ? (
              <TeamMemberReportView
                teamId={team.id}
                memberId={selectedMember.id}
                memberEmail={selectedMember.email}
                selectedMonth={selectedMonth}
              />
            ) : (
              <TeamReportsGrid
                teamId={team.id}
                members={members}
                selectedMonth={selectedMonth}
                onMemberClick={handleMemberClick}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
