'use server'

/**
 * @fileOverview A function to convert GPS coordinates to a human-readable address.
 *
 * - reverseGeocode - A function that handles the reverse geocoding process.
 * - ReverseGeocodeInput - The input type for the reverseGeocode function.
 * - ReverseGeocodeOutput - The return type for the reverseGeocode function.
 */
import { z } from 'zod'

const ReverseGeocodeInputSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
})
export type ReverseGeocodeInput = z.infer<typeof ReverseGeocodeInputSchema>

const ReverseGeocodeOutputSchema = z.object({
  address: z.string().describe('The human-readable address.'),
})
export type ReverseGeocodeOutput = z.infer<typeof ReverseGeocodeOutputSchema>

export async function reverseGeocode(
  input: ReverseGeocodeInput,
): Promise<ReverseGeocodeOutput> {
  const { latitude, longitude } = ReverseGeocodeInputSchema.parse(input)

  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (
    !apiKey ||
    apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE' ||
    apiKey.trim() === ''
  ) {
    console.error('Google Maps API key is not configured in .env file.')
    throw new Error(
      'Configuration Error: The GOOGLE_MAPS_API_KEY is not set in the .env file. This key is for location lookup and is separate from any Gemini/AI keys. Please get a key from the Google Cloud Console and add it to your .env file.',
    )
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`

  try {
    const response = await fetch(url)
    const data = await response.json()

    if (data.status !== 'OK') {
      console.error('Geocoding API Error:', data.status, data.error_message)
      if (data.status === 'REQUEST_DENIED') {
        throw new Error(
          `Google Maps API Error: ${data.error_message || 'The API key may be invalid or the Geocoding API may not be enabled in your Google Cloud project.'}`,
        )
      }
      throw new Error(
        `Geocoding API error: ${data.status} - ${data.error_message || 'An unknown error occurred.'}`,
      )
    }

    if (!data.results || data.results.length === 0) {
      return { address: 'Location not found' }
    }

    // Helper to find a specific address component type from the results
    const getAddressComponent = (components: any[], type: string) => {
      return components.find((c) => c.types.includes(type))?.long_name
    }

    const bestResult = data.results[0]
    const locality = getAddressComponent(
      bestResult.address_components,
      'locality',
    )
    const town = getAddressComponent(
      bestResult.address_components,
      'postal_town',
    )
    const city = getAddressComponent(
      bestResult.address_components,
      'administrative_area_level_2',
    )

    // Use the first available, from most to least specific, with a fallback to the first part of the formatted address.
    const address =
      locality || town || city || bestResult.formatted_address.split(',')[0]

    return { address }
  } catch (error) {
    console.error('Failed to fetch address from Google Maps API:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unknown error occurred while fetching the address.')
  }
}
