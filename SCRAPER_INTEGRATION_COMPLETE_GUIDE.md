# 🏠 Casa8v3 Scraper Integration - Complete System

## 🎯 Overview

This system integrates your AffordableHousing.com scraper with Casa8v3 to automatically populate property listings and maintain data freshness through daily synchronization.

## 🏗️ System Architecture

### **Components**
1. **Database Schema** - Extended properties table with scraper support
2. **Import Service** - Transforms and imports scraper data
3. **Sync Service** - Daily incremental updates and cleanup
4. **API Endpoints** - RESTful endpoints for external integration
5. **CLI Scripts** - Command-line tools for manual operations

### **Data Flow**
```
Scraper → JSON File → Import Service → Database → Casa8v3 Website
                                    ↓
                              Daily Sync Service
                                    ↓
                            Deactivate Removed Properties
```

## 📊 Database Schema

### **Properties Table Extensions**
```sql
-- New columns added to support scraper integration
ALTER TABLE properties ADD COLUMN data_source TEXT DEFAULT 'manual';
ALTER TABLE properties ADD COLUMN external_url TEXT;
ALTER TABLE properties ADD COLUMN external_id TEXT;
ALTER TABLE properties ADD COLUMN source_market TEXT;
ALTER TABLE properties ADD COLUMN last_scraped_at TIMESTAMPTZ;

-- Indexes for performance
CREATE INDEX idx_properties_external_url ON properties(external_url);
CREATE INDEX idx_properties_source_market ON properties(source_market);
CREATE INDEX idx_properties_data_source ON properties(data_source);
```

## 🔄 Import Process

### **1. Initial Import**
```bash
# Import all properties from scraper JSON
node scripts/scraper-import.js /path/to/scraper_results.json montgomery-al
```

**What it does:**
- Reads scraper JSON file
- Transforms data to Casa8v3 format
- Uploads property images to Supabase Storage
- Creates new property records
- Updates existing properties if URL matches

### **2. Data Transformation**
- **Address Parsing**: Extracts city/state from market slug
- **Price Normalization**: Converts "$1,200" → 1200
- **Property Type Mapping**: Maps scraper types to Casa8v3 types
- **Description Enhancement**: Combines description + contact info + features
- **Image Processing**: Uploads cleaned images to cloud storage

### **3. Landlord Assignment**
All scraped properties are assigned to an existing landlord account:
- **Landlord ID**: `a3930810-91d1-4f55-84b8-81a70291a446`
- **Email**: `jgrant@trestacapital.com`

## 🔄 Daily Sync Process

### **Sync Command**
```bash
# Daily sync to detect changes
node scripts/scraper-sync.js /path/to/latest_scraper_results.json montgomery-al
```

### **Change Detection**
1. **New Properties**: Found in scraper but not in database
2. **Removed Properties**: In database but missing from scraper
3. **Unchanged Properties**: Present in both sources

### **Actions Taken**
- ✅ **New Properties**: Added to database with full import process
- ❌ **Removed Properties**: Marked as `is_active = false` (soft delete)
- 📝 **Logging**: All changes logged to `logs/scraper-sync-YYYY-MM-DD.jsonl`

## 🌐 API Endpoints

### **Import Endpoint**
```http
POST /api/scraper/import
Content-Type: application/json

{
  "filePath": "/path/to/scraper_results.json",
  "sourceMarket": "montgomery-al"
}
```

### **Sync Endpoint**
```http
POST /api/scraper/sync
Content-Type: application/json

{
  "filePath": "/path/to/latest_results.json",
  "sourceMarket": "montgomery-al"
}
```

## 📁 File Structure

```
casa8v3/
├── src/
│   ├── lib/
│   │   └── scraper-import.ts          # Core import service
│   └── app/api/scraper/
│       ├── import/route.ts            # Import API endpoint
│       └── sync/route.ts              # Sync API endpoint
├── scripts/
│   ├── scraper-import.js              # CLI import tool
│   ├── scraper-sync.js                # CLI sync tool
│   ├── check-imported-properties.js   # Verification tool
│   └── add-scraper-support.sql        # Database setup
└── logs/
    └── scraper-sync-YYYY-MM-DD.jsonl  # Daily sync logs
```

