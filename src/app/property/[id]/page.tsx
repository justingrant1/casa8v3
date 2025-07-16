"use client"

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MapPin, Bed, Bath, Square, Heart, MessageSquare, Check, ArrowLeft, AlertTriangle } from "lucide-react"
import Image from "next/image"
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import Link from 'next/link'
import { getPropertyById } from '@/lib/properties'
import { getImageUrls } from '@/lib/storage'
import { ImageCarousel } from '@/components/image-carousel'
import { ApplicationModal } from '@/components/application-modal'

export default function PropertyDetailsPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const { id: propertyId } = params

  const fetchProperty = useCallback(async () => {
    if (!propertyId) {
      setLoading(false)
      setError("No property ID provided.")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await getPropertyById(propertyId)
      setProperty(data)
    } catch (err: any) {
      console.error('Error fetching property:', err)
      setError(err.message || "An unexpected error occurred.")
      setProperty(null)
    } finally {
      setLoading(false)
    }
  }, [propertyId])

  useEffect(() => {
    fetchProperty()
  }, [fetchProperty])

  const handleApply = () => {
    if (!user) {
      router.push('/login')
      return
    }
    setShowApplicationModal(true)
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="loading-dots">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
          <p className="mt-4 text-lg text-muted-foreground">Loading property details...</p>
        </div>
      </>
    )
  }

  if (error || !property) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-3xl font-bold mb-4">Property Not Found</h1>
          <p className="text-muted-foreground mb-8">
            {error || "The property you are looking for does not exist or may have been removed."}
          </p>
          <Link href="/search">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Search
            </Button>
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Image Carousel */}
            <ImageCarousel images={getImageUrls(property.images)} propertyTitle={property.title} />

            {/* Property Info */}
            <h1 className="text-4xl font-bold mb-2">{property.title}</h1>
            <div className="flex items-center text-lg text-gray-500 mb-4">
              <MapPin className="h-5 w-5 mr-2" />
              {property.address}, {property.city}, {property.state} {property.zip_code}
            </div>

            <div className="flex items-center space-x-8 mb-6 border-y py-4">
              <div className="flex items-center">
                <Bed className="h-6 w-6 mr-2 text-primary" />
                <span className="text-lg">{property.bedrooms} beds</span>
              </div>
              <div className="flex items-center">
                <Bath className="h-6 w-6 mr-2 text-primary" />
                <span className="text-lg">{property.bathrooms} baths</span>
              </div>
              <div className="flex items-center">
                <Square className="h-6 w-6 mr-2 text-primary" />
                <span className="text-lg">{property.sqft} sqft</span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">About this property</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{property.description}</p>
            </div>

            {/* Amenities */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {property.amenities?.map((amenity: string) => (
                  <div key={amenity} className="flex items-center">
                    <Check className="h-5 w-5 mr-2 text-green-500" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-3xl font-bold">${property.price.toLocaleString()}<span className="text-lg font-normal text-muted-foreground">/month</span></CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button size="lg" className="w-full h-12 text-lg" onClick={handleApply}>Apply Now</Button>
                <Button size="lg" variant="outline" className="w-full h-12 text-lg">
                  <Heart className="h-5 w-5 mr-2" />
                  Save to Favorites
                </Button>

                <div className="flex items-center pt-4 border-t">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={property.profiles?.avatar_url} />
                    <AvatarFallback>{property.profiles?.full_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4">
                    <div className="font-bold">{property.profiles?.full_name}</div>
                    <div className="text-sm text-gray-500">Landlord</div>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-2 h-12 text-lg">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Contact Landlord
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      <ApplicationModal
        propertyId={propertyId}
        propertyTitle={property.title}
        open={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
        onSuccess={() => {
          // Optionally redirect to dashboard or show success message
          router.push('/dashboard')
        }}
      />
    </>
  )
}
