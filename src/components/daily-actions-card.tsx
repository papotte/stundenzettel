import React from 'react'

import { BedDouble, Hourglass, Landmark, Plane } from 'lucide-react'
import { useTranslations } from 'next-intl'

import PaywallWrapper from '@/components/paywall-wrapper'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useTimeTrackerContext } from '@/context/time-tracker-context'

const DailyActionsCard: React.FC = () => {
  const t = useTranslations()

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
        <PaywallWrapper 
          feature="specialEntries"
          title={t('paywall.specialEntries.title')}
          description={t('paywall.specialEntries.description')}
          className="grid grid-cols-2 gap-4 md:grid-cols-4"
          fallback={
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Button disabled variant="outline">
                <BedDouble className="mr-2 h-4 w-4" />
                {t('special_locations.SICK_LEAVE')}
              </Button>
              <Button disabled variant="outline">
                <Plane className="mr-2 h-4 w-4" />
                {t('special_locations.PTO')}
              </Button>
              <Button disabled variant="outline">
                <Landmark className="mr-2 h-4 w-4" />
                {t('special_locations.BANK_HOLIDAY')}
              </Button>
              <Button disabled variant="outline">
                <Hourglass className="mr-2 h-4 w-4" />
                {t('special_locations.TIME_OFF_IN_LIEU')}
              </Button>
            </div>
          }
        >
          <Button
            onClick={() => handleAddSpecialEntry('SICK_LEAVE')}
            variant="outline"
          >
            <BedDouble className="mr-2 h-4 w-4" />{' '}
            {t('special_locations.SICK_LEAVE')}
          </Button>
          <Button onClick={() => handleAddSpecialEntry('PTO')} variant="outline">
            <Plane className="mr-2 h-4 w-4" /> {t('special_locations.PTO')}
          </Button>
          <Button
            onClick={() => handleAddSpecialEntry('BANK_HOLIDAY')}
            variant="outline"
          >
            <Landmark className="mr-2 h-4 w-4" />{' '}
            {t('special_locations.BANK_HOLIDAY')}
          </Button>
          <Button
            onClick={() => handleAddSpecialEntry('TIME_OFF_IN_LIEU')}
            variant="outline"
          >
            <Hourglass className="mr-2 h-4 w-4" />{' '}
            {t('special_locations.TIME_OFF_IN_LIEU')}
          </Button>
        </PaywallWrapper>
      </CardContent>
    </Card>
  )
}

export default DailyActionsCard
