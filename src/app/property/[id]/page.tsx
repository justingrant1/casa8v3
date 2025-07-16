"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { MapPin, Bed, Bath, Square, Heart, MessageSquare, Check } from "lucide-react"
import Image from "next/image"
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'

export default function PropertyDetailsPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { id: propertyId } = params

  useEffect(() => {
    if (!propertyId) return

    const fetchProperty = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('id', propertyId)
        .single()

      if (error) {
        console.error(error)
      } else {
        setProperty(data)
      }
      setLoading(false)
    }

    fetchProperty()
  }, [propertyId])

  const handleApply = () => {
    if (!user) {
      router.push('/login')
      return
    }
    // Navigate to application page, passing property id
    router.push(`/apply/${propertyId}`)
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>
  }

  if (!property) {
    return <div className="container mx-auto px-4 py-8">Property not found.</div>
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
          {/* Image Gallery */}
          <div className="grid grid-cols-2 gap-2 mb-8">
            {property.images?.slice(0, 4).map((img: string, index: number) => (
              <div key={index} className={`relative ${index === 0 ? 'col-span-2 row-span-2' : ''}`}>
                <Image
                  src={img}
                  alt={`${property.title} image ${index + 1}`}
                  width={index === 0 ? 800 : 400}
                  height={index === 0 ? 500 : 250}
                  className="object-cover w-full h-full rounded-lg"
                />
              </div>
            ))}
          </div>

          {/* Property Info */}
          <h1 className="text-4xl font-bold mb-2">{property.title}</h1>
          <div className="flex items-center text-lg text-gray-500 mb-4">
            <MapPin className="h-5 w-5 mr-2" />
            {property.address}
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
            <p className="text-gray-600 leading-relaxed">{property.description}</p>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">${property.price}/month</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" onClick={handleApply}>Apply Now</Button>
              <Button variant="outline" className="w-full">
                <Heart className="h-4 w-4 mr-2" />
                Save to Favorites
              </Button>

              <div className="flex items-center pt-4">
                <Avatar>
                  <AvatarImage src={property.profiles?.avatar_url} />
                  <AvatarFallback>{property.profiles?.full_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="ml-4">
                  <div className="font-bold">{property.profiles?.full_name}</div>
                  <div className="text-sm text-gray-500">Landlord</div>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-2">
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact Landlord
              </Button>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </>
  )
}
