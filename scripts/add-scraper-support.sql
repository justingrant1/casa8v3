-- Add scraper support fields to properties table
-- This enables multi-city property import and tracking

-- Add new columns for scraper data tracking
ALTER TABLE properties 
ADD COLUMN data_source TEXT DEFAULT 'manual',
ADD COLUMN external_url TEXT,
ADD COLUMN external_id TEXT,
ADD COLUMN source_market TEXT,
ADD COLUMN last_scraped_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_properties_data_source ON properties(data_source);
CREATE INDEX IF NOT EXISTS idx_properties_source_market ON properties(source_market);
CREATE INDEX IF NOT EXISTS idx_properties_external_url ON properties(external_url);
CREATE INDEX IF NOT EXISTS idx_properties_external_id ON properties(external_id);
CREATE INDEX IF NOT EXISTS idx_properties_last_scraped_at ON properties(last_scraped_at);

-- Create unique constraint to prevent duplicate imports
CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_external_unique 
ON properties(external_url) 
WHERE external_url IS NOT NULL;

-- Create system landlord profile for scraped properties
INSERT INTO profiles (
  id, 
  email, 
  first_name, 
  last_name, 
  role, 
  phone,
  onboarding_completed
) VALUES (
  'scraped-system-landlord',
  'system@casa8v3.com',
  'AffordableHousing',
  'System',
  'landlord',
  '555-SCRAPED',
  true
) ON CONFLICT (id) DO NOTHING;

-- Add comments for documentation
COMMENT ON COLUMN properties.data_source IS 'Source of property data: manual, scraped, api, etc.';
COMMENT ON COLUMN properties.external_url IS 'Original URL from external source (e.g., AffordableHousing.com)';
COMMENT ON COLUMN properties.external_id IS 'Unique identifier from external source';
COMMENT ON COLUMN properties.source_market IS 'Market identifier for scraped properties (e.g., montgomery-al)';
COMMENT ON COLUMN properties.last_scraped_at IS 'Timestamp of last successful scrape/update';
