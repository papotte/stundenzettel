'use client'

import { useState } from 'react'

import { MoreHorizontal, Shield, ShieldCheck, User, UserX } from 'lucide-react'

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
import { useTranslation } from '@/context/i18n-context'
import { useToast } from '@/hooks/use-toast'
import type { TeamMember } from '@/lib/types'
import {
  getTeamMembers,
  removeTeamMember,
  updateTeamMemberRole,
} from '@/services/team-service'

interface TeamMembersListProps {
  teamId: string
  members: TeamMember[]
  currentUserRole: 'owner' | 'admin' | 'member'
  onMembersChange: (members: TeamMember[]) => void
}

export function TeamMembersList({
  teamId,
  members,
  currentUserRole,
  onMembersChange,
}: TeamMembersListProps) {
  const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null)
  const { toast } = useToast()
  const { t } = useTranslation()

  const canManageMembers =
    currentUserRole === 'owner' || currentUserRole === 'admin'

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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('teams.member')}</TableHead>
            <TableHead>{t('teams.role')}</TableHead>
            <TableHead>{t('teams.joined')}</TableHead>
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
                {new Date(member.joinedAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {canManageMembers && canEditMember(member) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        disabled={loadingMemberId === member.id}
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
  )
}
