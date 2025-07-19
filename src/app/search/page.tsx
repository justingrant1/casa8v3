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
import { PropertyCard } from "@/components/property-card"
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
  
  const updateViewMode = (mode: 'list' | 'map') => {
    setViewMode(mode)
    // Update URL to maintain state
    const currentParams = new URLSearchParams(window.location.search)
    if (mode === 'map') {
      currentParams.set('view', 'map')
    } else {
      currentParams.delete('view')
    }
    const newUrl = `${window.location.pathname}${currentParams.toString() ? '?' + currentParams.toString() : ''}`
    window.history.replaceState({}, '', newUrl)
  }
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('price_asc')

  // Listen for URL parameter changes and update view mode
  useEffect(() => {
    const currentView = searchParams.get('view') === 'map' ? 'map' : 'list'
    setViewMode(currentView)
  }, [searchParams])

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true)
      try {
        // Read all possible search parameters
        const location = searchParams.get('location') || ''
        const city = searchParams.get('city') || ''
        const state = searchParams.get('state') || ''
        const lat = searchParams.get('lat')
        const lng = searchParams.get('lng')
        const bedrooms = searchParams.get('bedrooms') || 'any'

        // Build comprehensive filters
        const propertyFilters: any = {}
        
        // Handle location search - prioritize structured city/state over general location
        if (city) {
          propertyFilters.city = city
        } else if (location) {
          propertyFilters.city = location
        }
        
        if (state) {
          propertyFilters.state = state
        }
        
        // Add coordinate information for geographic filtering
        if (lat && lng) {
          propertyFilters.coordinates = {
            lat: parseFloat(lat),
            lng: parseFloat(lng)
          }
        }
        
        if (bedrooms !== 'any') {
          propertyFilters.bedrooms = parseInt(bedrooms)
        }

        // Use the most specific search term available
        const searchTerm = city || location || ''
        
        const data = await searchProperties(searchTerm, propertyFilters)
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
                      onClick={() => updateViewMode('list')}
                      className="rounded-full"
                    >
                      <List className="h-4 w-4 mr-2" />
                      List
                    </Button>
                    <Button
                      variant={viewMode === 'map' ? 'secondary' : 'ghost'}
                      onClick={() => updateViewMode('map')}
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {sortedProperties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              ) : (
                <div className="h-[600px] rounded-lg overflow-hidden">
                  {properties.length > 0 ? (
                    <SimpleMap 
                      properties={properties.map(property => ({
                        ...property,
                        coordinates: property.coordinates || (property.latitude && property.longitude ? {
                          lat: parseFloat(property.latitude),
                          lng: parseFloat(property.longitude)
                        } : null)
                      }))}
                      searchCoordinates={(() => {
                        const lat = searchParams.get('lat')
                        const lng = searchParams.get('lng')
                        return (lat && lng) ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined
                      })()}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
                      <div className="text-center">
                        <Map className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Properties Found</h3>
                        <p className="text-gray-500">Try adjusting your search criteria to see more properties on the map.</p>
                      </div>
                    </div>
                  )}
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
