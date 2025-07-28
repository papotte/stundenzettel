import React from 'react'

import { BarChart } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useTranslation } from '@/hooks/use-translation-compat'
import { useTimeTrackerContext } from '@/context/time-tracker-context'
import { formatHoursAndMinutes } from '@/lib/utils'

const SummaryCard: React.FC = () => {
  const { t } = useTranslation()
  const { dailyTotal, weeklyTotal, monthlyTotal } = useTimeTrackerContext()

  return (
    <Card className="shadow-lg" data-testid="summary-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart className="h-5 w-5 text-primary" />
          <CardTitle>{t('tracker.summaryTitle')}</CardTitle>
        </div>
        <CardDescription>{t('tracker.summaryDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 text-center sm:grid-cols-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {t('tracker.summaryDay')}
            </p>
            <p className="text-2xl font-bold">
              {formatHoursAndMinutes(dailyTotal)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {t('tracker.summaryWeek')}
            </p>
            <p className="text-2xl font-bold">
              {formatHoursAndMinutes(weeklyTotal)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {t('tracker.summaryMonth')}
            </p>
            <p className="text-2xl font-bold">
              {formatHoursAndMinutes(monthlyTotal)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default SummaryCard
