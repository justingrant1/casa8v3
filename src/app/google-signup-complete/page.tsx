"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Home, User, ArrowRight } from "lucide-react"

export default function GoogleSignupCompletePage() {
  const router = useRouter()
  const { user, profile, handleGoogleSignupComplete, completeOnboarding } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    role: "tenant",
  })

  useEffect(() => {
    // If user is not authenticated, redirect to register
    if (!user) {
      router.push("/register")
      return
    }

    // Get the pending role from localStorage
    const pendingRole = localStorage.getItem('pendingRole') || 'tenant'
    
    // Pre-fill form with Google data
    setFormData({
      firstName: user.user_metadata?.given_name || "",
      lastName: user.user_metadata?.family_name || "",
      phone: "",
      role: pendingRole,
    })
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // First, complete the Google signup with basic info
      const { error: signupError } = await handleGoogleSignupComplete({
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
      })

      if (signupError) {
        setError(signupError.message || "Failed to complete signup")
        setLoading(false)
        return
      }

      // Then complete onboarding
      const { error: onboardingError } = await completeOnboarding({
        onboarding_completed: true,
      })

      if (onboardingError) {
        setError(onboardingError.message || "Failed to complete onboarding")
        setLoading(false)
        return
      }

      // Clear the pending role from localStorage
      localStorage.removeItem('pendingRole')

      // Redirect based on role
      if (formData.role === "landlord") {
        router.push("/dashboard-simple")
      } else {
        router.push("/")
      }
    } catch (err) {
      console.error("Error completing Google signup:", err)
      setError("An unexpected error occurred")
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-cyan-50"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-br from-purple-200/30 to-pink-200/20 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden">
            <CardHeader className="text-center pb-8 pt-8">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-6">
                <span className="text-primary-foreground font-bold text-2xl">C8</span>
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900">Complete Your Profile</CardTitle>
              <CardDescription className="text-lg text-gray-600">
                Just a few more details to get started
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Role Selection */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold text-gray-900">I am a:</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className={`relative border-2 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-lg ${
                        formData.role === "tenant"
                          ? "border-primary bg-primary/5 shadow-lg"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handleInputChange("role", "tenant")}
                    >
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            formData.role === "tenant" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <User className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Tenant</div>
                          <div className="text-sm text-gray-600">Find your home</div>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`relative border-2 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-lg ${
                        formData.role === "landlord"
                          ? "border-primary bg-primary/5 shadow-lg"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handleInputChange("role", "landlord")}
                    >
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            formData.role === "landlord" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <Home className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Landlord</div>
                          <div className="text-sm text-gray-600">List properties</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className="h-12 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className="h-12 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="h-12 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    required
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-500 text-center">{error}</div>
                )}

                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                  disabled={loading}
                >
                  {loading ? "Completing Setup..." : "Complete Setup"}
                  {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
