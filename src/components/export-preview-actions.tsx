'use client'

import { isSameMonth } from 'date-fns'
import { Download, Printer, Send } from 'lucide-react'
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useFormatter } from '@/lib/date-formatter'

export interface ExportPreviewActionsProps {
  onExport: () => void | Promise<void>
  onPdfExport: () => void
  onPublish: () => void | Promise<void>
  entries: Array<{ startTime?: Date | null }>
  selectedMonth: Date
  userTeam: { id: string } | null
  publishedAt: Date | null | undefined
  isPublishing: boolean
}

const BUTTON_CLASS = 'w-full min-w-0'
const BUTTON_VARIANT = 'outline' as const

export function ExportPreviewActions({
  onExport,
  onPdfExport,
  onPublish,
  entries,
  selectedMonth,
  userTeam,
  publishedAt,
  isPublishing,
}: ExportPreviewActionsProps) {
  const t = useTranslations()
  const format = useFormatter()

  const hasEntries = entries.length > 0
  const hasEntriesForMonth = entries.some(
    (e) => e.startTime && isSameMonth(e.startTime, selectedMonth),
  )

  const noDataTooltip = (
    <TooltipContent side="top">
      {t('export.noDataHint', {
        defaultValue: 'No data available for export in this month.',
      })}
    </TooltipContent>
  )

  function renderExportButton() {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex">
            <Button
              variant={BUTTON_VARIANT}
              className={BUTTON_CLASS}
              onClick={onExport}
              data-testid="export-preview-export-button"
              disabled={!hasEntries}
            >
              <Download className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">{t('export.exportButton')}</span>
            </Button>
          </span>
        </TooltipTrigger>
        {!hasEntries && noDataTooltip}
      </Tooltip>
    )
  }

  function renderPdfButton() {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex">
            <Button
              variant={BUTTON_VARIANT}
              className={BUTTON_CLASS}
              onClick={onPdfExport}
              data-testid="export-preview-pdf-button"
              disabled={!hasEntries}
            >
              <Printer className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">{t('export.exportPdfButton')}</span>
            </Button>
          </span>
        </TooltipTrigger>
        {!hasEntries && noDataTooltip}
      </Tooltip>
    )
  }

  function renderPublishButton() {
    const publishButtonContent = (
      <Button
        variant="default"
        className={BUTTON_CLASS}
        disabled={!userTeam ? true : isPublishing || !hasEntriesForMonth}
        onClick={userTeam && !publishedAt ? onPublish : undefined}
        data-testid="export-preview-publish-button"
      >
        <Send className="mr-2 h-4 w-4 shrink-0" />
        <span className="truncate">
          {publishedAt ? t('export.publishUpdate') : t('export.publish')}
        </span>
      </Button>
    )

    const tooltipContent = !userTeam
      ? t('export.publishForTeamHint')
      : !hasEntriesForMonth
        ? t('export.noDataHint', {
            defaultValue: 'No data available for export in this month.',
          })
        : null

    if (userTeam && publishedAt) {
      return (
        <AlertDialog>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <span className="flex flex-1">{publishButtonContent}</span>
              </AlertDialogTrigger>
            </TooltipTrigger>
            {tooltipContent && (
              <TooltipContent side="top">{tooltipContent}</TooltipContent>
            )}
          </Tooltip>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('export.publishOverwriteTitle')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('export.publishOverwriteDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={onPublish}
                data-testid="export-preview-publish-overwrite-confirm"
              >
                {t('export.publishOverwriteConfirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex flex-1">{publishButtonContent}</span>
        </TooltipTrigger>
        {tooltipContent && (
          <TooltipContent side="top">{tooltipContent}</TooltipContent>
        )}
      </Tooltip>
    )
  }

  return (
    <div className="mt-4 grid grid-cols-3 gap-x-2 gap-y-1 sm:mt-0">
      <div className="flex min-w-0">{renderExportButton()}</div>
      <div className="flex min-w-0">{renderPdfButton()}</div>
      <div className="flex  min-w-0">{renderPublishButton()}</div>
      {userTeam && publishedAt && (
        <div
          className="col-start-3 flex items-center"
          data-testid="export-preview-published-on"
        >
          <span className="text-muted-foreground text-sm">
            {t('export.publishedOn', {
              date: format.dateTime(publishedAt, 'short'),
            })}
          </span>
        </div>
      )}
    </div>
  )
}
