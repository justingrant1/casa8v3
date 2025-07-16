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
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Find Your Perfect Home</h2>
      <form onSubmit={handleSearch} className="space-y-4">
        <Input
          type="text"
          placeholder="Enter city, neighborhood, or ZIP code..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full"
        />
        <Select value={bedrooms} onValueChange={setBedrooms}>
          <SelectTrigger>
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
        <Button type="submit" className="w-full bg-gray-900 text-white hover:bg-gray-800">
          <Search className="mr-2 h-4 w-4" />
          Search Properties
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => router.push('/search?view=map')}
        >
          <Map className="mr-2 h-4 w-4" />
          Map View
        </Button>
      </form>
    </div>
  )
}
