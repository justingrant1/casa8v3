"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Phone, Mail, User, MessageSquare, Send, X } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface ContactLandlordModalProps {
  isOpen: boolean
  onClose: () => void
  landlord: {
    id: string
    name: string
    phone: string
    email: string
  }
  property: {
    id: string
    title: string
  }
}

export function ContactLandlordModal({
  isOpen,
  onClose,
  landlord,
  property
}: ContactLandlordModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: '',
    message: `Hi ${landlord.name},\n\nI'm interested in your property listing "${property.title}". Could you please provide more information about availability and viewing times?\n\nThank you!`
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to contact the landlord",
        variant: "destructive"
      })
      router.push('/login')
      return
    }

    setLoading(true)

    try {
      // In a real app, this would send a message through your messaging system
      // For now, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Message Sent!",
        description: "Your message has been sent to the landlord. They will contact you soon.",
      })
      
      onClose()
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">Contact Landlord</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Property Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Property</h3>
            <p className="text-sm text-gray-700">{property.title}</p>
          </div>

          {/* Landlord Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Landlord Information
            </h3>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <User className="w-4 h-4 mr-2 text-gray-500" />
                <span className="font-medium">{landlord.name}</span>
              </div>
              {landlord.phone && landlord.phone !== "Phone not available" && (
                <div className="flex items-center text-sm">
                  <Phone className="w-4 h-4 mr-2 text-gray-500" />
                  <span>{landlord.phone}</span>
                </div>
              )}
              {landlord.email && landlord.email !== "Email not available" && (
                <div className="flex items-center text-sm">
                  <Mail className="w-4 h-4 mr-2 text-gray-500" />
                  <span>{landlord.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Your Name *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Your Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Your Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="(555) 123-4567"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                rows={6}
                className="mt-1"
                placeholder="Tell the landlord about your interest in the property..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
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
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Tips */}
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              Tips for Contacting Landlords
            </h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Be polite and professional in your message</li>
              <li>• Include your move-in timeline and any questions</li>
              <li>• Mention if you have references or documentation ready</li>
              <li>• Be prepared to schedule a viewing or phone call</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
