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

// Video storage functions
export function getVideoUrl(path: string | null): string | null {
  if (!path) {
    return null
  }

  // If it's already a full URL, return it
  if (path.startsWith('http')) {
    return path
  }

  // If it's a storage path, get the public URL
  const { data } = supabase.storage
    .from('property-videos')
    .getPublicUrl(path)

  return data.publicUrl || null
}

export function getVideoUrls(paths: string[] | null): string[] {
  if (!paths || paths.length === 0) {
    return []
  }

  return paths.map(path => getVideoUrl(path)).filter(Boolean) as string[]
}

// Helper function to check if video URL is valid
export function isValidVideoUrl(url: string): boolean {
  try {
    new URL(url)
    return url.includes('supabase') || url.startsWith('/') || url.startsWith('http')
  } catch {
    return false
  }
}

// Upload video function
export async function uploadVideo(
  file: File,
  userId: string,
  propertyId?: string
): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo']
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Invalid video format. Please upload MP4, WebM, OGG, MOV, or AVI files.' }
    }

    // Check file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      return { success: false, error: 'Video file is too large. Maximum size is 100MB.' }
    }

    // Create a unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${userId}/${propertyId || 'temp'}/${fileName}`

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('property-videos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Error uploading video:', error)
      return { success: false, error: error.message }
    }

    return { success: true, path: filePath }
  } catch (error) {
    console.error('Error uploading video:', error)
    return { success: false, error: 'Failed to upload video. Please try again.' }
  }
}

// Delete video function
export async function deleteVideo(path: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from('property-videos')
      .remove([path])

    if (error) {
      console.error('Error deleting video:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting video:', error)
    return { success: false, error: 'Failed to delete video. Please try again.' }
  }
}

// Upload property video with progress callback
export async function uploadPropertyVideo(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo']
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid video format. Please upload MP4, WebM, OGG, MOV, or AVI files.')
    }

    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      throw new Error('Video file is too large. Maximum size is 50MB.')
    }

    // Create a unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `property-videos/${fileName}`

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('property-videos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Error uploading video:', error)
      throw new Error(error.message)
    }

    // Get public URL
    const { data } = supabase.storage
      .from('property-videos')
      .getPublicUrl(filePath)

    // Call progress callback with 100% when complete
    if (onProgress) {
      onProgress(100)
    }

    return data.publicUrl
  } catch (error) {
    console.error('Error uploading video:', error)
    throw error
  }
}

// Delete property video by URL
export async function deletePropertyVideo(videoUrl: string): Promise<void> {
  try {
    // Extract the file path from the URL
    const urlParts = videoUrl.split('/property-videos/')
    if (urlParts.length !== 2) {
      throw new Error('Invalid video URL format')
    }
    
    const filePath = `property-videos/${urlParts[1].split('?')[0]}` // Remove query parameters
    
    const { error } = await supabase.storage
      .from('property-videos')
      .remove([filePath])
    
    if (error) {
      console.error('Error deleting video:', error)
      throw new Error(error.message)
    }
  } catch (error) {
    console.error('Error in deletePropertyVideo:', error)
    throw error
  }
}
