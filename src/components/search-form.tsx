"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Map } from 'lucide-react'

export function SearchForm() {
  const [location, setLocation] = useState('')
  const [bedrooms, setBedrooms] = useState('any')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const query = new URLSearchParams({
      location,
      bedrooms,
    }).toString()
    router.push(`/search?${query}`)
  }

  return (
    <div className="bg-white">
      <div className="px-6 py-6">
        <h2 className="text-3xl font-bold mb-6">Find Your Perfect Home</h2>
      </div>
      <form onSubmit={handleSearch} className="space-y-4 px-6">
        <Input
          type="text"
          placeholder="Enter city, neighborhood, or ZIP code..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full text-base h-12"
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
          onClick={() => router.push('/search?view=map')}
        >
          <Map className="mr-2 h-5 w-5" />
          Map View
        </Button>
      </div>
    </div>
  )
}
