'use client'

import { useEffect, useState } from 'react'

import { ArrowLeft, Check, Clock, Mail, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { useUserInvitations } from '@/hooks/use-user-invitations'
import { useFormatter } from '@/lib/date-formatter'
import type { Team, TeamInvitation } from '@/lib/types'
import {
  acceptTeamInvitation,
  declineTeamInvitation,
  getTeam,
  getTeamInvitation,
} from '@/services/team-service'

export default function InvitationPage() {
  const params = useParams()
  const invitationId = params.invitationId as string
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const t = useTranslations()
  const { toast } = useToast()
  const format = useFormatter().dateTime
  const { refreshInvitations } = useUserInvitations()

  const [loading, setLoading] = useState(true)
  const [invitation, setInvitation] = useState<TeamInvitation | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const loadInvitation = async () => {
      if (!invitationId) {
        setError('Invalid invitation link')
        setLoading(false)
        return
      }

      try {
        const inv = await getTeamInvitation(invitationId)

        if (!inv) {
          setError('Invitation not found')
          setLoading(false)
          return
        }

        // Check if invitation is expired
        if (new Date() > new Date(inv.expiresAt)) {
          setError('expired')
          setInvitation(inv)
          setLoading(false)
          return
        }

        // Check if invitation status is not pending
        if (inv.status !== 'pending') {
          setError('alreadyProcessed')
          setInvitation(inv)
          setLoading(false)
          return
        }

        // Load team details
        const teamData = await getTeam(inv.teamId)
        setTeam(teamData)
        setInvitation(inv)
        setLoading(false)
      } catch (err) {
        console.error('Error loading invitation:', err)
        setError('Failed to load invitation')
        setLoading(false)
      }
    }

    loadInvitation()
  }, [invitationId])

  const handleAccept = async () => {
    if (!invitation || !user) return

    // Check if user email matches invitation email
    if (user.email !== invitation.email) {
      toast({
        title: t('common.error'),
        description: t('teams.invitationEmailMismatch'),
        variant: 'destructive',
      })
      return
    }

    setProcessing(true)
    try {
      await acceptTeamInvitation(invitation.id, user.uid, user.email)

      // Refresh global invitations state
      await refreshInvitations()

      toast({
        title: t('teams.invitationAccepted'),
        description: t('teams.invitationAcceptedDescription'),
      })

      // Redirect to team page
      router.push('/team')
    } catch (err) {
      toast({
        title: t('common.error'),
        description:
          err instanceof Error
            ? err.message
            : t('teams.failedToAcceptInvitation'),
        variant: 'destructive',
      })
      setProcessing(false)
    }
  }

  const handleDecline = async () => {
    if (!invitation) return

    setProcessing(true)
    try {
      await declineTeamInvitation(invitation.id)

      // Refresh global invitations state
      await refreshInvitations()

      toast({
        title: t('teams.invitationDeclined'),
        description: t('teams.invitationDeclinedDescription'),
      })

      // Redirect to team page
      router.push('/team')
    } catch (err) {
      toast({
        title: t('common.error'),
        description:
          err instanceof Error
            ? err.message
            : t('teams.failedToDeclineInvitation'),
        variant: 'destructive',
      })
      setProcessing(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-muted p-4 sm:p-8">
        <div className="mx-auto max-w-2xl">
          <Skeleton className="mb-8 h-10 w-32" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-muted p-4 sm:p-8">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>{t('teams.teamInvitation')}</CardTitle>
              <CardDescription>
                {t('teams.loginToAcceptInvitation')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button asChild>
                  <Link href="/login">{t('login.signInButton')}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/">{t('common.home')}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error && error !== 'expired' && error !== 'alreadyProcessed') {
    return (
      <div className="min-h-screen bg-muted p-4 sm:p-8">
        <div className="mx-auto max-w-2xl">
          <Button asChild variant="outline" className="mb-8">
            <Link href="/team">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('settings.backToTeam')}
            </Link>
          </Button>
          <Card>
            <CardHeader>
              <CardTitle>{t('common.error')}</CardTitle>
              <CardDescription>
                {error === 'Invalid invitation link'
                  ? t('teams.invalidInvitationLink')
                  : error === 'Invitation not found'
                    ? t('teams.invitationNotFound')
                    : error}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/team">{t('teams.goToTeamPage')}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const isExpired = error === 'expired'
  const isAlreadyProcessed = error === 'alreadyProcessed'

  return (
    <div className="min-h-screen bg-muted p-4 sm:p-8 pb-20 md:pb-8">
      <div className="mx-auto max-w-2xl">
        <Button asChild variant="outline" className="mb-8">
          <Link href="/team">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('settings.backToTeam')}
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {t('teams.teamInvitation')}
            </CardTitle>
            <CardDescription>
              {isExpired
                ? t('teams.invitationExpiredDescription')
                : isAlreadyProcessed
                  ? t('teams.invitationAlreadyProcessed')
                  : t('teams.reviewInvitationDetails')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {invitation && team && (
              <div className="space-y-4">
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        {t('teams.team')}
                      </p>
                      <p className="font-semibold">{team.name}</p>
                      {team.description && (
                        <p className="text-sm text-muted-foreground">
                          {team.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        {t('teams.role')}
                      </p>
                      <p className="font-medium">
                        {t(`teams.roles.${invitation.role}`)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        {t('teams.invitedTo')}
                      </p>
                      <p className="font-medium">{invitation.email}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {isExpired ? (
                          <span className="text-red-600">
                            {t('teams.expiredOn')}{' '}
                            {format(invitation.expiresAt, 'longNoWeekday')}
                          </span>
                        ) : (
                          <>
                            {t('teams.expiresOn')}{' '}
                            {format(invitation.expiresAt, 'longNoWeekday')}
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {user.email !== invitation.email && (
                  <div className="rounded-lg border border-amber-500 bg-amber-50 dark:bg-amber-950/20 p-4">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      {t('teams.invitationEmailWarning', {
                        invitedEmail: invitation.email,
                        currentEmail: user.email,
                      })}
                    </p>
                  </div>
                )}

                {!isExpired && !isAlreadyProcessed && (
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={handleAccept}
                      disabled={
                        processing || user.email !== invitation.email
                      }
                      className="flex-1"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      {t('teams.acceptInvitation')}
                    </Button>
                    <Button
                      onClick={handleDecline}
                      disabled={processing}
                      variant="outline"
                      className="flex-1"
                    >
                      <X className="mr-2 h-4 w-4" />
                      {t('teams.declineInvitation')}
                    </Button>
                  </div>
                )}

                {(isExpired || isAlreadyProcessed) && (
                  <div className="pt-2">
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/team">{t('teams.goToTeamPage')}</Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
