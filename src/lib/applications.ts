import { supabase } from './supabase'
import { Database } from './database.types'

export interface Application {
  id: string
  property_id: string
  tenant_id: string
  status: 'pending' | 'approved' | 'rejected'
  message?: string
  move_in_date?: string
  created_at: string
  updated_at: string
  tenant_name: string
  tenant_email: string
  tenant_phone?: string
  properties?: {
    id: string
    title: string
    address: string
    city?: string
    state?: string
    price: number
    bedrooms: number
    bathrooms: number
  }
}

export async function getApplicationsForLandlord(landlordId: string): Promise<Application[]> {
  try {
    // First get property IDs for this landlord
    const { data: propertiesData, error: propertiesError } = await supabase
      .from('properties')
      .select('id')
      .eq('landlord_id', landlordId)

    if (propertiesError) {
      console.error('Error fetching landlord properties:', propertiesError)
      throw propertiesError
    }

    const propertyIds = propertiesData?.map(p => p.id) || []

    if (propertyIds.length === 0) {
      return []
    }

    // Fetch applications with tenant info and property info
    const { data: applicationsData, error: applicationsError } = await supabase
      .from('applications')
      .select(`
        *,
        properties!property_id (
          id,
          title,
          address,
          city,
          state,
          price,
          bedrooms,
          bathrooms
        )
      `)
      .in('property_id', propertyIds)
      .order('created_at', { ascending: false })

    if (applicationsError) {
      console.error('Error fetching applications:', applicationsError)
      throw applicationsError
    }

    if (!applicationsData || applicationsData.length === 0) {
      return []
    }

    console.log('Raw applications data:', applicationsData)

    // Transform the data to match our interface - now using tenant info from applications table
    const applications: Application[] = applicationsData.map(app => {
      console.log('Processing application:', app)
      
      // Get tenant name from the application record itself
      const tenantName = app.tenant_first_name && app.tenant_last_name
        ? `${app.tenant_first_name} ${app.tenant_last_name}`.trim()
        : app.tenant_email || 'Unknown'
      
      return {
        id: app.id,
        property_id: app.property_id,
        tenant_id: app.tenant_id,
        status: app.status,
        message: app.message,
        move_in_date: app.move_in_date,
        created_at: app.created_at,
        updated_at: app.updated_at,
        tenant_name: tenantName,
        tenant_email: app.tenant_email || 'Unknown',
        tenant_phone: app.tenant_phone,
        properties: app.properties
      }
    })
    
    console.log('Processed applications:', applications)

    return applications
  } catch (error) {
    console.error('Error in getApplicationsForLandlord:', error)
    throw error
  }
}

export async function getApplicationsForTenant(tenantId: string): Promise<Application[]> {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        properties!property_id (
          id,
          title,
          address,
          city,
          state,
          price,
          bedrooms,
          bathrooms,
          landlord:profiles!landlord_id (
            first_name,
            last_name,
            email,
            phone
          )
        )
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching applications for tenant:', error)
      throw error
    }

    // Transform the data to match our interface
    const applications: Application[] = (data || []).map(app => ({
      id: app.id,
      property_id: app.property_id,
      tenant_id: app.tenant_id,
      status: app.status,
      message: app.message,
      move_in_date: app.move_in_date,
      created_at: app.created_at,
      updated_at: app.updated_at,
      tenant_name: 'You', // Since this is for the tenant
      tenant_email: '', // Not needed for tenant view
      tenant_phone: '',
      properties: app.properties
    }))

    return applications
  } catch (error) {
    console.error('Error in getApplicationsForTenant:', error)
    throw error
  }
}

export async function submitApplication(applicationData: {
  property_id: string
  tenant_id: string
  message?: string
  move_in_date?: string
  tenant_first_name: string
  tenant_last_name: string
  tenant_email: string
  tenant_phone: string
}): Promise<string> {
  try {
    // Check if application already exists
    const { data: existingApp, error: checkError } = await supabase
      .from('applications')
      .select('id')
      .eq('property_id', applicationData.property_id)
      .eq('tenant_id', applicationData.tenant_id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing application:', checkError)
      throw checkError
    }

    if (existingApp) {
      throw new Error('You have already applied to this property')
    }

    // Create new application with tenant information
    const { data, error } = await supabase
      .from('applications')
      .insert([{
        property_id: applicationData.property_id,
        tenant_id: applicationData.tenant_id,
        message: applicationData.message,
        move_in_date: applicationData.move_in_date,
        status: 'pending',
        tenant_first_name: applicationData.tenant_first_name,
        tenant_last_name: applicationData.tenant_last_name,
        tenant_email: applicationData.tenant_email,
        tenant_phone: applicationData.tenant_phone
      }])
      .select()
      .single()

    if (error) {
      console.error('Error submitting application:', error)
      throw error
    }

    return data.id
  } catch (error) {
    console.error('Error in submitApplication:', error)
    throw error
  }
}

export async function updateApplicationStatus(
  applicationId: string, 
  status: 'pending' | 'approved' | 'rejected'
): Promise<void> {
  try {
    const { error } = await supabase
      .from('applications')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', applicationId)

    if (error) {
      console.error('Error updating application status:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in updateApplicationStatus:', error)
    throw error
  }
}

export async function getApplication(applicationId: string): Promise<Application | null> {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        tenant:profiles!tenant_id (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        properties!property_id (
          id,
          title,
          address,
          city,
          state,
          price,
          bedrooms,
          bathrooms
        )
      `)
      .eq('id', applicationId)
      .single()

    if (error) {
      console.error('Error fetching application:', error)
      throw error
    }

    if (!data) return null

    // Transform the data to match our interface
    const application: Application = {
      id: data.id,
      property_id: data.property_id,
      tenant_id: data.tenant_id,
      status: data.status,
      message: data.message,
      move_in_date: data.move_in_date,
      created_at: data.created_at,
      updated_at: data.updated_at,
      tenant_name: data.tenant ? `${data.tenant.first_name || ''} ${data.tenant.last_name || ''}`.trim() || 'Unknown' : 'Unknown',
      tenant_email: data.tenant?.email || 'Unknown',
      tenant_phone: data.tenant?.phone,
      properties: data.properties
    }

    return application
  } catch (error) {
    console.error('Error in getApplication:', error)
    throw error
  }
}

export async function deleteApplication(applicationId: string, userId: string): Promise<void> {
  try {
    // First, verify the application belongs to the user
    const { data: application, error: fetchError } = await supabase
      .from('applications')
      .select('tenant_id')
      .eq('id', applicationId)
      .single()

    if (fetchError) {
      console.error('Error fetching application:', fetchError)
      throw fetchError
    }

    if (!application || application.tenant_id !== userId) {
      throw new Error('Application not found or unauthorized')
    }

    // Delete the application
    const { error: deleteError } = await supabase
      .from('applications')
      .delete()
      .eq('id', applicationId)

    if (deleteError) {
      console.error('Error deleting application:', deleteError)
      throw deleteError
    }
  } catch (error) {
    console.error('Error in deleteApplication:', error)
    throw error
  }
}
