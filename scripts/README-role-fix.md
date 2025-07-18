# Fix for Role Display Issue

## Problem
Users are showing up as "User" instead of their selected role (tenant/landlord) because the database is missing the automatic profile creation trigger.

## Solution
Run the following SQL scripts in your Supabase SQL Editor in this order:

### Step 1: Add the Profile Creation Trigger
Run the SQL from `scripts/add-profile-trigger.sql` in your Supabase SQL Editor.

This will:
- Create a function that automatically creates profiles when users sign up
- Add a trigger that fires when new users are created in auth.users
- Extract role information from user metadata and store it in the profiles table

### Step 2: Fix Existing Profiles
Run the SQL from `scripts/fix-existing-profiles.sql` in your Supabase SQL Editor.

This will:
- Update existing profiles with missing role information from auth metadata
- Create profiles for any users who don't have profiles yet
- Ensure all users have proper first_name, last_name, phone, and role data

## How to Run These Scripts

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `add-profile-trigger.sql` and run it
4. Copy and paste the contents of `fix-existing-profiles.sql` and run it

## Expected Results

After running these scripts:
- New user registrations will automatically create profiles with proper roles
- Existing users will have their roles properly displayed in the navbar
- The navbar will show "Tenant" or "Landlord" instead of "User"
- All user profile data will be properly populated

## Testing

1. Try registering a new user as a tenant - they should see "Tenant" in the navbar
2. Try registering a new user as a landlord - they should see "Landlord" in the navbar
3. Existing users should now see their proper role when they refresh the page
