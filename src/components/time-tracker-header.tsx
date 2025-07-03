import React from 'react'

import { Cog, FileSpreadsheet, LogOut, Trash2 } from 'lucide-react'
import Link from 'next/link'

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
import { useTranslation } from '@/context/i18n-context'
import { useTimeTrackerContext } from '@/context/time-tracker-context'

import TimeWiseIcon from './time-wise-icon'

interface TimeTrackerHeaderProps {
  showClearData: boolean
}

const TimeTrackerHeader: React.FC<TimeTrackerHeaderProps> = ({
  showClearData,
}) => {
  const { t } = useTranslation()
  const { handleClearData, handleSignOut } = useTimeTrackerContext()
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2">
        <TimeWiseIcon className="h-6 w-6 text-primary" />
        <h1 className="font-headline text-xl font-bold tracking-tight">
          {t('login.title')}
        </h1>
      </div>
      <div
        className="ml-auto flex items-center gap-2"
        role="navigation"
        aria-label="Top navigation"
      >
        <Button asChild variant="outline" className="hidden md:flex">
          <Link href="/export">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {t('tracker.headerExportLink')}
          </Link>
        </Button>
        {showClearData && (
          <AlertDialog>
            <Tooltip>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="icon"
                  data-testid="clear-data-btn"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">
                    {t('tracker.headerClearDataTooltip')}
                  </span>
                </Button>
              </AlertDialogTrigger>
              <TooltipContent>
                <p>{t('tracker.headerClearDataTooltip')}</p>
              </TooltipContent>
            </Tooltip>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t('tracker.clearDataAlertTitle')}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t('tracker.clearDataAlertDescription')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {t('tracker.clearDataAlertCancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearData}
                  className="bg-destructive hover:bg-destructive/90"
                  data-testid="clear-data-confirm-btn"
                >
                  {t('tracker.clearDataAlertConfirm')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="hidden md:flex"
            >
              <Link href="/settings">
                <Cog className="h-4 w-4" />
                <span className="sr-only">
                  {t('tracker.headerSettingsTooltip')}
                </span>
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('tracker.headerSettingsTooltip')}</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              data-testid="sign-out-btn"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">
                {t('tracker.headerSignOutTooltip')}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('tracker.headerSignOutTooltip')}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  )
}

export default TimeTrackerHeader
