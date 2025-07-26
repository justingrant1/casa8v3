import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/dashboard-simple',
  '/profile',
  '/favorites',
  '/list-property',
  '/apply',
  '/admin',
  '/messages'
]

// Define routes that redirect authenticated users (login/register pages)
const authRoutes = [
  '/login',
  '/register',
  '/forgot-password'
]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    // Debug logging for production
    const pathname = req.nextUrl.pathname
    console.log('🛡️ Middleware executing for:', pathname)
    
    // Get session with simplified approach
    const { data: { session }, error } = await supabase.auth.getSession()
    
    console.log('🔍 Session check result:', {
      hasSession: !!session,
      userId: session?.user?.id,
      error: error?.message,
      pathname
    })

    if (error) {
      console.error('❌ Middleware auth error:', error)
    }
    const isProtectedRoute = protectedRoutes.some(route => 
      pathname === route || pathname.startsWith(route + '/')
    )
    const isAuthRoute = authRoutes.some(route => 
      pathname === route || pathname.startsWith(route + '/')
    )

    // Let the auth callback route handle the authentication flow
    if (pathname === '/auth/callback') {
      return res
    }

    // Allow access to Google signup completion page
    if (pathname === '/google-signup-complete') {
      return res
    }

    // Handle direct reset-password access with query parameters
    if (pathname === '/reset-password') {
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
    if (pathname.startsWith('/auth/')) {
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

    // Redirect authenticated users away from auth pages
    if (session && isAuthRoute) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Redirect unauthenticated users to login for protected routes
    if (!session && isProtectedRoute) {
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Check role-based access for admin routes
    if (session && pathname.startsWith('/admin')) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (!profile || profile.role !== 'admin') {
          return NextResponse.redirect(new URL('/dashboard?error=unauthorized', req.url))
        }
      } catch (error) {
        console.error('Error checking admin access:', error)
        return NextResponse.redirect(new URL('/dashboard?error=access_error', req.url))
      }
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    // Continue with the request if there's an error
    return res
  }
}

export const config = {
  matcher: [
    '/auth/:path*',
    '/reset-password',
    '/google-signup-complete',
    '/dashboard/:path*',
    '/dashboard-simple/:path*',
    '/profile/:path*',
    '/favorites/:path*',
    '/list-property/:path*',
    '/apply/:path*',
    '/admin/:path*',
    '/messages/:path*',
    '/login',
    '/register',
    '/forgot-password',
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
