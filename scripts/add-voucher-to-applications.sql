-- Add voucher information to applications table
-- This allows landlords to see tenant voucher details when reviewing applications

ALTER TABLE applications 
ADD COLUMN has_section8_voucher BOOLEAN DEFAULT FALSE,
ADD COLUMN voucher_bedroom_count INTEGER;

-- Update the comment for the table
COMMENT ON TABLE applications IS 'Stores rental applications with tenant information including voucher details';
COMMENT ON COLUMN applications.has_section8_voucher IS 'Whether the tenant has a Section 8 voucher';
COMMENT ON COLUMN applications.voucher_bedroom_count IS 'Number of bedrooms the tenant voucher covers';
