import { supabase } from './supabase'

export function getImageUrl(path: string | null): string {
  if (!path) {
    return '/placeholder.svg'
  }

  // If it's already a full URL, return it
  if (path.startsWith('http')) {
    return path
  }

  // If it's a storage path, get the public URL
  const { data } = supabase.storage
    .from('property-images')
    .getPublicUrl(path)

  return data.publicUrl || '/placeholder.svg'
}

export function getImageUrls(paths: string[] | null): string[] {
  if (!paths || paths.length === 0) {
    return ['/placeholder.svg']
  }

  return paths.map(path => getImageUrl(path))
}

// Helper function to check if image URL is valid
export function isValidImageUrl(url: string): boolean {
  try {
    new URL(url)
    return url.includes('supabase') || url.startsWith('/') || url.startsWith('http')
  } catch {
    return false
  }
}
