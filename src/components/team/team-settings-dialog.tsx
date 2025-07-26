'use client'

import { useState } from 'react'

import { Copy } from 'lucide-react'

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
import { useTranslation } from '@/context/i18n-context'
import { useToast } from '@/hooks/use-toast'
import type { Team } from '@/lib/types'
import { updateTeam } from '@/services/team-service'

interface TeamSettingsDialogProps {
  team: Team
  currentUserRole: 'owner' | 'admin' | 'member'
  onTeamUpdated?: (updatedTeam: Team) => void
  children: React.ReactNode
}

export function TeamSettingsDialog({
  team,
  currentUserRole,
  onTeamUpdated,
  children,
}: TeamSettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(team.name)
  const [description, setDescription] = useState(team.description || '')
  const { toast } = useToast()
  const { t } = useTranslation()

  const canEdit = currentUserRole === 'owner' || currentUserRole === 'admin'

  const handleCopyTeamId = async () => {
    try {
      await navigator.clipboard.writeText(team.id)
      toast({
        title: t('teams.teamIdCopied'),
        description: t('teams.teamIdCopiedDescription'),
      })
    } catch {
      toast({
        title: t('teams.error'),
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
        title: t('teams.error'),
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
    setOpen(false)
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {t('common.cancel')}
          </Button>
          {canEdit && (
            <Button onClick={handleSave} disabled={loading}>
              {loading ? t('teams.saving') : t('teams.saveChanges')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
