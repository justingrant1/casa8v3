-- Migration: Fix existing profiles that are missing role information
-- This script updates existing profiles to have proper roles based on their auth metadata

-- Update existing profiles with missing roles from auth.users metadata
UPDATE public.profiles 
SET 
  role = COALESCE(auth_users.raw_user_meta_data->>'role', 'tenant'),
  first_name = COALESCE(
    NULLIF(profiles.first_name, ''), 
    auth_users.raw_user_meta_data->>'first_name',
    ''
  ),
  last_name = COALESCE(
    NULLIF(profiles.last_name, ''), 
    auth_users.raw_user_meta_data->>'last_name',
    ''
  ),
  phone = COALESCE(
    NULLIF(profiles.phone, ''), 
    auth_users.raw_user_meta_data->>'phone',
    ''
  ),
  updated_at = NOW()
FROM auth.users AS auth_users
WHERE profiles.id = auth_users.id;

-- Create profiles for any users who don't have profiles yet
INSERT INTO public.profiles (
  id,
  email,
  first_name,
  last_name,
  role,
  phone,
  created_at,
  updated_at
)
SELECT 
  auth_users.id,
  auth_users.email,
  COALESCE(auth_users.raw_user_meta_data->>'first_name', ''),
  COALESCE(auth_users.raw_user_meta_data->>'last_name', ''),
  COALESCE(auth_users.raw_user_meta_data->>'role', 'tenant'),
  COALESCE(auth_users.raw_user_meta_data->>'phone', ''),
  NOW(),
  NOW()
FROM auth.users AS auth_users
LEFT JOIN public.profiles ON profiles.id = auth_users.id
WHERE profiles.id IS NULL;
