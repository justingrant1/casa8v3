import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Users, Home, TrendingUp, Phone, ExternalLink, Bed, Bath, Square, DollarSign } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { PropertyCard } from '@/components/property-card'
import { SearchForm } from '@/components/search-form'
import { SimpleMap } from '@/components/simple-map'
import { 
  getLocationBySlug, 
  generateCityTitle, 
  generateCityDescription,
  formatNumber,
  formatCurrency,
  MAJOR_CITIES 
} from '@/lib/locations'
import { getProperties, formatPropertyForFrontend } from '@/lib/properties'

interface CityPageProps {
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

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const location = getLocationBySlug(params.city, params.state)
  
  if (!location) {
    return {
      title: 'City Not Found | Casa8',
      description: 'The requested city page could not be found.'
    }
  }

  const title = generateCityTitle(location.city, location.state)
  const description = generateCityDescription(location)

  return {
    title,
    description,
    keywords: [
      `section 8 housing ${location.city.toLowerCase()}`,
      `section 8 apartments ${location.city.toLowerCase()}`,
      `affordable housing ${location.city.toLowerCase()}`,
      `housing vouchers ${location.city.toLowerCase()}`,
      `section 8 rentals ${location.city.toLowerCase()} ${location.stateCode.toLowerCase()}`,
      `subsidized housing ${location.city.toLowerCase()}`,
      `low income housing ${location.city.toLowerCase()}`,
      `section 8 approved properties ${location.city.toLowerCase()}`,
      `housing choice voucher ${location.city.toLowerCase()}`,
      `section 8 landlords ${location.city.toLowerCase()}`
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://casa8.com/locations/${params.state}/${params.city}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `/locations/${params.state}/${params.city}`,
    },
  }
}

