import { MetadataRoute } from 'next'
import { MAJOR_CITIES, STATES_DATA, LOCATION_KEYWORDS } from '@/lib/locations'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://casa8.com'
  const currentDate = new Date()
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/list-property`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/favorites`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/profile`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  // State pages
  const statePages: MetadataRoute.Sitemap = STATES_DATA.map(state => ({
    url: `${baseUrl}/locations/${state.slug}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // City pages
  const cityPages: MetadataRoute.Sitemap = MAJOR_CITIES.map(city => ({
    url: `${baseUrl}/locations/${city.stateSlug}/${city.slug}`,
    lastModified: currentDate,
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }))

  // Property type pages (apartments/houses) for each city
  const propertyTypePages: MetadataRoute.Sitemap = []
  MAJOR_CITIES.forEach(city => {
    // Apartments page
    propertyTypePages.push({
      url: `${baseUrl}/locations/${city.stateSlug}/${city.slug}/apartments`,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })
    
    // Houses page
    propertyTypePages.push({
      url: `${baseUrl}/locations/${city.stateSlug}/${city.slug}/houses`,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })
  })

  // Bedroom-specific pages for major cities (Phase 2 expansion)
  const bedroomPages: MetadataRoute.Sitemap = []
  const topCities = MAJOR_CITIES.slice(0, 5) // Top 5 cities for bedroom-specific pages
  
  topCities.forEach(city => {
    LOCATION_KEYWORDS.bedrooms.forEach(bedroom => {
      const bedroomSlug = bedroom.replace(' ', '-').toLowerCase()
      
      // Bedroom + apartments
      bedroomPages.push({
        url: `${baseUrl}/locations/${city.stateSlug}/${city.slug}/${bedroomSlug}-apartments`,
        lastModified: currentDate,
        changeFrequency: 'daily' as const,
        priority: 0.7,
      })
      
      // Bedroom + houses
      bedroomPages.push({
        url: `${baseUrl}/locations/${city.stateSlug}/${city.slug}/${bedroomSlug}-houses`,
        lastModified: currentDate,
        changeFrequency: 'daily' as const,
        priority: 0.7,
      })
    })
  })

  // Neighborhood pages for top cities (Phase 2 expansion)
  const neighborhoodPages: MetadataRoute.Sitemap = []
  const topCitiesWithNeighborhoods = [
    {
      city: 'new-york',
      state: 'new-york',
      neighborhoods: ['manhattan', 'brooklyn', 'queens', 'bronx', 'staten-island']
    },
    {
      city: 'los-angeles',
      state: 'california', 
      neighborhoods: ['hollywood', 'downtown', 'santa-monica', 'beverly-hills', 'venice']
    },
    {
      city: 'chicago',
      state: 'illinois',
      neighborhoods: ['downtown', 'north-side', 'south-side', 'west-side', 'lincoln-park']
    },
    {
      city: 'houston',
      state: 'texas',
      neighborhoods: ['downtown', 'midtown', 'montrose', 'river-oaks', 'heights']
    },
    {
      city: 'phoenix',
      state: 'arizona',
      neighborhoods: ['downtown', 'scottsdale', 'tempe', 'mesa', 'glendale']
    }
  ]

  topCitiesWithNeighborhoods.forEach(cityData => {
    cityData.neighborhoods.forEach(neighborhood => {
      neighborhoodPages.push({
        url: `${baseUrl}/locations/${cityData.state}/${cityData.city}/${neighborhood}`,
        lastModified: currentDate,
        changeFrequency: 'daily' as const,
        priority: 0.7,
      })
      
      // Neighborhood + apartments
      neighborhoodPages.push({
        url: `${baseUrl}/locations/${cityData.state}/${cityData.city}/${neighborhood}/apartments`,
        lastModified: currentDate,
        changeFrequency: 'daily' as const,
        priority: 0.6,
      })
      
      // Neighborhood + houses
      neighborhoodPages.push({
        url: `${baseUrl}/locations/${cityData.state}/${cityData.city}/${neighborhood}/houses`,
        lastModified: currentDate,
        changeFrequency: 'daily' as const,
        priority: 0.6,
      })
    })
  })

  // ZIP code pages for top cities (Phase 2 expansion)
  const zipCodePages: MetadataRoute.Sitemap = []
  const topZipCodes = [
    // New York
    { city: 'new-york', state: 'new-york', zips: ['10001', '10002', '10003', '10004', '10005'] },
    // Los Angeles  
    { city: 'los-angeles', state: 'california', zips: ['90001', '90002', '90003', '90004', '90005'] },
    // Chicago
    { city: 'chicago', state: 'illinois', zips: ['60601', '60602', '60603', '60604', '60605'] },
    // Houston
    { city: 'houston', state: 'texas', zips: ['77001', '77002', '77003', '77004', '77005'] },
    // Phoenix
    { city: 'phoenix', state: 'arizona', zips: ['85001', '85002', '85003', '85004', '85005'] }
  ]

  topZipCodes.forEach(cityData => {
    cityData.zips.forEach(zip => {
      zipCodePages.push({
        url: `${baseUrl}/locations/${cityData.state}/${cityData.city}/${zip}`,
        lastModified: currentDate,
        changeFrequency: 'daily' as const,
        priority: 0.6,
      })
    })
  })

  // Future Phase 3 & 4 pages (commented out for now, will be activated in future phases)
  /*
  // Multi-vertical pages (Phase 4)
  const verticalPages: MetadataRoute.Sitemap = []
  const verticals = ['senior-housing', 'student-housing', 'military-housing', 'corporate-housing', 'disability-housing']
  
  MAJOR_CITIES.forEach(city => {
    verticals.forEach(vertical => {
      verticalPages.push({
        url: `${baseUrl}/${vertical}/locations/${city.stateSlug}/${city.slug}`,
        lastModified: currentDate,
        changeFrequency: 'daily' as const,
        priority: 0.7,
      })
    })
  })

  // International pages (Phase 4)
  const internationalPages: MetadataRoute.Sitemap = []
  const internationalMarkets = [
    { country: 'canada', cities: ['toronto', 'vancouver', 'montreal'] },
    { country: 'uk', cities: ['london', 'manchester', 'birmingham'] },
    { country: 'germany', cities: ['berlin', 'munich', 'hamburg'] },
    { country: 'australia', cities: ['sydney', 'melbourne', 'brisbane'] }
  ]

  internationalMarkets.forEach(market => {
    market.cities.forEach(city => {
      internationalPages.push({
        url: `${baseUrl}/${market.country}/${city}`,
        lastModified: currentDate,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })
    })
  })
  */

  // Combine all pages
  return [
    ...staticPages,
    ...statePages,
    ...cityPages,
    ...propertyTypePages,
    ...bedroomPages,
    ...neighborhoodPages,
    ...zipCodePages,
    // ...verticalPages, // Phase 4
    // ...internationalPages, // Phase 4
  ]
}

// Export the total count for monitoring
export const SITEMAP_STATS = {
  staticPages: 8,
  statePages: 5,
  cityPages: 10,
  propertyTypePages: 20, // 10 cities × 2 property types
  bedroomPages: 50, // 5 cities × 5 bedrooms × 2 property types
  neighborhoodPages: 75, // 5 cities × 5 neighborhoods × 3 page types
  zipCodePages: 25, // 5 cities × 5 zip codes
  totalPages: 193,
  // Phase 4 projections:
  // verticalPages: 500, // 10 cities × 5 verticals × 10 page types
  // internationalPages: 120, // 4 countries × 3 cities × 10 page types
  // phase4Total: 813
}
