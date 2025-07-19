-- =====================================================================
-- CASA8 DATABASE INDEX OPTIMIZATION - SUPABASE VERSION
-- =====================================================================
-- Copy this entire script and paste into Supabase SQL Editor
-- Expected Impact: 60-80% performance improvement
-- =====================================================================

-- =====================================================================
-- 1. PROPERTIES TABLE - CORE PERFORMANCE INDEXES
-- =====================================================================

-- Critical: Every query starts with is_active = true filter
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_is_active 
ON properties(is_active) 
WHERE is_active = true;

-- High Impact: City searches (filtered by is_active)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_active_city 
ON properties(is_active, city) 
WHERE is_active = true;

-- High Impact: State searches (filtered by is_active)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_active_state 
ON properties(is_active, state) 
WHERE is_active = true;

-- High Impact: Bedroom filters (very common in property searches)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_active_bedrooms 
ON properties(is_active, bedrooms) 
WHERE is_active = true;

-- High Impact: Bathroom filters
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_active_bathrooms 
ON properties(is_active, bathrooms) 
WHERE is_active = true;

-- Medium Impact: Property type filters
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_active_type 
ON properties(is_active, property_type) 
WHERE is_active = true;

-- High Impact: Price range queries (very common)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_active_price 
ON properties(is_active, price) 
WHERE is_active = true;

-- Critical: Default ordering by created_at DESC for active properties
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_active_created_desc 
ON properties(is_active, created_at DESC) 
WHERE is_active = true;

-- Critical: JOIN performance with profiles table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_landlord_id 
ON properties(landlord_id);

-- =====================================================================
-- 2. COMPOSITE INDEXES FOR COMPLEX QUERIES
-- =====================================================================

-- City + Bedrooms (very common search pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_city_bedrooms 
ON properties(is_active, city, bedrooms) 
WHERE is_active = true;

-- State + Price range (market analysis queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_state_price 
ON properties(is_active, state, price) 
WHERE is_active = true;

-- Bedrooms + Bathrooms + Price (detailed property searches)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_bed_bath_price 
ON properties(is_active, bedrooms, bathrooms, price) 
WHERE is_active = true;

-- =====================================================================
-- 3. TEXT SEARCH OPTIMIZATION
-- =====================================================================

-- Title search optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_title_text 
ON properties USING gin(to_tsvector('english', title)) 
WHERE is_active = true;

-- Description search optimization  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_description_text 
ON properties USING gin(to_tsvector('english', description)) 
WHERE is_active = true;

-- Address search optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_address_text 
ON properties USING gin(to_tsvector('english', address)) 
WHERE is_active = true;

-- =====================================================================
-- 4. APPLICATIONS TABLE OPTIMIZATION
-- =====================================================================

-- Property applications lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_property_id 
ON applications(property_id);

-- Tenant applications lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_tenant_id 
ON applications(tenant_id);

-- Status filtering (for dashboard queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_status 
ON applications(status, created_at DESC);

-- Composite: Property + Status (landlord dashboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_property_status 
ON applications(property_id, status, created_at DESC);

-- Composite: Tenant + Status (tenant dashboard)  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_tenant_status 
ON applications(tenant_id, status, created_at DESC);

-- =====================================================================
-- 5. FAVORITES TABLE OPTIMIZATION
-- =====================================================================

-- User favorites lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorites_user_id 
ON favorites(user_id, created_at DESC);

-- Property favorites count
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorites_property_id 
ON favorites(property_id);

-- Composite: User + Property (for favorite checks)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorites_user_property 
ON favorites(user_id, property_id);

-- =====================================================================
-- 6. MESSAGES TABLE OPTIMIZATION
-- =====================================================================

-- Recipient messages (inbox)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_recipient 
ON messages(recipient_id, read, created_at DESC);

-- Sender messages (sent items)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sender 
ON messages(sender_id, created_at DESC);

-- Property-related messages
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_property 
ON messages(property_id, created_at DESC) 
WHERE property_id IS NOT NULL;

-- Application-related messages
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_application 
ON messages(application_id, created_at DESC) 
WHERE application_id IS NOT NULL;

-- Unread messages count
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_unread 
ON messages(recipient_id, read) 
WHERE read = false;

-- =====================================================================
-- 7. PROFILES TABLE OPTIMIZATION
-- =====================================================================

-- Email lookup (for authentication)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_email 
ON profiles(email);

-- Role-based queries (admin access, landlord properties)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_role 
ON profiles(role);

-- City-based user searches (if needed)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_city 
ON profiles(city) 
WHERE city IS NOT NULL;

-- Onboarding status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_onboarding 
ON profiles(onboarding_completed);

-- Section 8 voucher holders
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_section8 
ON profiles(has_section8_voucher, voucher_bedroom_count) 
WHERE has_section8_voucher = true;

-- =====================================================================
-- VERIFICATION QUERY - Check created indexes
-- =====================================================================

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('properties', 'applications', 'favorites', 'messages', 'profiles')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
