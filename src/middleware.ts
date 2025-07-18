import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Handle auth callback and redirect properly
  if (req.nextUrl.pathname === '/auth/callback') {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const type = searchParams.get('type')

    if (code) {
      await supabase.auth.exchangeCodeForSession(code)
      
      // If this is a password recovery callback, redirect to reset-password
      if (type === 'recovery') {
        const redirectUrl = new URL('/reset-password', req.url)
        // Preserve the original query parameters
        searchParams.forEach((value, key) => {
          if (key !== 'code') {
            redirectUrl.searchParams.set(key, value)
          }
        })
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  // Handle direct reset-password access with query parameters
  if (req.nextUrl.pathname === '/reset-password') {
    const { searchParams } = new URL(req.url)
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const type = searchParams.get('type')

    // If we have the tokens in the URL, allow the request to proceed
    if (type === 'recovery' && accessToken && refreshToken) {
      return res
    }
  }

  // Handle other Supabase auth redirects
  if (req.nextUrl.pathname.startsWith('/auth/')) {
    const { data: { session } } = await supabase.auth.getSession()
    
    // Handle password recovery flow
    if (req.nextUrl.searchParams.get('type') === 'recovery') {
      const redirectUrl = new URL('/reset-password', req.url)
      // Preserve query parameters
      req.nextUrl.searchParams.forEach((value, key) => {
        redirectUrl.searchParams.set(key, value)
      })
      return NextResponse.redirect(redirectUrl)
    }
  }

  return res
}

export const config = {
  matcher: [
    '/auth/:path*',
    '/reset-password',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
