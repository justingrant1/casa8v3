import { supabase } from './supabase'
import { Profile } from './database.types'
import { formatPropertyForFrontend } from './properties'

export const createProperty = async (
  propertyData: any,
  images: File[],
  videos: string[],
  user: any,
  onProgress?: (progress: number, stage: string) => void
) => {
  const totalSteps = images.length + 3 // images + profile fetch + database insert + completion
  let currentStep = 0

  const updateProgress = (stage: string) => {
    currentStep++
    const progress = Math.round((currentStep / totalSteps) * 100)
    onProgress?.(progress, stage)
  }

  // 1. Upload images to Supabase Storage
  const imageUrls: string[] = []
  for (let i = 0; i < images.length; i++) {
    const image = images[i]
    onProgress?.(Math.round(((currentStep + (i + 1) / images.length) / totalSteps) * 100), `Uploading image ${i + 1} of ${images.length}`)
    
    const { data, error } = await supabase.storage
      .from('property-images')
      .upload(`${user.id}/${Date.now()}_${image.name}`, image)

    if (error) throw error

    const {
      data: { publicUrl },
    } = supabase.storage.from('property-images').getPublicUrl(data.path)
    imageUrls.push(publicUrl)
  }
  
  if (images.length > 0) {
    currentStep = images.length
  }

  // 2. Videos are already uploaded URLs from VideoUpload component
  const videoUrls: string[] = videos

  // 3. Fetch the user's profile to get the correct landlord_id
  updateProgress('Verifying account information')
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Could not find a landlord profile for the current user.')
  }

  // 4. Insert property data into the database
  updateProgress('Saving property listing')
  const { error: dbError } = await supabase.from('properties').insert({
    ...propertyData,
    landlord_id: profile.id,
    images: imageUrls,
    videos: videoUrls,
  })

  if (dbError) throw dbError
  
  updateProgress('Property listing created successfully!')
}

export async function getLandlordProperties(landlordId: string) {
  if (!landlordId) {
    console.error('No landlord ID provided to getLandlordProperties')
    return []
  }

  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('landlord_id', landlordId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching landlord properties:', error)
      throw error
    }

    return data ? data.map(formatPropertyForFrontend) : []
  } catch (error) {
    console.error('Error in getLandlordProperties:', error)
    throw error
  }
}

export async function deleteProperty(propertyId: string, landlordId: string) {
  if (!propertyId || !landlordId) {
    throw new Error('Property ID and Landlord ID are required to delete a property.')
  }

  try {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId)
      .eq('landlord_id', landlordId)

    if (error) {
      console.error('Error deleting property:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in deleteProperty:', error)
    throw error
  }
}

export async function updatePropertyStatus(propertyId: string, landlordId: string, is_active: boolean) {
  if (!propertyId || !landlordId) {
    throw new Error('Property ID and Landlord ID are required to update status.')
  }

  try {
    const { error } = await supabase
      .from('properties')
      .update({ is_active })
      .eq('id', propertyId)
      .eq('landlord_id', landlordId)

    if (error) {
      console.error('Error updating property status:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in updatePropertyStatus:', error)
    throw error
  }
}

export async function getProperty(propertyId: string, landlordId: string) {
  if (!propertyId || !landlordId) {
    throw new Error('Property ID and Landlord ID are required to fetch property.')
  }

  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .eq('landlord_id', landlordId)
      .single()

    if (error) {
      console.error('Error fetching property:', error)
      throw error
    }

    return data ? formatPropertyForFrontend(data) : null
  } catch (error) {
    console.error('Error in getProperty:', error)
    throw error
  }
}

export async function updateProperty(
  propertyId: string,
  propertyData: any,
  images: File[],
  videos: string[],
  user: any,
  existingImages: string[] = [],
  onProgress?: (progress: number, stage: string) => void
) {
  const totalSteps = images.length + 3 // new images + profile fetch + database update + completion
  let currentStep = 0

  const updateProgress = (stage: string) => {
    currentStep++
    const progress = Math.round((currentStep / totalSteps) * 100)
    onProgress?.(progress, stage)
  }

  // 1. Upload new images to Supabase Storage
  const newImageUrls: string[] = []
  for (let i = 0; i < images.length; i++) {
    const image = images[i]
    onProgress?.(Math.round(((currentStep + (i + 1) / images.length) / totalSteps) * 100), `Uploading image ${i + 1} of ${images.length}`)
    
    const { data, error } = await supabase.storage
      .from('property-images')
      .upload(`${user.id}/${Date.now()}_${image.name}`, image)

    if (error) throw error

    const {
      data: { publicUrl },
    } = supabase.storage.from('property-images').getPublicUrl(data.path)
    newImageUrls.push(publicUrl)
  }
  
  if (images.length > 0) {
    currentStep = images.length
  }

  // 2. Combine existing and new images
  const allImageUrls = [...existingImages, ...newImageUrls]

  // 3. Videos are already uploaded URLs from VideoUpload component
  const videoUrls: string[] = videos

  // 4. Fetch the user's profile to get the correct landlord_id
  updateProgress('Verifying account information')
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Could not find a landlord profile for the current user.')
  }

  // 5. Update property data in the database
  updateProgress('Updating property listing')
  const { error: dbError } = await supabase
    .from('properties')
    .update({
      ...propertyData,
      images: allImageUrls,
      videos: videoUrls,
    })
    .eq('id', propertyId)
    .eq('landlord_id', profile.id)

  if (dbError) throw dbError
  
  updateProgress('Property listing updated successfully!')
}
