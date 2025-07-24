// Location data and utilities for programmatic SEO
export interface LocationData {
  city: string
  state: string
  stateCode: string
  slug: string
  stateSlug: string
  population: number
  medianIncome: number
  fairMarketRent: {
    studio: number
    oneBedroom: number
    twoBedroom: number
    threeBedroom: number
    fourBedroom: number
  }
  housingAuthority: {
    name: string
    phone: string
    website: string
    address: string
  }
  coordinates: {
    lat: number
    lng: number
  }
  demographics: {
    medianAge: number
    householdSize: number
    rentBurden: number // percentage of income spent on rent
  }
}

export interface StateData {
  name: string
  code: string
  slug: string
  population: number
  cities: number
  averageRent: number
  section8Participation: number
  housingShortage: number
}

// Major US cities with Section 8 programs - starting with top 100 markets
export const MAJOR_CITIES: LocationData[] = [
  {
    city: "New York",
    state: "New York",
    stateCode: "NY",
    slug: "new-york",
    stateSlug: "new-york",
    population: 8336817,
    medianIncome: 70663,
    fairMarketRent: {
      studio: 1592,
      oneBedroom: 1753,
      twoBedroom: 2152,
      threeBedroom: 2788,
      fourBedroom: 3188
    },
    housingAuthority: {
      name: "New York City Housing Authority",
      phone: "(212) 306-3000",
      website: "https://www1.nyc.gov/site/nycha/index.page",
      address: "250 Broadway, New York, NY 10007"
    },
    coordinates: {
      lat: 40.7128,
      lng: -74.0060
    },
    demographics: {
      medianAge: 36.2,
      householdSize: 2.3,
      rentBurden: 58.4
    }
  },
  {
    city: "Los Angeles",
    state: "California",
    stateCode: "CA",
    slug: "los-angeles",
    stateSlug: "california",
    population: 3898747,
    medianIncome: 65290,
    fairMarketRent: {
      studio: 1517,
      oneBedroom: 1877,
      twoBedroom: 2377,
      threeBedroom: 3461,
      fourBedroom: 4032
    },
    housingAuthority: {
      name: "Housing Authority of the City of Los Angeles",
      phone: "(213) 252-2500",
      website: "https://www.hacla.org/",
      address: "2600 Wilshire Blvd, Los Angeles, CA 90057"
    },
    coordinates: {
      lat: 34.0522,
      lng: -118.2437
    },
    demographics: {
      medianAge: 35.8,
      householdSize: 2.8,
      rentBurden: 56.9
    }
  },
  {
    city: "Chicago",
    state: "Illinois",
    stateCode: "IL",
    slug: "chicago",
    stateSlug: "illinois",
    population: 2693976,
    medianIncome: 58247,
    fairMarketRent: {
      studio: 1019,
      oneBedroom: 1199,
      twoBedroom: 1459,
      threeBedroom: 1889,
      fourBedroom: 2159
    },
    housingAuthority: {
      name: "Chicago Housing Authority",
      phone: "(312) 742-8500",
      website: "https://www.thecha.org/",
      address: "60 E Van Buren St, Chicago, IL 60605"
    },
    coordinates: {
      lat: 41.8781,
      lng: -87.6298
    },
    demographics: {
      medianAge: 34.8,
      householdSize: 2.4,
      rentBurden: 52.3
    }
  },
  {
    city: "Houston",
    state: "Texas",
    stateCode: "TX",
    slug: "houston",
    stateSlug: "texas",
    population: 2320268,
    medianIncome: 52338,
    fairMarketRent: {
      studio: 891,
      oneBedroom: 1019,
      twoBedroom: 1259,
      threeBedroom: 1719,
      fourBedroom: 1959
    },
    housingAuthority: {
      name: "Houston Housing Authority",
      phone: "(713) 260-0500",
      website: "https://www.housingforhouston.com/",
      address: "2640 Fountain View Dr, Houston, TX 77057"
    },
    coordinates: {
      lat: 29.7604,
      lng: -95.3698
    },
    demographics: {
      medianAge: 33.1,
      householdSize: 2.7,
      rentBurden: 48.2
    }
  },
  {
    city: "Phoenix",
    state: "Arizona",
    stateCode: "AZ",
    slug: "phoenix",
    stateSlug: "arizona",
    population: 1608139,
    medianIncome: 54804,
    fairMarketRent: {
      studio: 891,
      oneBedroom: 1049,
      twoBedroom: 1289,
      threeBedroom: 1849,
      fourBedroom: 2159
    },
    housingAuthority: {
      name: "Phoenix Housing Authority",
      phone: "(602) 262-6251",
      website: "https://www.phoenix.gov/housing",
      address: "1 N Central Ave, Phoenix, AZ 85004"
    },
    coordinates: {
      lat: 33.4484,
      lng: -112.0740
    },
    demographics: {
      medianAge: 33.0,
      householdSize: 2.7,
      rentBurden: 46.8
    }
  },
  {
    city: "Philadelphia",
    state: "Pennsylvania",
    stateCode: "PA",
    slug: "philadelphia",
    stateSlug: "pennsylvania",
    population: 1584064,
    medianIncome: 45927,
    fairMarketRent: {
      studio: 891,
      oneBedroom: 1049,
      twoBedroom: 1289,
      threeBedroom: 1619,
      fourBedroom: 1849
    },
    housingAuthority: {
      name: "Philadelphia Housing Authority",
      phone: "(215) 684-4000",
      website: "https://www.pha.phila.gov/",
      address: "2013 Ridge Ave, Philadelphia, PA 19121"
    },
    coordinates: {
      lat: 39.9526,
      lng: -75.1652
    },
    demographics: {
      medianAge: 34.2,
      householdSize: 2.4,
      rentBurden: 51.7
    }
  },
  {
    city: "San Antonio",
    state: "Texas",
    stateCode: "TX",
    slug: "san-antonio",
    stateSlug: "texas",
    population: 1547253,
    medianIncome: 52455,
    fairMarketRent: {
      studio: 719,
      oneBedroom: 849,
      twoBedroom: 1049,
      threeBedroom: 1459,
      fourBedroom: 1689
    },
    housingAuthority: {
      name: "San Antonio Housing Authority",
      phone: "(210) 477-6000",
      website: "https://www.saha.org/",
      address: "818 S Flores St, San Antonio, TX 78204"
    },
    coordinates: {
      lat: 29.4241,
      lng: -98.4936
    },
    demographics: {
      medianAge: 33.4,
      householdSize: 2.8,
      rentBurden: 44.9
    }
  },
  {
    city: "San Diego",
    state: "California",
    stateCode: "CA",
    slug: "san-diego",
    stateSlug: "california",
    population: 1423851,
    medianIncome: 70824,
    fairMarketRent: {
      studio: 1517,
      oneBedroom: 1877,
      twoBedroom: 2377,
      threeBedroom: 3461,
      fourBedroom: 4032
    },
    housingAuthority: {
      name: "San Diego Housing Commission",
      phone: "(619) 231-9400",
      website: "https://www.sdhc.org/",
      address: "1122 Broadway, San Diego, CA 92101"
    },
    coordinates: {
      lat: 32.7157,
      lng: -117.1611
    },
    demographics: {
      medianAge: 35.1,
      householdSize: 2.7,
      rentBurden: 53.2
    }
  },
  {
    city: "Dallas",
    state: "Texas",
    stateCode: "TX",
    slug: "dallas",
    stateSlug: "texas",
    population: 1343573,
    medianIncome: 52580,
    fairMarketRent: {
      studio: 891,
      oneBedroom: 1019,
      twoBedroom: 1259,
      threeBedroom: 1719,
      fourBedroom: 1959
    },
    housingAuthority: {
      name: "Dallas Housing Authority",
      phone: "(214) 951-8300",
      website: "https://www.dhadallas.com/",
      address: "3939 N Hampton Rd, Dallas, TX 75212"
    },
    coordinates: {
      lat: 32.7767,
      lng: -96.7970
    },
    demographics: {
      medianAge: 32.5,
      householdSize: 2.6,
      rentBurden: 49.1
    }
  },
  {
    city: "San Jose",
    state: "California",
    stateCode: "CA",
    slug: "san-jose",
    stateSlug: "california",
    population: 1021795,
    medianIncome: 109593,
    fairMarketRent: {
      studio: 2377,
      oneBedroom: 2917,
      twoBedroom: 3677,
      threeBedroom: 5377,
      fourBedroom: 6257
    },
    housingAuthority: {
      name: "Housing Authority of the County of Santa Clara",
      phone: "(408) 275-8770",
      website: "https://www.hacsc.org/",
      address: "505 W Julian St, San Jose, CA 95110"
    },
    coordinates: {
      lat: 37.3382,
      lng: -121.8863
    },
    demographics: {
      medianAge: 36.2,
      householdSize: 3.0,
      rentBurden: 42.8
    }
  }
]

