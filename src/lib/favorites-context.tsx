"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './auth'
import { supabase } from './supabase'

interface FavoritesContextType {
  favorites: string[]
  toggleFavorite: (propertyId: string) => void
  isFavorite: (propertyId: string) => boolean
  loading: boolean
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Load favorites when user changes
  useEffect(() => {
    if (user) {
      loadFavorites()
    } else {
      setFavorites([])
      setLoading(false)
    }
  }, [user])

  const loadFavorites = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('property_id')
        .eq('user_id', user.id)

      if (error) {
        console.error('Error loading favorites:', error)
        return
      }

      setFavorites(data?.map(f => f.property_id) || [])
    } catch (error) {
      console.error('Error loading favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async (propertyId: string) => {
    if (!user) return

    const isFav = favorites.includes(propertyId)

    try {
      if (isFav) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', propertyId)

        if (error) {
          console.error('Error removing favorite:', error)
          return
        }

        setFavorites(prev => prev.filter(id => id !== propertyId))
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert([
            {
              user_id: user.id,
              property_id: propertyId
            }
          ])

        if (error) {
          console.error('Error adding favorite:', error)
          return
        }

        setFavorites(prev => [...prev, propertyId])
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const isFavorite = (propertyId: string) => {
    return favorites.includes(propertyId)
  }

  return (
    <FavoritesContext.Provider value={{
      favorites,
      toggleFavorite,
      isFavorite,
      loading
    }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}
