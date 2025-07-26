# 🏠 Multi-City Scraper Integration - Complete Implementation Guide

## 📋 Overview

This guide implements a complete multi-city property scraper integration system for Casa8v3. The system transforms your existing AffordableHousing.com scraper into a powerful multi-city property import and sync engine with automated image processing and daily freshness checks.

## 🎯 What This System Does

### **Core Capabilities:**
- **Multi-City Import**: Import properties from any city scraped by your AffordableHousing.com scraper
- **Image Processing**: Automatically upload watermark-free, cropped property images to Supabase Storage
- **Daily Sync**: Keep properties fresh by detecting removed listings and deactivating them
- **Incremental Updates**: Only process new/changed properties for efficiency
- **Data Transformation**: Convert scraper data format to Casa8v3 database schema
- **Contact Preservation**: Maintain original contact info and property details

### **Supported Cities:**
- Montgomery, AL (`montgomery-al`)
- Birmingham, AL (`birmingham-al`) 
- Mobile, AL (`mobile-al`)
- Any city your scraper supports (just use `city-state` format)

## 🚀 Phase 1: Database Setup

### 1.1 Run Database Migration

```bash
# Apply scraper support schema changes
psql -h your-supabase-host -U postgres -d postgres -f scripts/add-scraper-support.sql
```

**What this adds:**
- `data_source` - Tracks if property is manual/scraped
- `external_url` - Original AffordableHousing.com URL
- `external_id` - Unique identifier from source
- `source_market` - City market (e.g., montgomery-al)
- `last_scraped_at` - Freshness timestamp
- System landlord profile for scraped properties
- Optimized indexes for performance

### 1.2 Create Storage Bucket

In Supabase Dashboard:
1. Go to Storage
2. Create bucket: `property-images`
3. Set to Public
4. Configure RLS policies for read access

## 🔧 Phase 2: Build System

### 2.1 Compile TypeScript

```bash
# Build the scraper import service
npm run build
```

### 2.2 Environment Setup

Add to `.env.local`:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 📊 Phase 3: Initial Import

### 3.1 Import Montgomery Properties

```bash
# Import your existing Montgomery scraper results
node scripts/scraper-import.js C:/Users/jgran/test_results_clean_images.json montgomery-al
```

**Expected Output:**
```
🏠 Casa8v3 Multi-City Scraper Import
=====================================
📁 File: C:/Users/jgran/test_results_clean_images.json
🏙️  Market: montgomery-al

🚀 Starting import...
📊 Processing 45 properties from montgomery-al
✅ Uploaded: photo_1_clean_cropped.jpg -> https://...
✅ Uploaded: photo_2_clean_cropped.jpg -> https://...

📊 Import Results
=================
✅ Success: true
⏱️  Duration: 23.4s
📈 Total Processed: 45
🆕 New Properties: 45
🔄 Updated Properties: 0
🖼️  Images Uploaded: 127
❌ Errors: 0

🏙️  City Results:
   montgomery-al: 45 processed, 45 new, 0 updated

✅ Import completed!
```

### 3.2 Verify Import

Check your Casa8v3 website - you should see:
- 45 new Montgomery properties
- Professional images (watermark-free, cropped)
- Contact information preserved
- Properties marked as "Listed by AffordableHousing System"

## 🔄 Phase 4: Daily Sync Setup

### 4.1 Run Daily Sync

```bash
# Compare current scraper results with database
node scripts/scraper-sync.js C:/Users/jgran/daily_montgomery_results.json montgomery-al
```

