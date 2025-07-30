import React from 'react'

import { FileSpreadsheet, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
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
import { Tooltip, TooltipContent } from '@/components/ui/tooltip'
import { useTimeTrackerContext } from '@/context/time-tracker-context'

import TimeWiseIcon from './time-wise-icon'
import UserMenu from './user-menu'

interface TimeTrackerHeaderProps {
  showClearData: boolean
}

const TimeTrackerHeader: React.FC<TimeTrackerHeaderProps> = ({
  showClearData,
}) => {
  const t = useTranslations()

  const { handleClearData } = useTimeTrackerContext()

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2">
        <TimeWiseIcon className="h-6 w-6 text-primary" />
        <h1 className="font-headline text-xl font-bold tracking-tight">
          {t('common.appName')}
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
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
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

        <UserMenu />
      </div>
    </header>
  )
}

export default TimeTrackerHeader
