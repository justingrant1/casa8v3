"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Phone, ArrowRight } from 'lucide-react'

interface GoogleSignupCompleteProps {
  onComplete: () => void
}

export function GoogleSignupComplete({ onComplete }: GoogleSignupCompleteProps) {
  const { user, profile, handleGoogleSignupComplete } = useAuth()
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If user already has a phone number, skip this step
    if (profile?.phone) {
      onComplete()
    }
  }, [profile, onComplete])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!phone.trim()) {
      setError('Phone number is required')
      setLoading(false)
      return
    }

    const { error } = await handleGoogleSignupComplete({
      phone: phone.trim(),
      first_name: user?.user_metadata?.given_name || '',
      last_name: user?.user_metadata?.family_name || '',
    })

    if (error) {
      setError(error.message || 'Failed to complete signup')
    } else {
      onComplete()
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl border-0 rounded-3xl">
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-primary-foreground font-bold text-2xl">C8</span>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Complete Your Profile</CardTitle>
          <p className="text-gray-600 mt-2">
            We just need a few more details to get you started
          </p>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Display user info from Google */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Name:</span>
                <span className="text-sm text-gray-900">
                  {user?.user_metadata?.given_name} {user?.user_metadata?.family_name}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Email:</span>
                <span className="text-sm text-gray-900">{user?.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Role:</span>
                <span className="text-sm text-gray-900 capitalize">
                  {localStorage.getItem('pendingRole') || 'tenant'}
                </span>
              </div>
            </div>

            {/* Phone Number Input */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-14 pl-12 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20 text-lg"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-500 text-center">{error}</div>
            )}

            <Button
              type="submit"
              className="w-full h-14 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Completing Profile...
                </>
              ) : (
                <>
                  Continue to Onboarding
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