**Expected Output:**
```
🔄 Casa8v3 Daily Scraper Sync
=============================
📁 File: C:/Users/jgran/daily_montgomery_results.json
🏙️  Market: montgomery-al
📅 Date: 7/24/2025

📖 Reading current scraper results...
   Found 43 current properties

🔍 Fetching existing properties from database...
   Found 45 existing properties (45 active, 0 inactive)

📊 Change Analysis:
   🆕 New properties: 1
   ❌ Removed properties: 3
   ✅ Unchanged properties: 42

🚀 Starting incremental sync...

📊 Sync Results
===============
✅ Success: true
⏱️  Duration: 8.2s
🆕 New Properties Added: 1
❌ Properties Deactivated: 3
🖼️  Images Uploaded: 4
🚨 Errors: 0

📈 Final Statistics:
   Total Properties: 46
   Active Properties: 43
   Inactive Properties: 3

✅ Daily sync completed!
📝 Logged to: logs/scraper-sync-2025-07-24.jsonl
```

### 4.2 Automate Daily Sync

**Windows Task Scheduler:**
```batch
# Create daily-sync.bat
@echo off
cd /d "C:\path\to\casa8v3"
node scripts/scraper-sync.js C:/Users/jgran/daily_montgomery_results.json montgomery-al
```

**Linux/Mac Cron:**
```bash
# Add to crontab
0 6 * * * cd /path/to/casa8v3 && node scripts/scraper-sync.js /path/to/daily_results.json montgomery-al
```

## 🌆 Phase 5: Multi-City Expansion

### 5.1 Add Birmingham

```bash
# Run your scraper for Birmingham
node scraper.js scrape-images-clean # Configure for Birmingham

# Import Birmingham results
node scripts/scraper-import.js C:/Users/jgran/birmingham_results.json birmingham-al

# Setup daily sync for Birmingham
node scripts/scraper-sync.js C:/Users/jgran/daily_birmingham.json birmingham-al
```

### 5.2 Add Mobile

```bash
# Run your scraper for Mobile
node scraper.js scrape-images-clean # Configure for Mobile

# Import Mobile results
node scripts/scraper-import.js C:/Users/jgran/mobile_results.json mobile-al

# Setup daily sync for Mobile
node scripts/scraper-sync.js C:/Users/jgran/daily_mobile.json mobile-al
```

## 🔌 Phase 6: API Integration

### 6.1 Import via API

```javascript
// POST /api/scraper/import
const response = await fetch('/api/scraper/import', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    filePath: 'C:/Users/jgran/test_results_clean_images.json',
    sourceMarket: 'montgomery-al'
  })
})

const result = await response.json()
console.log(result.message) // "Successfully imported 45 new and updated 0 properties"
```

### 6.2 Sync via API

```javascript
// POST /api/scraper/sync
const response = await fetch('/api/scraper/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    currentUrls: ['https://affordablehousing.com/property1', 'https://affordablehousing.com/property2'],
    newProperties: [/* new property objects */],
    sourceMarket: 'montgomery-al'
  })
})
```

### 6.3 Check Status

```javascript
// GET /api/scraper/sync?sourceMarket=montgomery-al
const response = await fetch('/api/scraper/sync?sourceMarket=montgomery-al')
const status = await response.json()

console.log(status.data.statistics)
// {
//   totalProperties: 46,
//   activeProperties: 43,
//   inactiveProperties: 3,
//   lastScrapedAt: "2025-07-24T20:15:30.000Z"
// }
```

## 📁 File Structure

```
casa8v3/
├── scripts/
│   ├── add-scraper-support.sql      # Database schema updates
│   ├── scraper-import.js            # Initial import script
│   └── scraper-sync.js              # Daily sync script
├── src/
│   ├── lib/
│   │   ├── scraper-import.ts        # Core import service
│   │   └── database.types.ts        # Updated with scraper fields
│   └── app/api/scraper/
│       ├── import/route.ts          # Import API endpoint
│       └── sync/route.ts            # Sync API endpoint
├── logs/                            # Sync logs (auto-created)
└── MULTI_CITY_SCRAPER_INTEGRATION_GUIDE.md
```

## 🎛️ Configuration Options

### Data Source Mapping

