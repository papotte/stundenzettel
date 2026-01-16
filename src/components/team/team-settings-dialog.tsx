'use client'

import { useState } from 'react'

import { Copy } from 'lucide-react'
import { useTranslations } from 'next-intl'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import type { Team } from '@/lib/types'
import { deleteTeam, updateTeam } from '@/services/team-service'

interface TeamSettingsDialogProps {
  team: Team
  currentUserRole: 'owner' | 'admin' | 'member'
  onTeamUpdated?: (updatedTeam: Team) => void
  onTeamDeleted?: () => void
  children: React.ReactNode
}

export function TeamSettingsDialog({
  team,
  currentUserRole,
  onTeamUpdated,
  onTeamDeleted,
  children,
}: TeamSettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(team.name)
  const [description, setDescription] = useState(team.description || '')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const { toast } = useToast()
  const t = useTranslations()

  // Team settings are owner-only (see docs/TEAM_AND_SUBSCRIPTION.md permission matrix)
  const canEdit = currentUserRole === 'owner'
  const canDelete = currentUserRole === 'owner'

  const handleCopyTeamId = async () => {
    try {
      await navigator.clipboard.writeText(team.id)
      toast({
        title: t('teams.teamIdCopied'),
        description: t('teams.teamIdCopiedDescription'),
      })
    } catch {
      toast({
        title: t('common.error'),
        description: t('teams.teamIdCopyError'),
        variant: 'destructive',
      })
    }
  }

  const handleSave = async () => {
    if (!canEdit) return

    setLoading(true)
    try {
      await updateTeam(team.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      })

      const updatedTeam: Team = {
        ...team,
        name: name.trim(),
        description: description.trim() || undefined,
        updatedAt: new Date(),
      }

      onTeamUpdated?.(updatedTeam)

      toast({
        title: t('teams.teamUpdated'),
        description: t('teams.teamUpdatedDescription'),
      })

      setOpen(false)
    } catch (error) {
      toast({
        title: t('common.error'),
        description:
          error instanceof Error
            ? error.message
            : t('teams.failedToUpdateTeamSettings'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset form to original values
    setName(team.name)
    setDescription(team.description || '')
    setDeleteConfirm('')
    setDeleteDialogOpen(false)
    setOpen(false)
  }

  const handleDeleteTeam = async () => {
    if (!canDelete) return

    setDeleteLoading(true)
    try {
      await deleteTeam(team.id)

      toast({
        title: t('teams.teamDeleted'),
        description: t('teams.teamDeletedDescription', { name: team.name }),
      })

      onTeamDeleted?.()
      setDeleteDialogOpen(false)
      setOpen(false)
      setDeleteConfirm('')
    } catch (error) {
      toast({
        title: t('common.error'),
        description:
          error instanceof Error
            ? error.message
            : t('teams.failedToDeleteTeam'),
        variant: 'destructive',
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('teams.settings')}</DialogTitle>
          <DialogDescription>
            {canEdit
              ? t('teams.settingsDescription')
              : t('teams.settingsViewDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="team-name">{t('teams.teamName')}</Label>
            <Input
              id="team-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEdit}
              placeholder={t('teams.teamNamePlaceholder')}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="team-description">{t('teams.description')}</Label>
            <Textarea
              id="team-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canEdit}
              placeholder={t('teams.descriptionPlaceholder')}
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label>{t('teams.teamId')}</Label>
            <div className="relative">
              <Input
                value={team.id}
                disabled
                className="font-mono text-sm pr-10"
              />
              <Button
                type="button"
                variant="link"
                size="icon"
                onClick={handleCopyTeamId}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                title={t('teams.teamId')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('teams.teamIdDescription')}
            </p>
          </div>

          {canDelete && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
              <div className="mb-3">
                <p className="text-sm font-medium text-destructive">
                  {t('teams.dangerZone')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('teams.deleteTeamWarning')}
                </p>
              </div>

              <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={deleteLoading}>
                    {t('teams.deleteTeam')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t('teams.deleteTeamTitle')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('teams.deleteTeamDescription')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <div className="grid gap-2">
                    <Label htmlFor="delete-team-confirm">
                      {t('teams.deleteTeamConfirmLabel', { name: team.name })}
                    </Label>
                    <Input
                      id="delete-team-confirm"
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      placeholder={team.name}
                      autoComplete="off"
                    />
                  </div>

                  <AlertDialogFooter>
                    <AlertDialogCancel
                      onClick={() => setDeleteConfirm('')}
                      disabled={deleteLoading}
                    >
                      {t('common.cancel')}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={(e) => {
                        // Prevent Radix from auto-closing; we close explicitly on success.
                        e.preventDefault()
                        void handleDeleteTeam()
                      }}
                      disabled={
                        deleteLoading || deleteConfirm.trim() !== team.name
                      }
                    >
                      {deleteLoading
                        ? t('common.loading')
                        : t('teams.deleteTeam')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {t('common.cancel')}
          </Button>
          {canEdit && (
            <Button onClick={handleSave} disabled={loading}>
              {loading ? t('common.saving') : t('common.save')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
