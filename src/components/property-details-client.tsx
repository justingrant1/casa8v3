"use client"

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MapPin, Bed, Bath, Square, Heart, MessageSquare, Check, ArrowLeft, AlertTriangle, Share2 } from "lucide-react"
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import Link from 'next/link'
import { getPropertyById } from '@/lib/properties'
import { getImageUrls } from '@/lib/storage'
import { ImageCarousel } from '@/components/image-carousel'
import { ApplicationModal } from '@/components/application-modal'
import { ContactLandlordModal } from '@/components/contact-landlord-modal'
import { useFavorites } from '@/lib/favorites-context'

interface PropertyDetailsClientProps {
  propertyId: string
}

export function PropertyDetailsClient({ propertyId }: PropertyDetailsClientProps) {
  const { user } = useAuth()
  const { isFavorite, toggleFavorite } = useFavorites()
  const router = useRouter()
  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)

  const fetchProperty = useCallback(async () => {
    if (!propertyId) {
      setLoading(false)
      setError("No property ID provided.")
      return
    }

    console.log('Fetching property with ID:', propertyId)
    setLoading(true)
    setError(null)
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setLoading(false)
      setError("Request timed out. Please try again.")
    }, 30000) // 30 second timeout
    
    try {
      const data = await getPropertyById(propertyId)
      clearTimeout(timeoutId)
      console.log('Raw property data received:', data)
      
      if (!data) {
        setError("Property not found.")
        setProperty(null)
      } else {
        console.log('Property data received:', data)
        setProperty(data)
      }
    } catch (err: any) {
      clearTimeout(timeoutId)
      console.error('Error fetching property:', err)
      setError(err.message || "Failed to load property. Please try again.")
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

  const handleToggleFavorite = () => {
    if (!user) {
      router.push('/login')
      return
    }
    toggleFavorite(propertyId)
  }

  const handleShare = async () => {
    if (!property) return
    
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
          <div className="flex gap-4 justify-center">
            <Button onClick={fetchProperty} variant="outline">
              Try Again
            </Button>
            <Link href="/search">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Search
              </Button>
            </Link>
          </div>
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
            <ImageCarousel 
              images={getImageUrls(property.images)} 
              propertyTitle={property.title}
              propertyType={property.type}
            />

            {/* Property Info */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
                  <h1 className="text-4xl font-bold">{property.title}</h1>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="flex items-center gap-2 h-12"
                    onClick={handleShare}
                  >
                    <Share2 className="h-5 w-5" />
                    Share
                  </Button>
                </div>
                <div className="flex items-center text-lg text-gray-500">
                  <MapPin className="h-5 w-5 mr-2" />
                  <button
                    onClick={() => {
                      const address = `${property.address}, ${property.city}, ${property.state} ${property.zip_code}`
                      const encodedAddress = encodeURIComponent(address)
                      window.open(`https://maps.google.com/maps?q=${encodedAddress}`, '_blank')
                    }}
                    className="text-left hover:text-blue-600 transition-colors cursor-pointer underline"
                  >
                    {property.address}, {property.city}, {property.state} {property.zip_code}
                  </button>
                </div>
              </div>
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

            {/* Lease Details */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Lease Details</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Lease Term:</span>
                    <span className="font-semibold text-gray-900">12+ months</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Security Deposit:</span>
                    <div className="text-right">
                      <span className="text-gray-700 text-sm">
                        ${(property.security_deposit || 1000).toLocaleString()}
                      </span>
                      {property.security_deposit_negotiable && (
                        <div className="flex items-center justify-end mt-0.5">
                          <Check className="h-3 w-3 mr-1 text-green-500" />
                          <span className="text-xs text-green-600">Negotiable</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
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
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="h-12 text-lg"
                    onClick={handleToggleFavorite}
                  >
                    <Heart className={`h-5 w-5 mr-2 ${isFavorite(propertyId) ? 'fill-red-500 text-red-500' : ''}`} />
                    {isFavorite(propertyId) ? 'Saved' : 'Save'}
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="h-12 text-lg" 
                    onClick={handleShare}
                  >
                    <Share2 className="h-5 w-5 mr-2" />
                    Share
                  </Button>
                </div>

                <div className="flex items-center pt-4 border-t">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {property.data_source === 'scraped' && property.scraped_contact_name
                        ? property.scraped_contact_name[0].toUpperCase()
                        : (property as any).profiles?.first_name?.[0] || 'L'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-4">
                    <div className="font-bold">
                      {property.data_source === 'scraped' && property.scraped_contact_name
                        ? property.scraped_contact_name
                        : (property as any).profiles 
                          ? `${(property as any).profiles.first_name || ''} ${(property as any).profiles.last_name || ''}`.trim() || 'Property Owner'
                          : 'Property Owner'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {property.data_source === 'scraped' ? 'Property Manager' : 'Landlord'}
                    </div>
                    {property.data_source === 'scraped' && property.scraped_contact_phone && (
                      <div className="text-sm text-blue-600 font-medium">
                        {property.scraped_contact_phone}
                      </div>
                    )}
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-2 h-12 text-lg"
                  onClick={() => setShowContactModal(true)}
                >
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
          router.push('/dashboard-simple')
        }}
      />

      {/* Contact Landlord Modal */}
      <ContactLandlordModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        landlord={{
          id: property.landlord_id,
          name: property.data_source === 'scraped' && property.scraped_contact_name
            ? property.scraped_contact_name
            : property.landlord || 'Property Owner',
          phone: property.data_source === 'scraped' && property.scraped_contact_phone
            ? property.scraped_contact_phone
            : property.landlord_phone,
          email: property.landlord_email
        }}
        property={{
          id: property.id,
          title: property.title
        }}
      />
    </>
  )
}