```typescript
// Customize property type mapping
private standardizePropertyType(propertyType: string): string {
  const type = propertyType.toLowerCase()
  if (type.includes('single family') || type.includes('house')) return 'house'
  if (type.includes('apartment')) return 'apartment'
  if (type.includes('townhouse')) return 'townhouse'
  if (type.includes('condo')) return 'condo'
  return 'house' // default
}
```

### Image Storage Paths

```typescript
// Images stored as: property-images/{sourceMarket}/{propertySlug}/{filename}
// Example: property-images/montgomery-al/3359_bedford_ln/photo_1_clean_cropped.jpg
```

### Contact Information

```typescript
// Contact info preserved in description:
// "Listed by: John Smith | Phone: (334) 555-0123 | Available: Immediately"
```

## 🔍 Monitoring & Logs

### Daily Sync Logs

```json
// logs/scraper-sync-2025-07-24.jsonl
{
  "timestamp": "2025-07-24T20:15:30.000Z",
  "sourceMarket": "montgomery-al",
  "filePath": "C:/Users/jgran/daily_montgomery.json",
  "duration": 8.2,
  "results": {
    "success": true,
    "newProperties": 1,
    "deactivatedProperties": 3,
    "imageUploads": 4,
    "errors": 0
  },
  "analysis": {
    "currentUrls": 43,
    "existingUrls": 45,
    "newUrls": 1,
    "removedUrls": 3
  }
}
```

### Database Queries

```sql
-- Check scraper statistics
SELECT 
  source_market,
  data_source,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_active = true) as active,
  COUNT(*) FILTER (WHERE is_active = false) as inactive,
  MAX(last_scraped_at) as last_scraped
FROM properties 
WHERE data_source = 'scraped'
GROUP BY source_market, data_source;

-- Find stale properties (not scraped in 2+ days)
SELECT id, title, address, source_market, last_scraped_at
FROM properties 
WHERE data_source = 'scraped' 
  AND is_active = true
  AND (last_scraped_at IS NULL OR last_scraped_at < NOW() - INTERVAL '2 days')
ORDER BY last_scraped_at ASC;
```

## 🚨 Troubleshooting

### Common Issues

**1. TypeScript Compilation Errors**
```bash
# Fix: Rebuild the project
npm run build
```

**2. Image Upload Failures**
```bash
# Check: Supabase storage bucket exists and is public
# Check: SUPABASE_SERVICE_ROLE_KEY is set correctly
```

**3. Database Connection Issues**
```bash
# Check: Environment variables in .env.local
# Check: Database schema migration was applied
```

**4. File Path Issues (Windows)**
```bash
# Use forward slashes or double backslashes
node scripts/scraper-import.js C:/Users/jgran/results.json montgomery-al
# OR
node scripts/scraper-import.js C:\\Users\\jgran\\results.json montgomery-al
```

### Performance Optimization

**Large Imports:**
- Process in batches of 100 properties
- Use `--max-old-space-size=4096` for Node.js memory
- Run during off-peak hours

**Image Processing:**
- Ensure local images exist before import
- Use SSD storage for faster file I/O
- Consider parallel uploads (modify service)

## 🎉 Success Metrics

After successful implementation, you should see:

### **Database Growth:**
- Properties table populated with scraped listings
- Images stored in Supabase Storage
- Proper data source tracking

### **Website Enhancement:**
- More property listings available
- Professional property photos
- Preserved contact information
- Fresh, up-to-date inventory

### **Operational Efficiency:**
- Automated daily sync process
- Stale property detection
- Comprehensive logging
- Multi-city scalability

## 🔮 Next Steps

1. **Expand to More Cities**: Add Atlanta, Nashville, etc.
2. **Enhanced Monitoring**: Build admin dashboard for sync status
3. **Advanced Filtering**: Add property quality scoring
4. **Contact Integration**: Direct landlord messaging system
5. **Market Analytics**: Track pricing trends across cities

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the daily sync logs in `logs/`
3. Verify database schema with provided SQL queries
4. Test with a small sample file first

**Your scraper is now a powerful multi-city property import engine! 🚀**
