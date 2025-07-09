import { reverseGeocode } from '../reverse-geocode-flow'

describe('reverseGeocode', () => {
  const OLD_ENV = process.env
  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
  })
  afterAll(() => {
    process.env = OLD_ENV
  })

  it('throws if GOOGLE_MAPS_API_KEY is missing', async () => {
    process.env.GOOGLE_MAPS_API_KEY = ''
    await expect(
      reverseGeocode({ latitude: 1, longitude: 2 })
    ).rejects.toThrow(/GOOGLE_MAPS_API_KEY/)
  })

  it('throws if API returns error', async () => {
    process.env.GOOGLE_MAPS_API_KEY = 'test-key'
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ status: 'REQUEST_DENIED', error_message: 'Denied' })
    })
    await expect(
      reverseGeocode({ latitude: 1, longitude: 2 })
    ).rejects.toThrow(/Denied/)
  })

  it('returns address if API returns OK', async () => {
    process.env.GOOGLE_MAPS_API_KEY = 'test-key'
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({
        status: 'OK',
        results: [
          {
            address_components: [
              { types: ['locality'], long_name: 'Berlin' }
            ],
            formatted_address: 'Berlin, Germany'
          }
        ]
      })
    })
    const result = await reverseGeocode({ latitude: 1, longitude: 2 })
    expect(result.address).toBe('Berlin')
  })
}) 