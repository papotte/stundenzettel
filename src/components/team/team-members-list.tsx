'use client'

import { useState } from 'react'

import {
  MoreHorizontal,
  Shield,
  ShieldCheck,
  User,
  UserX,
  Users,
} from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import type { Subscription, TeamMember } from '@/lib/types'
import {
  getTeamMembers,
  removeTeamMember,
  updateTeamMemberRole,
} from '@/services/team-service'

import { SeatAssignmentDialog } from './seat-assignment-dialog'

interface TeamMembersListProps {
  teamId: string
  members: TeamMember[]
  currentUserRole: 'owner' | 'admin' | 'member'
  subscription: Subscription | null
  currentUserId: string
  onMembersChange: (members: TeamMember[]) => void
}

export function TeamMembersList({
  teamId,
  members,
  currentUserRole,
  subscription,
  currentUserId,
  onMembersChange,
}: TeamMembersListProps) {
  const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null)
  const [showSeatAssignmentDialog, setShowSeatAssignmentDialog] =
    useState(false)
  const { toast } = useToast()
  const t = useTranslations()
  const format = useFormatter()

  const canManageMembers =
    currentUserRole === 'owner' || currentUserRole === 'admin'

  const canManageSeats = canManageMembers && subscription?.status === 'active'

  const assignedSeats = members.filter((m) => m.seatAssignment?.isActive).length
  const totalSeats = subscription?.quantity || 0

  const handleUpdateRole = async (
    memberId: string,
    newRole: TeamMember['role'],
  ) => {
    setLoadingMemberId(memberId)
    try {
      await updateTeamMemberRole(teamId, memberId, newRole)
      const updatedMembers = await getTeamMembers(teamId)
      onMembersChange(updatedMembers)

      toast({
        title: t('teams.roleUpdated'),
        description: t('teams.roleUpdatedDescription', { role: newRole }),
      })
    } catch (error) {
      toast({
        title: t('teams.error'),
        description:
          error instanceof Error
            ? error.message
            : t('teams.failedToUpdateRole'),
        variant: 'destructive',
      })
    } finally {
      setLoadingMemberId(null)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    setLoadingMemberId(memberId)
    try {
      await removeTeamMember(teamId, memberId)
      const updatedMembers = await getTeamMembers(teamId)
      onMembersChange(updatedMembers)

      toast({
        title: t('teams.memberRemoved'),
        description: t('teams.memberRemovedDescription'),
      })
    } catch (error) {
      toast({
        title: t('teams.error'),
        description:
          error instanceof Error
            ? error.message
            : t('teams.failedToRemoveMember'),
        variant: 'destructive',
      })
    } finally {
      setLoadingMemberId(null)
    }
  }

  const getRoleIcon = (role: TeamMember['role']) => {
    switch (role) {
      case 'owner':
        return <ShieldCheck className="h-4 w-4 text-blue-600" />
      case 'admin':
        return <Shield className="h-4 w-4 text-green-600" />
      case 'member':
        return <User className="h-4 w-4 text-gray-600" />
      default:
        return <User className="h-4 w-4 text-gray-600" />
    }
  }

  const getRoleLabel = (role: TeamMember['role']) => {
    return t(`teams.roles.${role}`)
  }

  const canEditMember = (member: TeamMember) => {
    // Owners can edit everyone except themselves if they're the only owner
    if (currentUserRole === 'owner') {
      return !(
        member.role === 'owner' &&
        members.filter((m) => m.role === 'owner').length === 1
      )
    }

    // Admins can edit members but not owners or other admins
    if (currentUserRole === 'admin') {
      return member.role === 'member'
    }

    // Members can't edit anyone
    return false
  }

  const hasSeatAssigned = (member: TeamMember) => {
    return member.seatAssignment?.isActive === true
  }

  return (
    <div className="space-y-4">
      {/* Seat Assignment Header */}
      {canManageSeats && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="text-sm text-muted-foreground">
              {t('teams.seatsUsed', { used: assignedSeats, total: totalSeats })}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSeatAssignmentDialog(true)}
          >
            <Users className="mr-2 h-4 w-4" />
            {t('teams.seatAssignment')}
          </Button>
        </div>
      )}

      {/* Members Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('teams.member')}</TableHead>
              <TableHead>{t('teams.role')}</TableHead>
              <TableHead>{t('teams.joined')}</TableHead>
              {canManageSeats && <TableHead>{t('teams.seatStatus')}</TableHead>}
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="font-medium">{member.email}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getRoleIcon(member.role)}
                    {getRoleLabel(member.role)}
                  </div>
                </TableCell>
                <TableCell>
                  {format.dateTime(member.joinedAt, 'longNoWeekday')}
                </TableCell>
                {canManageSeats && (
                  <TableCell>
                    {hasSeatAssigned(member) ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        {t('teams.seatAssigned')}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        {t('teams.noSeatAssigned')}
                      </Badge>
                    )}
                  </TableCell>
                )}
                <TableCell>
                  {canManageMembers && canEditMember(member) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          disabled={loadingMemberId === member.id}
                          aria-label={t('teams.memberOptions')}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {currentUserRole === 'owner' &&
                          member.role !== 'owner' && (
                            <>
                              {member.role === 'member' && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateRole(member.id, 'admin')
                                  }
                                >
                                  <Shield className="mr-2 h-4 w-4" />
                                  {t('teams.makeAdmin')}
                                </DropdownMenuItem>
                              )}
                              {member.role === 'admin' && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateRole(member.id, 'member')
                                  }
                                >
                                  <User className="mr-2 h-4 w-4" />
                                  {t('teams.makeMember')}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                            </>
                          )}
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          {t('teams.removeMember')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Seat Assignment Dialog */}
      <SeatAssignmentDialog
        open={showSeatAssignmentDialog}
        onOpenChange={setShowSeatAssignmentDialog}
        teamId={teamId}
        members={members}
        subscription={subscription}
        currentUserId={currentUserId}
        onMembersChange={onMembersChange}
      />
    </div>
  )
}