## 🚀 Usage Examples

### **Initial Setup**
```bash
# 1. Setup database schema
psql -h your-host -U postgres -d postgres -f scripts/add-scraper-support.sql

# 2. Import your first batch
node scripts/scraper-import.js C:/Users/jgran/test_results_clean_images.json montgomery-al

# 3. Verify import
node scripts/check-imported-properties.js
```

### **Daily Operations**
```bash
# Run your scraper (your existing process)
node scraper.js scrape-images-clean

# Sync changes with Casa8v3
node scripts/scraper-sync.js C:/Users/jgran/test_results_clean_images.json montgomery-al
```

### **Multi-City Support**
```bash
# Import different cities
node scripts/scraper-import.js /path/to/birmingham_results.json birmingham-al
node scripts/scraper-import.js /path/to/mobile_results.json mobile-al
node scripts/scraper-import.js /path/to/huntsville_results.json huntsville-al

# Daily sync for all cities
node scripts/scraper-sync.js /path/to/birmingham_latest.json birmingham-al
node scripts/scraper-sync.js /path/to/mobile_latest.json mobile-al
node scripts/scraper-sync.js /path/to/huntsville_latest.json huntsville-al
```

## 📊 Data Mapping

### **Scraper → Casa8v3 Field Mapping**
| Scraper Field | Casa8v3 Field | Transformation |
|---------------|---------------|----------------|
| `title` | `title` | Direct copy |
| `address` | `address` | Direct copy |
| `rent` | `price` | Parse "$1,200" → 1200 |
| `bedrooms` | `bedrooms` | Parse to integer |
| `bathrooms` | `bathrooms` | Parse to float |
| `squareFeet` | `sqft` | Parse to integer |
| `propertyType` | `property_type` | Standardize to enum |
| `description` + `listedBy` + `phoneNumber` + `features` | `description` | Enhanced combination |
| `downloadedImages` | `images` | Upload to Supabase Storage |
| `url` | `external_url` | Direct copy |
| Market slug | `city`, `state` | Parse "montgomery-al" → "Montgomery", "AL" |

### **Property Type Mapping**
| Scraper Type | Casa8v3 Type |
|--------------|--------------|
| "Single Family" | "house" |
| "Apartment" | "apartment" |
| "Townhouse" | "townhouse" |
| "Condo" | "condo" |
| Other | "house" (default) |

## 🖼️ Image Handling

### **Image Upload Process**
1. **Read Local Files**: From `downloadedImages[].localPath`
2. **Generate Storage Path**: `property-images/{market}/{property-slug}/{filename}`
3. **Upload to Supabase**: With automatic public URL generation
4. **Store URLs**: In property `images` JSON array

### **Storage Structure**
```
Supabase Storage: property-images/
├── montgomery-al/
│   ├── 123_main_street/
│   │   ├── photo_1_clean_cropped.jpg
│   │   └── photo_2_clean_cropped.jpg
│   └── 456_oak_avenue/
│       └── photo_1_clean_cropped.jpg
└── birmingham-al/
    └── 789_pine_street/
        └── photo_1_clean_cropped.jpg
```

## 📈 Monitoring & Logging

### **Import Results**
```javascript
{
  success: true,
  summary: {
    totalProcessed: 25,
    newProperties: 20,
    updatedProperties: 5,
    imageUploads: 45,
    errors: []
  },
  cityResults: {
    "montgomery-al": {
      processed: 25,
      new: 20,
      updated: 5,
      deactivated: 0
    }
  }
}
```

### **Sync Logs**
Daily sync operations are logged to `logs/scraper-sync-YYYY-MM-DD.jsonl`:
```json
{"timestamp":"2025-07-24T23:13:27.000Z","market":"montgomery-al","action":"sync_start","properties_count":3}
{"timestamp":"2025-07-24T23:13:27.100Z","market":"montgomery-al","action":"new_property","url":"https://example.com/new-listing"}
{"timestamp":"2025-07-24T23:13:27.200Z","market":"montgomery-al","action":"deactivate_property","url":"https://example.com/removed-listing"}
{"timestamp":"2025-07-24T23:13:27.300Z","market":"montgomery-al","action":"sync_complete","new":1,"deactivated":1,"errors":0}
```

