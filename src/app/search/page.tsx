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
import { LocationSearch } from "@/components/location-search"
import { SimpleMap } from "@/components/simple-map"
import { PropertyCardCarousel } from "@/components/property-card-carousel"
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
  const [searchLocation, setSearchLocation] = useState<any>(null)
  const [filters, setFilters] = useState({
    location: searchParams.get('location') || '',
    bedrooms: searchParams.get('bedrooms') || 'any',
    priceRange: [0, 5000],
    amenities: [] as string[],
  })

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true)
      try {
        // Build filters object for the properties library
        const propertyFilters: any = {}
        
        if (filters.location) {
          // Extract city/state from location string if possible
          const locationParts = filters.location.split(',')
          if (locationParts.length >= 2) {
            propertyFilters.city = locationParts[0].trim()
            propertyFilters.state = locationParts[1].trim()
          } else {
            propertyFilters.city = filters.location.trim()
          }
        }
        
        if (filters.bedrooms !== 'any') {
          propertyFilters.bedrooms = parseInt(filters.bedrooms)
        }
        
        propertyFilters.minPrice = filters.priceRange[0]
        propertyFilters.maxPrice = filters.priceRange[1]
        
        if (filters.amenities.length > 0) {
          propertyFilters.amenities = filters.amenities
        }

        // Use the properties library function
        const data = filters.location 
          ? await searchProperties(filters.location, propertyFilters)
          : await getProperties(propertyFilters)
        
        console.log('Fetched properties:', data)
        
        // Format properties for frontend display
        const formattedProperties = data.map(formatPropertyForFrontend)
        setProperties(formattedProperties)
      } catch (error) {
        console.error('Error in fetchProperties:', error)
        setProperties([])
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [filters])

  const handleFilterChange = (name: string, value: any) => {
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const handleAmenityChange = (amenity: string) => {
    setFilters((prev) => {
      const newAmenities = prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity]
      return { ...prev, amenities: newAmenities }
    })
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Filters */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <LocationSearch
                    placeholder="City, State, or Zip"
                    onLocationSelect={(location) => {
                      handleFilterChange('location', `${location.city}, ${location.state}`)
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Select
                    value={filters.bedrooms}
                    onValueChange={(value: string) => handleFilterChange('bedrooms', value)}
                  >
                    <SelectTrigger id="bedrooms">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amenities</Label>
                  <div className="space-y-2">
                    {['Washer/Dryer', 'Air Conditioning', 'Parking', 'Dishwasher', 'Pet Friendly', 'Gym'].map((amenity) => (
                      <div key={amenity} className="flex items-center space-x-2">
                        <Checkbox
                          id={amenity}
                          checked={filters.amenities.includes(amenity)}
                          onCheckedChange={() => handleAmenityChange(amenity)}
                        />
                        <Label htmlFor={amenity}>{amenity}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Properties */}
          <div className="md:col-span-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">Search Results</h1>
                <p className="text-gray-600">
                  {loading ? 'Loading...' : `${properties.length} properties found`}
                </p>
              </div>
              
              <div className="flex gap-2 mt-4 sm:mt-0">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  onClick={() => setViewMode('list')}
                  className="flex items-center gap-2"
                >
                  <List className="h-4 w-4" />
                  List
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'outline'}
                  onClick={() => setViewMode('map')}
                  className="flex items-center gap-2"
                >
                  <Map className="h-4 w-4" />
                  Map
                </Button>
              </div>
            </div>
            {loading ? (
              <div className="text-center">
                <div className="loading-dots">
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
                <p className="mt-4 text-lg text-muted-foreground">Loading properties...</p>
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">No Results Found</h2>
                <p className="text-muted-foreground mb-8">
                  We couldn't find any properties matching your search.
                </p>
                <Link href="/search">
                  <Button>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Clear Filters and Start Over
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {viewMode === 'list' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {properties.map((property) => (
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
                    <SimpleMap 
                      properties={properties.filter(p => p.coordinates)}
                      center={searchLocation?.coordinates}
                      zoom={12}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
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
