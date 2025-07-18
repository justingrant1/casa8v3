import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  if (error) {
    console.error('Auth callback error:', error, error_description)
    return NextResponse.redirect(new URL('/login?error=auth_callback_error', request.url))
  }

  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(new URL('/login?error=session_error', request.url))
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

      // For other auth types (signup, invite, etc.), redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } catch (error) {
      console.error('Unexpected error in auth callback:', error)
      return NextResponse.redirect(new URL('/login?error=unexpected_error', request.url))
    }
  }

  // If no code is provided, redirect to login
  return NextResponse.redirect(new URL('/login', request.url))
}
