# Geocoding Integration Guide

This guide documents the geocoding functionality that has been integrated into the Casa8v3 scraper import system to ensure all properties have proper latitude/longitude coordinates for search functionality.

## Overview

The geocoding system automatically converts property addresses into geographic coordinates (latitude/longitude) using the Google Maps Geocoding API. This is essential for:

- **Search Functionality**: Properties appear correctly in location-based searches
- **Map Display**: Properties can be shown on maps with accurate positioning
- **Distance Calculations**: Enable radius-based searches and distance sorting

## Components

### 1. Server-Side Geocoding Library (`src/lib/geocoding.ts`)

A TypeScript library that provides server-side geocoding functionality:

```typescript
// Geocode an address to coordinates
const result = await geocodeAddressServer("123 Main St, Birmingham, AL 35203")
// Returns: { lat: 33.5186, lng: -86.8104, formatted_address: "..." }
```

**Features:**
- Uses Google Maps Geocoding API
- Built-in error handling and logging
- Rate limiting support with delay function
- Works in Node.js server environment

### 2. Enhanced Scraper Import (`src/lib/scraper-import.ts`)

The scraper import system now automatically geocodes properties during import:

**Process Flow:**
1. Property data is processed from scraper JSON
2. Images are uploaded to Supabase Storage
3. **Address is geocoded** using Google Maps API
4. Property is saved with latitude/longitude coordinates
5. Rate limiting delays prevent API quota issues

**Geocoding Logic:**
- Combines address, city, state, and zip code into full address
- Calls Google Maps Geocoding API
- Stores coordinates in `latitude` and `longitude` database fields
- Logs success/failure for each property
- Includes 100ms delay between requests for rate limiting

### 3. Backfill Script (`scripts/geocode-existing-properties.js`)

A one-time script to geocode existing properties that were imported before geocoding was implemented:

```bash
node scripts/geocode-existing-properties.js
```

**Features:**
- Finds all properties missing coordinates
- Processes them in batches with rate limiting
- Updates database with geocoded coordinates
- Provides detailed progress reporting
- Handles errors gracefully

## Implementation Details

### Database Schema

Properties table includes geocoding fields:
```sql
latitude DECIMAL(10, 8) NULL,
longitude DECIMAL(11, 8) NULL
```

### API Configuration

Requires Google Maps API key in environment variables:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### Rate Limiting

To respect Google's API limits:
- **100ms delay** between geocoding requests
- **1 second pause** every 10 properties in backfill script
- Google allows 50 requests per second (we use ~10/second for safety)

### Error Handling

The system handles various error scenarios:
- **Missing API key**: Logs warning, skips geocoding
- **Invalid addresses**: Logs warning, continues processing
- **API failures**: Logs error, continues with next property
- **Rate limit exceeded**: Built-in delays prevent this

## Usage Examples

### 1. Import New Properties with Geocoding

```bash
# Properties will be automatically geocoded during import
node scripts/scraper-import.js data.json birmingham-al
```

### 2. Backfill Existing Properties

```bash
# One-time script to geocode existing properties
node scripts/geocode-existing-properties.js
```

### 3. Check Geocoding Status

```sql
-- Count properties with/without coordinates
SELECT 
  COUNT(*) as total_properties,
  COUNT(latitude) as geocoded_properties,
  COUNT(*) - COUNT(latitude) as missing_coordinates
FROM properties 
WHERE is_active = true;
```

## Monitoring and Maintenance

### Success Metrics

The backfill script provides detailed reporting:
```
📊 Geocoding Results
====================
✅ Successfully geocoded: 103
❌ Failed to geocode: 0
⏭️  Skipped (incomplete address): 0
📈 Total processed: 103
```

### Common Issues

1. **Missing API Key**
   - Symptom: "Google Maps API key not configured" warnings
   - Solution: Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local`

2. **Invalid Addresses**
   - Symptom: "Geocoding failed" warnings for specific properties
   - Solution: Check address format in source data

3. **Rate Limiting**
   - Symptom: API errors or quota exceeded messages
   - Solution: Built-in delays should prevent this, but can increase delays if needed

### Verification

After geocoding, verify results:

```sql
-- Check sample of geocoded properties
SELECT title, address, city, state, latitude, longitude 
FROM properties 
WHERE latitude IS NOT NULL 
LIMIT 10;
```

## Future Enhancements

Potential improvements to consider:

1. **Batch Geocoding**: Process multiple addresses in single API call
2. **Geocoding Cache**: Store results to avoid re-geocoding same addresses
3. **Address Validation**: Pre-validate addresses before geocoding
4. **Fallback Services**: Use alternative geocoding services if Google fails
5. **Coordinate Validation**: Verify coordinates are within expected geographic bounds

## API Costs

Google Maps Geocoding API pricing (as of 2024):
- **$5 per 1,000 requests** after free tier
- **Free tier**: 200 requests per day
- **Monthly billing**: Pay only for what you use

For large imports, monitor usage in Google Cloud Console.

## Troubleshooting

### Script Fails to Run

1. Check Node.js version: `node --version` (requires Node 14+)
2. Install dependencies: `npm install`
3. Verify environment variables in `.env.local`

### Geocoding Returns No Results

1. Check address format in source data
2. Verify API key has Geocoding API enabled
3. Check Google Cloud Console for quota/billing issues

### Database Connection Issues

1. Verify Supabase credentials in `.env.local`
2. Check network connectivity
3. Ensure service role key has proper permissions

## Summary

The geocoding integration ensures all properties in your Casa8v3 database have accurate geographic coordinates, enabling proper search functionality and map display. The system is designed to be:

- **Automatic**: New imports are geocoded automatically
- **Reliable**: Built-in error handling and rate limiting
- **Efficient**: Optimized for Google's API limits
- **Maintainable**: Clear logging and monitoring capabilities

Your properties should now appear correctly in location-based searches and map displays!
