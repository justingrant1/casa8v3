import { supabase } from './supabase'
import { User, AuthError } from '@supabase/supabase-js'

export interface Profile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: string | null
  onboarding_completed: boolean
  phone: string | null
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user ?? null
}

export async function getCurrentProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, role, onboarding_completed, phone')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching profile:', error)
    return null
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}

export async function signIn(email: string, password: string): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return { error }
}

export async function signUp(email: string, password: string, metadata?: any): Promise<{ error: any }> {
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

    return { error: null }
  } catch (err) {
    console.error('Signup error:', err)
    return { error: err }
  }
}
