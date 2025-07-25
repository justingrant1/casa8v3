const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addContactFields() {
  console.log('🔧 Adding scraped contact fields to properties table...');
  
  try {
    // Add the new columns
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE properties 
        ADD COLUMN IF NOT EXISTS scraped_contact_name TEXT,
        ADD COLUMN IF NOT EXISTS scraped_contact_phone TEXT;
      `
    });

    if (alterError) {
      console.error('❌ Error adding columns:', alterError);
      return;
    }

    console.log('✅ Successfully added scraped contact fields');

    // Update existing scraped properties to extract contact info from description
    console.log('🔄 Updating existing scraped properties...');
    
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql_query: `
        UPDATE properties 
        SET 
          scraped_contact_name = CASE 
            WHEN description LIKE '%Listed by:%' THEN 
              TRIM(SPLIT_PART(SPLIT_PART(description, 'Listed by: ', 2), ' |', 1))
            ELSE NULL 
          END,
          scraped_contact_phone = CASE 
            WHEN description LIKE '%Phone:%' THEN 
              TRIM(SPLIT_PART(SPLIT_PART(description, 'Phone: ', 2), ' |', 1))
            ELSE NULL 
          END
        WHERE data_source = 'scraped';
      `
    });

    if (updateError) {
      console.error('❌ Error updating existing properties:', updateError);
      return;
    }

    console.log('✅ Successfully updated existing scraped properties');

    // Create index for better performance
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE INDEX IF NOT EXISTS idx_properties_scraped_contact 
        ON properties(scraped_contact_name, scraped_contact_phone);
      `
    });

    if (indexError) {
      console.error('❌ Error creating index:', indexError);
      return;
    }

    console.log('✅ Successfully created index');
    console.log('🎉 All database updates completed successfully!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

addContactFields();
