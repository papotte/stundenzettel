import { AllTheProviders, act, renderHook, waitFor } from '@jest-setup'

import { reverseGeocode } from '@/ai/flows/reverse-geocode-flow'

import { useGeolocationAddress } from '../use-geolocation-address'

const mockToast = jest.fn()
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

jest.mock('@/ai/flows/reverse-geocode-flow')
const mockedReverseGeocode = reverseGeocode as jest.MockedFunction<
  typeof reverseGeocode
>

const mockGetCurrentPosition = jest.fn()

function setNavigatorGeolocation(value: Geolocation | undefined): void {
  Object.defineProperty(navigator, 'geolocation', {
    value,
    configurable: true,
    writable: true,
  })
}

describe('useGeolocationAddress', () => {
  const onAddress = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockToast.mockClear()
    onAddress.mockClear()
    mockGetCurrentPosition.mockReset()
    setNavigatorGeolocation({
      getCurrentPosition: mockGetCurrentPosition,
    } as unknown as Geolocation)
  })

  function renderUseGeolocationAddress() {
    return renderHook(() => useGeolocationAddress(onAddress), {
      wrapper: AllTheProviders(),
    })
  }

  it('toasts and returns when geolocation is not available', async () => {
    setNavigatorGeolocation(undefined)

    const { result } = renderUseGeolocationAddress()
    expect(result.current.isFetchingLocation).toBe(false)
    await act(async () => {
      await result.current.fetchCurrentLocationAddress()
    })

    expect(mockGetCurrentPosition).not.toHaveBeenCalled()
    expect(onAddress).not.toHaveBeenCalled()
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('geolocationNotSupportedToastTitle'),
        variant: 'destructive',
      }),
    )
  })

  it('reverse-geocodes and calls onAddress with the resolved address', async () => {
    mockedReverseGeocode.mockResolvedValue({ address: '123 Main St' })
    mockGetCurrentPosition.mockImplementation((success) => {
      success({
        coords: { latitude: 51.123456, longitude: 45.987654 },
      } as GeolocationPosition)
    })

    const { result } = renderUseGeolocationAddress()
    await act(async () => {
      await result.current.fetchCurrentLocationAddress()
    })

    await waitFor(() => {
      expect(mockedReverseGeocode).toHaveBeenCalledWith({
        latitude: 51.123456,
        longitude: 45.987654,
      })
    })
    expect(onAddress).toHaveBeenCalledWith('123 Main St')
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('locationFetchedToastTitle'),
        className: 'bg-accent text-accent-foreground',
      }),
    )
    expect(result.current.isFetchingLocation).toBe(false)
  })

  it('calls onAddress with lat/lon fallback when reverse geocode throws', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation()
    mockedReverseGeocode.mockRejectedValue(new Error('network fail'))
    mockGetCurrentPosition.mockImplementation((success) => {
      success({
        coords: { latitude: 1.234567, longitude: 8.876543 },
      } as GeolocationPosition)
    })

    const { result } = renderUseGeolocationAddress()
    await act(async () => {
      await result.current.fetchCurrentLocationAddress()
    })

    await waitFor(() => {
      expect(onAddress).toHaveBeenCalledWith('Lat: 1.2346, Lon: 8.8765')
    })
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('locationErrorToastTitle'),
        description: 'network fail',
        variant: 'destructive',
      }),
    )
    expect(result.current.isFetchingLocation).toBe(false)
    consoleError.mockRestore()
  })

  it('uses a generic message when reverse geocode throws a non-Error', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation()
    mockedReverseGeocode.mockRejectedValue('bad')
    mockGetCurrentPosition.mockImplementation((success) => {
      success({
        coords: { latitude: 0, longitude: 0 },
      } as GeolocationPosition)
    })

    const { result } = renderUseGeolocationAddress()
    await act(async () => {
      await result.current.fetchCurrentLocationAddress()
    })

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'An unknown error occurred',
        }),
      )
    })
    expect(result.current.isFetchingLocation).toBe(false)
    consoleError.mockRestore()
  })

  it('toasts coords error when getCurrentPosition invokes the error callback', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation()
    mockGetCurrentPosition.mockImplementation((_success, error) => {
      error?.({ code: 1, message: 'denied' } as GeolocationPositionError)
    })

    const { result } = renderUseGeolocationAddress()
    await act(async () => {
      await result.current.fetchCurrentLocationAddress()
    })

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('locationCoordsErrorToastTitle'),
          variant: 'destructive',
        }),
      )
    })
    expect(onAddress).not.toHaveBeenCalled()
    expect(result.current.isFetchingLocation).toBe(false)
    consoleError.mockRestore()
  })

  it('does not call getCurrentPosition twice when fetch is invoked concurrently', async () => {
    mockedReverseGeocode.mockResolvedValue({ address: 'x' })
    mockGetCurrentPosition.mockImplementation((success) => {
      success({
        coords: { latitude: 0, longitude: 0 },
      } as GeolocationPosition)
    })

    const { result } = renderUseGeolocationAddress()
    await act(async () => {
      const a = result.current.fetchCurrentLocationAddress()
      const b = result.current.fetchCurrentLocationAddress()
      await Promise.all([a, b])
    })

    expect(mockGetCurrentPosition).toHaveBeenCalledTimes(1)
  })
})
