"use client"

import { useState, useEffect, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, X } from 'lucide-react'
import { useGoogleMaps } from '@/lib/google-maps'
import { PropertyCard } from './property-card'
import { ContactLandlordModal } from './contact-landlord-modal'
import { useAuth } from '@/lib/auth'
import { useFavorites } from '@/lib/favorites-context'

interface Property {
  id: string
  title: string
  price: number
  location: string
  address?: string
  bedrooms: number
  bathrooms: number
  sqft: number
  type: string
  image: string
  images?: string[]
  amenities?: string[]
  landlord_id?: string
  landlord?: string
  landlord_phone?: string
  landlord_email?: string
  profiles?: {
    first_name?: string
    last_name?: string
    phone?: string
    email?: string
  }
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
  const { user } = useAuth()
  const { toggleFavorite, isFavorite } = useFavorites()
  const { isLoaded, error } = useGoogleMaps()
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])
  const [infoWindows, setInfoWindows] = useState<google.maps.InfoWindow[]>([])
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

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
    if (!isLoaded || !mapRef.current) return

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
    setMap(mapInstance)
  }, [isLoaded])

  // Update map center when it changes
  useEffect(() => {
    if (map && mapCenter) {
      map.setCenter(mapCenter)
    }
  }, [map, mapCenter])

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

      // Create standard Google Maps pin markers
      const marker = new google.maps.Marker({
        position: property.coordinates,
        map,
        title: property.title,
        // Using default Google Maps pin - no custom icon
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
        setSelectedProperty(property)
        
        if (onMarkerClick) {
          onMarkerClick(property)
        }
      })

      // Add touch event handling for mobile
      marker.addListener('touchstart', (e: any) => {
        e.preventDefault()
        closeAllInfoWindows()
        setSelectedProperty(property)
        
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
  }, [map, properties, onMarkerClick])

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

  // Extract landlord data for the selected property
  const landlord = selectedProperty ? {
    id: selectedProperty.landlord_id || '1',
    name: selectedProperty.profiles 
      ? `${selectedProperty.profiles.first_name || ''} ${selectedProperty.profiles.last_name || ''}`.trim() || 'Property Owner'
      : selectedProperty.landlord || 'Property Owner',
    phone: selectedProperty.profiles?.phone || selectedProperty.landlord_phone || null,
    email: selectedProperty.profiles?.email || selectedProperty.landlord_email || null,
  } : null

  return (
    <>
      <div className={`w-full h-96 rounded-lg overflow-hidden ${className}`}>
        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* Property Details Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="relative">
            <Button
              size="icon"
              variant="secondary"
              className="absolute top-2 right-2 h-10 w-10 rounded-full bg-white/80 backdrop-blur-sm z-10"
              onClick={() => setSelectedProperty(null)}
            >
              <X className="h-5 w-5 text-gray-700" />
            </Button>
            <PropertyCard property={selectedProperty} />
          </div>
        </div>
      )}

      {/* Contact Landlord Modal */}
      {selectedProperty && landlord && (
        <ContactLandlordModal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          landlord={landlord}
          property={selectedProperty}
        />
      )}
    </>
  )
}
