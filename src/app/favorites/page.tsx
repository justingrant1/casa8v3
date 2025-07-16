"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, MapPin, Bed, Bath, Square, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/navbar'
import { getFavoriteProperties, formatPropertyForFrontend } from '@/lib/properties'
import { useFavorites } from '@/lib/favorites-context'
import { PropertyCardCarousel } from '@/components/property-card-carousel'
import { getImageUrls } from '@/lib/storage'

export default function FavoritesPage() {
  const { user } = useAuth()
  const { toggleFavorite, isFavorite } = useFavorites()
  const [favorites, setFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    
    console.log('Fetching favorites for user:', user.id)
    setLoading(true)
    setError(null)
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setLoading(false)
      setError("Request timed out. Please try again.")
    }, 30000) // 30 second timeout
    
    try {
      const data = await getFavoriteProperties(user.id)
      clearTimeout(timeoutId)
      console.log('Favorites data received:', data)
      
      const formattedProperties = data.map(formatPropertyForFrontend)
      setFavorites(formattedProperties)
    } catch (err: any) {
      clearTimeout(timeoutId)
      console.error('Error fetching favorites:', err)
      setError(err.message || "Failed to load favorites. Please try again.")
      setFavorites([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  const handleRemoveFavorite = async (propertyId: string) => {
    if (!user) return
    
    try {
      await toggleFavorite(propertyId)
      // Remove from local state
      setFavorites(favorites.filter(fav => fav.id !== propertyId))
    } catch (error) {
      console.error('Error removing favorite:', error)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="loading-dots">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
            <p className="mt-4 text-lg text-muted-foreground">Loading your favorite properties...</p>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-3xl font-bold mb-4">Failed to Load Favorites</h1>
          <p className="text-muted-foreground mb-8">
            {error}
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={fetchFavorites} variant="outline">
              Try Again
            </Button>
            <Link href="/search">
              <Button>Browse Properties</Button>
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
        <h1 className="text-3xl font-bold mb-6">My Favorite Properties</h1>
        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No Favorites Yet</h2>
            <p className="text-gray-500 mb-6">You haven't saved any properties yet.</p>
            <Link href="/search">
              <Button>Browse Properties</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((property) => (
              <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <PropertyCardCarousel
                    images={getImageUrls(property.images)}
                    propertyTitle={property.title}
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 left-2 h-8 w-8 z-10"
                    onClick={() => handleRemoveFavorite(property.id)}
                  >
                    <Heart className="h-4 w-4 fill-white" />
                  </Button>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{property.title}</CardTitle>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mr-1" />
                    {property.location}
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
    </>
  )
}
