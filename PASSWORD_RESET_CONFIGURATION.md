# Password Reset Configuration Guide

This guide explains how to configure Supabase for proper password reset functionality.

## Issue Fixed

The password reset flow was redirecting users to the homepage instead of the reset password page. This has been fixed with the following changes:

### Code Changes Made

1. **Enhanced Reset Password Flow**
   - Updated `forgot-password/page.tsx` to use environment variables for redirect URLs
   - Improved `reset-password/page.tsx` with better session handling and validation
   - Added proper loading states and error handling

2. **Added Middleware**
   - Created `src/middleware.ts` to handle auth redirects properly
   - Handles password recovery callbacks and preserves query parameters

3. **Auth Callback Route**
   - Created `src/app/auth/callback/route.ts` for handling Supabase auth callbacks
   - Properly routes password recovery to the reset password page

## Required Supabase Configuration

### 1. Update Authentication Settings

Go to your Supabase project dashboard → Authentication → URL Configuration

#### Site URL
Set the **Site URL** to:
```
https://www.casa8.com
```

#### Redirect URLs
Add these **Redirect URLs**:
```
https://www.casa8.com/auth/callback
http://localhost:3000/auth/callback
```

### 2. Environment Variables

Add to your `.env.local` file:
```
NEXT_PUBLIC_SITE_URL=https://www.casa8.com
```

For development, you can use:
```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## How It Works Now

### Password Reset Flow:
1. User enters email on forgot password page
2. Supabase sends reset email with link to `/auth/callback`
3. Auth callback route processes the request and redirects to `/reset-password`
4. Reset password page validates the session and allows password update
5. After successful reset, user is redirected to login

### Key Improvements:
- ✅ Proper session validation before showing reset form
- ✅ Better error handling for invalid/expired links
- ✅ Loading states during validation
- ✅ Automatic redirect to login after successful reset
- ✅ Fallback to request new reset link if session is invalid

## Testing the Fix

1. **Development Testing:**
   - Set `NEXT_PUBLIC_SITE_URL=http://localhost:3000` in `.env.local`
   - Add `http://localhost:3000/auth/callback` to Supabase redirect URLs
   - Test the password reset flow

2. **Production Testing:**
   - Set `NEXT_PUBLIC_SITE_URL=https://www.casa8.com` in your production environment
   - Ensure `https://www.casa8.com/auth/callback` is in Supabase redirect URLs
   - Test the password reset flow on production

## Troubleshooting

If users are still being redirected to the homepage:

1. **Check Supabase Configuration:**
   - Verify Site URL is set correctly
   - Ensure redirect URLs include the auth callback route

2. **Check Environment Variables:**
   - Make sure `NEXT_PUBLIC_SITE_URL` is set in your environment
   - Restart your development server after adding environment variables

3. **Clear Browser Cache:**
   - Have users clear their browser cache or use incognito mode
   - Old cached redirects might interfere with the new flow

## Security Notes

- The middleware handles sensitive auth operations securely
- Session tokens are properly validated before allowing password reset
- Invalid/expired links are handled gracefully with clear error messages
- Users are automatically redirected to appropriate pages based on auth state

This configuration ensures that password reset links work reliably across all environments and provide a smooth user experience.
