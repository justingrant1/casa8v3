require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkImportedProperties() {
  console.log('🔍 Checking imported properties...\n');
  
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('id, title, address, city, state, price, data_source, source_market, external_url')
      .eq('source_market', 'montgomery-al')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.log('📭 No properties found for montgomery-al');
      return;
    }

    console.log(`📊 Found ${data.length} imported properties:\n`);
    
    data.forEach((property, index) => {
      console.log(`${index + 1}. ${property.title}`);
      console.log(`   📍 ${property.address}, ${property.city}, ${property.state}`);
      console.log(`   💰 $${property.price}`);
      console.log(`   🔗 ${property.external_url}`);
      console.log(`   📊 Source: ${property.data_source} (${property.source_market})`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

checkImportedProperties();