// State data for state-level pages
export const STATES_DATA: StateData[] = [
  {
    name: "California",
    code: "CA",
    slug: "california",
    population: 39538223,
    cities: 482,
    averageRent: 2800,
    section8Participation: 12.4,
    housingShortage: 1200000
  },
  {
    name: "Texas",
    code: "TX",
    slug: "texas",
    population: 29145505,
    cities: 961,
    averageRent: 1400,
    section8Participation: 8.9,
    housingShortage: 320000
  },
  {
    name: "Florida",
    code: "FL",
    slug: "florida",
    population: 21538187,
    cities: 411,
    averageRent: 1800,
    section8Participation: 10.2,
    housingShortage: 280000
  },
  {
    name: "New York",
    code: "NY",
    slug: "new-york",
    population: 20201249,
    cities: 62,
    averageRent: 2200,
    section8Participation: 15.7,
    housingShortage: 450000
  },
  {
    name: "Pennsylvania",
    code: "PA",
    slug: "pennsylvania",
    population: 13002700,
    cities: 956,
    averageRent: 1200,
    section8Participation: 11.3,
    housingShortage: 180000
  }
]

// Utility functions
export function getLocationBySlug(citySlug: string, stateSlug: string): LocationData | null {
  return MAJOR_CITIES.find(city => 
    city.slug === citySlug && city.stateSlug === stateSlug
  ) || null
}

