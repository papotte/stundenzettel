'use client'

import { useEffect } from 'react'

import { useRouter } from 'next/navigation'

import StatsView from '@/components/stats-view'
import { TimeTrackerProvider } from '@/context/time-tracker-context'
import { useAuth } from '@/hooks/use-auth'

export default function StatsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login?returnUrl=/stats')
    }
  }, [user, loading, router])

  if (loading || !user) {
    return null
  }

  return (
    <TimeTrackerProvider user={user}>
      <div className="min-h-screen bg-muted p-4 sm:p-8 pb-20 md:pb-8">
        <div className="mx-auto max-w-7xl">
          <StatsView />
        </div>
      </div>
    </TimeTrackerProvider>
  )
}
