# Location-Based Features Implementation Guide

## Overview
This guide documents the implementation of location-based features for Casa8, including user location detection, nearby property search, and geocoding integration.

## Features Implemented

### 1. User Location Hook (`src/hooks/use-location.ts`)
A React hook that provides browser-based geolocation functionality:

**Features:**
- Requests user's current location using browser geolocation API
- Reverse geocoding to get city/state from coordinates
- Permission status tracking
- Error handling for various geolocation scenarios
- Configurable timeout and accuracy settings

**Usage:**
```typescript
import { useLocation } from '@/hooks/use-location'

const { location, loading, error, requestLocation, hasPermission } = useLocation()

// location contains: { latitude, longitude, city?, state?, accuracy? }
```

### 2. Geocoding Library (`src/lib/geocoding.ts`)
Utility functions for address geocoding and coordinate conversion:

**Features:**
- Forward geocoding (address → coordinates)
- Reverse geocoding (coordinates → address)
- Integration with multiple geocoding services
- Fallback mechanisms for reliability
- Caching for performance

**Key Functions:**
- `geocodeAddress(address: string)` - Convert address to coordinates
- `reverseGeocode(lat: number, lng: number)` - Convert coordinates to address
- `validateCoordinates(lat: number, lng: number)` - Validate coordinate pairs

### 3. Database Functions (`scripts/add-nearby-properties-function.sql`)
PostgreSQL functions for efficient distance calculations:

**Functions Created:**
- `calculate_distance(lat1, lng1, lat2, lng2)` - Haversine formula implementation
- `get_nearby_properties(user_lat, user_lng, max_distance_km, property_limit)` - Find closest properties

**Database Indexes:**
- `idx_properties_location` - Index on latitude/longitude for performance
- `idx_properties_active_location` - Composite index for active properties with location

### 4. Enhanced Properties API (`src/lib/properties.ts`)
Updated properties library with location-based functionality:

**New Function:**
```typescript
getNearbyProperties(
  latitude: number, 
  longitude: number, 
  maxDistanceKm: number = 100, 
  limit: number = 5
): Promise<any[]>
```

**Features:**
- Uses database RPC function for efficient distance calculation
- Returns properties with distance information (km and miles)
- Includes landlord profile data
- Fallback error handling

### 5. Updated Homepage (`src/app/page.tsx`)
Enhanced homepage with location-aware property display:

**Features:**
- Automatic location detection on page load
- Location-based property recommendations
- Fallback to general properties if location unavailable
- Dynamic section titles based on user location
- Distance indicators for nearby properties

## Implementation Details

### Location Detection Flow
1. User visits homepage
2. `useLocation` hook automatically requests location permission
3. If granted, coordinates are obtained and reverse geocoded
4. Nearby properties are fetched using database function
5. Properties displayed with distance information

### Database Schema Requirements
Properties table must have:
- `latitude` (DECIMAL(10,8)) - Property latitude
- `longitude` (DECIMAL(11,8)) - Property longitude
- `is_active` (BOOLEAN) - Property availability status

### Performance Considerations
- Database indexes on location fields for fast queries
- Caching of geocoding results to reduce API calls
- Efficient Haversine formula implementation in PostgreSQL
- Fallback mechanisms to prevent blocking user experience

## Setup Instructions

### 1. Database Setup
Run the SQL script to create necessary functions and indexes:
```sql
-- Execute scripts/add-nearby-properties-function.sql
-- This creates the calculate_distance and get_nearby_properties functions
-- Also creates performance indexes
```

### 2. Environment Variables
Ensure geocoding service API keys are configured:
```env
# Add to .env.local if using external geocoding services
GOOGLE_MAPS_API_KEY=your_api_key_here
```

### 3. Property Data Requirements
Ensure existing properties have latitude/longitude data:
- Run geocoding script for existing properties without coordinates
- Validate coordinate data quality
- Set up automated geocoding for new property listings

## Usage Examples

### Basic Nearby Properties Search
```typescript
import { getNearbyProperties } from '@/lib/properties'

const nearbyProps = await getNearbyProperties(
  40.7128, // New York latitude
  -74.0060, // New York longitude
  50, // 50km radius
  10 // limit to 10 properties
)

// Each property includes distance information:
// { ...propertyData, distance: 5.2, distanceMiles: 3.2 }
```

