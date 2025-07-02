'use client'

import { useEffect } from 'react'

import { useRouter } from 'next/navigation'

import TimeTracker from '@/components/time-tracker'
import { useAuth } from '@/hooks/use-auth'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading, router])

  if (loading || !user) {
    // AuthProvider shows a loading screen, so we can return null or a minimal loader here
    return null
  }

  return <TimeTracker />
}
