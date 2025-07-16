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

let propertiesCache: Property[] = []
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function clearPropertiesCache() {
  propertiesCache = []
  cacheTimestamp = 0
}

export async function getProperties(filters?: PropertyFilter): Promise<Property[]> {
  try {
    // Check cache first
    const now = Date.now()
    if (propertiesCache.length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
      return applyFilters(propertiesCache, filters)
    }

    let query = supabase
      .from('properties')
      .select(`
        *,
        profiles!properties_landlord_id_fkey (
          full_name,
          email,
          phone
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

    const { data, error } = await query

    if (error) {
      console.error('Error fetching properties:', error)
      throw error
    }

    // Update cache
    propertiesCache = data || []
    cacheTimestamp = now

    return data || []
  } catch (error) {
    console.error('Error in getProperties:', error)
    throw error
  }
}

function applyFilters(properties: Property[], filters?: PropertyFilter): Property[] {
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

export async function searchProperties(searchTerm: string, filters?: PropertyFilter): Promise<Property[]> {
  try {
    let query = supabase
      .from('properties')
      .select(`
        *,
        profiles!properties_landlord_id_fkey (
          full_name,
          email,
          phone
        )
      `)
      .eq('is_active', true)

    // Search across multiple fields
    if (searchTerm) {
      query = query.or(`
        title.ilike.%${searchTerm}%,
        description.ilike.%${searchTerm}%,
        address.ilike.%${searchTerm}%,
        city.ilike.%${searchTerm}%,
        state.ilike.%${searchTerm}%,
        property_type.ilike.%${searchTerm}%
      `)
    }

    // Apply additional filters
    if (filters?.city) {
      query = query.ilike('city', `%${filters.city}%`)
    }
    
    if (filters?.state) {
      query = query.ilike('state', `%${filters.state}%`)
    }

    if (filters?.bedrooms !== undefined) {
      query = query.eq('bedrooms', filters.bedrooms)
    }

    if (filters?.propertyType) {
      query = query.eq('property_type', filters.propertyType)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error searching properties:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in searchProperties:', error)
    throw error
  }
}

export async function getPropertyById(id: string): Promise<Property | null> {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        profiles!properties_landlord_id_fkey (
          full_name,
          email,
          phone
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // This code indicates that no rows were found, which is not a true error in this case.
        return null
      }
      console.error('Error fetching property:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in getPropertyById:', error)
    throw error
  }
}

export function formatPropertyForFrontend(property: any) {
  return {
    id: property.id,
    title: property.title,
    description: property.description,
    price: property.price,
    type: property.property_type,
    location: `${property.address}${property.city ? `, ${property.city}` : ''}${property.state ? `, ${property.state}` : ''}`,
    address: property.address,
    city: property.city,
    state: property.state,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    sqft: property.sqft || 1200, // Default square footage
    images: property.images || ['/placeholder.svg'],
    image: property.images?.[0] || '/placeholder.svg',
    amenities: property.amenities || [],
    available: property.is_active,
    landlord: property.profiles?.full_name || 'Property Owner',
    landlord_email: property.profiles?.email,
    landlord_phone: property.profiles?.phone,
    landlord_id: property.landlord_id,
    latitude: property.latitude,
    longitude: property.longitude,
    coordinates: property.latitude && property.longitude ? {
      lat: parseFloat(property.latitude),
      lng: parseFloat(property.longitude)
    } : null,
    created_at: property.created_at,
    updated_at: property.updated_at
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
            full_name,
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
