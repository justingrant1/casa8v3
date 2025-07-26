-- Add function to find nearby properties using Haversine formula
-- This function calculates the distance between two points on Earth using their latitude and longitude

-- First, create the Haversine distance function
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL(10,8),
    lng1 DECIMAL(11,8),
    lat2 DECIMAL(10,8),
    lng2 DECIMAL(11,8)
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    earth_radius DECIMAL := 6371; -- Earth's radius in kilometers
    dlat DECIMAL;
    dlng DECIMAL;
    a DECIMAL;
    c DECIMAL;
    distance DECIMAL;
BEGIN
    -- Convert degrees to radians
    dlat := RADIANS(lat2 - lat1);
    dlng := RADIANS(lng2 - lng1);
    
    -- Haversine formula
    a := SIN(dlat/2) * SIN(dlat/2) + 
         COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * 
         SIN(dlng/2) * SIN(dlng/2);
    c := 2 * ATAN2(SQRT(a), SQRT(1-a));
    distance := earth_radius * c;
    
    RETURN ROUND(distance, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get the 5 closest properties to a given location
CREATE OR REPLACE FUNCTION get_nearby_properties(
    user_lat DECIMAL(10,8),
    user_lng DECIMAL(11,8),
    max_distance_km DECIMAL DEFAULT 100,
    property_limit INTEGER DEFAULT 5
) RETURNS TABLE (
    id UUID,
    landlord_id UUID,
    title TEXT,
    description TEXT,
    price INTEGER,
    property_type TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    bedrooms INTEGER,
    bathrooms DECIMAL(3,1),
    sqft INTEGER,
    images TEXT[],
    amenities TEXT[],
    is_active BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    data_source TEXT,
    external_url TEXT,
    external_id TEXT,
    source_market TEXT,
    last_scraped_at TIMESTAMPTZ,
    scraped_contact_name TEXT,
    scraped_contact_phone TEXT,
    distance_km DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.landlord_id,
        p.title,
        p.description,
        p.price,
        p.property_type,
        p.address,
        p.city,
        p.state,
        p.zip_code,
        p.latitude,
        p.longitude,
        p.bedrooms,
        p.bathrooms,
        p.sqft,
        p.images,
        p.amenities,
        p.is_active,
        p.created_at,
        p.updated_at,
        p.data_source,
        p.external_url,
        p.external_id,
        p.source_market,
        p.last_scraped_at,
        p.scraped_contact_name,
        p.scraped_contact_phone,
        calculate_distance(user_lat, user_lng, p.latitude, p.longitude) as distance_km
    FROM properties p
    WHERE 
        p.is_active = true
        AND p.latitude IS NOT NULL 
        AND p.longitude IS NOT NULL
        AND calculate_distance(user_lat, user_lng, p.latitude, p.longitude) <= max_distance_km
    ORDER BY distance_km ASC
    LIMIT property_limit;
END;
$$ LANGUAGE plpgsql;

-- Create an index on latitude and longitude for better performance
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Create a composite index for active properties with location
CREATE INDEX IF NOT EXISTS idx_properties_active_location ON properties (is_active, latitude, longitude) WHERE is_active = true AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add comments for documentation
COMMENT ON FUNCTION calculate_distance(DECIMAL, DECIMAL, DECIMAL, DECIMAL) IS 'Calculates the distance in kilometers between two points using the Haversine formula';
COMMENT ON FUNCTION get_nearby_properties(DECIMAL, DECIMAL, DECIMAL, INTEGER) IS 'Returns the closest properties to a given location, ordered by distance';
