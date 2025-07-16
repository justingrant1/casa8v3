import { supabase } from './supabase'
import { Database } from './database.types'

type Property = Database['public']['Tables']['properties']['Row']

export async function getLandlordProperties(landlordId: string): Promise<Property[]> {
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

    return data || []
  } catch (error) {
    console.error('Error in getLandlordProperties:', error)
    throw error
  }
}

export async function deleteProperty(propertyId: string, landlordId: string): Promise<void> {
  try {
    // First, verify the property belongs to the landlord
    const { data: property, error: fetchError } = await supabase
      .from('properties')
      .select('landlord_id')
      .eq('id', propertyId)
      .single()

    if (fetchError) {
      console.error('Error fetching property:', fetchError)
      throw fetchError
    }

    if (!property || property.landlord_id !== landlordId) {
      throw new Error('Property not found or unauthorized')
    }

    // Delete related records first
    await supabase
      .from('applications')
      .delete()
      .eq('property_id', propertyId)

    await supabase
      .from('favorites')
      .delete()
      .eq('property_id', propertyId)

    await supabase
      .from('messages')
      .delete()
      .eq('property_id', propertyId)

    // Finally, delete the property
    const { error: deleteError } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId)

    if (deleteError) {
      console.error('Error deleting property:', deleteError)
      throw deleteError
    }
  } catch (error) {
    console.error('Error in deleteProperty:', error)
    throw error
  }
}

export async function updatePropertyStatus(
  propertyId: string, 
  landlordId: string, 
  available: boolean
): Promise<void> {
  try {
    // First, verify the property belongs to the landlord
    const { data: property, error: fetchError } = await supabase
      .from('properties')
      .select('landlord_id')
      .eq('id', propertyId)
      .single()

    if (fetchError) {
      console.error('Error fetching property:', fetchError)
      throw fetchError
    }

    if (!property || property.landlord_id !== landlordId) {
      throw new Error('Property not found or unauthorized')
    }

    // Update the property status
    const { error: updateError } = await supabase
      .from('properties')
      .update({ available, updated_at: new Date().toISOString() })
      .eq('id', propertyId)

    if (updateError) {
      console.error('Error updating property status:', updateError)
      throw updateError
    }
  } catch (error) {
    console.error('Error in updatePropertyStatus:', error)
    throw error
  }
}

export async function getPropertyApplications(propertyId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        tenant:profiles!tenant_id (
          id,
          full_name,
          email,
          phone
        )
      `)
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching property applications:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getPropertyApplications:', error)
    throw error
  }
}

export async function getPropertyStats(landlordId: string): Promise<{
  totalProperties: number
  activeProperties: number
  totalApplications: number
  pendingApplications: number
}> {
  try {
    // Get property stats
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('id, available')
      .eq('landlord_id', landlordId)

    if (propError) {
      console.error('Error fetching property stats:', propError)
      throw propError
    }

    const totalProperties = properties?.length || 0
    const activeProperties = properties?.filter(p => p.available).length || 0

    // Get application stats
    const { data: applications, error: appError } = await supabase
      .from('applications')
      .select('status, property_id')
      .in('property_id', properties?.map(p => p.id) || [])

    if (appError) {
      console.error('Error fetching application stats:', appError)
      throw appError
    }

    const totalApplications = applications?.length || 0
    const pendingApplications = applications?.filter(a => a.status === 'pending').length || 0

    return {
      totalProperties,
      activeProperties,
      totalApplications,
      pendingApplications
    }
  } catch (error) {
    console.error('Error in getPropertyStats:', error)
    throw error
  }
}
