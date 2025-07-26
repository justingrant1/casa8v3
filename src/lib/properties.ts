import { supabase } from './supabase'
import { Database } from './database.types'

type Property = Database['public']['Tables']['properties']['Row']

export interface PropertyFilter {
  limit?: number
  city?: string
  state?: string
  bedrooms?: number
  bathrooms?: number
  propertyType?: string
  minPrice?: number
  maxPrice?: number
  amenities?: string[]
}

let propertiesCache: any[] = []
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function clearPropertiesCache() {
  propertiesCache = []
  cacheTimestamp = 0
}

// Clear cache immediately to force fresh data with new RLS policy
clearPropertiesCache()

export async function getProperties(filters?: PropertyFilter): Promise<any[]> {
  try {
    // Check cache first
    const now = Date.now()
    if (propertiesCache.length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('Returning properties from cache.')
      return applyFilters(propertiesCache, filters)
    }

    // Use JOIN to fetch properties with landlord data in one query
    let query = supabase
      .from('properties')
      .select(`
        *,
        profiles!properties_landlord_id_fkey (
          id,
          first_name,
          last_name,
          email,
          phone,
          avatar_url
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    // Apply filters at database level where possible
    if (filters?.city) {
      query = query.ilike('city', `%${filters.city}%`)
    }
    
    if (filters?.state) {
      query = query.ilike('state', `%${filters.state}%`)
    }

    if (filters?.bedrooms !== undefined) {
      query = query.eq('bedrooms', filters.bedrooms)
    }

    if (filters?.bathrooms !== undefined) {
      query = query.eq('bathrooms', filters.bathrooms)
    }

    if (filters?.propertyType) {
      query = query.eq('property_type', filters.propertyType)
    }

    if (filters?.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice)
    }

    if (filters?.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data: properties, error } = await query

    if (error) {
      console.error('Error fetching properties:', error)
      throw error
    }

    if (!properties || properties.length === 0) {
      propertiesCache = []
      cacheTimestamp = now
      return []
    }

    // Format properties - profiles are already included from JOIN
    const formattedProperties = properties.map(formatPropertyForFrontend)

    // Update cache with the FORMATTED data
    propertiesCache = formattedProperties
    cacheTimestamp = now

    // Apply filters to the newly fetched data before returning
    return applyFilters(formattedProperties, filters)
  } catch (error) {
    console.error('Error in getProperties:', error)
    throw error
  }
}

function applyFilters(properties: any[], filters?: PropertyFilter): any[] {
  if (!filters) return properties

  let filtered = properties

  // Apply client-side filters for complex logic
  if (filters.amenities && filters.amenities.length > 0) {
    filtered = filtered.filter(property => 
      filters.amenities!.every(amenity => 
        property.amenities?.includes(amenity)
      )
    )
  }

  if (filters.limit) {
    filtered = filtered.slice(0, filters.limit)
  }

  return filtered
}

export async function searchProperties(searchTerm: string, filters?: PropertyFilter & { coordinates?: { lat: number; lng: number } }): Promise<any[]> {
  try {
    console.log('searchProperties called with:', { searchTerm, filters })
    
    // Use JOIN to fetch properties with landlord data in one query
    let query = supabase
      .from('properties')
      .select(`
        *,
        profiles!properties_landlord_id_fkey (
          id,
          first_name,
          last_name,
          email,
          phone,
          avatar_url
        )
      `)
      .eq('is_active', true)

    // Search across multiple fields
    if (searchTerm) {
      console.log('Adding search term to query:', searchTerm)
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,state.ilike.%${searchTerm}%,property_type.ilike.%${searchTerm}%`)
    }

    // Apply additional filters only if we don't have a general search term
    // This prevents double-filtering when someone searches for a city name
    if (filters?.city && !searchTerm) {
      query = query.ilike('city', `%${filters.city}%`)
    }
    
    if (filters?.state && !searchTerm) {
      query = query.ilike('state', `%${filters.state}%`)
    }

    if (filters?.bedrooms !== undefined) {
      query = query.eq('bedrooms', filters.bedrooms)
    }

    if (filters?.bathrooms !== undefined) {
      query = query.eq('bathrooms', filters.bathrooms)
    }

    if (filters?.propertyType) {
      query = query.eq('property_type', filters.propertyType)
    }

    if (filters?.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice)
    }

    if (filters?.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data: properties, error } = await query

    if (error) {
      console.error('Error searching properties:', error)
      throw error
    }

    if (!properties || properties.length === 0) {
      return []
    }

    // Format properties - profiles are already included from JOIN
    let formattedProperties = properties.map(formatPropertyForFrontend)

    // Apply geographic filtering if coordinates are provided (backend filtering)
    if (filters?.coordinates) {
      const { lat: searchLat, lng: searchLng } = filters.coordinates
      const radiusMiles = 50 // 50 mile radius for relevant results
      
      formattedProperties = formattedProperties.filter(property => {
        if (!property.coordinates) return false
        
        const distance = calculateDistance(
          searchLat, 
          searchLng, 
          property.coordinates.lat, 
          property.coordinates.lng
        )
        
        return distance <= radiusMiles
      })
    }

    return formattedProperties
  } catch (error) {
    console.error('Error in searchProperties:', error)
    throw error
  }
}

