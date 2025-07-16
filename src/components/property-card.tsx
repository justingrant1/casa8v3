"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, MapPin, Bed, Bath, Square } from "lucide-react"
import { PropertyCardCarousel } from "./property-card-carousel"
import { ContactLandlordModal } from "./contact-landlord-modal"
import { getImageUrls } from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import { useFavorites } from "@/lib/favorites-context"

interface PropertyCardProps {
  property: any
}

export function PropertyCard({ property }: PropertyCardProps) {
  const { user } = useAuth()
  const { toggleFavorite, isFavorite } = useFavorites()
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

  // Dummy landlord data - replace with actual data from property
  const landlord = {
    id: property.landlord_id || '1',
    name: 'Property Owner',
    phone: property.landlord_phone || null,
    email: property.landlord_email || null,
  }

  return (
    <>
      <Card className="w-full max-w-sm rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1">
        <div className="relative">
          <PropertyCardCarousel
            images={getImageUrls(property.images)}
            propertyTitle={property.title}
          />
          <Badge variant="secondary" className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm">
            {property.type}
          </Badge>
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/80 backdrop-blur-sm"
            onClick={() => user && toggleFavorite(property.id)}
          >
            <Heart className={`h-5 w-5 ${user && isFavorite(property.id) ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
          </Button>
        </div>
        <CardContent className="p-6 bg-white">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-bold text-gray-900 truncate pr-2">{property.title}</h3>
            <div className="text-right">
              <p className="text-xl font-bold text-gray-900">${property.price.toLocaleString()}</p>
              <p className="text-sm text-gray-500">per month</p>
            </div>
          </div>
          <div className="flex items-center text-gray-600 mb-4">
            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
            <p className="truncate">{property.address}</p>
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

          <div className="grid grid-cols-2 gap-4">
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
