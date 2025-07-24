import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Users, Home, TrendingUp, Building, Bed, Bath, Square } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { PropertyCard } from '@/components/property-card'
import { SearchForm } from '@/components/search-form'
import { 
  getLocationBySlug, 
  formatNumber,
  formatCurrency,
  MAJOR_CITIES 
} from '@/lib/locations'
import { getProperties, formatPropertyForFrontend } from '@/lib/properties'

interface ApartmentPageProps {
  params: {
    state: string
    city: string
  }
}

export async function generateStaticParams() {
  return MAJOR_CITIES.map((city) => ({
    state: city.stateSlug,
    city: city.slug,
  }))
}

export async function generateMetadata({ params }: ApartmentPageProps): Promise<Metadata> {
  const location = getLocationBySlug(params.city, params.state)
  
  if (!location) {
    return {
      title: 'City Not Found | Casa8',
      description: 'The requested city page could not be found.'
    }
  }

  const title = `Section 8 Apartments in ${location.city}, ${location.state} | Casa8`
  const description = `Find Section 8 approved apartments in ${location.city}, ${location.state}. Browse ${formatNumber(Math.floor(location.population / 200))}+ affordable apartment rentals that accept housing vouchers. Studio, 1BR, 2BR, 3BR+ available.`

  return {
    title,
    description,
    keywords: [
      `section 8 apartments ${location.city.toLowerCase()}`,
      `affordable apartments ${location.city.toLowerCase()}`,
      `section 8 apartment rentals ${location.city.toLowerCase()}`,
      `housing voucher apartments ${location.city.toLowerCase()}`,
      `subsidized apartments ${location.city.toLowerCase()}`,
      `low income apartments ${location.city.toLowerCase()}`,
      `1 bedroom apartments section 8 ${location.city.toLowerCase()}`,
      `2 bedroom apartments section 8 ${location.city.toLowerCase()}`,
      `3 bedroom apartments section 8 ${location.city.toLowerCase()}`,
      `studio apartments section 8 ${location.city.toLowerCase()}`
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://casa8.com/locations/${params.state}/${params.city}/apartments`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `/locations/${params.state}/${params.city}/apartments`,
    },
  }
}

