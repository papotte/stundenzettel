'use server';
/**
 * @fileOverview A flow to convert GPS coordinates to a human-readable address.
 *
 * - reverseGeocode - A function that handles the reverse geocoding process.
 * - ReverseGeocodeInput - The input type for the reverseGeocode function.
 * - ReverseGeocodeOutput - The return type for the reverseGeocode function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ReverseGeocodeInputSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});
export type ReverseGeocodeInput = z.infer<typeof ReverseGeocodeInputSchema>;

const ReverseGeocodeOutputSchema = z.object({
    address: z.string().describe('The human-readable address.'),
});
export type ReverseGeocodeOutput = z.infer<typeof ReverseGeocodeOutputSchema>;

export async function reverseGeocode(input: ReverseGeocodeInput): Promise<ReverseGeocodeOutput> {
  return reverseGeocodeFlow(input);
}

const reverseGeocodeFlow = ai.defineFlow(
  {
    name: 'reverseGeocodeFlow',
    inputSchema: ReverseGeocodeInputSchema,
    outputSchema: ReverseGeocodeOutputSchema,
  },
  async ({ latitude, longitude }) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE' || apiKey.trim() === '') {
      console.error('Google Maps API key is not configured in .env.local');
      throw new Error('Server configuration error: The Google Maps API key is missing or invalid.');
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&result_type=locality|administrative_area_level_2&key=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Geocoding API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }
      
      if (!data.results || data.results.length === 0) {
        return { address: 'Location not found' };
      }

      // The first result is often the most specific one. We take the first part of the formatted address.
      const bestResult = data.results[0];
      const address = bestResult.formatted_address.split(',')[0];
      
      return { address };

    } catch (error) {
      console.error('Failed to fetch address from Google Maps API:', error);
      throw new Error('Failed to fetch address from the server.');
    }
  }
);