## 🔧 Automation Setup

### **Daily Cron Job (Linux/Mac)**
```bash
# Add to crontab (crontab -e)
0 6 * * * cd /path/to/casa8v3 && node scripts/scraper-sync.js /path/to/latest_results.json montgomery-al >> logs/cron.log 2>&1
```

### **Windows Task Scheduler**
```batch
# Create batch file: daily-sync.bat
@echo off
cd C:\path\to\casa8v3
node scripts/scraper-sync.js C:\path\to\latest_results.json montgomery-al
```

### **Docker Integration**
```dockerfile
# Add to your scraper Dockerfile
COPY scripts/ /app/scripts/
RUN npm install @supabase/supabase-js

# Run sync after scraping
CMD ["sh", "-c", "node scraper.js scrape-images-clean && node scripts/scraper-sync.js /app/results.json montgomery-al"]
```

## 🚨 Error Handling

### **Common Issues & Solutions**

1. **Missing Images**
   ```
   Error: Image file not found: /path/to/image.jpg
   Solution: Ensure scraper downloads images before running import
   ```

2. **Database Connection**
   ```
   Error: Connection refused
   Solution: Check .env.local file has correct Supabase credentials
   ```

3. **Invalid JSON**
   ```
   Error: Unexpected token in JSON
   Solution: Verify scraper output is valid JSON format
   ```

4. **Duplicate Properties**
   ```
   Behavior: Updates existing property based on external_url
   Solution: This is expected behavior for incremental updates
   ```

## 📋 Maintenance Tasks

### **Weekly Tasks**
- Review sync logs for errors
- Check property image upload success rates
- Verify active/inactive property counts

### **Monthly Tasks**
- Clean up old log files
- Review database performance
- Update property type mappings if needed

### **Quarterly Tasks**
- Backup scraper integration configuration
- Review and optimize database indexes
- Update documentation for any changes

## 🎯 Next Steps

### **Immediate Actions**
1. ✅ **Database Setup**: Run `scripts/add-scraper-support.sql`
2. ✅ **Test Import**: Import sample data with `scripts/scraper-import.js`
3. ✅ **Verify Results**: Check imported properties with `scripts/check-imported-properties.js`
4. ✅ **Test Sync**: Run daily sync with `scripts/scraper-sync.js`

### **Production Deployment**
1. **Schedule Daily Sync**: Set up cron job or task scheduler
2. **Monitor Logs**: Implement log monitoring and alerts
3. **Scale for Multiple Cities**: Extend to Birmingham, Mobile, Huntsville
4. **Image Optimization**: Consider CDN for faster image loading

### **Future Enhancements**
- **Real-time Sync**: WebSocket integration for instant updates
- **Advanced Filtering**: Property quality scoring and filtering
- **Analytics Dashboard**: Track scraper performance and property metrics
- **Multi-source Integration**: Support additional property websites

## 📞 Support

### **Troubleshooting Commands**
```bash
# Check database connection
node -e "require('dotenv').config({path:'.env.local'}); console.log('DB URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)"

# Verify property count
node scripts/check-imported-properties.js

# Test single property import
node -e "const service = require('./src/lib/scraper-import.ts'); console.log('Service loaded successfully')"
```

### **Log Locations**
- **Import Logs**: Console output during import
- **Sync Logs**: `logs/scraper-sync-YYYY-MM-DD.jsonl`
- **Error Logs**: `logs/error-YYYY-MM-DD.log` (if configured)

---

## 🎉 Success Metrics

After successful integration, you should see:
- ✅ Properties automatically imported from scraper
- ✅ Daily sync detecting and handling changes
- ✅ Removed properties marked as inactive
- ✅ Property images uploaded to cloud storage
- ✅ Enhanced descriptions with contact information
- ✅ Proper city/state parsing and categorization

**Your Casa8v3 website now has fresh, up-to-date property listings that stay synchronized with your scraper data!** 🏠✨