export default async function ApartmentPage({ params }: ApartmentPageProps) {
  const location = getLocationBySlug(params.city, params.state)
  
  if (!location) {
    notFound()
  }

  // Get apartment properties in this city
  const properties = await getProperties({ 
    limit: 20,
    city: location.city,
    state: location.state,
    propertyType: 'apartment'
  })
  const formattedProperties = properties.map(formatPropertyForFrontend)

  // Filter by bedroom counts for statistics
  const studioApts = formattedProperties.filter(p => p.bedrooms === 0)
  const oneBedroomApts = formattedProperties.filter(p => p.bedrooms === 1)
  const twoBedroomApts = formattedProperties.filter(p => p.bedrooms === 2)
  const threeBedroomApts = formattedProperties.filter(p => p.bedrooms === 3)
  const fourPlusBedroomApts = formattedProperties.filter(p => p.bedrooms >= 4)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/8 via-primary/4 to-background py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
              <Link href="/" className="hover:text-primary">Home</Link>
              <span>/</span>
              <Link href={`/locations/${params.state}`} className="hover:text-primary capitalize">
                {location.state}
              </Link>
              <span>/</span>
              <Link href={`/locations/${params.state}/${params.city}`} className="hover:text-primary">
                {location.city}
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">Apartments</span>
            </nav>

            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
                Section 8 <span className="text-primary">Apartments</span> in {location.city}, {location.stateCode}
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed max-w-4xl mx-auto">
                Discover quality apartment rentals that accept Section 8 housing vouchers in {location.city}. 
                From studios to family-sized units, find your perfect affordable apartment home today.
              </p>
              
              {/* Apartment Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                  <Building className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="text-lg font-bold text-gray-900">{formattedProperties.length}</div>
                  <div className="text-xs text-gray-600">Available Apartments</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                  <Home className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(location.fairMarketRent.oneBedroom)}</div>
                  <div className="text-xs text-gray-600">1BR Fair Market Rent</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                  <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(location.fairMarketRent.twoBedroom)}</div>
                  <div className="text-xs text-gray-600">2BR Fair Market Rent</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                  <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(location.fairMarketRent.threeBedroom)}</div>
                  <div className="text-xs text-gray-600">3BR Fair Market Rent</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">
              Search Section 8 Apartments in {location.city}
            </h2>
            <SearchForm />
          </div>
        </div>
      </section>

      {/* Apartment Types Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gray-900">
              Apartments by Bedroom Count
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Find the perfect apartment size for your family in {location.city}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Studio Apartments */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Studio Apartments</span>
                  <Badge variant="secondary">{studioApts.length} available</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Fair Market Rent:</span>
                    <span className="font-medium">{formatCurrency(location.fairMarketRent.studio)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ideal for:</span>
                    <span className="font-medium">Singles, Students</span>
                  </div>
                  <div className="pt-4">
                    <Link href={`/search?city=${location.city}&state=${location.state}&bedrooms=0&type=apartment`}>
                      <Button className="w-full" size="sm">
                        View Studio Apartments
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 1 Bedroom Apartments */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>1 Bedroom Apartments</span>
                  <Badge variant="secondary">{oneBedroomApts.length} available</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Fair Market Rent:</span>
                    <span className="font-medium">{formatCurrency(location.fairMarketRent.oneBedroom)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ideal for:</span>
                    <span className="font-medium">Singles, Couples</span>
                  </div>
                  <div className="pt-4">
                    <Link href={`/search?city=${location.city}&state=${location.state}&bedrooms=1&type=apartment`}>
                      <Button className="w-full" size="sm">
                        View 1BR Apartments
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2 Bedroom Apartments */}
            <Card className="hover:shadow-lg transition-shadow border-2 border-primary">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>2 Bedroom Apartments</span>
                  <Badge className="bg-primary text-primary-foreground">{twoBedroomApts.length} available</Badge>
                </CardTitle>
                <Badge variant="outline" className="w-fit mx-auto">Most Popular</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Fair Market Rent:</span>
                    <span className="font-medium">{formatCurrency(location.fairMarketRent.twoBedroom)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ideal for:</span>
                    <span className="font-medium">Small Families</span>
                  </div>
                  <div className="pt-4">
                    <Link href={`/search?city=${location.city}&state=${location.state}&bedrooms=2&type=apartment`}>
                      <Button className="w-full" size="sm">
                        View 2BR Apartments
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3 Bedroom Apartments */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>3 Bedroom Apartments</span>
                  <Badge variant="secondary">{threeBedroomApts.length} available</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Fair Market Rent:</span>
                    <span className="font-medium">{formatCurrency(location.fairMarketRent.threeBedroom)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ideal for:</span>
                    <span className="font-medium">Growing Families</span>
                  </div>
                  <div className="pt-4">
                    <Link href={`/search?city=${location.city}&state=${location.state}&bedrooms=3&type=apartment`}>
                      <Button className="w-full" size="sm">
                        View 3BR Apartments
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 4+ Bedroom Apartments */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>4+ Bedroom Apartments</span>
                  <Badge variant="secondary">{fourPlusBedroomApts.length} available</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Fair Market Rent:</span>
                    <span className="font-medium">{formatCurrency(location.fairMarketRent.fourBedroom)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ideal for:</span>
                    <span className="font-medium">Large Families</span>
                  </div>
                  <div className="pt-4">
                    <Link href={`/search?city=${location.city}&state=${location.state}&bedrooms=4&type=apartment`}>
                      <Button className="w-full" size="sm">
                        View 4BR+ Apartments
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* All Apartments */}
            <Card className="hover:shadow-lg transition-shadow bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>All Apartments</span>
                  <Badge variant="outline">{formattedProperties.length} total</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Price Range:</span>
                    <span className="font-medium">{formatCurrency(location.fairMarketRent.studio)} - {formatCurrency(location.fairMarketRent.fourBedroom)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">All Sizes:</span>
                    <span className="font-medium">Studio to 4BR+</span>
                  </div>
                  <div className="pt-4">
                    <Link href={`/search?city=${location.city}&state=${location.state}&type=apartment`}>
                      <Button variant="outline" className="w-full" size="sm">
                        View All Apartments
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Apartments */}
      {formattedProperties.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-12">
              <div className="mb-6 lg:mb-0">
                <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gray-900">
                  Featured Section 8 Apartments in {location.city}
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl">
                  {formattedProperties.length} quality apartment rentals accepting housing vouchers
                </p>
              </div>
              <Link href={`/search?city=${location.city}&state=${location.state}&type=apartment`}>
                <Button variant="outline" size="lg" className="font-medium px-8">
                  View All Apartments
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {formattedProperties.slice(0, 9).map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            {formattedProperties.length > 9 && (
              <div className="text-center mt-12">
                <Link href={`/search?city=${location.city}&state=${location.state}&type=apartment`}>
                  <Button size="lg" className="px-8">
                    View All {formattedProperties.length} Apartments
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Apartment Living Benefits */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold mb-8 text-gray-900 text-center">
              Why Choose Section 8 Apartments in {location.city}?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-primary" />
                    Apartment Living Advantages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>Lower maintenance responsibilities - landlord handles repairs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>Often includes amenities like laundry, parking, or fitness centers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>Better security with controlled access and neighbors nearby</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>More affordable than houses, perfect for Section 8 budgets</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>Often located near public transportation and services</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="w-5 h-5 text-primary" />
                    Section 8 Apartment Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>Rent capped at Fair Market Rent limits for affordability</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>You pay only 30% of your income toward rent</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>Housing Quality Standards ensure safe, decent conditions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>Portable vouchers - move to different apartments if needed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>Protection under fair housing laws and regulations</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12 text-center">
              <h3 className="text-2xl font-bold mb-4 text-gray-900">
                Ready to Find Your Perfect Apartment?
              </h3>
              <p className="text-xl text-gray-600 mb-8">
                Browse {formattedProperties.length} Section 8 approved apartments in {location.city}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={`/search?city=${location.city}&state=${location.state}&type=apartment`}>
                  <Button size="lg" className="px-8">
                    Search All Apartments
                  </Button>
                </Link>
                <Link href="/register?role=tenant">
                  <Button size="lg" variant="outline" className="px-8">
                    Create Account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary via-primary to-primary/90 text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              List Your Section 8 Apartments in {location.city}
            </h2>
            <p className="text-xl mb-8 opacity-95">
              Connect with qualified tenants who have housing vouchers ready to rent
            </p>
            <Link href="/list-property">
              <Button size="lg" variant="secondary" className="px-8">
                List Your Apartment
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
