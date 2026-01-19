'use client'

import { useEffect, useState } from 'react'

import { useParams, useSearchParams } from 'next/navigation'

import { TeamMemberReportView } from '@/components/team/team-member-report-view'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { verifyTeamAccess } from '@/lib/team-auth'
import { getUserTeam } from '@/services/team-service'

export default function TeamMemberReportPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [memberEmail, setMemberEmail] = useState<string>('')

  const memberId = params.memberId as string
  const monthParam = searchParams.get('month')

  const selectedMonth = monthParam ? new Date(monthParam + '-01') : new Date()

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) return

      setIsLoading(true)
      try {
        const userTeam = await getUserTeam(user.uid)
        if (!userTeam) {
          setIsAuthorized(false)
          return
        }

        const authResult = await verifyTeamAccess(
          userTeam.id,
          user.uid,
          'admin',
        )
        setIsAuthorized(authResult.authorized)

        // Get member email from URL or use memberId as fallback
        const emailParam = searchParams.get('email')
        setMemberEmail(emailParam || memberId)
      } catch (error) {
        console.error('Failed to verify access:', error)
        setIsAuthorized(false)
      } finally {
        setIsLoading(false)
      }
    }

    if (!authLoading && user) {
      checkAccess()
    }
  }, [user, authLoading, memberId, searchParams])

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
          memberId={memberId}
          memberEmail={memberEmail}
          selectedMonth={selectedMonth}
        />
      </div>
    </div>
  )
}
