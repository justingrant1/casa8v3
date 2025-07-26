import { createClient } from '@supabase/supabase-js'
import { Database, TablesInsert } from './database.types'
import { geocodeAddressServer, delay } from './geocoding'
import fs from 'fs'
import path from 'path'

// Types for scraper data format
export interface ScraperProperty {
  url: string
  title: string
  address: string
  zipCode: string
  rent: string
  bedrooms: string
  bathrooms: string
  squareFeet: string
  yearBuilt: string
  propertyType: string
  listedBy: string
  phoneNumber: string
  description: string
  availability: string
  features: string[] | string
  images: string[]
  localImagePaths?: string[]
  downloadedImages?: Array<{
    originalUrl: string
    localPath: string
    filename: string
    size: number
    watermarkRemoved: boolean
    wasCropped: boolean
  }>
}

export interface ImportResult {
  success: boolean
  summary: {
    totalProcessed: number
    newProperties: number
    updatedProperties: number
    deactivatedProperties: number
    imageUploads: number
    errors: string[]
  }
  cityResults: Record<string, {
    processed: number
    new: number
    updated: number
    deactivated: number
  }>
}

export class ScraperImportService {
  private supabase: ReturnType<typeof createClient<Database>>

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey)
  }

  /**
   * Parse city and state from cityStateSlug
   */
  private parseCityState(cityStateSlug: string): { city: string; state: string } {
    const parts = cityStateSlug.split('-')
    const state = parts.pop()?.toUpperCase() || ''
    const city = parts.join(' ').replace(/\b\w/g, l => l.toUpperCase())
    
    return { city, state }
  }

  /**
   * Parse price from rent string like "$1,200" -> 1200
   */
  private parsePrice(rent: string): number {
    const cleaned = rent.replace(/[$,]/g, '')
    const price = parseInt(cleaned)
    return isNaN(price) ? 0 : price
  }

  /**
   * Parse square feet from string like "1,200" -> 1200
   */
  private parseSquareFeet(squareFeet: string): number | null {
    if (!squareFeet || squareFeet.trim() === '') {
      return null
    }
    
    const cleaned = squareFeet.replace(/[,\s]/g, '')
    const sqft = parseInt(cleaned)
    return isNaN(sqft) ? null : sqft
  }

  /**
   * Standardize property type
   */
  private standardizePropertyType(propertyType: string): string {
    const type = propertyType.toLowerCase()
    if (type.includes('single family') || type.includes('house')) return 'house'
    if (type.includes('apartment')) return 'apartment'
    if (type.includes('townhouse')) return 'townhouse'
    if (type.includes('condo')) return 'condo'
    return 'house' // default
  }

  /**
   * Generate external ID from URL
   */
  private generateExternalId(url: string): string {
    const match = url.match(/-(\d{6,})\//)
    return match ? match[1] : url.split('/').pop()?.replace(/[^0-9]/g, '') || ''
  }

  /**
   * Build enhanced description with availability and features
   */
  private buildDescription(property: ScraperProperty): string {
    let description = property.description || ''
    
    // Add availability information
    if (property.availability) {
      description += (description ? '\n\n' : '') + `Available: ${property.availability}`
    }
    
    // Add features - handle both string and array formats
    if (property.features) {
      let featuresText = ''
      if (Array.isArray(property.features) && property.features.length > 0) {
        featuresText = property.features.join(', ')
      } else if (typeof property.features === 'string' && property.features.trim()) {
        featuresText = property.features.trim()
      }
      
      if (featuresText) {
        description += (description ? '\n\n' : '') + 'Features: ' + featuresText
      }
    }
    
    return description.trim()
  }

  /**
   * Upload property images to Supabase Storage
   */
  private async uploadPropertyImages(
    property: ScraperProperty, 
    sourceMarket: string
  ): Promise<string[]> {
    const uploadedUrls: string[] = []
    
    if (!property.downloadedImages || property.downloadedImages.length === 0) {
      return uploadedUrls
    }

    // Create property slug for storage path
    const propertySlug = property.address
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase()
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')

    for (const imageInfo of property.downloadedImages) {
      try {
        // Read the local file
        if (!fs.existsSync(imageInfo.localPath)) {
          console.warn(`Image file not found: ${imageInfo.localPath}`)
          continue
        }

        const fileBuffer = fs.readFileSync(imageInfo.localPath)
        const fileName = imageInfo.filename
        const storagePath = `property-images/${sourceMarket}/${propertySlug}/${fileName}`

        // Upload to Supabase Storage
        const { data, error } = await this.supabase.storage
          .from('property-images')
          .upload(storagePath, fileBuffer, {
            contentType: 'image/jpeg',
            upsert: true
          })

        if (error) {
          console.error(`Failed to upload image ${fileName}:`, error.message)
          continue
        }

        // Get public URL
        const { data: publicUrlData } = this.supabase.storage
          .from('property-images')
          .getPublicUrl(storagePath)

        if (publicUrlData?.publicUrl) {
          uploadedUrls.push(publicUrlData.publicUrl)
          console.log(`✅ Uploaded: ${fileName} -> ${publicUrlData.publicUrl}`)
        }

      } catch (error) {
        console.error(`Error uploading image ${imageInfo.filename}:`, error)
      }
    }

    return uploadedUrls
  }

  /**
   * Transform scraper property to Casa8v3 format
   */
  private async transformProperty(
    property: ScraperProperty,
    sourceMarket: string
  ): Promise<TablesInsert<'properties'>> {
    const { city, state } = this.parseCityState(sourceMarket)
    
    // Upload images first
    const imageUrls = await this.uploadPropertyImages(property, sourceMarket)
    
    // Geocode the address
    let latitude: number | null = null
    let longitude: number | null = null
    
    if (property.address) {
      console.log(`🗺️  Geocoding: ${property.address}`)
      const fullAddress = `${property.address}, ${city}, ${state} ${property.zipCode || ''}`.trim()
      
      try {
        const geocodeResult = await geocodeAddressServer(fullAddress)
        if (geocodeResult) {
          latitude = geocodeResult.lat
          longitude = geocodeResult.lng
          console.log(`✅ Geocoded: ${property.address} -> ${latitude}, ${longitude}`)
        } else {
          console.warn(`⚠️  Geocoding failed for: ${property.address}`)
        }
        
        // Add delay to respect API rate limits (Google allows 50 requests per second)
        await delay(100)
      } catch (error) {
        console.error(`❌ Geocoding error for ${property.address}:`, error)
      }
    }
    
    return {
      landlord_id: 'a3930810-91d1-4f55-84b8-81a70291a446',
      title: property.title || 'Untitled Property',
      description: this.buildDescription(property),
      price: this.parsePrice(property.rent),
      property_type: this.standardizePropertyType(property.propertyType),
      address: property.address || '',
      city,
      state,
      zip_code: property.zipCode || null,
      latitude,
      longitude,
      bedrooms: parseInt(property.bedrooms) || 0,
      bathrooms: parseFloat(property.bathrooms) || 0,
      sqft: this.parseSquareFeet(property.squareFeet),
      images: imageUrls.length > 0 ? imageUrls : null,
      is_active: true,
      data_source: 'scraped',
      external_url: property.url,
      external_id: this.generateExternalId(property.url),
      source_market: sourceMarket,
      last_scraped_at: new Date().toISOString(),
      scraped_contact_name: property.listedBy || null,
      scraped_contact_phone: property.phoneNumber || null
    }
  }

  /**
   * Import properties from scraper JSON file
   */
  async importFromFile(filePath: string, sourceMarket: string): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      summary: {
        totalProcessed: 0,
        newProperties: 0,
        updatedProperties: 0,
        deactivatedProperties: 0,
        imageUploads: 0,
        errors: []
      },
      cityResults: {}
    }

    try {
      // Read and parse scraper data
      if (!fs.existsSync(filePath)) {
        throw new Error(`Scraper file not found: ${filePath}`)
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const scraperData: ScraperProperty[] = JSON.parse(fileContent)

      if (!Array.isArray(scraperData)) {
        throw new Error('Invalid scraper data format - expected array')
      }

      console.log(`📊 Processing ${scraperData.length} properties from ${sourceMarket}`)

      // Transform and insert properties
      for (const property of scraperData) {
        try {
          result.summary.totalProcessed++

          // Skip properties without images
          if (!property.downloadedImages || property.downloadedImages.length === 0) {
            console.log(`⏭️  Skipping property without images: ${property.title || property.address}`)
            continue
          }

          // Check if property already exists
          const { data: existingProperty } = await this.supabase
            .from('properties')
            .select('id, external_url')
            .eq('external_url', property.url)
            .single()

          const transformedProperty = await this.transformProperty(property, sourceMarket)

          if (existingProperty) {
            // Update existing property
            const { error } = await this.supabase
              .from('properties')
              .update({
                ...transformedProperty,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingProperty.id)

            if (error) {
              result.summary.errors.push(`Update failed for ${property.url}: ${error.message}`)
            } else {
              result.summary.updatedProperties++
              if (transformedProperty.images) {
                result.summary.imageUploads += transformedProperty.images.length
              }
            }
          } else {
            // Insert new property
            const { error } = await this.supabase
              .from('properties')
              .insert(transformedProperty)

            if (error) {
              result.summary.errors.push(`Insert failed for ${property.url}: ${error.message}`)
            } else {
              result.summary.newProperties++
              if (transformedProperty.images) {
                result.summary.imageUploads += transformedProperty.images.length
              }
            }
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          result.summary.errors.push(`Property processing failed: ${errorMessage}`)
        }
      }

      // Set city results
      result.cityResults[sourceMarket] = {
        processed: result.summary.totalProcessed,
        new: result.summary.newProperties,
        updated: result.summary.updatedProperties,
        deactivated: 0 // Will be implemented in incremental sync
      }

      result.success = result.summary.errors.length === 0

      console.log(`✅ Import completed for ${sourceMarket}:`)
      console.log(`   New: ${result.summary.newProperties}`)
      console.log(`   Updated: ${result.summary.updatedProperties}`)
      console.log(`   Images: ${result.summary.imageUploads}`)
      console.log(`   Errors: ${result.summary.errors.length}`)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      result.summary.errors.push(`Import failed: ${errorMessage}`)
      console.error('❌ Import failed:', errorMessage)
    }

    return result
  }

  /**
   * Incremental sync - compare current URLs with database and process changes
   */
  async incrementalSync(
    currentUrls: string[],
    newProperties: ScraperProperty[],
    removedUrls: string[],
    sourceMarket: string
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      summary: {
        totalProcessed: 0,
        newProperties: 0,
        updatedProperties: 0,
        deactivatedProperties: 0,
        imageUploads: 0,
        errors: []
      },
      cityResults: {}
    }

    try {
      console.log(`🔄 Incremental sync for ${sourceMarket}:`)
      console.log(`   Current URLs: ${currentUrls.length}`)
      console.log(`   New properties: ${newProperties.length}`)
      console.log(`   Removed URLs: ${removedUrls.length}`)

      // Process new properties
      for (const property of newProperties) {
        try {
          // Skip properties without images
          if (!property.downloadedImages || property.downloadedImages.length === 0) {
            console.log(`⏭️  Skipping property without images: ${property.title || property.address}`)
            continue
          }

          const transformedProperty = await this.transformProperty(property, sourceMarket)
          
          const { error } = await this.supabase
            .from('properties')
            .insert(transformedProperty)

          if (error) {
            result.summary.errors.push(`Insert failed for ${property.url}: ${error.message}`)
          } else {
            result.summary.newProperties++
            result.summary.totalProcessed++
            if (transformedProperty.images) {
              result.summary.imageUploads += transformedProperty.images.length
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          result.summary.errors.push(`New property processing failed: ${errorMessage}`)
        }
      }

      // Deactivate removed properties
      if (removedUrls.length > 0) {
        const { error } = await this.supabase
          .from('properties')
          .update({ 
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .in('external_url', removedUrls)
          .eq('source_market', sourceMarket)

        if (error) {
          result.summary.errors.push(`Deactivation failed: ${error.message}`)
        } else {
          result.summary.deactivatedProperties = removedUrls.length
        }
      }

      // Set city results
      result.cityResults[sourceMarket] = {
        processed: result.summary.totalProcessed,
        new: result.summary.newProperties,
        updated: result.summary.updatedProperties,
        deactivated: result.summary.deactivatedProperties
      }

      result.success = result.summary.errors.length === 0

      console.log(`✅ Incremental sync completed for ${sourceMarket}:`)
      console.log(`   New: ${result.summary.newProperties}`)
      console.log(`   Deactivated: ${result.summary.deactivatedProperties}`)
      console.log(`   Images: ${result.summary.imageUploads}`)
      console.log(`   Errors: ${result.summary.errors.length}`)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      result.summary.errors.push(`Incremental sync failed: ${errorMessage}`)
      console.error('❌ Incremental sync failed:', errorMessage)
    }

    return result
  }
}
