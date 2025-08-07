'use client'

import { useState } from 'react'

import { Clock, Mail, MoreHorizontal, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { useFormatter } from '@/lib/date-formatter'
import type { TeamInvitation } from '@/lib/types'
import {
  createTeamInvitation,
  declineTeamInvitation,
} from '@/services/team-service'

interface TeamInvitationsListProps {
  invitations: TeamInvitation[]
  onInvitationsChange: (invitations: TeamInvitation[]) => void
}

export function TeamInvitationsList({
  invitations,
  onInvitationsChange,
}: TeamInvitationsListProps) {
  const [loadingInvitationId, setLoadingInvitationId] = useState<string | null>(
    null,
  )
  const { toast } = useToast()
  const t = useTranslations()
  const format = useFormatter()

  const handleCancelInvitation = async (invitationId: string) => {
    setLoadingInvitationId(invitationId)
    try {
      await declineTeamInvitation(invitationId)

      // Remove the invitation from the list
      const updatedInvitations = invitations.filter(
        (inv) => inv.id !== invitationId,
      )
      onInvitationsChange(updatedInvitations)

      toast({
        title: t('teams.invitationCancelled'),
        description: t('teams.invitationCancelledDescription'),
      })
    } catch (error) {
      toast({
        title: t('common.error'),
        description:
          error instanceof Error
            ? error.message
            : t('teams.failedToCancelInvitation'),
        variant: 'destructive',
      })
    } finally {
      setLoadingInvitationId(null)
    }
  }

  const handleResendInvitation = async (invitation: TeamInvitation) => {
    setLoadingInvitationId(invitation.id)
    try {
      // Cancel the old invitation first
      await declineTeamInvitation(invitation.id)

      // Create a new invitation
      const newInvitationId = await createTeamInvitation(
        invitation.teamId,
        invitation.email,
        invitation.role,
        invitation.invitedBy,
      )

      // Update the invitation in the list
      const updatedInvitations = invitations.map((inv) =>
        inv.id === invitation.id
          ? {
              ...inv,
              id: newInvitationId,
              invitedAt: new Date(),
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            }
          : inv,
      )
      onInvitationsChange(updatedInvitations)

      toast({
        title: t('teams.invitationResent'),
        description: t('teams.invitationResentDescription', {
          email: invitation.email,
        }),
      })
    } catch (error) {
      toast({
        title: t('common.error'),
        description:
          error instanceof Error
            ? error.message
            : t('teams.failedToResendInvitation'),
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
            <TableHead>{t('teams.emailAddress')}</TableHead>
            <TableHead>{t('teams.role')}</TableHead>
            <TableHead>{t('teams.status')}</TableHead>
            <TableHead>{t('teams.expires')}</TableHead>
            <TableHead className="w-[70px]"></TableHead>
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
                    <span className="font-medium">{invitation.email}</span>
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
                  {format.dateTime(invitation.expiresAt, 'longNoWeekday')}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        disabled={loadingInvitationId === invitation.id}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleResendInvitation(invitation)}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        {t('teams.resendInvitation')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleCancelInvitation(invitation.id)}
                      >
                        <X className="mr-2 h-4 w-4" />
                        {t('teams.cancelInvitation')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
