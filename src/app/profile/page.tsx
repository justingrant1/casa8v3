"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { LocationSearch } from '@/components/location-search'
import { CheckCircle, Users, MapPin, Home } from 'lucide-react'

export default function ProfilePage() {
  const { user, profile, updateProfile } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [hasSection8Voucher, setHasSection8Voucher] = useState<boolean | undefined>(undefined)
  const [voucherBedroomCount, setVoucherBedroomCount] = useState<number | null>(null)
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '')
      setLastName(profile.last_name || '')
      setPhone(profile.phone || '')
      setHasSection8Voucher(profile.has_section8_voucher)
      setVoucherBedroomCount(profile.voucher_bedroom_count)
      setCity(profile.city || '')
    }
  }, [profile])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    let avatar_url = profile?.avatar_url

    if (avatarFile) {
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(`${user!.id}/${Date.now()}`, avatarFile)

      if (error) {
        console.error(error)
      } else {
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(data.path)
        avatar_url = publicUrl
      }
    }

    const { error } = await updateProfile({
      first_name: firstName,
      last_name: lastName,
      phone,
      avatar_url,
      has_section8_voucher: hasSection8Voucher,
      voucher_bedroom_count: voucherBedroomCount,
      city,
    })

    if (error) {
      console.error(error)
    } else {
      setMessage('Profile updated successfully!')
    }

    setLoading(false)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
          <CardDescription>Update your personal information and housing preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Personal Information</h3>
              </div>
              
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback>{profile?.first_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Label htmlFor="avatar">Update Profile Picture</Label>
                  <Input
                    id="avatar"
                    type="file"
                    onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user?.email || ''} disabled />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <Separator />

            {/* Housing Preferences Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Home className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Housing Preferences</h3>
              </div>

              {/* Section 8 Voucher */}
              <div className="space-y-3">
                <Label>Section 8 Housing Voucher</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      hasSection8Voucher === true ? 'border-primary bg-primary/5' : 'border-gray-200'
                    }`}
                    onClick={() => setHasSection8Voucher(true)}
                  >
                    <CardContent className="p-4 text-center">
                      <CheckCircle className={`w-8 h-8 mx-auto mb-2 ${
                        hasSection8Voucher === true ? 'text-primary' : 'text-gray-400'
                      }`} />
                      <p className="font-medium">Yes, I have a voucher</p>
                    </CardContent>
                  </Card>

                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      hasSection8Voucher === false ? 'border-primary bg-primary/5' : 'border-gray-200'
                    }`}
                    onClick={() => {
                      setHasSection8Voucher(false)
                      setVoucherBedroomCount(null)
                    }}
                  >
                    <CardContent className="p-4 text-center">
                      <Users className={`w-8 h-8 mx-auto mb-2 ${
                        hasSection8Voucher === false ? 'text-primary' : 'text-gray-400'
                      }`} />
                      <p className="font-medium">No, I don't have a voucher</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Voucher Bedroom Count - Only show if they have a voucher */}
              {hasSection8Voucher === true && (
                <div className="space-y-2">
                  <Label htmlFor="voucherBedroomCount">Voucher Bedroom Count</Label>
                  <Select
                    value={voucherBedroomCount?.toString() || ''}
                    onValueChange={(value) => setVoucherBedroomCount(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select bedroom count" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Studio</SelectItem>
                      <SelectItem value="1">1 Bedroom</SelectItem>
                      <SelectItem value="2">2 Bedrooms</SelectItem>
                      <SelectItem value="3">3 Bedrooms</SelectItem>
                      <SelectItem value="4">4 Bedrooms</SelectItem>
                      <SelectItem value="5">5+ Bedrooms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>City</span>
                  </div>
                </Label>
                <LocationSearch
                  placeholder="Search for a city..."
                  value={city}
                  onLocationSelect={(location) => {
                    setCity(`${location.city}, ${location.state}`)
                  }}
                />
                {city && (
                  <p className="text-sm text-gray-600 mt-1">
                    Selected: {city}
                  </p>
                )}
              </div>
            </div>

            {message && <p className="text-sm text-green-500">{message}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Updating...' : 'Update Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
