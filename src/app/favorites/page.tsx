"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, MapPin, Bed, Bath, Square } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function FavoritesPage() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) return
      setLoading(true)
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          properties (
            *,
            profiles (
              full_name
            )
          )
        `)
        .eq('user_id', user.id)

      if (error) {
        console.error(error)
      } else {
        setFavorites(data.map(fav => fav.properties))
      }
      setLoading(false)
    }

    fetchFavorites()
  }, [user])

  const handleRemoveFavorite = async (propertyId: string) => {
    if (!user) return
    const { error } = await supabase
      .from('favorites')
      .delete()
      .match({ user_id: user.id, property_id: propertyId })

    if (error) {
      console.error(error)
    } else {
      setFavorites(favorites.filter(fav => fav.id !== propertyId))
    }
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Favorite Properties</h1>
      {favorites.length === 0 ? (
        <p>You haven't saved any properties yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((property) => (
            <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <Image
                  src={property.images?.[0] || '/placeholder.svg'}
                  alt={property.title}
                  width={400}
                  height={250}
                  className="object-cover w-full h-48"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={() => handleRemoveFavorite(property.id)}
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{property.title}</CardTitle>
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mr-1" />
                  {property.address}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center">
                    <Bed className="h-4 w-4 mr-1" />
                    {property.bedrooms} beds
                  </div>
                  <div className="flex items-center">
                    <Bath className="h-4 w-4 mr-1" />
                    {property.bathrooms} baths
                  </div>
                  <div className="flex items-center">
                    <Square className="h-4 w-4 mr-1" />
                    {property.sqft} sqft
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <div className="text-lg font-bold text-primary">${property.price}/mo</div>
                <Link href={`/property/${property.id}`}>
                  <Button>View Details</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
