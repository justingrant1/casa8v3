#!/usr/bin/env node

/**
 * Casa8v3 Daily Scraper Sync Script
 * 
 * This script performs incremental sync to keep property data fresh.
 * It compares current scraper results with database and:
 * - Adds new properties
 * - Deactivates removed properties
 * - Updates existing properties
 * 
 * Usage:
 *   node scripts/scraper-sync.js <currentFilePath> <sourceMarket>
 *   node scripts/scraper-sync.js C:/Users/jgran/daily_montgomery_results.json montgomery-al
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
  console.error('❌ Usage: node scripts/scraper-sync.js <currentFilePath> <sourceMarket>')
  console.error('\nExamples:')
  console.error('   node scripts/scraper-sync.js C:/Users/jgran/daily_montgomery.json montgomery-al')
  console.error('   node scripts/scraper-sync.js /path/to/daily_birmingham.json birmingham-al')
  console.error('   node scripts/scraper-sync.js /path/to/daily_mobile.json mobile-al')
  console.error('\nThis script compares current scraper results with database to:')
  console.error('   • Add new properties')
  console.error('   • Deactivate removed properties')
  console.error('   • Keep data fresh and accurate')
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
  console.log('🔄 Casa8v3 Daily Scraper Sync')
  console.log('=============================')
  console.log(`📁 File: ${filePath}`)
  console.log(`🏙️  Market: ${sourceMarket}`)
  console.log(`📅 Date: ${new Date().toLocaleDateString()}`)
  console.log('')

  try {
    // Initialize services
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const importService = new ScraperImportService(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Read current scraper results
    console.log('📖 Reading current scraper results...')
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const currentProperties = JSON.parse(fileContent)

    if (!Array.isArray(currentProperties)) {
      throw new Error('Invalid scraper data format - expected array')
    }

    const currentUrls = currentProperties.map(prop => prop.url)
    console.log(`   Found ${currentProperties.length} current properties`)

    // Get existing URLs from database
    console.log('🔍 Fetching existing properties from database...')
    const { data: existingProperties, error } = await supabase
      .from('properties')
      .select('external_url, is_active')
      .eq('source_market', sourceMarket)
      .eq('data_source', 'scraped')
      .not('external_url', 'is', null)

    if (error) {
      throw new Error(`Failed to fetch existing properties: ${error.message}`)
    }

    const existingUrls = existingProperties?.map(p => p.external_url).filter(Boolean) || []
    const activeCount = existingProperties?.filter(p => p.is_active).length || 0
    const inactiveCount = existingProperties?.length - activeCount || 0

    console.log(`   Found ${existingUrls.length} existing properties (${activeCount} active, ${inactiveCount} inactive)`)

    // Analyze changes
    const newUrls = currentUrls.filter(url => !existingUrls.includes(url))
    const removedUrls = existingUrls.filter(url => !currentUrls.includes(url))
    const unchangedUrls = currentUrls.filter(url => existingUrls.includes(url))

    console.log('\n📊 Change Analysis:')
    console.log(`   🆕 New properties: ${newUrls.length}`)
    console.log(`   ❌ Removed properties: ${removedUrls.length}`)
    console.log(`   ✅ Unchanged properties: ${unchangedUrls.length}`)

    // Filter new properties
    const newProperties = currentProperties.filter(prop => newUrls.includes(prop.url))

    // Perform incremental sync
    console.log('\n🚀 Starting incremental sync...')
    const startTime = Date.now()

    const result = await importService.incrementalSync(
      currentUrls,
      newProperties,
      removedUrls,
      sourceMarket
    )

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    // Display results
    console.log('\n📊 Sync Results')
    console.log('===============')
    console.log(`✅ Success: ${result.success}`)
    console.log(`⏱️  Duration: ${duration}s`)
    console.log(`🆕 New Properties Added: ${result.summary.newProperties}`)
    console.log(`❌ Properties Deactivated: ${result.summary.deactivatedProperties}`)
    console.log(`🖼️  Images Uploaded: ${result.summary.imageUploads}`)
    console.log(`🚨 Errors: ${result.summary.errors.length}`)

    if (result.summary.errors.length > 0) {
      console.log('\n🚨 Errors:')
      result.summary.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`)
      })
    }

    // Summary statistics
    const finalActiveCount = activeCount + result.summary.newProperties - result.summary.deactivatedProperties
    console.log('\n📈 Final Statistics:')
    console.log(`   Total Properties: ${existingUrls.length + result.summary.newProperties}`)
    console.log(`   Active Properties: ${finalActiveCount}`)
    console.log(`   Inactive Properties: ${existingUrls.length + result.summary.newProperties - finalActiveCount}`)

    console.log('\n✅ Daily sync completed!')

    // Log sync to file for monitoring
    const logEntry = {
      timestamp: new Date().toISOString(),
      sourceMarket,
      filePath,
      duration: parseFloat(duration),
      results: {
        success: result.success,
        newProperties: result.summary.newProperties,
        deactivatedProperties: result.summary.deactivatedProperties,
        imageUploads: result.summary.imageUploads,
        errors: result.summary.errors.length
      },
      analysis: {
        currentUrls: currentUrls.length,
        existingUrls: existingUrls.length,
        newUrls: newUrls.length,
        removedUrls: removedUrls.length
      }
    }

    // Create logs directory if it doesn't exist
    const logsDir = path.join(__dirname, '..', 'logs')
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true })
    }

    // Append to daily log file
    const logFile = path.join(logsDir, `scraper-sync-${new Date().toISOString().split('T')[0]}.jsonl`)
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n')
    console.log(`📝 Logged to: ${logFile}`)

    if (!result.success) {
      process.exit(1)
    }

  } catch (error) {
    console.error('\n❌ Sync failed:', error.message)
    console.error('\nStack trace:', error.stack)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Sync interrupted by user')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n\n⏹️  Sync terminated')
  process.exit(0)
})

// Run the sync
main().catch(error => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})
