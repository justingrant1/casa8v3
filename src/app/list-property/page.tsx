"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function ListPropertyPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [sqft, setSqft] = useState('')
  const [amenities, setAmenities] = useState<string[]>([])
  const [images, setImages] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAmenityChange = (amenity: string) => {
    setAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    )
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('You must be logged in to list a property.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Upload images to Supabase Storage
      const imageUrls: string[] = []
      for (const image of images) {
        const { data, error } = await supabase.storage
          .from('property-images')
          .upload(`${user.id}/${Date.now()}_${image.name}`, image)

        if (error) throw error
        
        const { data: { publicUrl } } = supabase.storage.from('property-images').getPublicUrl(data.path)
        imageUrls.push(publicUrl)
      }

      // 2. Fetch the user's profile to get the correct landlord_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        throw new Error('Could not find a landlord profile for the current user.')
      }

      // 3. Insert property data into the database
      const { error: dbError } = await supabase.from('properties').insert({
        landlord_id: profile.id,
        title,
        description,
        price: parseFloat(price),
        property_type: propertyType,
        address,
        city,
        state,
        zip_code: zipCode,
        bedrooms: parseInt(bedrooms),
        bathrooms: parseFloat(bathrooms),
        sqft: parseInt(sqft),
        amenities,
        images: imageUrls,
      })

      if (dbError) throw dbError

      router.push('/dashboard')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>List a New Property</CardTitle>
          <CardDescription>Fill out the details of your property to get it listed.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Property Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (per month)</Label>
                <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="propertyType">Property Type</Label>
                <Select value={propertyType} onValueChange={(value: string) => setPropertyType(value)}>
                  <SelectTrigger id="propertyType">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Apartment">Apartment</SelectItem>
                    <SelectItem value="House">House</SelectItem>
                    <SelectItem value="Condo">Condo</SelectItem>
                    <SelectItem value="Townhouse">Townhouse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" value={state} onChange={(e) => setState(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input id="zipCode" value={zipCode} onChange={(e) => setZipCode(e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input id="bedrooms" type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input id="bathrooms" type="number" step="0.5" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sqft">Square Feet</Label>
                <Input id="sqft" type="number" value={sqft} onChange={(e) => setSqft(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Amenities</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {['Washer/Dryer', 'Air Conditioning', 'Parking', 'Dishwasher', 'Pet Friendly', 'Gym'].map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={amenity}
                      checked={amenities.includes(amenity)}
                      onChange={() => handleAmenityChange(amenity)}
                    />
                    <Label htmlFor={amenity}>{amenity}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="images">Images</Label>
              <Input id="images" type="file" multiple onChange={handleImageChange} />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Listing Property...' : 'List Property'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
