#!/usr/bin/env node

/**
 * Geocode Existing Properties Script
 * 
 * This script finds all properties in the database that are missing latitude/longitude
 * coordinates and geocodes them using the Google Maps API.
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Geocoding function (inline since we can't import TS directly in Node.js)
async function geocodeAddressServer(address) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    console.warn('Google Maps API key not configured for geocoding')
    return null
  }

  try {
    const encodedAddress = encodeURIComponent(address)
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`
    
    const fetch = (await import('node-fetch')).default
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0]
      const location = result.geometry.location
      
      return {
        lat: location.lat,
        lng: location.lng,
        formatted_address: result.formatted_address
      }
    } else {
      console.warn(`Geocoding failed for address "${address}": ${data.status}`)
      return null
    }
  } catch (error) {
    console.error(`Geocoding error for address "${address}":`, error)
    return null
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function geocodeExistingProperties() {
  console.log('🏠 Casa8v3 Property Geocoding Backfill')
  console.log('=====================================')
  
  try {
    // Find all properties missing coordinates
    console.log('🔍 Finding properties without coordinates...')
    
    const { data: properties, error } = await supabase
      .from('properties')
      .select('id, address, city, state, zip_code, title')
      .or('latitude.is.null,longitude.is.null')
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch properties: ${error.message}`)
    }

    if (!properties || properties.length === 0) {
      console.log('✅ All properties already have coordinates!')
      return
    }

    console.log(`📊 Found ${properties.length} properties needing geocoding`)
    console.log('')

    let successCount = 0
    let failureCount = 0
    let skippedCount = 0

    // Process each property
    for (let i = 0; i < properties.length; i++) {
      const property = properties[i]
      const progress = `[${i + 1}/${properties.length}]`
      
      console.log(`${progress} Processing: ${property.title}`)
      console.log(`   Address: ${property.address}, ${property.city}, ${property.state} ${property.zip_code || ''}`)

      // Skip if no address
      if (!property.address || !property.city || !property.state) {
        console.log(`   ⏭️  Skipping - incomplete address`)
        skippedCount++
        continue
      }

      try {
        // Build full address
        const fullAddress = `${property.address}, ${property.city}, ${property.state} ${property.zip_code || ''}`.trim()
        
        // Geocode the address
        const geocodeResult = await geocodeAddressServer(fullAddress)
        
        if (geocodeResult) {
          // Update the property with coordinates
          const { error: updateError } = await supabase
            .from('properties')
            .update({
              latitude: geocodeResult.lat,
              longitude: geocodeResult.lng,
              updated_at: new Date().toISOString()
            })
            .eq('id', property.id)

          if (updateError) {
            console.log(`   ❌ Database update failed: ${updateError.message}`)
            failureCount++
          } else {
            console.log(`   ✅ Geocoded: ${geocodeResult.lat}, ${geocodeResult.lng}`)
            successCount++
          }
        } else {
          console.log(`   ⚠️  Geocoding failed - no results`)
          failureCount++
        }

        // Rate limiting - Google allows 50 requests per second
        await delay(100)

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`)
        failureCount++
      }

      // Add a longer pause every 10 properties to be extra safe with rate limits
      if ((i + 1) % 10 === 0) {
        console.log(`   ⏸️  Pausing for rate limit safety...`)
        await delay(1000)
      }

      console.log('')
    }

    // Summary
    console.log('📊 Geocoding Results')
    console.log('====================')
    console.log(`✅ Successfully geocoded: ${successCount}`)
    console.log(`❌ Failed to geocode: ${failureCount}`)
    console.log(`⏭️  Skipped (incomplete address): ${skippedCount}`)
    console.log(`📈 Total processed: ${properties.length}`)
    
    if (successCount > 0) {
      console.log('')
      console.log('🎉 Geocoding backfill completed successfully!')
      console.log('   Your properties should now appear correctly in search results.')
    }

  } catch (error) {
    console.error('❌ Geocoding backfill failed:', error.message)
    process.exit(1)
  }
}

// Run the script
geocodeExistingProperties()