// Helper function to calculate distance between two points in miles
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959 // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export async function getPropertyById(id: string): Promise<any | null> {
  try {
    // First get the property
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single()

    if (propertyError) {
      if (propertyError.code === 'PGRST116') {
        return null
      }
      console.error('Error fetching property:', propertyError)
      throw propertyError
    }

    if (!property) {
      return null
    }

    // Then get the landlord profile
    console.log('Looking for landlord profile with ID:', property.landlord_id)
    const { data: landlordProfile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, email, phone, avatar_url')
      .eq('id', property.landlord_id)
      .single()

    if (profileError) {
      console.error('Error fetching landlord profile:', profileError)
      console.error('Profile error details:', {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint
      })
      // Don't throw error, just log it and continue without profile data
    } else {
      console.log('Landlord profile found:', landlordProfile)
    }

    // Combine the data
    const enrichedProperty = {
      ...property,
      profiles: landlordProfile || null
    }

    return formatPropertyForFrontend(enrichedProperty)
  } catch (error) {
    console.error('Error in getPropertyById:', error)
    throw error
  }
}

export function formatPropertyForFrontend(property: any) {
  let parsedData = {}
  let cleanDescription = property.description

  if (typeof property.description === 'string' && property.description.includes('{')) {
    try {
      const jsonStartIndex = property.description.indexOf('{')
      const jsonString = property.description.substring(jsonStartIndex)
      cleanDescription = property.description.substring(0, jsonStartIndex).trim()
      
      if (jsonString) {
        parsedData = JSON.parse(jsonString)
      }
    } catch (e) {
      console.error('Error parsing property JSON:', e, 'Raw description:', property.description)
      // Keep original description if JSON is malformed
      cleanDescription = property.description
    }
  }

  const combined = { ...property, ...parsedData }

  const landlordName = combined.profiles 
    ? `${combined.profiles.first_name || ''} ${combined.profiles.last_name || ''}`.trim() || 'Property Owner'
    : 'Property Owner'

  // Create coordinates object with more robust checking
  const lat = combined.latitude ? parseFloat(combined.latitude) : null
  const lng = combined.longitude ? parseFloat(combined.longitude) : null
  const coordinates = (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) ? {
    lat: lat,
    lng: lng
  } : null

  // Defensively clean address fields to remove any stray JSON
  const cleanAddressField = (field: any) => {
    if (typeof field !== 'string') return field
    const jsonIndex = field.indexOf('{')
    return jsonIndex === -1 ? field : field.substring(0, jsonIndex).trim().replace(/,$/, '')
  }

  const cleanedAddress = cleanAddressField(combined.address)
  const cleanedCity = cleanAddressField(combined.city)
  const cleanedState = cleanAddressField(combined.state)
  const cleanedZip = cleanAddressField(combined.zip_code)

  return {
    id: combined.id,
    title: combined.title,
    description: cleanDescription,
    price: combined.price,
    type: combined.propertyType || combined.property_type,
    location: `${cleanedAddress}${cleanedCity ? `, ${cleanedCity}` : ''}${cleanedState ? `, ${cleanedState}` : ''}`,
    address: cleanedAddress,
    city: cleanedCity,
    state: cleanedState,
    zip_code: cleanedZip,
    bedrooms: combined.bedrooms,
    bathrooms: combined.bathrooms,
    sqft: combined.sqft || 1200, // Default square footage
    images: combined.images || ['/placeholder.svg'],
    image: combined.images?.[0] || '/placeholder.svg',
    amenities: combined.amenities || [],
    available: combined.is_active,
    landlord: landlordName,
    landlord_email: combined.profiles?.email,
    landlord_phone: combined.profiles?.phone,
    landlord_id: combined.landlord_id,
    latitude: combined.latitude,
    longitude: combined.longitude,
    coordinates: coordinates,
    created_at: combined.created_at,
    updated_at: combined.updated_at,
    profiles: combined.profiles
  }
}

export async function getNearbyProperties(
  latitude: number, 
  longitude: number, 
  maxDistanceKm: number = 100, 
  limit: number = 5
): Promise<any[]> {
  try {
    console.log('Getting nearby properties for coordinates:', { latitude, longitude, maxDistanceKm, limit })
    
    const { data, error } = await supabase
      .rpc('get_nearby_properties', {
        user_lat: latitude,
        user_lng: longitude,
        max_distance_km: maxDistanceKm,
        property_limit: limit
      })

    if (error) {
      console.error('Error fetching nearby properties:', error)
      throw error
    }

    if (!data || data.length === 0) {
      console.log('No nearby properties found')
      return []
    }

    console.log(`Found ${data.length} nearby properties`)

    // Get landlord profiles for the properties
    const landlordIds = [...new Set(data.map((p: any) => p.landlord_id).filter(Boolean))]
    
    let landlordProfiles: any = {}
    if (landlordIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone, avatar_url')
        .in('id', landlordIds)

      if (profileError) {
        console.error('Error fetching landlord profiles:', profileError)
      } else {
        landlordProfiles = profiles?.reduce((acc: any, profile: any) => {
          acc[profile.id] = profile
          return acc
        }, {}) || {}
      }
    }

    // Format properties with landlord data and distance
    const formattedProperties = data.map((property: any) => {
      const enrichedProperty = {
        ...property,
        profiles: landlordProfiles[property.landlord_id] || null
      }
      
      const formatted = formatPropertyForFrontend(enrichedProperty)
      
      // Add distance information
      return {
        ...formatted,
        distance: property.distance_km,
        distanceMiles: Math.round(property.distance_km * 0.621371 * 10) / 10 // Convert km to miles, round to 1 decimal
      }
    })

    return formattedProperties
  } catch (error) {
    console.error('Error in getNearbyProperties:', error)
    throw error
  }
}

export async function getFavoriteProperties(userId: string): Promise<Property[]> {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        properties (
          *,
          profiles!properties_landlord_id_fkey (
            first_name,
            last_name,
            email,
            phone
          )
        )
      `)
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching favorite properties:', error)
      throw error
    }

    return data?.map((item: any) => item.properties).filter((property: any) => property !== null) || []
  } catch (error) {
    console.error('Error in getFavoriteProperties:', error)
    throw error
  }
}
