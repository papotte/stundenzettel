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
import { useToast } from '@/hooks/use-toast'
import { useUserInvitations } from '@/hooks/use-user-invitations'
import type { TeamInvitation } from '@/lib/types'
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
        title: 'Invitation accepted',
        description: 'You have successfully joined the team!',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to accept invitation',
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
        title: 'Invitation declined',
        description: 'The invitation has been declined',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to decline invitation',
        variant: 'destructive',
      })
    } finally {
      setLoadingInvitationId(null)
    }
  }

  const getRoleLabel = (role: TeamInvitation['role']) => {
    return role.charAt(0).toUpperCase() + role.slice(1)
  }

  const isExpired = (expiresAt: Date) => {
    return new Date() > new Date(expiresAt)
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No pending invitations
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Team</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="w-[120px]">Actions</TableHead>
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
                    <span className="font-medium">Team Invitation</span>
                  </div>
                </TableCell>
                <TableCell>{getRoleLabel(invitation.role)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span
                      className={expired ? 'text-red-600' : 'text-amber-600'}
                    >
                      {expired ? 'Expired' : 'Pending'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className={expired ? 'text-red-600' : ''}>
                  {new Date(invitation.expiresAt).toLocaleDateString()}
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
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeclineInvitation(invitation.id)}
                        disabled={loadingInvitationId === invitation.id}
                        className="h-8"
                      >
                        <X className="mr-1 h-3 w-3" />
                        Decline
                      </Button>
                    </div>
                  )}
                  {expired && (
                    <span className="text-sm text-muted-foreground">
                      Expired
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
