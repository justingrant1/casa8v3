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

export default function ApplyPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const [property, setProperty] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [moveInDate, setMoveInDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProperty = async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('title')
        .eq('id', params.id)
        .single()

      if (error) {
        console.error(error)
      } else {
        setProperty(data)
      }
    }

    fetchProperty()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('You must be logged in to apply.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error: dbError } = await supabase.from('applications').insert({
        property_id: params.id,
        tenant_id: user.id,
        message,
        move_in_date: moveInDate,
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
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Apply for {property?.title || 'Property'}</CardTitle>
          <CardDescription>Submit your application for this property.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="moveInDate">Desired Move-in Date</Label>
              <Input
                id="moveInDate"
                type="date"
                value={moveInDate}
                onChange={(e) => setMoveInDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message to Landlord</Label>
              <Textarea
                id="message"
                placeholder="Tell the landlord a bit about yourself..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Application'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
