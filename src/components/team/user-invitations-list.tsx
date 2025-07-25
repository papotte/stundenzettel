'use client'

import { useState } from 'react'

import { Check, Clock, Mail, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useTranslation } from '@/context/i18n-context'
import { useToast } from '@/hooks/use-toast'
import { useUserInvitations } from '@/hooks/use-user-invitations'
import type { TeamInvitation } from '@/lib/types'
import { formatAppDate } from '@/lib/utils'
import {
  acceptTeamInvitation,
  declineTeamInvitation,
} from '@/services/team-service'

interface UserInvitationsListProps {
  invitations: TeamInvitation[]
  onInvitationsChange: (invitations: TeamInvitation[]) => void
  onInvitationAccepted?: () => void
  currentUserEmail: string
  currentUserId: string
}

export function UserInvitationsList({
  invitations,
  onInvitationsChange,
  onInvitationAccepted,
  currentUserEmail,
  currentUserId,
}: UserInvitationsListProps) {
  const [loadingInvitationId, setLoadingInvitationId] = useState<string | null>(
    null,
  )
  const { toast } = useToast()
  const { t, language } = useTranslation()
  const { refreshInvitations } = useUserInvitations()

  const handleAcceptInvitation = async (invitation: TeamInvitation) => {
    setLoadingInvitationId(invitation.id)
    try {
      await acceptTeamInvitation(invitation.id, currentUserId, currentUserEmail)

      // Remove the invitation from the list
      const updatedInvitations = invitations.filter(
        (inv) => inv.id !== invitation.id,
      )
      onInvitationsChange(updatedInvitations)

      // Refresh global invitations state
      await refreshInvitations()

      // Notify parent component that invitation was accepted
      onInvitationAccepted?.()

      toast({
        title: t('teams.invitationAccepted'),
        description: t('teams.invitationAcceptedDescription'),
      })
    } catch (error) {
      toast({
        title: t('teams.error'),
        description:
          error instanceof Error
            ? error.message
            : t('teams.failedToAcceptInvitation'),
        variant: 'destructive',
      })
    } finally {
      setLoadingInvitationId(null)
    }
  }

  const handleDeclineInvitation = async (invitationId: string) => {
    setLoadingInvitationId(invitationId)
    try {
      await declineTeamInvitation(invitationId)

      // Remove the invitation from the list
      const updatedInvitations = invitations.filter(
        (inv) => inv.id !== invitationId,
      )
      onInvitationsChange(updatedInvitations)

      // Refresh global invitations state
      await refreshInvitations()

      toast({
        title: t('teams.invitationDeclined'),
        description: t('teams.invitationDeclinedDescription'),
      })
    } catch (error) {
      toast({
        title: t('teams.error'),
        description:
          error instanceof Error
            ? error.message
            : t('teams.failedToDeclineInvitation'),
        variant: 'destructive',
      })
    } finally {
      setLoadingInvitationId(null)
    }
  }

  const getRoleLabel = (role: TeamInvitation['role']) => {
    return t(`teams.roles.${role}`)
  }

  const isExpired = (expiresAt: Date) => {
    return new Date() > new Date(expiresAt)
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        {t('teams.noPendingInvitations')}
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('teams.team')}</TableHead>
            <TableHead>{t('teams.role')}</TableHead>
            <TableHead>{t('teams.status')}</TableHead>
            <TableHead>{t('teams.expires')}</TableHead>
            <TableHead className="w-[120px]">{t('teams.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.map((invitation) => {
            const expired = isExpired(invitation.expiresAt)

            return (
              <TableRow key={invitation.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {t('teams.teamInvitation')}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{getRoleLabel(invitation.role)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span
                      className={expired ? 'text-red-600' : 'text-amber-600'}
                    >
                      {expired ? t('teams.expired') : t('teams.pending')}
                    </span>
                  </div>
                </TableCell>
                <TableCell className={expired ? 'text-red-600' : ''}>
                  {formatAppDate(
                    new Date(invitation.expiresAt),
                    language,
                    false,
                  )}
                </TableCell>
                <TableCell>
                  {!expired && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptInvitation(invitation)}
                        disabled={loadingInvitationId === invitation.id}
                        className="h-8"
                      >
                        <Check className="mr-1 h-3 w-3" />
                        {t('teams.accept')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeclineInvitation(invitation.id)}
                        disabled={loadingInvitationId === invitation.id}
                        className="h-8"
                      >
                        <X className="mr-1 h-3 w-3" />
                        {t('teams.decline')}
                      </Button>
                    </div>
                  )}
                  {expired && (
                    <span className="text-sm text-muted-foreground">
                      {t('teams.expired')}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
