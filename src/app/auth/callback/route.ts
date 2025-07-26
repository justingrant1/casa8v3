import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  if (error) {
    console.error('Auth callback error:', error, error_description)
    return NextResponse.redirect(new URL('/register?error=auth_callback_error', request.url))
  }

  if (code) {
    try {
      const supabase = createRouteHandlerClient({ cookies })
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(new URL('/register?error=session_error', request.url))
      }

      // Handle different types of auth callbacks
      if (type === 'recovery') {
        // For password recovery, redirect to reset-password with the necessary parameters
        const resetUrl = new URL('/reset-password', request.url)
        searchParams.forEach((value, key) => {
          if (key !== 'code') {
            resetUrl.searchParams.set(key, value)
          }
        })
        return NextResponse.redirect(resetUrl)
      }

      // Check if this is a new user from Google OAuth
      if (data?.user) {
        // Try to get the user's profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        // If profile doesn't exist or user hasn't completed onboarding
        if (profileError || !profile || !profile.onboarding_completed) {
          // For new Google users, redirect to a completion page
          return NextResponse.redirect(new URL('/google-signup-complete', request.url))
        }

        // If user has completed profile, redirect based on their role
        if (profile.role === 'landlord') {
          return NextResponse.redirect(new URL('/dashboard-simple', request.url))
        } else {
          return NextResponse.redirect(new URL('/', request.url))
        }
      }

      // Fallback redirect
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } catch (error) {
      console.error('Unexpected error in auth callback:', error)
      return NextResponse.redirect(new URL('/register?error=unexpected_error', request.url))
    }
  }

  // If no code is provided, redirect to register
  return NextResponse.redirect(new URL('/register', request.url))
}
