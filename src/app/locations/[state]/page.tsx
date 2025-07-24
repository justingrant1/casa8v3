import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Users, Home, TrendingUp, Phone, ExternalLink } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { PropertyCard } from '@/components/property-card'
import { 
  getStateBySlug, 
  getCitiesByState, 
  generateStateTitle, 
  generateStateDescription,
  formatNumber,
  formatCurrency,
  STATES_DATA 
} from '@/lib/locations'
import { getProperties, formatPropertyForFrontend } from '@/lib/properties'

interface StatePageProps {
  params: {
    state: string
  }
}

export async function generateStaticParams() {
  return STATES_DATA.map((state) => ({
    state: state.slug,
  }))
}

export async function generateMetadata({ params }: StatePageProps): Promise<Metadata> {
  const stateData = getStateBySlug(params.state)
  
  if (!stateData) {
    return {
      title: 'State Not Found | Casa8',
      description: 'The requested state page could not be found.'
    }
  }

  const title = generateStateTitle(stateData.name)
  const description = generateStateDescription(stateData)

  return {
    title,
    description,
    keywords: [
      `section 8 housing ${stateData.name.toLowerCase()}`,
      `affordable housing ${stateData.name.toLowerCase()}`,
      `section 8 apartments ${stateData.name.toLowerCase()}`,
      `housing vouchers ${stateData.name.toLowerCase()}`,
      `subsidized housing ${stateData.name.toLowerCase()}`,
      `low income housing ${stateData.name.toLowerCase()}`
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://casa8.com/locations/${params.state}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `/locations/${params.state}`,
    },
  }
}

export default async function StatePage({ params }: StatePageProps) {
  const stateData = getStateBySlug(params.state)
  
  if (!stateData) {
    notFound()
  }

  const cities = getCitiesByState(params.state)
  
  // Get sample properties from the state
  const properties = await getProperties({ 
    limit: 6,
    state: stateData.name 
  })
  const formattedProperties = properties.map(formatPropertyForFrontend)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/8 via-primary/4 to-background py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
              Section 8 Housing in <span className="text-primary">{stateData.name}</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
              Find affordable rental properties that accept housing vouchers across {stateData.name}. 
              Search {formatNumber(stateData.cities)} cities with thousands of Section 8 approved listings.
            </p>
            
            {/* State Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{formatNumber(stateData.population)}</div>
                <div className="text-sm text-gray-600">Population</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                <Home className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{formatNumber(stateData.cities)}</div>
                <div className="text-sm text-gray-600">Cities</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(stateData.averageRent)}</div>
                <div className="text-sm text-gray-600">Avg. Rent</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stateData.section8Participation}%</div>
                <div className="text-sm text-gray-600">Section 8 Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      {formattedProperties.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-12">
              <div className="mb-6 lg:mb-0">
                <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gray-900">
                  Featured Properties in {stateData.name}
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl">
                  Discover quality Section 8 approved rentals across the state
                </p>
              </div>
              <Link href={`/search?state=${stateData.name}`}>
                <Button variant="outline" size="lg" className="font-medium px-8">
                  View All Properties
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {formattedProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Major Cities */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gray-900">
              Section 8 Housing by City
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Browse affordable housing options in major cities across {stateData.name}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cities.map((city) => (
              <Card key={city.slug} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{city.city}</span>
                    <Badge variant="secondary">{formatNumber(city.population)} people</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Median Income:</span>
                      <span className="font-medium">{formatCurrency(city.medianIncome)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">2BR Fair Market Rent:</span>
                      <span className="font-medium">{formatCurrency(city.fairMarketRent.twoBedroom)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Rent Burden:</span>
                      <span className="font-medium">{city.demographics.rentBurden}%</span>
                    </div>
                    
                    <div className="pt-4 space-y-2">
                      <Link href={`/locations/${city.stateSlug}/${city.slug}`}>
                        <Button className="w-full" size="sm">
                          View {city.city} Housing
                        </Button>
                      </Link>
                      <div className="text-xs text-gray-500 text-center">
                        Housing Authority: {city.housingAuthority.name}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section 8 Information */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold mb-8 text-gray-900 text-center">
              Section 8 Housing in {stateData.name}: What You Need to Know
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="w-5 h-5 text-primary" />
                    Housing Shortage Crisis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    {stateData.name} faces a shortage of approximately {formatNumber(stateData.housingShortage)} 
                    affordable housing units, making Section 8 vouchers crucial for low-income families.
                  </p>
                  <p className="text-gray-600">
                    With {stateData.section8Participation}% of eligible households participating in the program, 
                    there's significant demand for quality affordable housing.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Market Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    The average rent in {stateData.name} is {formatCurrency(stateData.averageRent)}, 
                    making housing vouchers essential for affordability.
                  </p>
                  <p className="text-gray-600">
                    Casa8 connects you with landlords who accept Section 8 vouchers across 
                    all {formatNumber(stateData.cities)} cities in the state.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12 text-center">
              <h3 className="text-2xl font-bold mb-4 text-gray-900">
                Ready to Find Your Next Home?
              </h3>
              <p className="text-xl text-gray-600 mb-8">
                Start your search for Section 8 approved housing in {stateData.name} today
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={`/search?state=${stateData.name}`}>
                  <Button size="lg" className="px-8">
                    Search All Properties
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
              Are You a Landlord in {stateData.name}?
            </h2>
            <p className="text-xl mb-8 opacity-95">
              List your Section 8 approved properties and connect with qualified tenants across the state
            </p>
            <Link href="/list-property">
              <Button size="lg" variant="secondary" className="px-8">
                List Your Property
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
