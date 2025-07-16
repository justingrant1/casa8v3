"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, DollarSign, MapPin, Users, Calendar, Heart, CheckCircle, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TenantOnboardingProps {
  isOpen: boolean
  onComplete: (data: any) => void
  onSkip: () => void
}

export function TenantOnboarding({ isOpen, onComplete, onSkip }: TenantOnboardingProps) {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    // Basic Preferences
    preferredLocation: '',
    maxBudget: '',
    bedrooms: '',
    bathrooms: '',
    propertyType: '',
    moveInDate: '',
    
    // Lifestyle Preferences
    amenities: [] as string[],
    petFriendly: false,
    smokingAllowed: false,
    
    // Personal Information
    employmentStatus: '',
    monthlyIncome: '',
    hasRentalHistory: '',
    
    // Additional Notes
    additionalNotes: ''
  })

  const amenitiesList = [
    'Parking',
    'Laundry',
    'Dishwasher',
    'Air Conditioning',
    'Heating',
    'Internet',
    'Gym/Fitness Center',
    'Pool',
    'Balcony/Patio',
    'Storage',
    'Elevator',
    'Security System'
  ]

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }))
  }

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    
    try {
      // Validate required fields
      if (!formData.preferredLocation || !formData.maxBudget || !formData.bedrooms) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive"
        })
        setLoading(false)
        return
      }

      // Process the form data
      const processedData = {
        ...formData,
        maxBudget: parseInt(formData.maxBudget),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        monthlyIncome: formData.monthlyIncome ? parseInt(formData.monthlyIncome) : null,
        onboarding_completed: true
      }

      await onComplete(processedData)
    } catch (error) {
      console.error('Error completing onboarding:', error)
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Home className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">Let's Find Your Perfect Home</h2>
              <p className="text-gray-600">Tell us about your basic housing preferences</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Preferred Location *</Label>
                <Input
                  id="location"
                  value={formData.preferredLocation}
                  onChange={(e) => handleInputChange('preferredLocation', e.target.value)}
                  placeholder="e.g., New York, NY"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="budget">Maximum Budget * (monthly)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={formData.maxBudget}
                  onChange={(e) => handleInputChange('maxBudget', e.target.value)}
                  placeholder="e.g., 2000"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="bedrooms">Bedrooms *</Label>
                <Select
                  value={formData.bedrooms}
                  onValueChange={(value: string) => handleInputChange('bedrooms', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Studio</SelectItem>
                    <SelectItem value="1">1 bedroom</SelectItem>
                    <SelectItem value="2">2 bedrooms</SelectItem>
                    <SelectItem value="3">3 bedrooms</SelectItem>
                    <SelectItem value="4">4 bedrooms</SelectItem>
                    <SelectItem value="5">5+ bedrooms</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Select
                  value={formData.bathrooms}
                  onValueChange={(value: string) => handleInputChange('bathrooms', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 bathroom</SelectItem>
                    <SelectItem value="1.5">1.5 bathrooms</SelectItem>
                    <SelectItem value="2">2 bathrooms</SelectItem>
                    <SelectItem value="2.5">2.5 bathrooms</SelectItem>
                    <SelectItem value="3">3+ bathrooms</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="propertyType">Property Type</Label>
                <Select
                  value={formData.propertyType}
                  onValueChange={(value: string) => handleInputChange('propertyType', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                    <SelectItem value="townhouse">Townhouse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="moveInDate">Preferred Move-in Date</Label>
              <Input
                id="moveInDate"
                type="date"
                value={formData.moveInDate}
                onChange={(e) => handleInputChange('moveInDate', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Heart className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">Your Lifestyle Preferences</h2>
              <p className="text-gray-600">What amenities and features matter most to you?</p>
            </div>

            <div>
              <Label className="text-lg font-semibold mb-4 block">Preferred Amenities</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {amenitiesList.map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox
                      id={amenity}
                      checked={formData.amenities.includes(amenity)}
                      onCheckedChange={() => handleAmenityToggle(amenity)}
                    />
                    <Label htmlFor={amenity} className="text-sm cursor-pointer">
                      {amenity}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="petFriendly"
                  checked={formData.petFriendly}
                  onCheckedChange={(checked: boolean) => handleInputChange('petFriendly', checked)}
                />
                <Label htmlFor="petFriendly" className="font-medium">
                  Pet-friendly properties only
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="smokingAllowed"
                  checked={formData.smokingAllowed}
                  onCheckedChange={(checked: boolean) => handleInputChange('smokingAllowed', checked)}
                />
                <Label htmlFor="smokingAllowed" className="font-medium">
                  Smoking allowed
                </Label>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Users className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">Background Information</h2>
              <p className="text-gray-600">Help landlords understand your situation (optional)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employment">Employment Status</Label>
                <Select
                  value={formData.employmentStatus}
                  onValueChange={(value: string) => handleInputChange('employmentStatus', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time Employed</SelectItem>
                    <SelectItem value="part-time">Part-time Employed</SelectItem>
                    <SelectItem value="self-employed">Self-employed</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="income">Monthly Income</Label>
                <Input
                  id="income"
                  type="number"
                  value={formData.monthlyIncome}
                  onChange={(e) => handleInputChange('monthlyIncome', e.target.value)}
                  placeholder="e.g., 5000"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="rentalHistory">Do you have rental history?</Label>
              <Select
                value={formData.hasRentalHistory}
                onValueChange={(value: string) => handleInputChange('hasRentalHistory', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes, I have rental history</SelectItem>
                  <SelectItem value="no">No, I'm a first-time renter</SelectItem>
                  <SelectItem value="student">I'm a student</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.additionalNotes}
                onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                placeholder="Anything else you'd like landlords to know about you..."
                rows={4}
                className="mt-1"
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">Welcome to Casa8!</DialogTitle>
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
          {/* Progress Bar */}
          <div className="flex items-center space-x-4 mb-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step <= currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step < currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    step
                  )}
                </div>
                {step < 3 && (
                  <div
                    className={`w-16 h-1 ml-2 ${
                      step < currentStep ? 'bg-primary' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <div className="flex space-x-2">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading}
                >
                  Back
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={onSkip}
                disabled={loading}
              >
                Skip for Now
              </Button>
            </div>
            <Button
              onClick={handleNext}
              disabled={loading}
              className="min-w-[100px]"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : currentStep === 3 ? (
                'Complete Setup'
              ) : (
                'Next'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
