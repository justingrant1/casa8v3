-- Fix Property Active Status
-- This script ensures all existing properties have is_active set to true by default
-- Run this script if you have existing properties that might have null is_active values

-- Update any properties that have is_active set to NULL to be active
UPDATE properties 
SET is_active = true 
WHERE is_active IS NULL;

-- Verify the update
SELECT id, title, is_active 
FROM properties 
ORDER BY created_at DESC;
