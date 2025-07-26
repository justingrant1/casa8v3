"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { User, AuthError } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { Profile } from './database.types'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  handleGoogleSignupComplete: (userData: any) => Promise<{ error: any }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>
  completeOnboarding: (data: any) => Promise<{ error: any }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session with refresh for production domain sync
    const getInitialSession = async () => {
      try {
        // First try to refresh session to ensure sync with server
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
        
        let session = null
        if (!refreshError && refreshData?.session) {
          session = refreshData.session
        } else {
          // Fallback to getSession if refresh fails
          const { data: sessionData } = await supabase.auth.getSession()
          session = sessionData?.session
        }
        
        setUser(session?.user ?? null)
        setLoading(false)
        
        if (session?.user) {
          fetchProfile(session.user.id)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes with enhanced session handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id)
        
        setUser(session?.user ?? null)
        setLoading(false)
        
        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        
        // Force a hard refresh on sign out to clear any stale state
        if (event === 'SIGNED_OUT') {
          window.location.href = '/'
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string, retryCount = 0) => {
    try {
      console.log('🔍 ADMIN DEBUG - Fetching profile for user:', userId, 'retry:', retryCount)
      console.log('🔍 ADMIN DEBUG - Current user object:', user)
      
      // Test if we can query the profiles table at all
      console.log('🔍 ADMIN DEBUG - Testing profiles table access...')
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .limit(5)
      
      console.log('🔍 ADMIN DEBUG - Profiles table test result:', { testData, testError })

      // Now try the specific user query
      console.log('🔍 ADMIN DEBUG - Querying specific profile...')
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      console.log('🔍 ADMIN DEBUG - Profile query result:', { data, error, userId })

      if (error) {
        console.error('❌ ADMIN DEBUG - Error fetching profile:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        
        // If profile doesn't exist and it's a new user, retry a few times
        if (error.code === 'PGRST116' && retryCount < 3) {
          console.log('⏳ ADMIN DEBUG - Profile not found, retrying in 1 second...')
          await new Promise(resolve => setTimeout(resolve, 1000))
          return fetchProfile(userId, retryCount + 1)
        }
        
        // Set profile to null on error to prevent undefined state
        console.log('❌ ADMIN DEBUG - Setting profile to null due to error')
        setProfile(null)
        return
      }

      console.log('✅ ADMIN DEBUG - Profile fetched successfully:', {
        id: data.id,
        email: data.email,
        role: data.role,
        fullData: data
      })
      setProfile(data)
    } catch (error) {
      console.error('❌ ADMIN DEBUG - Catch block error:', error)
      setProfile(null)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    return { error }
  }

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      })

      if (error) {
        console.error('Auth signup error:', error)
        return { error }
      }

      // Profile creation is handled automatically by database trigger
      return { error: null }
    } catch (err) {
      console.error('Signup error:', err)
      return { error: err }
    }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    return { error }
  }

  const handleGoogleSignupComplete = async (userData: any) => {
    if (!user) return { error: 'Not authenticated' }

    try {
      // Get the pending role from localStorage
      const pendingRole = localStorage.getItem('pendingRole') || 'tenant'
      localStorage.removeItem('pendingRole')

      // Update the user's profile with additional info
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: userData.first_name || user.user_metadata?.given_name,
          last_name: userData.last_name || user.user_metadata?.family_name,
          phone: userData.phone,
          role: pendingRole,
          onboarding_completed: false, // They still need to complete onboarding
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (!error) {
        await fetchProfile(user.id)
      }

      return { error }
    } catch (err) {
      console.error('Error completing Google signup:', err)
      return { error: err }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'Not authenticated' }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (!error && data) {
      setProfile(data)
    }

    return { error }
  }

  const completeOnboarding = async (data: any) => {
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
      .from('profiles')
      .update({
        ...data,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (!error) {
      await fetchProfile(user.id)
    }

    return { error }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    handleGoogleSignupComplete,
    signOut,
    updateProfile,
    completeOnboarding,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
