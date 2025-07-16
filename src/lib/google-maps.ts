import { Loader } from '@googlemaps/js-api-loader'
import { useState, useEffect } from 'react'

// Google Maps API configuration
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

// Initialize Google Maps API loader
const loader = new Loader({
  apiKey: GOOGLE_MAPS_API_KEY,
  version: 'weekly',
  libraries: ['places', 'geometry'],
})

let isLoaded = false
let loadingPromise: Promise<void> | null = null

/**
 * Load Google Maps API
 */
export async function loadGoogleMaps(): Promise<void> {
  if (isLoaded) return
  
  if (loadingPromise) {
    await loadingPromise
    return
  }

  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('Google Maps API key is not configured')
    return
  }

  try {
    loadingPromise = loader.load().then(() => {
      isLoaded = true
    })
    await loadingPromise
  } catch (error) {
    console.error('Failed to load Google Maps API:', error)
    throw error
  } finally {
    loadingPromise = null
  }
}

/**
 * Check if Google Maps API is available
 */
export function isGoogleMapsAvailable(): boolean {
  return Boolean(GOOGLE_MAPS_API_KEY && typeof window !== 'undefined' && window.google?.maps)
}

/**
 * Geocode an address to coordinates
 */
export async function geocodeAddress(address: string): Promise<{
  lat: number
  lng: number
  formatted_address: string
  address_components: google.maps.GeocoderAddressComponent[]
} | null> {
  if (!isGoogleMapsAvailable()) {
    console.warn('Google Maps API not available for geocoding')
    return null
  }

  try {
    const geocoder = new google.maps.Geocoder()
    const results = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results) {
          resolve(results)
        } else {
          reject(new Error(`Geocoding failed: ${status}`))
        }
      })
    })

    if (results.length > 0) {
      const result = results[0]
      return {
        lat: result.geometry.location.lat(),
        lng: result.geometry.location.lng(),
        formatted_address: result.formatted_address,
        address_components: result.address_components,
      }
    }
  } catch (error) {
    console.error('Geocoding error:', error)
  }

  return null
}

/**
 * Reverse geocode coordinates to address
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  if (!isGoogleMapsAvailable()) {
    console.warn('Google Maps API not available for reverse geocoding')
    return null
  }

  try {
    const geocoder = new google.maps.Geocoder()
    const results = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results) {
          resolve(results)
        } else {
          reject(new Error(`Reverse geocoding failed: ${status}`))
        }
      })
    })

    if (results.length > 0) {
      return results[0].formatted_address
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error)
  }

  return null
}

/**
 * Calculate distance between two coordinates
 */
export function calculateDistance(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  if (!isGoogleMapsAvailable()) {
    // Fallback to haversine formula
    const R = 6371 // Earth's radius in kilometers
    const dLat = (to.lat - from.lat) * Math.PI / 180
    const dLng = (to.lng - from.lng) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const distance = google.maps.geometry.spherical.computeDistanceBetween(
    new google.maps.LatLng(from.lat, from.lng),
    new google.maps.LatLng(to.lat, to.lng)
  )
  return distance / 1000 // Convert to kilometers
}

/**
 * Get current user location using browser API
 */
export async function getCurrentLocation(): Promise<{
  lat: number
  lng: number
  accuracy: number
} | null> {
  if (!navigator.geolocation) {
    console.warn('Geolocation is not supported by this browser')
    return null
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      })
    })

    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
    }
  } catch (error) {
    console.error('Failed to get current location:', error)
    return null
  }
}

/**
 * Initialize Google Places Autocomplete
 */
export function initializeAutocomplete(
  input: HTMLInputElement,
  options: {
    types?: string[]
    componentRestrictions?: { country: string | string[] }
    fields?: string[]
    onPlaceChanged?: (place: google.maps.places.PlaceResult) => void
  } = {}
): google.maps.places.Autocomplete | null {
  if (!isGoogleMapsAvailable()) {
    console.warn('Google Maps API not available for autocomplete')
    return null
  }

  try {
    const autocomplete = new google.maps.places.Autocomplete(input, {
      types: options.types || ['address'],
      componentRestrictions: options.componentRestrictions || { country: 'us' },
      fields: options.fields || ['formatted_address', 'geometry', 'address_components', 'place_id'],
    })

    if (options.onPlaceChanged) {
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        options.onPlaceChanged!(place)
      })
    }

    return autocomplete
  } catch (error) {
    console.error('Failed to initialize autocomplete:', error)
    return null
  }
}

/**
 * Parse place result to extract city and state
 */
export function parsePlaceResult(place: google.maps.places.PlaceResult): {
  city: string
  state: string
  country: string
  formatted_address: string
  coordinates: { lat: number; lng: number } | null
} {
  const components = place.address_components || []
  let city = ''
  let state = ''
  let country = ''

  components.forEach((component) => {
    const types = component.types
    if (types.includes('locality')) {
      city = component.long_name
    } else if (types.includes('administrative_area_level_1')) {
      state = component.short_name
    } else if (types.includes('country')) {
      country = component.long_name
    }
  })

  const coordinates = place.geometry?.location
    ? {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      }
    : null

  return {
    city,
    state,
    country,
    formatted_address: place.formatted_address || '',
    coordinates,
  }
}

/**
 * Create a static map URL
 */
export function createStaticMapUrl(
  center: { lat: number; lng: number },
  options: {
    zoom?: number
    size?: string
    maptype?: string
    markers?: Array<{
      lat: number
      lng: number
      color?: string
      label?: string
    }>
  } = {}
): string {
  if (!GOOGLE_MAPS_API_KEY) {
    return ''
  }

  const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap'
  const params = new URLSearchParams({
    center: `${center.lat},${center.lng}`,
    zoom: (options.zoom || 15).toString(),
    size: options.size || '600x400',
    maptype: options.maptype || 'roadmap',
    key: GOOGLE_MAPS_API_KEY,
  })

  // Add markers
  if (options.markers) {
    options.markers.forEach((marker, index) => {
      const markerString = `${marker.color || 'red'}|${marker.label || index + 1}|${marker.lat},${marker.lng}`
      params.append('markers', markerString)
    })
  }

  return `${baseUrl}?${params.toString()}`
}

/**
 * Convert kilometers to miles
 */
export function kmToMiles(km: number): number {
  return km * 0.621371
}

/**
 * Convert miles to kilometers
 */
export function milesToKm(miles: number): number {
  return miles / 0.621371
}

/**
 * Format distance for display
 */
export function formatDistance(km: number, unit: 'km' | 'miles' = 'miles'): string {
  if (unit === 'miles') {
    const miles = kmToMiles(km)
    return `${miles.toFixed(1)} mi`
  }
  return `${km.toFixed(1)} km`
}

/**
 * Custom hook for Google Maps integration
 */
export function useGoogleMaps() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isGoogleMapsAvailable()) {
      setIsLoaded(true)
      return
    }

    loadGoogleMaps()
      .then(() => setIsLoaded(true))
      .catch((err) => {
        console.error('Failed to load Google Maps:', err)
        setError('Failed to load Google Maps API')
      })
  }, [])

  return { isLoaded, error }
}

// Export types for TypeScript
export type PlaceResult = google.maps.places.PlaceResult
export type LatLng = google.maps.LatLng
export type Map = google.maps.Map
export type Marker = google.maps.Marker
export type InfoWindow = google.maps.InfoWindow
export type Autocomplete = google.maps.places.Autocomplete
