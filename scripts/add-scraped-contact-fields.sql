-- Add fields to store scraped contact information
ALTER TABLE properties 
ADD COLUMN scraped_contact_name TEXT,
ADD COLUMN scraped_contact_phone TEXT;

-- Update existing scraped properties to extract contact info from description
-- This will help populate the new fields for existing properties
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

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_properties_scraped_contact ON properties(scraped_contact_name, scraped_contact_phone);
