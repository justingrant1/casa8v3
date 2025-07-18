"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LocationSearch } from '@/components/location-search'
import { Search, Map } from 'lucide-react'

function SearchFormContent() {
  const [location, setLocation] = useState('')
  const [searchLocation, setSearchLocation] = useState<any>(null)
  const [bedrooms, setBedrooms] = useState('any')
  const router = useRouter()
  const searchParams = useSearchParams()

  // Initialize form with current search parameters
  useEffect(() => {
    const currentLocation = searchParams.get('location') || ''
    const currentBedrooms = searchParams.get('bedrooms') || 'any'
    setLocation(currentLocation)
    setBedrooms(currentBedrooms)
  }, [searchParams])

  const handleLocationSelect = (locationData: any) => {
    setSearchLocation(locationData)
    // Update the location string for display
    setLocation(`${locationData.city}, ${locationData.state}`)
  }

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    const searchParams = new URLSearchParams()
    
    if (searchLocation) {
      if (searchLocation.city) searchParams.append('city', searchLocation.city)
      if (searchLocation.state) searchParams.append('state', searchLocation.state)
      if (searchLocation.coordinates) {
        searchParams.append('lat', searchLocation.coordinates.lat.toString())
        searchParams.append('lng', searchLocation.coordinates.lng.toString())
      }
    } else if (location) {
      searchParams.append('location', location)
    }

    if (bedrooms !== 'any') {
      searchParams.append('bedrooms', bedrooms)
    }

    router.push(`/search?${searchParams.toString()}`)
  }

  const handleMapView = () => {
    const searchParams = new URLSearchParams()
    
    if (searchLocation) {
      if (searchLocation.city) searchParams.append('city', searchLocation.city)
      if (searchLocation.state) searchParams.append('state', searchLocation.state)
      if (searchLocation.coordinates) {
        searchParams.append('lat', searchLocation.coordinates.lat.toString())
        searchParams.append('lng', searchLocation.coordinates.lng.toString())
      }
    } else if (location) {
      searchParams.append('location', location)
    }

    if (bedrooms !== 'any') {
      searchParams.append('bedrooms', bedrooms)
    }

    searchParams.append('view', 'map')
    router.push(`/search?${searchParams.toString()}`)
  }

  return (
    <div className="bg-white">
      <div className="px-6 py-6">
        <h2 className="text-3xl font-bold mb-6">Find Your Perfect Home</h2>
      </div>
      <form onSubmit={handleSearch} className="space-y-4 px-6">
        <LocationSearch
          placeholder="Enter city, neighborhood, or ZIP code..."
          value={location}
          onLocationSelect={handleLocationSelect}
          className="w-full"
        />
        <Select value={bedrooms} onValueChange={setBedrooms}>
          <SelectTrigger className="h-12 text-base">
            <SelectValue placeholder="Any bedrooms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any bedrooms</SelectItem>
            <SelectItem value="1">1 Bedroom</SelectItem>
            <SelectItem value="2">2 Bedrooms</SelectItem>
            <SelectItem value="3">3 Bedrooms</SelectItem>
            <SelectItem value="4">4+ Bedrooms</SelectItem>
          </SelectContent>
        </Select>
      </form>
      <div className="mt-4">
        <Button 
          type="submit" 
          className="w-full bg-gray-900 text-white hover:bg-gray-800 rounded-none h-14 text-base font-medium"
          onClick={handleSearch}
        >
          <Search className="mr-2 h-5 w-5" />
          Search Properties
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-none h-14 text-base font-medium border-0 border-t"
          onClick={handleMapView}
        >
          <Map className="mr-2 h-5 w-5" />
          Map View
        </Button>
      </div>
    </div>
  )
}

function SearchFormFallback() {
  return (
    <div className="bg-white">
      <div className="px-6 py-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse mb-6"></div>
      </div>
      <div className="space-y-4 px-6">
        <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="mt-4">
        <div className="h-14 bg-gray-200 rounded animate-pulse mb-1"></div>
        <div className="h-14 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  )
}

export function SearchForm() {
  return (
    <Suspense fallback={<SearchFormFallback />}>
      <SearchFormContent />
    </Suspense>
  )
}
