#!/usr/bin/env node

/**
 * Casa8v3 Scraper Integration Setup Script
 * 
 * This script helps you set up the multi-city scraper integration system.
 * It checks prerequisites, builds the system, and guides you through first import.
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🏠 Casa8v3 Multi-City Scraper Integration Setup')
console.log('===============================================')
console.log('')

// Check if we're in the right directory
if (!fs.existsSync('package.json') || !fs.existsSync('src')) {
  console.error('❌ Please run this script from the Casa8v3 root directory')
  process.exit(1)
}

// Check environment variables
console.log('🔍 Checking environment variables...')
const envPath = '.env.local'
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found')
  console.error('   Please create .env.local with your Supabase credentials')
  process.exit(1)
}

const envContent = fs.readFileSync(envPath, 'utf-8')
const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL')
const hasServiceKey = envContent.includes('SUPABASE_SERVICE_ROLE_KEY')

if (!hasSupabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL in .env.local')
  process.exit(1)
}

if (!hasServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env.local')
  console.error('   This is required for scraper operations')
  process.exit(1)
}

console.log('✅ Environment variables found')

// Build TypeScript
console.log('\n🔨 Building TypeScript...')
try {
  execSync('npm run build', { stdio: 'inherit' })
  console.log('✅ TypeScript build completed')
} catch (error) {
  console.error('❌ TypeScript build failed')
  console.error('   Please fix build errors and try again')
  process.exit(1)
}

// Check if TypeScript source files exist
if (!fs.existsSync('src/lib/scraper-import.ts')) {
  console.error('❌ Scraper import service not found in src/lib/')
  console.error('   TypeScript source files may be missing')
  process.exit(1)
}

console.log('✅ Scraper import service TypeScript files found')

// Create logs directory
const logsDir = 'logs'
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
  console.log('✅ Created logs directory')
}

// Check for scraper data file
console.log('\n📁 Checking for scraper data...')
const commonPaths = [
  'C:/Users/jgran/test_results_clean_images.json',
  'C:/Users/jgran/test_results.json',
  './scraper_results.json'
]

let foundDataFile = null
for (const filePath of commonPaths) {
  if (fs.existsSync(filePath)) {
    foundDataFile = filePath
    break
  }
}

if (foundDataFile) {
  console.log(`✅ Found scraper data: ${foundDataFile}`)
  
  // Validate the data format
  try {
    const data = JSON.parse(fs.readFileSync(foundDataFile, 'utf-8'))
    if (Array.isArray(data) && data.length > 0) {
      console.log(`   Contains ${data.length} properties`)
      
      // Check if it has the expected structure
      const sample = data[0]
      const hasRequiredFields = sample.url && sample.title && sample.address && sample.rent
      
      if (hasRequiredFields) {
        console.log('✅ Data format looks correct')
      } else {
        console.log('⚠️  Data format may need adjustment')
        console.log('   Expected fields: url, title, address, rent')
      }
    } else {
      console.log('⚠️  Data file is empty or not an array')
    }
  } catch (error) {
    console.log('⚠️  Could not parse data file as JSON')
  }
} else {
  console.log('⚠️  No scraper data file found in common locations')
  console.log('   You can import data later using:')
  console.log('   node scripts/scraper-import.js <filePath> <sourceMarket>')
}

// Display next steps
console.log('\n🎉 Setup Complete!')
console.log('==================')
console.log('')
console.log('📋 Next Steps:')
console.log('')
console.log('1. Apply database schema:')
console.log('   Run the SQL in scripts/add-scraper-support.sql in your Supabase dashboard')
console.log('')
console.log('2. Create storage bucket:')
console.log('   Create "property-images" bucket in Supabase Storage (set to public)')
console.log('')
console.log('3. Import your first city:')
if (foundDataFile) {
  console.log(`   node scripts/scraper-import.js "${foundDataFile}" montgomery-al`)
} else {
  console.log('   node scripts/scraper-import.js <path-to-your-data.json> montgomery-al')
}
console.log('')
console.log('4. Set up daily sync:')
console.log('   node scripts/scraper-sync.js <path-to-daily-data.json> montgomery-al')
console.log('')
console.log('📖 For detailed instructions, see:')
console.log('   MULTI_CITY_SCRAPER_INTEGRATION_GUIDE.md')
console.log('')
console.log('🚀 Your scraper integration is ready to go!')
