interface GeocodeResult {
  lat: number
  lng: number
  formatted_address: string
}

/**
 * Server-side geocoding using Google Maps Geocoding API
 */
export async function geocodeAddressServer(address: string): Promise<GeocodeResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    console.warn('Google Maps API key not configured for geocoding')
    return null
  }

  try {
    const encodedAddress = encodeURIComponent(address)
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0]
      const location = result.geometry.location
      
      return {
        lat: location.lat,
        lng: location.lng,
        formatted_address: result.formatted_address
      }
    } else {
      console.warn(`Geocoding failed for address "${address}": ${data.status}`)
      return null
    }
  } catch (error) {
    console.error(`Geocoding error for address "${address}":`, error)
    return null
  }
}

/**
 * Add a small delay to respect API rate limits
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