export default async function CityPage({ params }: CityPageProps) {
  const location = getLocationBySlug(params.city, params.state)
  
  if (!location) {
    notFound()
  }

  // Get properties in this city
  const properties = await getProperties({ 
    limit: 12,
    city: location.city,
    state: location.state 
  })
  const formattedProperties = properties.map(formatPropertyForFrontend)

  // Add coordinates for map display
  const propertiesWithCoords = formattedProperties.map(property => ({
    ...property,
    coordinates: property.coordinates || (property.latitude && property.longitude ? {
      lat: parseFloat(property.latitude),
      lng: parseFloat(property.longitude)
    } : undefined)
  })).filter(property => property.coordinates)

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
              <span className="text-gray-900 font-medium">{location.city}</span>
            </nav>

            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
                Section 8 Housing in <span className="text-primary">{location.city}, {location.stateCode}</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed max-w-4xl mx-auto">
                Find affordable rental properties that accept housing vouchers in {location.city}. 
                Browse {formatNumber(Math.floor(location.population / 100))}+ verified Section 8 approved listings 
                with competitive rent prices and quality amenities.
              </p>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                  <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="text-lg font-bold text-gray-900">{formatNumber(location.population)}</div>
                  <div className="text-xs text-gray-600">Population</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                  <DollarSign className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(location.medianIncome)}</div>
                  <div className="text-xs text-gray-600">Median Income</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                  <Home className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(location.fairMarketRent.twoBedroom)}</div>
                  <div className="text-xs text-gray-600">2BR Fair Market Rent</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                  <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="text-lg font-bold text-gray-900">{location.demographics.rentBurden}%</div>
                  <div className="text-xs text-gray-600">Rent Burden</div>
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
              Search Section 8 Housing in {location.city}
            </h2>
            <SearchForm />
          </div>
        </div>
      </section>

      {/* Properties Section */}
      {formattedProperties.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-12">
              <div className="mb-6 lg:mb-0">
                <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gray-900">
                  Available Properties in {location.city}
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl">
                  {formattedProperties.length} Section 8 approved rental properties currently available
                </p>
              </div>
              <Link href={`/search?city=${location.city}&state=${location.state}`}>
                <Button variant="outline" size="lg" className="font-medium px-8">
                  View All {location.city} Properties
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {formattedProperties.slice(0, 6).map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            {formattedProperties.length > 6 && (
              <div className="text-center mt-12">
                <Link href={`/search?city=${location.city}&state=${location.state}`}>
                  <Button size="lg" className="px-8">
                    View All {formattedProperties.length} Properties
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Map Section */}
      {propertiesWithCoords.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl lg:text-4xl font-bold mb-8 text-gray-900 text-center">
              Section 8 Properties Map - {location.city}
            </h2>
            <div className="h-[500px] rounded-lg overflow-hidden shadow-lg">
              <SimpleMap 
                properties={propertiesWithCoords}
                center={location.coordinates}
              />
            </div>
          </div>
        </section>
      )}

      {/* Fair Market Rent Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold mb-8 text-gray-900 text-center">
              {location.city} Fair Market Rent 2025
            </h2>
            <p className="text-xl text-gray-600 text-center mb-12">
              HUD Fair Market Rent limits for Section 8 housing vouchers in {location.city}, {location.state}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card className="text-center">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Studio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-2">
                    {formatCurrency(location.fairMarketRent.studio)}
                  </div>
                  <div className="text-sm text-gray-600">per month</div>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">1 Bedroom</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-2">
                    {formatCurrency(location.fairMarketRent.oneBedroom)}
                  </div>
                  <div className="text-sm text-gray-600">per month</div>
                </CardContent>
              </Card>
              
              <Card className="text-center border-2 border-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">2 Bedroom</CardTitle>
                  <Badge className="mx-auto">Most Popular</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-2">
                    {formatCurrency(location.fairMarketRent.twoBedroom)}
                  </div>
                  <div className="text-sm text-gray-600">per month</div>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">3 Bedroom</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-2">
                    {formatCurrency(location.fairMarketRent.threeBedroom)}
                  </div>
                  <div className="text-sm text-gray-600">per month</div>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">4 Bedroom</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-2">
                    {formatCurrency(location.fairMarketRent.fourBedroom)}
                  </div>
                  <div className="text-sm text-gray-600">per month</div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12 text-center">
              <p className="text-gray-600 mb-6">
                These are the maximum rent amounts that can be charged for Section 8 housing voucher units in {location.city}. 
                Actual rent may be lower depending on the property and landlord.
              </p>
              <Link href={`/search?city=${location.city}&state=${location.state}`}>
                <Button size="lg" className="px-8">
                  Find Properties Within These Limits
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Housing Authority Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold mb-8 text-gray-900 text-center">
              {location.city} Housing Authority Information
            </h2>
            
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-primary" />
                  {location.housingAuthority.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Contact Information</h4>
                    <div className="space-y-2 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{location.housingAuthority.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{location.housingAuthority.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        <a 
                          href={location.housingAuthority.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Visit Official Website
                        </a>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Services Provided</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Section 8 Housing Choice Voucher Program</li>
                      <li>• Public Housing Administration</li>
                      <li>• Housing Assistance Applications</li>
                      <li>• Landlord Services and Support</li>
                      <li>• Housing Quality Standards Inspections</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>For Tenants</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    If you're looking for Section 8 housing in {location.city}, start by contacting the local housing authority 
                    to apply for a housing voucher or join the waiting list.
                  </p>
                  <Link href="/register?role=tenant">
                    <Button className="w-full">
                      Create Tenant Account
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>For Landlords</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    List your Section 8 approved properties in {location.city} and connect with qualified tenants 
                    who have housing vouchers ready to use.
                  </p>
                  <Link href="/list-property">
                    <Button variant="outline" className="w-full">
                      List Your Property
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Local Market Information */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold mb-8 text-gray-900 text-center">
              {location.city} Housing Market Overview
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Demographics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Population:</span>
                      <span className="font-medium">{formatNumber(location.population)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Median Age:</span>
                      <span className="font-medium">{location.demographics.medianAge} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Household Size:</span>
                      <span className="font-medium">{location.demographics.householdSize} people</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Income & Affordability
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Median Income:</span>
                      <span className="font-medium">{formatCurrency(location.medianIncome)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rent Burden:</span>
                      <span className="font-medium">{location.demographics.rentBurden}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">30% of Income:</span>
                      <span className="font-medium">{formatCurrency(Math.floor(location.medianIncome * 0.3 / 12))}/mo</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="w-5 h-5 text-primary" />
                    Housing Costs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">1BR FMR:</span>
                      <span className="font-medium">{formatCurrency(location.fairMarketRent.oneBedroom)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">2BR FMR:</span>
                      <span className="font-medium">{formatCurrency(location.fairMarketRent.twoBedroom)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">3BR FMR:</span>
                      <span className="font-medium">{formatCurrency(location.fairMarketRent.threeBedroom)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Why Choose Section 8 Housing in {location.city}?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Benefits for Tenants</h4>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Reduced rent burden (pay only 30% of income)</li>
                      <li>• Access to quality housing in {location.city}</li>
                      <li>• Housing stability and security</li>
                      <li>• Opportunity to live in better neighborhoods</li>
                      <li>• Protection under fair housing laws</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Market Advantages</h4>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Guaranteed rent payments from housing authority</li>
                      <li>• Large pool of qualified tenants</li>
                      <li>• Stable, long-term rental income</li>
                      <li>• Support from local housing programs</li>
                      <li>• Growing demand for affordable housing</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary via-primary to-primary/90 text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Find Your Home in {location.city}?
            </h2>
            <p className="text-xl mb-8 opacity-95">
              Join thousands of families who have found quality, affordable housing through Casa8
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/search?city=${location.city}&state=${location.state}`}>
                <Button size="lg" variant="secondary" className="px-8">
                  Browse All Properties
                </Button>
              </Link>
              <Link href="/register?role=tenant">
                <Button size="lg" className="bg-white text-primary hover:bg-gray-100 px-8">
                  Create Free Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
