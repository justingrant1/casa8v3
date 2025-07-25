const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function dailyFreshnessCheck() {
  console.log('🔄 Starting daily freshness check...');
  
  let totalDeactivated = 0;
  const errors = [];
  
  try {
    // Get all active scraped properties
    const { data: activeProperties, error } = await supabase
      .from('properties')
      .select('external_url, source_market, title, address')
      .eq('data_source', 'scraped')
      .eq('is_active', true);

    if (error) throw error;

    console.log(`📊 Found ${activeProperties.length} active scraped properties`);

    // Group by source market
    const marketGroups = activeProperties.reduce((acc, prop) => {
      if (!acc[prop.source_market]) acc[prop.source_market] = [];
      acc[prop.source_market].push({
        url: prop.external_url,
        title: prop.title,
        address: prop.address
      });
      return acc;
    }, {});

    console.log(`🏘️ Markets to check: ${Object.keys(marketGroups).join(', ')}`);

    // For each market, check property freshness
    for (const [market, properties] of Object.entries(marketGroups)) {
      console.log(`\n🔍 Checking ${market} (${properties.length} properties)`);
      
      try {
        // TODO: Integrate with your actual scraper here
        // For now, we'll simulate by checking if properties still exist
        // You would replace this with actual scraper calls:
        // const currentScrapedData = await runScraperForMarket(market);
        // const currentUrls = currentScrapedData.map(p => p.url);
        
        // Simulate: assume all properties are still active for now
        // In real implementation, you'd compare with fresh scraper results
        const existingUrls = properties.map(p => p.url);
        const currentUrls = existingUrls; // Replace with actual scraper results
        
        // Find removed properties (properties that were in DB but not in fresh scrape)
        const removedUrls = existingUrls.filter(url => !currentUrls.includes(url));
        
        if (removedUrls.length > 0) {
          console.log(`❌ Found ${removedUrls.length} removed properties in ${market}:`);
          
          // Log which properties are being removed
          const removedProperties = properties.filter(p => removedUrls.includes(p.url));
          removedProperties.forEach(prop => {
            console.log(`   - ${prop.title} at ${prop.address}`);
          });
          
          // Deactivate removed properties
          const { error: deactivateError } = await supabase
            .from('properties')
            .update({ 
              is_active: false,
              updated_at: new Date().toISOString()
            })
            .in('external_url', removedUrls)
            .eq('source_market', market);

          if (deactivateError) {
            const errorMsg = `Error deactivating properties in ${market}: ${deactivateError.message}`;
            console.error('❌', errorMsg);
            errors.push(errorMsg);
          } else {
            console.log(`✅ Deactivated ${removedUrls.length} stale properties in ${market}`);
            totalDeactivated += removedUrls.length;
          }
        } else {
          console.log(`✅ All properties in ${market} are still active`);
        }

        // Update last_scraped_at for all active properties in this market
        const { error: updateError } = await supabase
          .from('properties')
          .update({ 
            last_scraped_at: new Date().toISOString()
          })
          .eq('source_market', market)
          .eq('data_source', 'scraped')
          .eq('is_active', true);

        if (updateError) {
          const errorMsg = `Error updating last_scraped_at for ${market}: ${updateError.message}`;
          console.error('⚠️', errorMsg);
          errors.push(errorMsg);
        }

      } catch (marketError) {
        const errorMsg = `Error processing market ${market}: ${marketError.message}`;
        console.error('❌', errorMsg);
        errors.push(errorMsg);
      }
    }

    // Log final results
    const logResults = {
      timestamp: new Date().toISOString(),
      totalChecked: activeProperties.length,
      marketsProcessed: Object.keys(marketGroups).length,
      propertiesDeactivated: totalDeactivated,
      errors: errors.length,
      errorDetails: errors
    };

    console.log('\n📊 Daily Freshness Check Results:');
    console.log(`   Properties Checked: ${logResults.totalChecked}`);
    console.log(`   Markets Processed: ${logResults.marketsProcessed}`);
    console.log(`   Properties Deactivated: ${logResults.propertiesDeactivated}`);
    console.log(`   Errors: ${logResults.errors}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach(error => console.log(`   - ${error}`));
    }

    // Save results to log file
    const fs = require('fs');
    const path = require('path');
    const logDir = path.join(__dirname, 'logs');
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logFile = path.join(logDir, `freshness-check-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(logFile, JSON.stringify(logResults, null, 2));
    console.log(`📝 Results saved to: ${logFile}`);

    // Send alert if many properties were deactivated
    if (totalDeactivated > 10) {
      console.log(`🚨 ALERT: ${totalDeactivated} properties were deactivated today - this may indicate a scraping issue`);
      // TODO: Add email notification here if needed
    }

    console.log('\n🎉 Daily freshness check completed successfully!');
    
  } catch (error) {
    console.error('❌ Daily freshness check failed:', error);
    
    // Log the failure
    const failureLog = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    };
    
    const fs = require('fs');
    const path = require('path');
    const logDir = path.join(__dirname, 'logs');
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const errorFile = path.join(logDir, `freshness-check-error-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(errorFile, JSON.stringify(failureLog, null, 2));
    
    process.exit(1);
  }
}

// Run the check
if (require.main === module) {
  dailyFreshnessCheck();
}

module.exports = { dailyFreshnessCheck };
