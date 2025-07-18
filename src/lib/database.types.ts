export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          role: 'tenant' | 'landlord' | 'admin'
          phone: string | null
          created_at: string
          updated_at: string
          avatar_url: string | null
          onboarding_completed: boolean
          has_section8_voucher: boolean
          voucher_bedroom_count: number | null
          city: string | null
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          role: 'tenant' | 'landlord' | 'admin'
          phone?: string | null
          created_at?: string
          updated_at?: string
          avatar_url?: string | null
          onboarding_completed?: boolean
          has_section8_voucher?: boolean
          voucher_bedroom_count?: number | null
          city?: string | null
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          role?: 'tenant' | 'landlord' | 'admin'
          phone?: string | null
          created_at?: string
          updated_at?: string
          avatar_url?: string | null
          onboarding_completed?: boolean
          has_section8_voucher?: boolean
          voucher_bedroom_count?: number | null
          city?: string | null
        }
      }
      properties: {
        Row: {
          id: string
          landlord_id: string
          title: string
          description: string | null
          price: number
          property_type: string
          address: string
          city: string
          state: string
          zip_code: string | null
          latitude: number | null
          longitude: number | null
          bedrooms: number
          bathrooms: number
          sqft: number | null
          amenities: string[] | null
          images: string[] | null
          videos: string[] | null
          available_date: string | null
          is_active: boolean
          security_deposit: number | null
          security_deposit_negotiable: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          landlord_id: string
          title: string
          description?: string | null
          price: number
          property_type: string
          address: string
          city: string
          state: string
          zip_code?: string | null
          latitude?: number | null
          longitude?: number | null
          bedrooms: number
          bathrooms: number
          sqft?: number | null
          amenities?: string[] | null
          images?: string[] | null
          videos?: string[] | null
          available_date?: string | null
          is_active?: boolean
          security_deposit?: number | null
          security_deposit_negotiable?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          landlord_id?: string
          title?: string
          description?: string | null
          price?: number
          property_type?: string
          address?: string
          city?: string
          state?: string
          zip_code?: string | null
          latitude?: number | null
          longitude?: number | null
          bedrooms?: number
          bathrooms?: number
          sqft?: number | null
          amenities?: string[] | null
          images?: string[] | null
          videos?: string[] | null
          available_date?: string | null
          is_active?: boolean
          security_deposit?: number | null
          security_deposit_negotiable?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          property_id: string
          tenant_id: string
          status: 'pending' | 'approved' | 'rejected'
          message: string | null
          move_in_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          tenant_id: string
          status?: 'pending' | 'approved' | 'rejected'
          message?: string | null
          move_in_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          tenant_id?: string
          status?: 'pending' | 'approved' | 'rejected'
          message?: string | null
          move_in_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          property_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          property_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          property_id?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          property_id: string | null
          application_id: string | null
          sender_id: string
          recipient_id: string
          subject: string | null
          message_text: string
          message_type: 'application' | 'inquiry' | 'general'
          read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id?: string | null
          application_id?: string | null
          sender_id: string
          recipient_id: string
          subject?: string | null
          message_text: string
          message_type?: 'application' | 'inquiry' | 'general'
          read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string | null
          application_id?: string | null
          sender_id?: string
          recipient_id?: string
          subject?: string | null
          message_text?: string
          message_type?: 'application' | 'inquiry' | 'general'
          read?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export type Profile = Tables<'profiles'>
export type Property = Tables<'properties'>
export type Application = Tables<'applications'>
export type Favorite = Tables<'favorites'>
export type Message = Tables<'messages'>