export function getStateBySlug(stateSlug: string): StateData | null {
  return STATES_DATA.find(state => state.slug === stateSlug) || null
}

export function getCitiesByState(stateSlug: string): LocationData[] {
  return MAJOR_CITIES.filter(city => city.stateSlug === stateSlug)
}

export function generateLocationSlug(city: string, state: string): string {
  return `${city.toLowerCase().replace(/\s+/g, '-')}-${state.toLowerCase().replace(/\s+/g, '-')}`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

// SEO-optimized content generators
export function generateCityTitle(city: string, state: string): string {
  return `Section 8 Housing in ${city}, ${state} | Casa8 - Find Affordable Rentals`
}

export function generateCityDescription(location: LocationData): string {
  return `Find Section 8 approved apartments and houses in ${location.city}, ${location.state}. Browse ${formatNumber(Math.floor(location.population / 100))}+ affordable rental listings that accept housing vouchers. Apply today!`
}

export function generateStateTitle(state: string): string {
  return `Section 8 Housing in ${state} | Casa8 - Affordable Rentals Statewide`
}

export function generateStateDescription(stateData: StateData): string {
  return `Discover Section 8 housing across ${stateData.name}. Search ${formatNumber(stateData.cities)} cities with ${formatNumber(Math.floor(stateData.population / 1000))}K+ affordable rental listings that accept housing vouchers.`
}

// Keywords for programmatic content
export const LOCATION_KEYWORDS = {
  primary: [
    "section 8 housing",
    "section 8 apartments",
    "section 8 rentals",
    "affordable housing",
    "housing vouchers accepted"
  ],
  secondary: [
    "low income housing",
    "subsidized housing",
    "housing choice voucher",
    "section 8 approved properties",
    "section 8 landlords"
  ],
  propertyTypes: [
    "apartments",
    "houses",
    "condos",
    "townhomes",
    "senior housing",
    "family housing"
  ],
  bedrooms: [
    "studio",
    "1 bedroom",
    "2 bedroom", 
    "3 bedroom",
    "4 bedroom"
  ]
}
