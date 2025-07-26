"use client"

import { useState, useEffect } from 'react'

interface LocationData {
  latitude: number
  longitude: number
  city?: string
  state?: string
  accuracy?: number
}

interface UseLocationReturn {
  location: LocationData | null
  loading: boolean
  error: string | null
  requestLocation: () => void
  hasPermission: boolean | null
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      return
    }

    setLoading(true)
    setError(null)

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords
        
        try {
          // Try to get city/state from reverse geocoding
          let city, state
          
          // Use a simple reverse geocoding service or fallback to coordinates only
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            )
            
            if (response.ok) {
              const data = await response.json()
              city = data.city || data.locality
              state = data.principalSubdivision
            }
          } catch (geocodeError) {
            console.warn('Reverse geocoding failed, using coordinates only:', geocodeError)
          }

          setLocation({
            latitude,
            longitude,
            city,
            state,
            accuracy
          })
          setHasPermission(true)
        } catch (err) {
          console.error('Error processing location:', err)
          // Still set location with just coordinates
          setLocation({
            latitude,
            longitude,
            accuracy
          })
          setHasPermission(true)
        } finally {
          setLoading(false)
        }
      },
      (error) => {
        setLoading(false)
        setHasPermission(false)
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('Location access denied by user')
            break
          case error.POSITION_UNAVAILABLE:
            setError('Location information is unavailable')
            break
          case error.TIMEOUT:
            setError('Location request timed out')
            break
          default:
            setError('An unknown error occurred while retrieving location')
            break
        }
      },
      options
    )
  }

  // Check permission status on mount
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          setHasPermission(true)
        } else if (result.state === 'denied') {
          setHasPermission(false)
        }
        // 'prompt' state leaves hasPermission as null
      }).catch(() => {
        // Permissions API not supported, leave as null
      })
    }
  }, [])

  return {
    location,
    loading,
    error,
    requestLocation,
    hasPermission
  }
}
