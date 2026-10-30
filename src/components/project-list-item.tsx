'use client'

import { Archive, ArchiveRestore, Check, Pencil, Trash2, X } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Project } from '@/lib/types'

interface ProjectListItemProps {
  project: Project
  canEdit: boolean
  isEditing: boolean
  editingName: string
  onEditingNameChange: (name: string) => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onRename: () => void
  onToggleArchived: () => void
  onDelete: () => void
}

export function ProjectListItem({
  project,
  canEdit,
  isEditing,
  editingName,
  onEditingNameChange,
  onStartEdit,
  onCancelEdit,
  onRename,
  onToggleArchived,
  onDelete,
}: ProjectListItemProps) {
  const t = useTranslations()
  const ArchiveIcon = project.archived ? ArchiveRestore : Archive
  const archiveLabel = project.archived
    ? t('projects.unarchive')
    : t('projects.archive')

  return (
    <li
      className="flex items-center justify-between gap-2 py-2"
      data-testid={`project-row-${project.id}`}
    >
      {isEditing ? (
        <div className="flex flex-1 items-center gap-2">
          <Input
            value={editingName}
            onChange={(e) => onEditingNameChange(e.target.value)}
            minLength={2}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onRename()
              } else if (e.key === 'Escape') {
                onCancelEdit()
              }
            }}
            data-testid="project-rename-input"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={onRename}
            disabled={editingName.trim().length < 2}
          >
            <Check className="size-4" />
            <span className="sr-only">{t('common.save')}</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={onCancelEdit}>
            <X className="size-4" />
            <span className="sr-only">{t('common.cancel')}</span>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium">{project.name}</span>
            {project.archived && (
              <Badge variant="secondary">{t('projects.archivedBadge')}</Badge>
            )}
          </div>
          {canEdit && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={onStartEdit}
                data-testid={`project-rename-${project.id}`}
              >
                <Pencil className="size-4" />
                <span className="sr-only">{t('projects.rename')}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleArchived}
                data-testid={`project-archive-${project.id}`}
              >
                <ArchiveIcon className="size-4" />
                <span className="sr-only">{archiveLabel}</span>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    data-testid={`project-delete-${project.id}`}
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">{t('projects.delete')}</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t('projects.deleteConfirmTitle')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('projects.deleteConfirmDescription', {
                        name: project.name,
                      })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onDelete}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {t('projects.delete')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </>
      )}
    </li>
  )
}
