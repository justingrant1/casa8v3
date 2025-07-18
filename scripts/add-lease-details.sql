-- Add security deposit fields to properties table
ALTER TABLE properties 
ADD COLUMN security_deposit INTEGER DEFAULT 1000,
ADD COLUMN security_deposit_negotiable BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN properties.security_deposit IS 'Security deposit amount in dollars';
COMMENT ON COLUMN properties.security_deposit_negotiable IS 'Whether security deposit is negotiable';
