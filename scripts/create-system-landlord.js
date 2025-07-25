require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSystemLandlord() {
  console.log('🏠 Creating system landlord profile...');
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        email: 'system@casa8v3.com',
        first_name: 'Casa8v3 Scraper',
        last_name: 'System',
        role: 'landlord',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error('❌ Error creating system landlord:', error.message);
      process.exit(1);
    }

    console.log('✅ System landlord profile created successfully!');
    console.log('   ID: 00000000-0000-0000-0000-000000000001');
    console.log('   Email: system@casa8v3.com');
    console.log('   Name: Casa8v3 Scraper System');
    console.log('   Role: landlord');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

createSystemLandlord();
