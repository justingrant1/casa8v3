"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Home, MapPin, CheckCircle, Users, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { LocationSearch } from "@/components/location-search"

interface TenantOnboardingProps {
  isOpen: boolean
  onComplete: (data: any) => void
  onSkip: () => void
}

export function TenantOnboarding({ isOpen, onComplete, onSkip }: TenantOnboardingProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    hasSection8Voucher: '',
    voucherBedroomCount: '',
    city: '',
    coordinates: null as { lat: number; lng: number } | null
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Reset bedroom count if no voucher is selected
    if (field === 'hasSection8Voucher' && value === 'no') {
      setFormData(prev => ({
        ...prev,
        voucherBedroomCount: ''
      }))
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    
    try {
      // Validate required fields
      if (!formData.hasSection8Voucher || !formData.city) {
        toast({
          title: "Missing Information",
          description: "Please answer all questions",
          variant: "destructive"
        })
        setLoading(false)
        return
      }

      // Validate voucher bedroom count if they have a voucher
      if (formData.hasSection8Voucher === 'yes' && !formData.voucherBedroomCount) {
        toast({
          title: "Missing Information",
          description: "Please select your voucher bedroom count",
          variant: "destructive"
        })
        setLoading(false)
        return
      }

      // Process the form data
      const processedData = {
        has_section8_voucher: formData.hasSection8Voucher === 'yes',
        voucher_bedroom_count: formData.voucherBedroomCount ? parseInt(formData.voucherBedroomCount) : null,
        city: formData.city,
        onboarding_completed: true
      }

      await onComplete(processedData)
    } catch (error) {
      console.error('Error completing onboarding:', error)
      toast({
        title: "Error",
        description: "Failed to save information. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl sm:text-2xl font-bold">Welcome to Casa8!</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onSkip}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Step 1 of 1</span>
            </div>
          </div>

          {/* Section 8 Housing Voucher Question */}
          <div className="space-y-4">
            <div className="text-center mb-4">
              <Home className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 text-primary" />
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Section 8 Housing Voucher</h2>
              <p className="text-gray-600">Do you have a Section 8 housing voucher?</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  formData.hasSection8Voucher === 'yes' ? 'border-primary bg-primary/5' : 'border-gray-200'
                }`}
                onClick={() => handleInputChange('hasSection8Voucher', 'yes')}
              >
                <CardContent className="p-4 sm:p-6 text-center">
                  <CheckCircle className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 ${
                    formData.hasSection8Voucher === 'yes' ? 'text-primary' : 'text-gray-400'
                  }`} />
                  <h3 className="font-semibold text-base sm:text-lg mb-2">Yes, I have a voucher</h3>
                  <p className="text-sm text-gray-600">I have a Section 8 housing voucher</p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  formData.hasSection8Voucher === 'no' ? 'border-primary bg-primary/5' : 'border-gray-200'
                }`}
                onClick={() => handleInputChange('hasSection8Voucher', 'no')}
              >
                <CardContent className="p-4 sm:p-6 text-center">
                  <Users className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 ${
                    formData.hasSection8Voucher === 'no' ? 'text-primary' : 'text-gray-400'
                  }`} />
                  <h3 className="font-semibold text-base sm:text-lg mb-2">No, I don't have a voucher</h3>
                  <p className="text-sm text-gray-600">I'll be paying rent without assistance</p>
                </CardContent>
              </Card>
            </div>

            {/* Voucher Details - Only show if they have a voucher */}
            {formData.hasSection8Voucher === 'yes' && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Voucher Details</h3>
                  <p className="text-gray-600">How many bedrooms is your voucher approved for?</p>
                </div>

                <div className="w-full">
                  <Label htmlFor="bedroomCount" className="text-sm font-medium text-gray-700">
                    Bedroom Count
                  </Label>
                  <Select
                    value={formData.voucherBedroomCount}
                    onValueChange={(value: string) => handleInputChange('voucherBedroomCount', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select bedroom count" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Studio</SelectItem>
                      <SelectItem value="1">1 Bedroom</SelectItem>
                      <SelectItem value="2">2 Bedrooms</SelectItem>
                      <SelectItem value="3">3 Bedrooms</SelectItem>
                      <SelectItem value="4">4 Bedrooms</SelectItem>
                      <SelectItem value="5">5+ Bedrooms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* City Selection */}
            <div className="space-y-4">
              <div className="text-center">
                <MapPin className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Select Your City</h3>
                <p className="text-gray-600">Which city are you looking for housing in?</p>
              </div>

              <div className="w-full">
                <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                  City
                </Label>
                <div className="mt-1">
                  <LocationSearch
                    placeholder="Search for a city..."
                    onLocationSelect={(location) => {
                      setFormData(prev => ({
                        ...prev,
                        city: `${location.city}, ${location.state}`,
                        coordinates: location.coordinates
                      }))
                    }}
                  />
                </div>
                {formData.city && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: {formData.city}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full sm:min-w-[200px] sm:w-auto h-12 text-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                'Get Started'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
