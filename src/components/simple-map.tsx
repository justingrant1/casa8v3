"use client"

import { useState, useEffect, useRef, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Bed, Bath, Square, Heart, X } from 'lucide-react'
import Link from 'next/link'
import { loadGoogleMaps, useGoogleMaps, createStaticMapUrl } from '@/lib/google-maps'
import { PropertyCardCarousel } from './property-card-carousel'
import { ContactLandlordModal } from './contact-landlord-modal'
import { getImageUrls } from '@/lib/storage'
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
          <Card className="w-full max-w-md rounded-xl overflow-hidden shadow-2xl bg-white">
            <div className="relative">
              <PropertyCardCarousel
                images={getImageUrls(selectedProperty.images || null)}
                propertyTitle={selectedProperty.title}
              />
              <Badge variant="secondary" className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm">
                {selectedProperty.type}
              </Badge>
              <Button
                size="icon"
                variant="secondary"
                className="absolute top-4 right-14 h-10 w-10 rounded-full bg-white/80 backdrop-blur-sm"
                onClick={() => user && toggleFavorite(selectedProperty.id)}
              >
                <Heart className={`h-5 w-5 ${user && isFavorite(selectedProperty.id) ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/80 backdrop-blur-sm"
                onClick={() => setSelectedProperty(null)}
              >
                <X className="h-5 w-5 text-gray-700" />
              </Button>
            </div>
            <CardContent className="p-6 bg-white">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-gray-900 truncate pr-2">{selectedProperty.title}</h3>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">${selectedProperty.price.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">per month</p>
                </div>
              </div>
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                <p className="truncate">{selectedProperty.address || selectedProperty.location}</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 flex justify-around items-center mb-6">
                <div className="text-center">
                  <Bed className="h-6 w-6 mx-auto text-gray-500 mb-1" />
                  <p className="text-lg font-semibold">{selectedProperty.bedrooms}</p>
                  <p className="text-xs text-gray-500 uppercase">Beds</p>
                </div>
                <div className="border-l h-10 border-gray-200"></div>
                <div className="text-center">
                  <Bath className="h-6 w-6 mx-auto text-gray-500 mb-1" />
                  <p className="text-lg font-semibold">{selectedProperty.bathrooms}</p>
                  <p className="text-xs text-gray-500 uppercase">Baths</p>
                </div>
                <div className="border-l h-10 border-gray-200"></div>
                <div className="text-center">
                  <Square className="h-6 w-6 mx-auto text-gray-500 mb-1" />
                  <p className="text-lg font-semibold">{selectedProperty.sqft}</p>
                  <p className="text-xs text-gray-500 uppercase">Sqft</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {selectedProperty.amenities?.slice(0, 3).map((amenity: string) => (
                  <Badge key={amenity} variant="outline" className="font-normal bg-gray-100 text-gray-700">
                    {amenity}
                  </Badge>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Link href={`/property/${selectedProperty.id}`} passHref>
                  <Button variant="outline" className="w-full" onClick={() => setSelectedProperty(null)}>
                    View Details
                  </Button>
                </Link>
                <Button 
                  className="w-full bg-gray-900 text-white hover:bg-gray-800"
                  onClick={() => setIsContactModalOpen(true)}
                >
                  Contact Now
                </Button>
              </div>
            </CardContent>
          </Card>
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
