import { useEffect, useState } from 'react'

import { useAuth } from '@/hooks/use-auth'
import type { TeamInvitation } from '@/lib/types'
import { getUserInvitations } from '@/services/team-service'

export function useUserInvitations() {
  const { user } = useAuth()
  const [invitations, setInvitations] = useState<TeamInvitation[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user?.email) {
      setInvitations([])
      return
    }

    const loadInvitations = async () => {
      setLoading(true)
      try {
        const pendingInvitations = await getUserInvitations(user.email)
        setInvitations(pendingInvitations)
      } catch (error) {
        console.error('Error loading user invitations:', error)
        setInvitations([])
      } finally {
        setLoading(false)
      }
    }

    loadInvitations()
  }, [user?.email])

  const refreshInvitations = async () => {
    if (!user?.email) return

    setLoading(true)
    try {
      const pendingInvitations = await getUserInvitations(user.email)
      setInvitations(pendingInvitations)
    } catch (error) {
      console.error('Error refreshing user invitations:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    invitations,
    loading,
    refreshInvitations,
    hasPendingInvitations: invitations.length > 0,
  }
}
