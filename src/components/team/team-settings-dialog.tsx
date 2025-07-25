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

  const canEdit = currentUserRole === 'owner' || currentUserRole === 'admin'

  const handleCopyTeamId = async () => {
    try {
      await navigator.clipboard.writeText(team.id)
      toast({
        title: 'Team ID copied',
        description: 'Team ID has been copied to clipboard',
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to copy Team ID to clipboard',
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
        title: 'Team updated',
        description: 'Team settings have been saved successfully.',
      })

      setOpen(false)
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to update team settings',
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
          <DialogTitle>Team Settings</DialogTitle>
          <DialogDescription>
            {canEdit
              ? 'Update your team information and settings.'
              : 'View your team information and settings.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="team-name">Team Name</Label>
            <Input
              id="team-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEdit}
              placeholder="Enter team name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="team-description">Description</Label>
            <Textarea
              id="team-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canEdit}
              placeholder="Enter team description"
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label>Team ID</Label>
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
                title="Copy Team ID"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Please provide this ID when contacting support for team-related
              issues.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          {canEdit && (
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
