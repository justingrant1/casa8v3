"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { submitApplication } from '@/lib/applications'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { X } from 'lucide-react'

interface ApplicationModalProps {
  propertyId: string
  propertyTitle: string
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function ApplicationModal({ propertyId, propertyTitle, open, onClose, onSuccess }: ApplicationModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Form fields - auto-populated from user profile
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [additionalMessage, setAdditionalMessage] = useState('')

  // Auto-populate form fields with user data
  useEffect(() => {
    if (!user || !open) return

    const fetchUserProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, phone')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching user profile:', error)
        } else {
          setFirstName(data.first_name || '')
          setLastName(data.last_name || '')
          setPhoneNumber(data.phone || '')
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
    }

    // Set email from user object
    setEmail(user.email || '')
    
    // Fetch other profile data
    fetchUserProfile()
  }, [user, open])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setError(null)
      setSuccess(false)
      setAdditionalMessage('')
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('You must be logged in to apply.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Debug: Log form values before submission
      console.log('=== Application Modal Form Data ===')
      console.log('First Name:', firstName)
      console.log('Last Name:', lastName)
      console.log('Email:', email)
      console.log('Phone:', phoneNumber)
      console.log('Message:', additionalMessage)
      console.log('Property ID:', propertyId)
      console.log('User ID:', user.id)

      // First, update user profile with form data
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: firstName,
          last_name: lastName,
          phone: phoneNumber,
          email: email, // Keep email in sync
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        console.error('Error updating profile:', profileError)
        throw new Error('Failed to update profile information')
      }

      // Use the submitApplication function with all tenant information
      const applicationId = await submitApplication({
        property_id: propertyId,
        tenant_id: user.id,
        message: additionalMessage || undefined,
        tenant_first_name: firstName,
        tenant_last_name: lastName,
        tenant_email: email,
        tenant_phone: phoneNumber
      })

      console.log('Application submitted successfully:', applicationId)

      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 2000)
    } catch (error: any) {
      console.error('Error submitting application:', error)
      setError(error.message || 'Failed to submit application. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Application Submitted!</h3>
            <p className="text-sm text-gray-600">
              Your application has been sent to the landlord. You'll be notified when they respond.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply for this Property</DialogTitle>
          <DialogDescription>
            Please fill out the form below to apply for this rental property.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              <p className="text-sm text-muted-foreground">Provide your contact details for the application.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalMessage">Additional Message (Optional)</Label>
              <Textarea
                id="additionalMessage"
                placeholder="Any additional information you'd like to provide..."
                value={additionalMessage}
                onChange={(e) => setAdditionalMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
