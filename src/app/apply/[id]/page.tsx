"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Navbar } from '@/components/navbar'

export default function ApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth()
  const router = useRouter()
  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [propertyId, setPropertyId] = useState<string | null>(null)
  
  // Form fields - auto-populated from user profile
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [additionalMessage, setAdditionalMessage] = useState('')

  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params
      setPropertyId(resolvedParams.id)
    }
    initializeParams()
  }, [params])

  useEffect(() => {
    if (!propertyId) return

    const fetchProperty = async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('title')
        .eq('id', propertyId)
        .single()

      if (error) {
        console.error(error)
      } else {
        setProperty(data)
      }
    }

    fetchProperty()
  }, [propertyId])

  // Auto-populate form fields with user data
  useEffect(() => {
    if (!user) return

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
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('You must be logged in to apply.')
      return
    }

    if (!propertyId) {
      setError('Property ID not found.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error: dbError } = await supabase.from('applications').insert({
        property_id: propertyId,
        tenant_id: user.id,
        message: additionalMessage,
        status: 'pending'
      })

      if (dbError) throw dbError

      router.push('/dashboard')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Apply for this Property</CardTitle>
            <CardDescription>Please fill out the form below to apply for this rental property.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-lg font-semibold">Personal Information</h3>
                  <p className="text-sm text-muted-foreground">Provide your contact details for the application.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
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

              {error && <p className="text-sm text-red-500">{error}</p>}
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Application'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
