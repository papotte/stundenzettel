'use client'

import { useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { FolderPlus, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { ProjectListItem } from '@/components/project-list-item'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { projectScopeQueryKey, useProjects } from '@/hooks/use-projects'
import { useToast } from '@/hooks/use-toast'
import type { Project } from '@/lib/types'
import {
  type ProjectScope,
  addProject,
  deleteProject,
  updateProject,
} from '@/services/project-service'

interface ProjectsCardProps {
  scope: ProjectScope
  canEdit: boolean
  /** Show a hint that the list is managed by team admins (read-only members). */
  showManagedHint?: boolean
}

export function ProjectsCard({
  scope,
  canEdit,
  showManagedHint,
}: ProjectsCardProps) {
  const t = useTranslations()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { data: projects, isPending } = useProjects(scope)
  const [newName, setNewName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: projectScopeQueryKey(scope) })

  const failToast = (key: string) =>
    toast({
      title: t('common.error'),
      description: t(key),
      variant: 'destructive',
    })

  const handleAdd = async () => {
    const name = newName.trim()
    if (name.length < 2) return
    setIsSaving(true)
    try {
      await addProject(scope, name)
      setNewName('')
      await invalidate()
    } catch {
      failToast('projects.saveFailed')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRename = async (project: Project) => {
    const name = editingName.trim()
    setEditingId(null)
    if (name.length < 2 || name === project.name) return
    if (
      (projects ?? []).some(
        (p) =>
          p.id !== project.id && p.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      failToast('projects.duplicateError')
      return
    }
    try {
      await updateProject(scope, project.id, { name })
      await invalidate()
    } catch {
      failToast('projects.saveFailed')
    }
  }

  const handleToggleArchived = async (project: Project) => {
    try {
      await updateProject(scope, project.id, {
        archived: !(project.archived ?? false),
      })
      await invalidate()
    } catch {
      failToast('projects.saveFailed')
    }
  }

  const handleDelete = async (project: Project) => {
    try {
      await deleteProject(scope, project.id)
      await invalidate()
    } catch {
      failToast('projects.deleteFailed')
    }
  }

  let projectsContent: React.ReactNode
  if (isPending) {
    projectsContent = (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  } else if (!projects || projects.length === 0) {
    projectsContent = (
      <p className="text-sm text-muted-foreground">{t('projects.empty')}</p>
    )
  } else {
    projectsContent = (
      <ul className="divide-y divide-border">
        {projects.map((project) => (
          <ProjectListItem
            key={project.id}
            project={project}
            canEdit={canEdit}
            isEditing={editingId === project.id}
            editingName={editingName}
            onEditingNameChange={setEditingName}
            onStartEdit={() => {
              setEditingId(project.id)
              setEditingName(project.name)
            }}
            onCancelEdit={() => setEditingId(null)}
            onRename={() => void handleRename(project)}
            onToggleArchived={() => void handleToggleArchived(project)}
            onDelete={() => void handleDelete(project)}
          />
        ))}
      </ul>
    )
  }

  return (
    <Card data-testid="projects-card">
      <CardHeader>
        <CardTitle>{t('projects.title')}</CardTitle>
        <CardDescription>
          {showManagedHint
            ? t('projects.teamManagedHint')
            : t('projects.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {canEdit && (
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('projects.namePlaceholder')}
              aria-label={t('projects.nameLabel')}
              minLength={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void handleAdd()
                }
              }}
              data-testid="project-name-input"
            />
            <Button
              type="button"
              onClick={() => void handleAdd()}
              disabled={isSaving || newName.trim().length < 2}
              data-testid="add-project-button"
            >
              {isSaving ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <FolderPlus className="mr-2 size-4" />
              )}
              {t('projects.addButton')}
            </Button>
          </div>
        )}

        {projectsContent}
      </CardContent>
    </Card>
  )
}
