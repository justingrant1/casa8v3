"use client"

import { useState, useEffect, useRef, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Bed, Bath, Square, Heart } from 'lucide-react'
import Link from 'next/link'
import { loadGoogleMaps, useGoogleMaps, createStaticMapUrl } from '@/lib/google-maps'

interface Property {
  id: string
  title: string
  price: number
  location: string
  bedrooms: number
  bathrooms: number
  sqft: number
  type: string
  image: string
  coordinates?: {
    lat: number
    lng: number
  }
}

interface SimpleMapProps {
  properties: Property[]
  className?: string
  center?: { lat: number; lng: number }
  zoom?: number
  onMarkerClick?: (property: Property) => void
}

export function SimpleMap({ 
  properties, 
  className = "",
  center,
  zoom = 12,
  onMarkerClick
}: SimpleMapProps) {
  const { isLoaded, error } = useGoogleMaps()
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])
  const [infoWindows, setInfoWindows] = useState<google.maps.InfoWindow[]>([])

  // Debug logging
  console.log('SimpleMap render - isLoaded:', isLoaded, 'error:', error, 'properties:', properties)

  // Calculate center if not provided - memoized to prevent infinite loops
  const mapCenter = useMemo(() => {
    if (center) return center
    
    const validProperties = properties.filter(p => p.coordinates)
    if (validProperties.length === 0) {
      return { lat: 39.8283, lng: -98.5795 } // Center of US
    }
    
    const avgLat = validProperties.reduce((sum, p) => sum + (p.coordinates?.lat || 0), 0) / validProperties.length
    const avgLng = validProperties.reduce((sum, p) => sum + (p.coordinates?.lng || 0), 0) / validProperties.length
    
    return { lat: avgLat, lng: avgLng }
  }, [center, properties])

  // Initialize map
  useEffect(() => {
    console.log('Map initialization effect - isLoaded:', isLoaded, 'mapRef.current:', mapRef.current, 'mapCenter:', mapCenter)
    if (!isLoaded || !mapRef.current) return

    console.log('Creating map instance...')
    const mapInstance = new google.maps.Map(mapRef.current, {
      center: mapCenter,
      zoom,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    })

    console.log('Map instance created:', mapInstance)
    setMap(mapInstance)

    return () => {
      // Cleanup
      setMap(null)
    }
  }, [isLoaded, mapCenter, zoom])

  // Add markers
  useEffect(() => {
    if (!map || !isLoaded) return

    // Clear existing markers and info windows
    markers.forEach(marker => marker.setMap(null))
    infoWindows.forEach(infoWindow => infoWindow.close())
    
    const newMarkers: google.maps.Marker[] = []
    const newInfoWindows: google.maps.InfoWindow[] = []

    properties.forEach(property => {
      if (!property.coordinates) return

      // Create larger, more touch-friendly markers
      const marker = new google.maps.Marker({
        position: property.coordinates,
        map,
        title: property.title,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 16, // Larger for better touch interaction
          fillColor: '#3b82f6',
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 3
        },
        optimized: false // Better for touch interaction
      })

      // Create info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-3 max-w-xs">
            <h3 class="font-semibold text-sm mb-1">${property.title}</h3>
            <p class="text-xs text-gray-600 mb-2">${property.location}</p>
            <div class="flex justify-between items-center">
              <span class="text-sm font-bold text-blue-600">$${property.price.toLocaleString()}/mo</span>
              <span class="text-xs text-gray-500">${property.bedrooms}br/${property.bathrooms}ba</span>
            </div>
          </div>
        `
      })

      // Function to close all info windows
      const closeAllInfoWindows = () => {
        newInfoWindows.forEach(iw => iw.close())
      }

      // Handle both click and touch events
      marker.addListener('click', () => {
        closeAllInfoWindows()
        infoWindow.open(map, marker)
        
        if (onMarkerClick) {
          onMarkerClick(property)
        }
      })

      // Add touch event handling for mobile
      marker.addListener('touchstart', (e: any) => {
        e.preventDefault()
        closeAllInfoWindows()
        infoWindow.open(map, marker)
        
        if (onMarkerClick) {
          onMarkerClick(property)
        }
      })

      // For desktop, still use hover for better UX
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      
      if (!isTouchDevice) {
        marker.addListener('mouseover', () => {
          infoWindow.open(map, marker)
        })

        marker.addListener('mouseout', () => {
          infoWindow.close()
        })
      }

      newMarkers.push(marker)
      newInfoWindows.push(infoWindow)
    })

    setMarkers(newMarkers)
    setInfoWindows(newInfoWindows)

    return () => {
      newMarkers.forEach(marker => marker.setMap(null))
      newInfoWindows.forEach(infoWindow => infoWindow.close())
    }
  }, [map, properties, onMarkerClick, infoWindows])

  // Show loading state
  if (!isLoaded) {
    return (
      <div className={`w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Loading map...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className={`w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center">
          <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Map Unavailable</h3>
          <p className="text-gray-500 mb-4">Unable to load Google Maps</p>
          <Badge variant="outline" className="bg-red-50 text-red-700">
            {error}
          </Badge>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full h-96 rounded-lg overflow-hidden ${className}`}>
      <div ref={mapRef} className="w-full h-full" />
    </div>
  )
}