### Location-Aware Component
```typescript
import { useLocation } from '@/hooks/use-location'

function LocationAwareComponent() {
  const { location, loading, error, requestLocation } = useLocation()
  
  if (loading) return <div>Getting your location...</div>
  if (error) return <div>Location unavailable: {error}</div>
  if (!location) return <button onClick={requestLocation}>Enable Location</button>
  
  return <div>You're in {location.city}, {location.state}</div>
}
```

## Error Handling

### Location Permission Denied
- Graceful fallback to general property listings
- Clear messaging about location benefits
- Option to manually enter location

### Geocoding Failures
- Multiple service fallbacks
- Coordinate-only storage when address geocoding fails
- User-friendly error messages

### Database Query Errors
- Fallback to non-location-based queries
- Logging for debugging
- Performance monitoring

## Future Enhancements

### Planned Features
1. **Map Integration** - Interactive property maps with markers
2. **Location Preferences** - Save user's preferred search areas
3. **Radius Customization** - Allow users to adjust search radius
4. **Location History** - Remember previous search locations
5. **Geofencing** - Notifications for new properties in saved areas

### Performance Optimizations
1. **Spatial Indexing** - PostGIS integration for advanced spatial queries
2. **Caching Layer** - Redis cache for frequent location queries
3. **CDN Integration** - Cache geocoding results globally
4. **Background Updates** - Periodic location data refresh

## Testing

### Manual Testing Steps
1. Visit homepage and allow location access
2. Verify nearby properties are displayed with distances
3. Test fallback when location is denied
4. Verify property cards show distance information
5. Test search functionality with location context

### Automated Testing
```typescript
// Example test for location hook
import { renderHook } from '@testing-library/react'
import { useLocation } from '@/hooks/use-location'

test('useLocation returns location data', async () => {
  const { result } = renderHook(() => useLocation())
  
  // Mock geolocation API
  Object.defineProperty(global.navigator, 'geolocation', {
    value: {
      getCurrentPosition: jest.fn().mockImplementation((success) =>
        success({
          coords: {
            latitude: 40.7128,
            longitude: -74.0060,
            accuracy: 10
          }
        })
      )
    }
  })
  
  await act(() => {
    result.current.requestLocation()
  })
  
  expect(result.current.location).toEqual({
    latitude: 40.7128,
    longitude: -74.0060,
    accuracy: 10
  })
})
```

## Troubleshooting

### Common Issues

#### Location Not Working
- Check browser permissions
- Verify HTTPS connection (required for geolocation)
- Test with different browsers
- Check console for JavaScript errors

#### Database Function Errors
- Ensure functions are created in correct schema
- Verify user permissions for RPC calls
- Check coordinate data types and ranges
- Monitor query performance

#### Geocoding Failures
- Verify API keys are configured
- Check rate limits and quotas
- Test with different address formats
- Implement fallback services

### Debug Commands
```sql
-- Test distance calculation
SELECT calculate_distance(40.7128, -74.0060, 40.7589, -73.9851) as distance_km;

-- Test nearby properties function
SELECT * FROM get_nearby_properties(40.7128, -74.0060, 50, 5);

-- Check property coordinates
SELECT id, title, latitude, longitude 
FROM properties 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL 
LIMIT 10;
```

## Security Considerations

### Location Privacy
- Request location permission explicitly
- Allow users to opt-out of location features
- Don't store precise coordinates unnecessarily
- Provide clear privacy policy

### Data Protection
- Encrypt location data in transit
- Limit location data retention
- Anonymize location analytics
- Comply with GDPR/CCPA requirements

## Monitoring and Analytics

### Key Metrics
- Location permission grant rate
- Geocoding success rate
- Nearby search performance
- User engagement with location features

### Logging
```typescript
// Example logging for location features
console.log('Location requested:', {
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  hasPermission: hasPermission
})

console.log('Nearby properties found:', {
  userLocation: { lat: latitude, lng: longitude },
  propertiesFound: properties.length,
  searchRadius: maxDistanceKm,
  queryTime: performance.now() - startTime
})
```

## Conclusion

The location-based features enhance Casa8's user experience by providing personalized property recommendations based on user location. The implementation includes:

- ✅ Browser geolocation integration
- ✅ Efficient database distance calculations
- ✅ Geocoding and reverse geocoding
- ✅ Location-aware homepage
- ✅ Performance optimizations
- ✅ Error handling and fallbacks

The system is designed to be robust, performant, and privacy-conscious while providing valuable location-based functionality to users.
