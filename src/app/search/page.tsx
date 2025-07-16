"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, MapPin, Bed, Bath, Square, Heart, ArrowLeft, Map, List } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { SimpleMap } from "@/components/simple-map"
import { PropertyCardCarousel } from "@/components/property-card-carousel"
import { SearchForm } from "@/components/search-form"
import { useAuth } from "@/lib/auth"
import { useFavorites } from "@/lib/favorites-context"
import { getProperties, searchProperties, formatPropertyForFrontend } from "@/lib/properties"
import { getImageUrls } from "@/lib/storage"

function SearchPageContent() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toggleFavorite, isFavorite } = useFavorites()
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'map'>(searchParams.get('view') === 'map' ? 'map' : 'list')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('price_asc')

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true)
      try {
        const location = searchParams.get('location') || ''
        const bedrooms = searchParams.get('bedrooms') || 'any'

        const propertyFilters: any = {}
        if (location) {
          propertyFilters.city = location
        }
        if (bedrooms !== 'any') {
          propertyFilters.bedrooms = parseInt(bedrooms)
        }

        const data = await searchProperties(location, propertyFilters)
        const formattedProperties = data.map(formatPropertyForFrontend)
        setProperties(formattedProperties)
      } catch (error) {
        console.error('Error fetching properties:', error)
        setProperties([])
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [searchParams])

  const sortedProperties = [...properties].sort((a, b) => {
    switch (sortBy) {
      case 'price_asc':
        return a.price - b.price
      case 'price_desc':
        return b.price - a.price
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      default:
        return 0
    }
  })

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <SearchForm />
          </div>
          <div className="lg:col-span-3">
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Filters</h3>
                <Button variant="ghost" onClick={() => setShowFilters(!showFilters)}>
                  {showFilters ? 'Hide' : 'Show'}
                </Button>
              </div>
              {showFilters && (
                <div className="mt-4">
                  {/* Add advanced filter components here */}
                  <p className="text-gray-500">Advanced filters coming soon...</p>
                </div>
              )}
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Search Results</h2>
                  <p className="text-gray-600">{properties.length} properties found</p>
                </div>
                <div className="flex items-center gap-4 mt-4 sm:mt-0">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      onClick={() => setViewMode('list')}
                      className="rounded-full"
                    >
                      <List className="h-4 w-4 mr-2" />
                      List
                    </Button>
                    <Button
                      variant={viewMode === 'map' ? 'secondary' : 'ghost'}
                      onClick={() => setViewMode('map')}
                      className="rounded-full"
                    >
                      <Map className="h-4 w-4 mr-2" />
                      Map
                    </Button>
                  </div>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price_asc">Price: Low to High</SelectItem>
                      <SelectItem value="price_desc">Price: High to Low</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-16">
                  <p>Loading...</p>
                </div>
              ) : viewMode === 'list' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {sortedProperties.map((property) => (
                    <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative">
                        <PropertyCardCarousel
                          images={getImageUrls(property.images)}
                          propertyTitle={property.title}
                        />
                        <Button 
                          size="icon" 
                          variant="secondary" 
                          className="absolute top-2 left-2 h-8 w-8 z-10"
                          onClick={() => user && toggleFavorite(property.id)}
                        >
                          <Heart className={`h-4 w-4 ${user && isFavorite(property.id) ? 'fill-red-500 text-red-500' : ''}`} />
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
              ) : (
                <div className="h-[600px] rounded-lg overflow-hidden">
                  <SimpleMap properties={properties.filter(p => p.coordinates)} />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="loading-dots">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
          <p className="mt-4 text-lg text-muted-foreground">Loading search page...</p>
        </div>
      </>
    }>
      <SearchPageContent />
    </Suspense>
  )
}
