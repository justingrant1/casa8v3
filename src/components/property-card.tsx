"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, MapPin, Bed, Bath, Square, Share2 } from "lucide-react"
import { PropertyCardCarousel } from "./property-card-carousel"
import { ContactLandlordModal } from "./contact-landlord-modal"
import { getImageUrls } from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import { useFavorites } from "@/lib/favorites-context"
import { useRouter } from "next/navigation"

interface PropertyCardProps {
  property: any
}

export function PropertyCard({ property }: PropertyCardProps) {
  const { user } = useAuth()
  const { toggleFavorite, isFavorite } = useFavorites()
  const router = useRouter()
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

  const landlord = {
    id: property.landlord_id || '1',
    name: property.landlord || 'Property Owner',
    phone: property.landlord_phone,
    email: property.landlord_email,
  }

  const handleOpenMaps = () => {
    // Create full address string for better mapping
    const fullAddress = `${property.address}, ${property.city}, ${property.state} ${property.zip_code}`.trim()
    const encodedAddress = encodeURIComponent(fullAddress)
    const mapsUrl = `https://maps.google.com/maps?q=${encodedAddress}`
    
    // For mobile devices, try to open the native maps app first
    if (/Android/i.test(navigator.userAgent)) {
      // Try Android native maps first, fallback to web
      window.open(`geo:0,0?q=${encodedAddress}`, '_blank')
      setTimeout(() => window.open(mapsUrl, '_blank'), 500)
    } else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      // Try iOS native maps first, fallback to web
      window.open(`maps://maps.google.com/maps?q=${encodedAddress}`, '_blank')
      setTimeout(() => window.open(mapsUrl, '_blank'), 500)
    } else {
      window.open(mapsUrl, '_blank')
    }
  }

  const handleShare = async () => {
    const fullAddress = `${property.address}${property.city ? `, ${property.city}` : ''}${property.state ? `, ${property.state}` : ''}${property.zip_code ? ` ${property.zip_code}` : ''}`
    const shareData = {
      title: `${property.title} - Casa8`,
      text: `Check out this ${property.bedrooms} bedroom, ${property.bathrooms} bathroom home at ${fullAddress}. $${property.price.toLocaleString()} per month. Available on Casa8.`,
      url: `${window.location.origin}/property/${property.id}`
    }

    try {
      if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        await navigator.share(shareData)
      } else {
        // Fallback for desktop or unsupported browsers
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`)
        alert('Link copied to clipboard!')
      }
    } catch (error) {
      console.error('Error sharing:', error)
      // Final fallback
      try {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`)
        alert('Link copied to clipboard!')
      } catch (clipboardError) {
        console.error('Clipboard also failed:', clipboardError)
      }
    }
  }

  return (
    <>
      <Card className="w-full max-w-sm sm:max-w-md rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1">
        <div className="relative">
          <PropertyCardCarousel
            images={getImageUrls(property.images)}
            propertyTitle={property.title}
          />
          {property.type && (
            <Badge variant="secondary" className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm">
              {property.type}
            </Badge>
          )}
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/80 backdrop-blur-sm"
            onClick={() => {
              if (!user) {
                router.push('/login')
                return
              }
              toggleFavorite(property.id)
            }}
          >
            <Heart className={`h-5 w-5 ${user && isFavorite(property.id) ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
          </Button>
        </div>
        <CardContent className="p-4 sm:p-6 bg-white">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3">
            <Link href={`/property/${property.id}`} passHref>
              <h3 
                className="text-lg sm:text-xl font-bold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors duration-200 mb-2 sm:mb-0 line-clamp-2 sm:pr-2"
                onClick={() => {
                  // Haptic feedback for supported devices
                  if (navigator.vibrate) {
                    navigator.vibrate(10)
                  }
                }}
              >
                {property.title}
              </h3>
            </Link>
            <div className="text-left sm:text-right flex-shrink-0">
              <p className="text-xl font-bold text-gray-900">${property.price.toLocaleString()}</p>
              <p className="text-sm text-gray-500">per month</p>
            </div>
          </div>
          <div className="flex items-center text-gray-600 mb-4">
            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
            <button 
              onClick={handleOpenMaps}
              className="flex-1 text-left hover:text-blue-600 cursor-pointer transition-colors duration-200 text-sm leading-relaxed"
              title="Open in Maps"
            >
              <div className="line-clamp-2">
                {property.address}{property.city && `, ${property.city}`}{property.state && `, ${property.state}`}{property.zip_code && ` ${property.zip_code}`}
              </div>
            </button>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 flex justify-around items-center mb-6">
            <div className="text-center">
              <Bed className="h-6 w-6 mx-auto text-gray-500 mb-1" />
              <p className="text-lg font-semibold">{property.bedrooms}</p>
              <p className="text-xs text-gray-500 uppercase">Beds</p>
            </div>
            <div className="border-l h-10 border-gray-200"></div>
            <div className="text-center">
              <Bath className="h-6 w-6 mx-auto text-gray-500 mb-1" />
              <p className="text-lg font-semibold">{property.bathrooms}</p>
              <p className="text-xs text-gray-500 uppercase">Baths</p>
            </div>
            <div className="border-l h-10 border-gray-200"></div>
            <div className="text-center">
              <Square className="h-6 w-6 mx-auto text-gray-500 mb-1" />
              <p className="text-lg font-semibold">{property.sqft}</p>
              <p className="text-xs text-gray-500 uppercase">Sqft</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {property.amenities?.slice(0, 3).map((amenity: string) => (
              <Badge key={amenity} variant="outline" className="font-normal bg-gray-100 text-gray-700">
                {amenity}
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <Link href={`/property/${property.id}`} passHref>
              <Button variant="outline" className="w-full">View Details</Button>
            </Link>
            <Button 
              className="w-full bg-gray-900 text-white hover:bg-gray-800"
              onClick={() => setIsContactModalOpen(true)}
            >
              Contact Now
            </Button>
          </div>
          
          {/* Mobile Share Button */}
          <div className="sm:hidden">
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              Share Listing
            </Button>
          </div>
        </CardContent>
      </Card>

      <ContactLandlordModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        landlord={landlord}
        property={property}
      />
    </>
  );
}
