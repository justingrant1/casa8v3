-- =====================================================================
-- CASA8 DATABASE INDEX ROLLBACK SCRIPT
-- =====================================================================
-- Purpose: Remove all custom indexes created by optimize-database-indexes.sql
-- Use this script if you need to rollback the optimization changes
-- Safe to run: Uses IF EXISTS, will not error if indexes don't exist
-- =====================================================================

-- Enable timing to measure execution time
\timing on

BEGIN;

\echo 'Starting rollback of Casa8 database index optimization...'

-- =====================================================================
-- REMOVE PROPERTIES TABLE INDEXES
-- =====================================================================

DROP INDEX CONCURRENTLY IF EXISTS idx_properties_is_active;
DROP INDEX CONCURRENTLY IF EXISTS idx_properties_active_city;
DROP INDEX CONCURRENTLY IF EXISTS idx_properties_active_state;
DROP INDEX CONCURRENTLY IF EXISTS idx_properties_active_bedrooms;
DROP INDEX CONCURRENTLY IF EXISTS idx_properties_active_bathrooms;
DROP INDEX CONCURRENTLY IF EXISTS idx_properties_active_type;
DROP INDEX CONCURRENTLY IF EXISTS idx_properties_active_price;
DROP INDEX CONCURRENTLY IF EXISTS idx_properties_active_created_desc;
DROP INDEX CONCURRENTLY IF EXISTS idx_properties_landlord_id;

-- =====================================================================
-- REMOVE COMPOSITE INDEXES
-- =====================================================================

DROP INDEX CONCURRENTLY IF EXISTS idx_properties_city_bedrooms;
DROP INDEX CONCURRENTLY IF EXISTS idx_properties_state_price;
DROP INDEX CONCURRENTLY IF EXISTS idx_properties_bed_bath_price;

-- =====================================================================
-- REMOVE TEXT SEARCH INDEXES
-- =====================================================================

DROP INDEX CONCURRENTLY IF EXISTS idx_properties_title_text;
DROP INDEX CONCURRENTLY IF EXISTS idx_properties_description_text;
DROP INDEX CONCURRENTLY IF EXISTS idx_properties_address_text;
DROP INDEX CONCURRENTLY IF EXISTS idx_properties_combined_text;

-- =====================================================================
-- REMOVE GEOSPATIAL INDEXES
-- =====================================================================

DROP INDEX CONCURRENTLY IF EXISTS idx_properties_coordinates;

-- =====================================================================
-- REMOVE APPLICATIONS TABLE INDEXES
-- =====================================================================

DROP INDEX CONCURRENTLY IF EXISTS idx_applications_property_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_applications_tenant_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_applications_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_applications_property_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_applications_tenant_status;

-- =====================================================================
-- REMOVE FAVORITES TABLE INDEXES
-- =====================================================================

DROP INDEX CONCURRENTLY IF EXISTS idx_favorites_user_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_favorites_property_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_favorites_user_property;

-- =====================================================================
-- REMOVE MESSAGES TABLE INDEXES
-- =====================================================================

DROP INDEX CONCURRENTLY IF EXISTS idx_messages_recipient;
DROP INDEX CONCURRENTLY IF EXISTS idx_messages_sender;
DROP INDEX CONCURRENTLY IF EXISTS idx_messages_property;
DROP INDEX CONCURRENTLY IF EXISTS idx_messages_application;
DROP INDEX CONCURRENTLY IF EXISTS idx_messages_unread;

-- =====================================================================
-- REMOVE PROFILES TABLE INDEXES
-- =====================================================================

DROP INDEX CONCURRENTLY IF EXISTS idx_profiles_email;
DROP INDEX CONCURRENTLY IF EXISTS idx_profiles_role;
DROP INDEX CONCURRENTLY IF EXISTS idx_profiles_city;
DROP INDEX CONCURRENTLY IF EXISTS idx_profiles_onboarding;
DROP INDEX CONCURRENTLY IF EXISTS idx_profiles_section8;

-- =====================================================================
-- ROLLBACK SUMMARY
-- =====================================================================

COMMIT;

-- Display remaining indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('properties', 'applications', 'favorites', 'messages', 'profiles')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

\echo 'Database index rollback completed successfully!'
\echo 'All custom optimization indexes have been removed.'
