-- Create system landlord profile for scraped properties
INSERT INTO profiles (id, email, first_name, last_name, role, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'system@casa8v3.com',
  'Casa8v3 Scraper',
  'System',
  'landlord',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  updated_at = NOW();
