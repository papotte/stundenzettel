'use client'

import { useEffect } from 'react'

import { useParams, useSearchParams } from 'next/navigation'

import { TeamMemberReportView } from '@/components/team/team-member-report-view'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { useNow } from '@/hooks/use-now'
import { useTeamPageData } from '@/hooks/use-team'

export default function TeamMemberReportPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()

  const memberId = params.memberId as string
  const monthParam = searchParams.get('month')

  const now = useNow()
  const selectedMonth = monthParam ? new Date(monthParam + '-01') : now

  const { data, isLoading } = useTeamPageData(user)
  const teamId = data?.team?.id ?? null
  const isAuthorized =
    data?.currentUserRole === 'owner' || data?.currentUserRole === 'admin'
  const memberEmail = searchParams.get('email') || memberId

  useEffect(() => {
    // Trigger print when page loads (for PDF export)
    if (!isLoading && isAuthorized && typeof window !== 'undefined') {
      // Wait for content to render before triggering print
      const timer = setTimeout(() => {
        window.print()
        // Close the window after print dialog is closed (optional)
        // window.addEventListener('afterprint', () => window.close())
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isLoading, isAuthorized])

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-white p-4 sm:p-8">
        <div className="mx-auto max-w-7xl">
          <Skeleton className="mb-8 h-10 w-32" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  if (!isAuthorized || !user) {
    return (
      <div className="min-h-screen bg-white p-4 sm:p-8">
        <div className="mx-auto max-w-7xl">
          <p>Unauthorized access</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-4 sm:p-8 print:p-0">
      <div className="mx-auto max-w-7xl">
        <TeamMemberReportView
          teamId={teamId}
          memberId={memberId}
          memberEmail={memberEmail}
          selectedMonth={selectedMonth}
        />
      </div>
    </div>
  )
}
