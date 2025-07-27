'use client'

import { useState } from 'react'

import { Check, Users, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import type { Subscription, TeamMember } from '@/lib/types'
import { formatAppDate } from '@/lib/utils'
import { assignSeat, unassignSeat } from '@/services/team-service'

interface SeatAssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamId: string
  members: TeamMember[]
  subscription: Subscription | null
  currentUserId: string
  onMembersChange: (members: TeamMember[]) => void
}

export function SeatAssignmentDialog({
  open,
  onOpenChange,
  teamId,
  members,
  subscription,
  currentUserId,
  onMembersChange,
}: SeatAssignmentDialogProps) {
  const { t, language } = useTranslation()
  const { toast } = useToast()
  const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null)

  const totalSeats = subscription?.quantity || 0
  const assignedSeats = members.filter((m) => m.seatAssignment?.isActive).length
  const availableSeats = totalSeats - assignedSeats

  const handleAssignSeat = async (memberId: string) => {
    if (availableSeats <= 0) {
      toast({
        title: t('teams.error'),
        description: t('teams.seatLimitReached'),
        variant: 'destructive',
      })
      return
    }

    setLoadingMemberId(memberId)
    try {
      await assignSeat(teamId, memberId, currentUserId)

      // Refresh members list
      const updatedMembers = members.map((member) =>
        member.id === memberId
          ? {
              ...member,
              seatAssignment: {
                assignedAt: new Date(),
                assignedBy: currentUserId,
                isActive: true,
              },
            }
          : member,
      )
      onMembersChange(updatedMembers)

      toast({
        title: t('teams.seatAssigned'),
        description: t('teams.seatAssignedDescription'),
      })
    } catch {
      toast({
        title: t('teams.error'),
        description: t('teams.seatAssignmentFailed'),
        variant: 'destructive',
      })
    } finally {
      setLoadingMemberId(null)
    }
  }

  const handleUnassignSeat = async (memberId: string) => {
    // Prevent unassigning seats from owners
    const member = members.find((m) => m.id === memberId)
    if (member?.role === 'owner') {
      toast({
        title: t('teams.error'),
        description: t('teams.cannotUnassignOwnerSeat'),
        variant: 'destructive',
      })
      return
    }

    setLoadingMemberId(memberId)
    try {
      await unassignSeat(teamId, memberId, currentUserId)

      // Refresh members list
      const updatedMembers = members.map((member) =>
        member.id === memberId
          ? {
              ...member,
              seatAssignment: {
                assignedAt: new Date(),
                assignedBy: currentUserId,
                isActive: false,
              },
            }
          : member,
      )
      onMembersChange(updatedMembers)

      toast({
        title: t('teams.seatUnassigned'),
        description: t('teams.seatUnassignedDescription'),
      })
    } catch {
      toast({
        title: t('teams.error'),
        description: t('teams.seatUnassignmentFailed'),
        variant: 'destructive',
      })
    } finally {
      setLoadingMemberId(null)
    }
  }

  const hasSeatAssigned = (member: TeamMember) => {
    return member.seatAssignment?.isActive === true
  }

  const canUnassignSeat = (member: TeamMember) => {
    // Owners cannot have their seats unassigned
    return member.role !== 'owner'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('teams.seatAssignment')}
          </DialogTitle>
          <DialogDescription>
            {t('teams.seatAssignmentDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Seat Usage Summary */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {assignedSeats}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('teams.assignedSeats')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {availableSeats}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('teams.availableSeats')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-muted-foreground">
                  {totalSeats}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('teams.totalSeats')}
                </div>
              </div>
            </div>
            {availableSeats <= 0 && (
              <Badge variant="destructive">{t('teams.seatLimitReached')}</Badge>
            )}
          </div>

          {/* Members Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('teams.member')}</TableHead>
                  <TableHead>{t('teams.role')}</TableHead>
                  <TableHead>{t('teams.seatStatus')}</TableHead>
                  <TableHead>{t('teams.assignedDate')}</TableHead>
                  <TableHead className="w-[120px]">
                    {t('teams.actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="font-medium">{member.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {t(`teams.roles.${member.role}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {hasSeatAssigned(member) ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          <Check className="mr-1 h-3 w-3" />
                          {t('teams.seatAssigned')}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          {t('teams.noSeatAssigned')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {member.seatAssignment?.isActive ? (
                        <div className="text-sm text-muted-foreground">
                          {formatAppDate(
                            member.seatAssignment.assignedAt,
                            language,
                            false,
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {hasSeatAssigned(member) ? (
                        canUnassignSeat(member) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnassignSeat(member.id)}
                            disabled={loadingMemberId === member.id}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="mr-1 h-3 w-3" />
                            {t('teams.unassignSeat')}
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {t('teams.ownerSeatRequired')}
                          </span>
                        )
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssignSeat(member.id)}
                          disabled={
                            loadingMemberId === member.id || availableSeats <= 0
                          }
                        >
                          <Check className="mr-1 h-3 w-3" />
                          {t('teams.assignSeat')}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
