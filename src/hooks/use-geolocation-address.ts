import { useCallback, useRef, useState } from 'react'

import { useTranslations } from 'next-intl'

import { reverseGeocode } from '@/ai/flows/reverse-geocode-flow'
import { useToast } from '@/hooks/use-toast'

export function useGeolocationAddress(onAddress: (address: string) => void) {
  const { toast } = useToast()
  const t = useTranslations()
  const [isFetchingLocation, setIsFetchingLocation] = useState(false)
  const onAddressRef = useRef(onAddress)
  onAddressRef.current = onAddress
  const fetchingRef = useRef(false)

  const fetchCurrentLocationAddress = useCallback(async () => {
    if (fetchingRef.current) return
    if (!navigator.geolocation) {
      toast({
        title: t('time_entry_form.geolocationNotSupportedToastTitle'),
        description: t(
          'time_entry_form.geolocationNotSupportedToastDescription',
        ),
        variant: 'destructive',
      })
      return
    }

    fetchingRef.current = true
    setIsFetchingLocation(true)
    toast({
      title: t('time_entry_form.locationFetchToastTitle'),
      description: t('time_entry_form.locationFetchToastDescription'),
    })

    // eslint-disable-next-line sonarjs/no-intrusive-permissions -- only after user taps "use current location" for the work location field
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const result = await reverseGeocode({ latitude, longitude })
          onAddressRef.current(result.address)
          toast({
            title: t('time_entry_form.locationFetchedToastTitle'),
            description: t('time_entry_form.locationFetchedToastDescription', {
              address: result.address,
            }),
            className: 'bg-accent text-accent-foreground',
          })
        } catch (error) {
          console.error('Error getting address', error)
          const errorMessage =
            error instanceof Error ? error.message : 'An unknown error occurred'
          toast({
            title: t('time_entry_form.locationErrorToastTitle'),
            description: errorMessage,
            variant: 'destructive',
          })
          onAddressRef.current(
            `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`,
          )
        } finally {
          fetchingRef.current = false
          setIsFetchingLocation(false)
        }
      },
      (error) => {
        console.error('Error getting location', error)
        toast({
          title: t('time_entry_form.locationCoordsErrorToastTitle'),
          description: t('time_entry_form.locationCoordsErrorToastDescription'),
          variant: 'destructive',
        })
        fetchingRef.current = false
        setIsFetchingLocation(false)
      },
    )
  }, [t, toast])

  return { fetchCurrentLocationAddress, isFetchingLocation }
}
