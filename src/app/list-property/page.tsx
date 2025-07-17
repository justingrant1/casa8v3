"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { VideoUpload } from '@/components/video-upload'
import { useGoogleMaps, geocodeAddress, initializeAutocomplete, parsePlaceResult } from '@/lib/google-maps'
import { MapPin, Star } from 'lucide-react'

export default function ListPropertyPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { isLoaded: mapsLoaded } = useGoogleMaps()
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [propertyType, setPropertyType] = useState('')
  
  // Address handling
  const [fullAddress, setFullAddress] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [manualOverride, setManualOverride] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  
  const [bedrooms, setBedrooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [sqft, setSqft] = useState('')
  const [amenities, setAmenities] = useState<string[]>([])
  const [images, setImages] = useState<File[]>([])
  const [videos, setVideos] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addressInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  // Initialize Google Maps autocomplete
  useEffect(() => {
    if (mapsLoaded && addressInputRef.current && !autocompleteRef.current && !manualOverride) {
      autocompleteRef.current = initializeAutocomplete(addressInputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'us' },
        fields: ['formatted_address', 'geometry', 'address_components', 'place_id'],
        onPlaceChanged: (place) => {
          const parsed = parsePlaceResult(place)
          
          if (parsed.coordinates) {
            setFullAddress(parsed.formatted_address)
            setCoordinates(parsed.coordinates)
            
            // Parse address components
            const addressComponents = place.address_components || []
            let streetNumber = ''
            let route = ''
            let zipCode = ''
            
            addressComponents.forEach(component => {
              const types = component.types
              if (types.includes('street_number')) {
                streetNumber = component.long_name
              } else if (types.includes('route')) {
                route = component.long_name
              } else if (types.includes('postal_code')) {
                zipCode = component.long_name
              }
            })
            
            setAddress(`${streetNumber} ${route}`.trim())
            setCity(parsed.city)
            setState(parsed.state)
            setZipCode(zipCode)
          }
        }
      })
    }
  }, [mapsLoaded, manualOverride])

  // Manual geocoding for override mode
  const handleGeocodeAddress = async () => {
    if (!fullAddress.trim()) return
    
    setGeocoding(true)
    try {
      const result = await geocodeAddress(fullAddress)
      if (result) {
        setCoordinates({ lat: result.lat, lng: result.lng })
        
        // Parse the result to fill in city, state, etc.
        const addressComponents = result.address_components || []
        let streetNumber = ''
        let route = ''
        let city = ''
        let state = ''
        let zipCode = ''
        
        addressComponents.forEach(component => {
          const types = component.types
          if (types.includes('street_number')) {
            streetNumber = component.long_name
          } else if (types.includes('route')) {
            route = component.long_name
          } else if (types.includes('locality')) {
            city = component.long_name
          } else if (types.includes('administrative_area_level_1')) {
            state = component.short_name
          } else if (types.includes('postal_code')) {
            zipCode = component.long_name
          }
        })
        
        setAddress(`${streetNumber} ${route}`.trim())
        setCity(city)
        setState(state)
        setZipCode(zipCode)
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      setError('Failed to geocode address. Please check the address and try again.')
    } finally {
      setGeocoding(false)
    }
  }

  const handleAmenityChange = (amenity: string) => {
    setAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    )
  }

  const handleGenerateWithAI = async () => {
    if (!fullAddress.trim()) {
      setError('Please enter a property address first before generating with AI.')
      return
    }

    setAiGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/generate-listing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: fullAddress
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate listing')
      }

      if (result.success && result.data) {
        const data = result.data
        
        // Populate form fields with AI-generated data
        setTitle(data.title)
        setDescription(data.description)
        setBedrooms(data.bedrooms.toString())
        setBathrooms(data.bathrooms.toString())
        setSqft(data.sqft.toString())
        setPropertyType(data.propertyType)
        setPrice(data.price.toString())
        
        // Update amenities
        setAmenities(data.amenities)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setAiGenerating(false)
    }
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

      // 2. Videos are already uploaded URLs from VideoUpload component
      const videoUrls: string[] = videos

      // 3. Fetch the user's profile to get the correct landlord_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        throw new Error('Could not find a landlord profile for the current user.')
      }

      // 4. Insert property data into the database
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
        latitude: coordinates?.lat?.toString() || null,
        longitude: coordinates?.lng?.toString() || null,
        bedrooms: parseInt(bedrooms),
        bathrooms: parseFloat(bathrooms),
        sqft: parseInt(sqft),
        amenities,
        images: imageUrls,
        videos: videoUrls,
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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Section */}
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Information</h2>
              <p className="text-gray-600">Provide basic details about your property</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700">Property Title</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="text-sm"
                    onClick={handleGenerateWithAI}
                    disabled={aiGenerating || !fullAddress.trim()}
                  >
                    <Star className="h-4 w-4 mr-1" />
                    {aiGenerating ? 'Generating...' : 'Complete with AI'}
                  </Button>
                </div>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g., Modern Downtown Apartment"
                  className="h-12"
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                <Textarea 
                  id="description" 
                  value={description} 
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                  placeholder="Describe your property, its features, and what makes it special..."
                  className="min-h-32 resize-none"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="propertyType" className="text-sm font-medium text-gray-700">Property Type</Label>
                  <Select value={propertyType} onValueChange={(value: string) => setPropertyType(value)}>
                    <SelectTrigger id="propertyType" className="h-12">
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Apartment">Apartment</SelectItem>
                      <SelectItem value="House">House</SelectItem>
                      <SelectItem value="Condo">Condo</SelectItem>
                      <SelectItem value="Townhouse">Townhouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-medium text-gray-700">Monthly Rent ($)</Label>
                  <Input 
                    id="price" 
                    type="number" 
                    value={price} 
                    onChange={(e) => setPrice(e.target.value)} 
                    placeholder="2500"
                    className="h-12"
                    required 
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Section */}
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Location</h2>
              <p className="text-gray-600">Where is your property located?</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="address" className="text-sm font-medium text-gray-700">Property Address</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="manual-override"
                      checked={manualOverride}
                      onCheckedChange={(checked) => setManualOverride(checked as boolean)}
                    />
                    <Label htmlFor="manual-override" className="text-sm text-gray-600">
                      Enter manually
                    </Label>
                  </div>
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    ref={addressInputRef}
                    id="address"
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    placeholder="2712 Rutland St, Opa-locka, FL 33054, USA"
                    className="pl-12 h-12"
                    required
                  />
                </div>
              </div>

              {coordinates && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Parsed Address:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Street:</span> {address}
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">City:</span> {city}
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">State:</span> {state}
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">ZIP:</span> {zipCode}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Coordinates:</span> {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Property Details Section */}
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Details</h2>
              <p className="text-gray-600">Add details about your property</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="bedrooms" className="text-sm font-medium text-gray-700">Bedrooms</Label>
                  <Input 
                    id="bedrooms" 
                    type="number" 
                    value={bedrooms} 
                    onChange={(e) => setBedrooms(e.target.value)} 
                    className="h-12"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bathrooms" className="text-sm font-medium text-gray-700">Bathrooms</Label>
                  <Input 
                    id="bathrooms" 
                    type="number" 
                    step="0.5" 
                    value={bathrooms} 
                    onChange={(e) => setBathrooms(e.target.value)} 
                    className="h-12"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sqft" className="text-sm font-medium text-gray-700">Square Feet</Label>
                  <Input 
                    id="sqft" 
                    type="number" 
                    value={sqft} 
                    onChange={(e) => setSqft(e.target.value)} 
                    className="h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Amenities</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {['Washer/Dryer', 'Air Conditioning', 'Parking', 'Dishwasher', 'Pet Friendly', 'Gym'].map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Checkbox
                        id={amenity}
                        checked={amenities.includes(amenity)}
                        onCheckedChange={() => handleAmenityChange(amenity)}
                      />
                      <Label htmlFor={amenity} className="text-sm text-gray-700">{amenity}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Images Section */}
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Images</h2>
              <p className="text-gray-600">Upload photos of your property</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="images" className="text-sm font-medium text-gray-700">Images</Label>
              <Input 
                id="images" 
                type="file" 
                multiple 
                accept="image/*" 
                onChange={handleImageChange}
                className="h-12"
              />
            </div>
          </CardContent>
        </Card>

        {/* Property Videos Section */}
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <VideoUpload 
              onVideoUpload={(videoUrl) => setVideos(prev => [...prev, videoUrl])}
              onVideoRemove={(videoUrl) => setVideos(prev => prev.filter(url => url !== videoUrl))}
              existingVideos={videos}
              maxVideos={5}
              maxSizeInMB={100}
            />
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium" 
          disabled={loading}
        >
          {loading ? 'Listing Property...' : 'List Property'}
        </Button>
      </form>
    </div>
  )
}
