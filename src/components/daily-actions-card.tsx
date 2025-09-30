import React from 'react'

import { BedDouble, Hourglass, Landmark, Plane } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useTimeTrackerContext } from '@/context/time-tracker-context'
import { usePaywall } from '@/hooks/use-paywall'

const DailyActionsCard: React.FC = () => {
  const t = useTranslations()
  const { canAccess } = usePaywall()

  const { selectedDate, handleAddSpecialEntry, formattedSelectedDate } =
    useTimeTrackerContext()

  return (
    <Card className="shadow-lg" data-testid="daily-actions-card">
      <CardHeader>
        <CardTitle>{t('tracker.dailyActionsTitle')}</CardTitle>
        <CardDescription>
          {selectedDate
            ? t('tracker.dailyActionsDescription', {
                date: formattedSelectedDate,
              })
            : t('common.loading')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Button
            onClick={() => handleAddSpecialEntry('SICK_LEAVE')}
            variant="outline"
            disabled={!canAccess('specialEntries')}
          >
            <BedDouble className="mr-2 h-4 w-4" />{' '}
            {t('special_locations.SICK_LEAVE')}
          </Button>
          <Button 
            onClick={() => handleAddSpecialEntry('PTO')} 
            variant="outline"
            disabled={!canAccess('specialEntries')}
          >
            <Plane className="mr-2 h-4 w-4" /> {t('special_locations.PTO')}
          </Button>
          <Button
            onClick={() => handleAddSpecialEntry('BANK_HOLIDAY')}
            variant="outline"
            disabled={!canAccess('specialEntries')}
          >
            <Landmark className="mr-2 h-4 w-4" />{' '}
            {t('special_locations.BANK_HOLIDAY')}
          </Button>
          <Button
            onClick={() => handleAddSpecialEntry('TIME_OFF_IN_LIEU')}
            variant="outline"
            disabled={!canAccess('specialEntries')}
          >
            <Hourglass className="mr-2 h-4 w-4" />{' '}
            {t('special_locations.TIME_OFF_IN_LIEU')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default DailyActionsCard
