#!/usr/bin/env node

/**
 * Casa8v3 Multi-City Scraper Import Script
 * 
 * This script imports property data from AffordableHousing.com scraper results
 * into the Casa8v3 database with image upload support.
 * 
 * Usage:
 *   node scripts/scraper-import.js <filePath> <sourceMarket>
 *   node scripts/scraper-import.js C:/Users/jgran/test_results_clean_images.json montgomery-al
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

// Import our scraper service using ts-node
require('ts-node/register')
const { ScraperImportService } = require('../src/lib/scraper-import.ts')

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate environment
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nPlease check your .env.local file')
  process.exit(1)
}

// Parse command line arguments
const args = process.argv.slice(2)
if (args.length < 2) {
  console.error('❌ Usage: node scripts/scraper-import.js <filePath> <sourceMarket>')
  console.error('\nExamples:')
  console.error('   node scripts/scraper-import.js C:/Users/jgran/test_results_clean_images.json montgomery-al')
  console.error('   node scripts/scraper-import.js /path/to/birmingham_results.json birmingham-al')
  console.error('   node scripts/scraper-import.js /path/to/mobile_results.json mobile-al')
  process.exit(1)
}

const [filePath, sourceMarket] = args

// Validate inputs
if (!fs.existsSync(filePath)) {
  console.error(`❌ File not found: ${filePath}`)
  process.exit(1)
}

// Validate source market format (city-state)
if (!/^[a-z-]+-[a-z]{2}$/.test(sourceMarket)) {
  console.error(`❌ Invalid source market format: ${sourceMarket}`)
  console.error('   Expected format: city-state (e.g., montgomery-al, birmingham-al)')
  process.exit(1)
}

async function main() {
  console.log('🏠 Casa8v3 Multi-City Scraper Import')
  console.log('=====================================')
  console.log(`📁 File: ${filePath}`)
  console.log(`🏙️  Market: ${sourceMarket}`)
  console.log('')

  try {
    // Initialize import service
    const importService = new ScraperImportService(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Start import
    console.log('🚀 Starting import...')
    const startTime = Date.now()

    const result = await importService.importFromFile(filePath, sourceMarket)

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    // Display results
    console.log('\n📊 Import Results')
    console.log('=================')
    console.log(`✅ Success: ${result.success}`)
    console.log(`⏱️  Duration: ${duration}s`)
    console.log(`📈 Total Processed: ${result.summary.totalProcessed}`)
    console.log(`🆕 New Properties: ${result.summary.newProperties}`)
    console.log(`🔄 Updated Properties: ${result.summary.updatedProperties}`)
    console.log(`🖼️  Images Uploaded: ${result.summary.imageUploads}`)
    console.log(`❌ Errors: ${result.summary.errors.length}`)

    if (result.summary.errors.length > 0) {
      console.log('\n🚨 Errors:')
      result.summary.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`)
      })
    }

    // City-specific results
    console.log('\n🏙️  City Results:')
    Object.entries(result.cityResults).forEach(([city, stats]) => {
      console.log(`   ${city}: ${stats.processed} processed, ${stats.new} new, ${stats.updated} updated`)
    })

    console.log('\n✅ Import completed!')

    if (!result.success) {
      process.exit(1)
    }

  } catch (error) {
    console.error('\n❌ Import failed:', error.message)
    console.error('\nStack trace:', error.stack)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Import interrupted by user')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n\n⏹️  Import terminated')
  process.exit(0)
})

// Run the import
main().catch(error => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})
