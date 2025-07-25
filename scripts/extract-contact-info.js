const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function extractContactInfo() {
  console.log('🔄 Extracting contact information from existing scraped properties...');
  
  try {
    // Get all scraped properties with descriptions
    const { data: properties, error } = await supabase
      .from('properties')
      .select('id, title, description, address')
      .eq('data_source', 'scraped')
      .not('description', 'is', null);

    if (error) throw error;

    console.log(`📊 Found ${properties.length} scraped properties to process`);

    let updatedCount = 0;
    let extractedNames = 0;
    let extractedPhones = 0;

    for (const property of properties) {
      try {
        let contactName = null;
        let contactPhone = null;
        let hasUpdates = false;

        // Extract contact name from "Listed by: Name" pattern
        const nameMatch = property.description.match(/Listed by:\s*([^||\n]+)/i);
        if (nameMatch) {
          contactName = nameMatch[1].trim();
          extractedNames++;
          hasUpdates = true;
        }

        // Extract phone number from "Phone: Number" pattern
        const phoneMatch = property.description.match(/Phone:\s*([^||\n]+)/i);
        if (phoneMatch) {
          contactPhone = phoneMatch[1].trim();
          extractedPhones++;
          hasUpdates = true;
        }

        // Update the property if we found contact info
        if (hasUpdates) {
          const { error: updateError } = await supabase
            .from('properties')
            .update({
              scraped_contact_name: contactName,
              scraped_contact_phone: contactPhone,
              updated_at: new Date().toISOString()
            })
            .eq('id', property.id);

          if (updateError) {
            console.error(`❌ Error updating property ${property.id}:`, updateError.message);
          } else {
            updatedCount++;
            console.log(`✅ Updated: ${property.title} at ${property.address}`);
            if (contactName) console.log(`   Name: ${contactName}`);
            if (contactPhone) console.log(`   Phone: ${contactPhone}`);
          }
        }

      } catch (propertyError) {
        console.error(`❌ Error processing property ${property.id}:`, propertyError.message);
      }
    }

    console.log('\n📊 Contact Extraction Results:');
    console.log(`   Properties Processed: ${properties.length}`);
    console.log(`   Properties Updated: ${updatedCount}`);
    console.log(`   Names Extracted: ${extractedNames}`);
    console.log(`   Phone Numbers Extracted: ${extractedPhones}`);

    // Now clean up descriptions by removing the contact info lines
    console.log('\n🧹 Cleaning up property descriptions...');
    
    const { data: propertiesWithContact, error: selectError } = await supabase
      .from('properties')
      .select('id, description')
      .eq('data_source', 'scraped')
      .not('description', 'is', null)
      .or('scraped_contact_name.not.is.null,scraped_contact_phone.not.is.null');

    if (selectError) throw selectError;

    let cleanedCount = 0;

    for (const property of propertiesWithContact) {
      try {
        let cleanedDescription = property.description;

        // Remove "Listed by: Name | " pattern
        cleanedDescription = cleanedDescription.replace(/Listed by:\s*[^||\n]+\s*\|\s*/gi, '');
        
        // Remove "Phone: Number | " pattern
        cleanedDescription = cleanedDescription.replace(/Phone:\s*[^||\n]+\s*\|\s*/gi, '');
        
        // Remove standalone "Listed by: Name" at the end
        cleanedDescription = cleanedDescription.replace(/\n\nListed by:\s*[^||\n]+$/gi, '');
        
        // Remove standalone "Phone: Number" at the end
        cleanedDescription = cleanedDescription.replace(/\n\nPhone:\s*[^||\n]+$/gi, '');

        // Clean up any double spaces or extra newlines
        cleanedDescription = cleanedDescription.replace(/\s+/g, ' ').trim();
        cleanedDescription = cleanedDescription.replace(/\n\s*\n/g, '\n\n');

        // Only update if the description actually changed
        if (cleanedDescription !== property.description) {
          const { error: updateError } = await supabase
            .from('properties')
            .update({
              description: cleanedDescription,
              updated_at: new Date().toISOString()
            })
            .eq('id', property.id);

          if (updateError) {
            console.error(`❌ Error cleaning description for property ${property.id}:`, updateError.message);
          } else {
            cleanedCount++;
          }
        }

      } catch (cleanError) {
        console.error(`❌ Error cleaning property ${property.id}:`, cleanError.message);
      }
    }

    console.log(`✅ Cleaned descriptions for ${cleanedCount} properties`);

    // Final verification - show some examples
    console.log('\n🔍 Verification - Sample updated properties:');
    
    const { data: sampleProperties, error: sampleError } = await supabase
      .from('properties')
      .select('title, address, scraped_contact_name, scraped_contact_phone')
      .eq('data_source', 'scraped')
      .not('scraped_contact_name', 'is', null)
      .limit(5);

    if (!sampleError && sampleProperties) {
      sampleProperties.forEach(prop => {
        console.log(`📋 ${prop.title} at ${prop.address}`);
        console.log(`   Contact: ${prop.scraped_contact_name || 'N/A'}`);
        console.log(`   Phone: ${prop.scraped_contact_phone || 'N/A'}`);
      });
    }

    console.log('\n🎉 Contact information extraction completed successfully!');

  } catch (error) {
    console.error('❌ Contact extraction failed:', error);
    process.exit(1);
  }
}

// Run the extraction
if (require.main === module) {
  extractContactInfo();
}

module.exports = { extractContactInfo };
