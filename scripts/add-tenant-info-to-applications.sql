-- Add tenant information columns to applications table
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS tenant_first_name TEXT,
ADD COLUMN IF NOT EXISTS tenant_last_name TEXT,
ADD COLUMN IF NOT EXISTS tenant_email TEXT,
ADD COLUMN IF NOT EXISTS tenant_phone TEXT;

-- Update the applications table to store tenant info directly
-- This makes it much more reliable than trying to join with profiles
