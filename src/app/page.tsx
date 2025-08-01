"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Search, TrendingUp, Shield, Users, Map } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ContactLandlordModal } from "@/components/contact-landlord-modal"
import { LocationSearch } from "@/components/location-search"
import { TenantOnboarding } from "@/components/tenant-onboarding"
import { useAuth } from "@/lib/auth"
import { useFavorites } from "@/lib/favorites-context"
import { getProperties, getNearbyProperties } from "@/lib/properties"
import { useLocation } from "@/hooks/use-location"
import { MapPin as LocationIcon } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { PropertyCard } from "@/components/property-card"

export default function HomePage() {
  const router = useRouter()
  const { user, profile, signOut, loading, completeOnboarding } = useAuth()
  const { toggleFavorite, isFavorite } = useFavorites()
  const { location: browserLocation, requestLocation } = useLocation()
  const [properties, setProperties] = useState<any[]>([])
  const [propertiesLoading, setPropertiesLoading] = useState(true)
  const [contactModal, setContactModal] = useState<{
    isOpen: boolean
    landlord?: { id: string; name: string; phone: string; email: string }
    property?: { title: string; id: string }
  }>({
    isOpen: false,
  })
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [searchLocation, setSearchLocation] = useState<any>(null)
  const [bedrooms, setBedrooms] = useState<string>('any')

  // Request user location on mount
  useEffect(() => {
    requestLocation()
  }, [requestLocation])

  // Check if tenant needs onboarding
  useEffect(() => {
    if (user && profile && profile.role === 'tenant' && !profile.onboarding_completed) {
      setShowOnboarding(true)
    }
  }, [user, profile])

  // Fetch properties from database
  useEffect(() => {
    async function fetchProperties() {
      try {
        setPropertiesLoading(true)
        
        // If user location is available, get nearby properties
        if (browserLocation) {
          console.log('Getting nearby properties for location:', browserLocation)
          const nearbyProperties = await getNearbyProperties(
            browserLocation.latitude,
            browserLocation.longitude,
            100, // 100km radius
            6 // limit to 6 properties
          )
          setProperties(nearbyProperties)
        } else {
          // Fallback to regular properties if no location
          const data = await getProperties({ limit: 6 })
          setProperties(data)
        }
      } catch (error) {
        console.error('Error fetching properties:', error)
        // Fallback to regular properties on error
        try {
          const data = await getProperties({ limit: 6 })
          setProperties(data)
        } catch (fallbackError) {
          console.error('Error fetching fallback properties:', fallbackError)
        }
      } finally {
        setPropertiesLoading(false)
      }
    }

    fetchProperties()
  }, [browserLocation]) // Re-fetch when user location is available

  const openContactModal = (property: any) => {
    setContactModal({
      isOpen: true,
      landlord: {
        id: property.landlord_id || 'temp-id',
        name: property.landlord,
        phone: property.landlord_phone || "Phone not available",
        email: property.landlord_email || "Email not available",
      },
      property: {
        title: property.title,
        id: property.id,
      },
    })
  }

  const closeContactModal = () => {
    setContactModal({ isOpen: false })
  }

  const handlePostListing = () => {
    if (user) {
      router.push("/list-property")
    } else {
      router.push("/login")
    }
  }

  const handleSignOut = async () => {
    await signOut()
    // Don't need router.push since signOut() already handles redirect
  }

  const handleToggleFavorite = (propertyId: string) => {
    if (!user) {
      router.push('/login')
      return
    }
    
    toggleFavorite(propertyId)
  }

  const handleSearch = (mapView = false) => {
    const searchParams = new URLSearchParams()
    
    if (searchLocation) {
      if (searchLocation.city) searchParams.append('city', searchLocation.city)
      if (searchLocation.state) searchParams.append('state', searchLocation.state)
      if (searchLocation.coordinates) {
        searchParams.append('lat', searchLocation.coordinates.lat.toString())
        searchParams.append('lng', searchLocation.coordinates.lng.toString())
      }
    }

    if (bedrooms !== 'any') {
      searchParams.append('bedrooms', bedrooms)
    }

    if (mapView) {
      searchParams.append('view', 'map')
    }

    router.push(`/search?${searchParams.toString()}`)
  }

  const handleOnboardingComplete = async (data: any) => {
    console.log('🏠 Homepage: handleOnboardingComplete called with data:', data)
    
    try {
      console.log('🔄 Calling completeOnboarding from auth context...')
      const result = await completeOnboarding(data)
      
      console.log('📋 completeOnboarding result:', result)
      
      if (!result.error) {
        console.log('✅ Onboarding completed successfully!')
        console.log('📋 Current profile before update:', profile)
        
        // Close the modal immediately
        setShowOnboarding(false)
        
        // Show success message
        alert('Welcome to Casa8! Your preferences have been saved.')
        
        // Simple reload to ensure fresh state
        window.location.reload()
      } else {
        console.error('❌ Error completing onboarding:', result.error)
        alert(`Error saving preferences: ${result.error.message || result.error}`)
      }
    } catch (error) {
      console.error('❌ Exception in handleOnboardingComplete:', error)
      alert(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // No need to show loading screen on homepage - content can render immediately
  // Auth-dependent features will show/hide as auth status loads

  return (
    <div className="min-h-screen bg-background">
      <Navbar currentPage="home" />

      {/* Hero Section - Enhanced with sophisticated background */}
      <section className="relative bg-gradient-to-br from-primary/8 via-primary/4 to-background py-20 lg:py-28 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>

          {/* Geometric Shapes */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute top-1/2 right-0 w-80 h-80 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-gradient-to-br from-indigo-200/20 to-blue-200/20 rounded-full blur-3xl transform translate-y-1/2"></div>

          {/* Subtle Pattern Overlay */}
          <div className="absolute inset-0 opacity-30">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgb(99 102 241)" strokeWidth="0.5" opacity="0.1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Floating Elements */}
          <div className="absolute top-20 left-20 w-4 h-4 bg-primary/20 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-32 w-3 h-3 bg-purple-400/30 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-32 left-1/4 w-2 h-2 bg-indigo-400/40 rounded-full animate-pulse delay-2000"></div>
          <div className="absolute top-1/3 right-20 w-6 h-6 border border-primary/20 rounded-full animate-pulse delay-500"></div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-8 text-gray-900 leading-tight">
              Welcome Home
              <span className="text-primary block">with Section 8.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Discover thousands of <strong>affordable rentals that accept Section 8 vouchers</strong>. Whether you're a tenant seeking your next home or a landlord ready to list, join our community of <strong>over 10,000 verified listings</strong> today.
            </p>

            {/* Enhanced Search Bar with backdrop */}
            <div className="max-w-6xl mx-auto">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-white/20">
                <div className="flex flex-col lg:flex-row gap-4">
                  <LocationSearch
                    placeholder="Enter city, neighborhood, or ZIP code..."
                    onLocationSelect={setSearchLocation}
                  />

                  <div className="flex-shrink-0 w-full lg:w-48">
                    <Select value={bedrooms} onValueChange={setBedrooms}>
                      <SelectTrigger className="h-14 text-lg border-0 bg-gray-50 focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder="Select # of bedrooms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any bedrooms</SelectItem>
                        <SelectItem value="studio">Studio</SelectItem>
                        <SelectItem value="1">1 bedroom</SelectItem>
                        <SelectItem value="2">2 bedrooms</SelectItem>
                        <SelectItem value="3">3 bedrooms</SelectItem>
                        <SelectItem value="4">4 bedrooms</SelectItem>
                        <SelectItem value="5+">5+ bedrooms</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    size="lg"
                    className="h-14 px-8 text-lg font-semibold shadow-lg whitespace-nowrap w-full lg:w-auto bg-gray-900 hover:bg-gray-800 text-white font-medium flex items-center gap-2"
                    onClick={() => handleSearch()}
                  >
                    <Search className="w-5 h-5" />
                    Search Properties
                  </Button>
                  
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 px-6 text-lg font-semibold shadow-lg whitespace-nowrap w-full lg:w-auto border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    onClick={() => handleSearch(true)}
                  >
                    <Map className="w-5 h-5" />
                    Map View
                  </Button>
                </div>
              </div>
            </div>

            {/* Enhanced trust indicators with backdrop */}
            <div className="flex flex-wrap justify-center items-center gap-8 mt-12">
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                <Shield className="w-5 h-5 text-primary" />
                <span className="font-medium text-gray-700">Verified Properties</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-medium text-gray-700">25,000+ Happy Tenants</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="font-medium text-gray-700">10,000+ Properties</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties - Improved layout and visual hierarchy */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-12">
            <div className="mb-6 lg:mb-0">
              <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-gray-900">
                {browserLocation ? `Properties Near ${browserLocation.city || 'You'}, ${browserLocation.state || ''}` : 'Featured Properties'}
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl">
                {browserLocation 
                  ? `Properties closest to your location, sorted by distance`
                  : 'Discover our most popular rental properties, carefully selected for quality and value'
                }
              </p>
              {browserLocation && (
                <div className="flex items-center gap-2 mt-3">
                  <LocationIcon className="h-4 w-4 text-primary" />
                  <span className="text-sm text-gray-500">
                    Showing properties within 60 miles of your location
                  </span>
                </div>
              )}
            </div>
            <Link href="/search">
              <Button variant="outline" size="lg" className="font-medium px-8 bg-transparent">
                View All Properties
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {properties.map((property) => (
              <PropertyCard 
                key={property.id} 
                property={property}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Enhanced visual appeal */}
      <section className="bg-gradient-to-r from-primary via-primary to-primary/90 text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-xl md:text-2xl mb-12 opacity-95 leading-relaxed">
              Join thousands of landlords and tenants who trust our platform for their rental needs
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center max-w-2xl mx-auto">
              <Link href="/register?role=tenant" className="flex-1">
                <Button size="lg" variant="secondary" className="w-full h-14 text-lg font-semibold">
                  I'm Looking for a Home
                </Button>
              </Link>
              <Button
                size="lg"
                className="flex-1 bg-white text-primary hover:bg-gray-100 h-14 text-lg font-semibold"
                onClick={handlePostListing}
              >
                List My Property
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Improved spacing and organization */}
      <footer className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">C8</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">Casa8</span>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Your trusted partner in finding the perfect rental property. Making renting simple and secure.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-6 text-lg">For Tenants</h3>
              <ul className="space-y-4 text-gray-600">
                <li>
                  <Link href="/search" className="hover:text-primary transition-colors">
                    Search Properties
                  </Link>
                </li>
                <li>
                  <Link href="/saved" className="hover:text-primary transition-colors">
                    Saved Properties
                  </Link>
                </li>
                <li>
                  <Link href="/applications" className="hover:text-primary transition-colors">
                    My Applications
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-6 text-lg">For Landlords</h3>
              <ul className="space-y-4 text-gray-600">
                <li>
                  <Link href="/dashboard-simple" className="hover:text-primary transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/list-property" className="hover:text-primary transition-colors">
                    List Property
                  </Link>
                </li>
                <li>
                  <Link href="/applications" className="hover:text-primary transition-colors">
                    Applications
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-6 text-lg">Support</h3>
              <ul className="space-y-4 text-gray-600">
                <li>
                  <Link href="/help" className="hover:text-primary transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-primary transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-primary transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-primary transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-primary transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-12 pt-8 text-center text-gray-600">
            <p>&copy; 2024 Casa8. All rights reserved. Made with ❤️ for renters everywhere.</p>
          </div>
        </div>
      </footer>

      {contactModal.isOpen && contactModal.landlord && contactModal.property && (
        <ContactLandlordModal
          isOpen={contactModal.isOpen}
          onClose={closeContactModal}
          landlord={contactModal.landlord}
          property={contactModal.property}
        />
      )}

      {showOnboarding && (
        <TenantOnboarding
          isOpen={showOnboarding}
          onComplete={handleOnboardingComplete}
          onSkip={() => setShowOnboarding(false)}
        />
      )}
    </div>
  )
}
