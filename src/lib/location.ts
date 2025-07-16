export interface UserLocation {
  city: string
  state: string
  latitude: number
  longitude: number
  country?: string
}

export interface PropertyWithDistance {
  id: string
  distance: number
  [key: string]: any
}

export async function getUserLocationByIP(): Promise<UserLocation | null> {
  try {
    const response = await fetch('https://ipapi.co/json/')
    const data = await response.json()
    
    if (data.city && data.region && data.latitude && data.longitude) {
      return {
        city: data.city,
        state: data.region,
        latitude: data.latitude,
        longitude: data.longitude,
        country: data.country_name
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting user location:', error)
    return null
  }
}

export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

export function kmToMiles(km: number): string {
  const miles = km * 0.621371
  return miles.toFixed(1)
}

export function getNearbyProperties(
  properties: any[], 
  userLocation: { lat: number; lng: number }, 
  radiusKm: number = 50
): PropertyWithDistance[] {
  return properties
    .map(property => {
      if (!property.coordinates) return null
      
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        property.coordinates.lat,
        property.coordinates.lng
      )
      
      return {
        ...property,
        distance
      }
    })
    .filter((property): property is PropertyWithDistance => 
      property !== null && property.distance <= radiusKm
    )
    .sort((a, b) => a.distance - b.distance)
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Using a free geocoding service
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    )
    const data = await response.json()
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      }
    }
    
    return null
  } catch (error) {
    console.error('Error geocoding address:', error)
    return null
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    )
    const data = await response.json()
    
    if (data && data.display_name) {
      return data.display_name
    }
    
    return null
  } catch (error) {
    console.error('Error reverse geocoding:', error)
    return null
  }
}

export function formatLocation(city: string, state: string, country?: string): string {
  let location = `${city}, ${state}`
  if (country && country !== 'United States') {
    location += `, ${country}`
  }
  return location
}

export function parseLocationString(locationString: string): { city: string; state: string } | null {
  const parts = locationString.split(',').map(part => part.trim())
  
  if (parts.length >= 2) {
    return {
      city: parts[0],
      state: parts[1]
    }
  }
  
  return null
}
