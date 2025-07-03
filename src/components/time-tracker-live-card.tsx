import React from 'react'

import { Loader2, MapPin, Pause, Play } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useTranslation } from '@/context/i18n-context'
import { useTimeTrackerContext } from '@/context/time-tracker-context'
import { formatDuration } from '@/lib/utils'

const TimeTrackerLiveCard: React.FC = () => {
  const { t } = useTranslation()
  const {
    runningTimer,
    elapsedTime,
    location,
    setLocation,
    isFetchingLocation,
    handleGetCurrentLocation,
    handleStartTimer,
    handleStopTimer,
  } = useTimeTrackerContext()

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>{t('tracker.liveTrackingTitle')}</CardTitle>
        <CardDescription>
          {t('tracker.liveTrackingDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {runningTimer ? (
          <div className="grid gap-4">
            <div className="flex items-center justify-between rounded-lg bg-muted p-4">
              <div>
                <p className="font-medium">
                  {t('tracker.runningTimerLocation', {
                    location: runningTimer.location,
                  })}
                </p>
              </div>
              <p className="font-mono text-2xl font-bold tabular-nums tracking-wider text-primary">
                {formatDuration(elapsedTime)}
              </p>
            </div>
            <div className="flex">
              <Button
                onClick={handleStopTimer}
                className="w-full bg-destructive transition-all duration-300 hover:bg-destructive/90"
              >
                <Pause className="mr-2 h-4 w-4" />
                {t('tracker.stopButton')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="flex w-full items-center gap-2">
              <Input
                placeholder={t('tracker.locationPlaceholder')}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="flex-1"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleGetCurrentLocation}
                    aria-label={t('tracker.getLocationTooltip')}
                    disabled={isFetchingLocation}
                  >
                    {isFetchingLocation ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MapPin className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('tracker.getLocationTooltip')}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Button
              onClick={handleStartTimer}
              size="lg"
              className="w-full transition-all duration-300"
            >
              <Play className="mr-2 h-4 w-4" />
              {t('tracker.startButton')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default TimeTrackerLiveCard
