"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Phone, Mail, MessageSquare, Send, X, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ContactLandlordModalProps {
  isOpen: boolean
  onClose: () => void
  landlord: {
    id: string
    name: string
    phone?: string | null
    email?: string | null
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
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("chat")

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard!",
    })
  }

  const landlordPhoneNumber = landlord.phone || "Phone not available"
  const landlordEmail = landlord.email || "Email not available"

  const emailSubject = `Inquiry about ${property.title}`
  const emailBody = `Hi Property Owner,\n\nI'm interested in your property "${property.title}" and would like to know more details. Could we schedule a viewing?\n\nThank you!`

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-bold">Contact Landlord</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>
        <div className="p-6 pt-0">
          <p className="text-gray-500 mb-6 text-center">Choose how you'd like to get in touch</p>
          
          <Tabs defaultValue="chat" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 bg-gray-100">
              <TabsTrigger value="chat"><MessageSquare className="w-4 h-4 mr-2" />Chat</TabsTrigger>
              <TabsTrigger value="email"><Mail className="w-4 h-4 mr-2" />Email</TabsTrigger>
              <TabsTrigger value="phone"><Phone className="w-4 h-4 mr-2" />Phone</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="mt-6">
              <h3 className="font-semibold mb-2">Live Chat</h3>
              <p className="text-sm text-gray-500 mb-4">Start a real-time conversation with the landlord.</p>
              <Button className="w-full bg-gray-900 text-white hover:bg-gray-800">
                <MessageSquare className="w-4 h-4 mr-2" />
                Start Chat
              </Button>
              <p className="text-xs text-gray-400 mt-2 text-center">Messaging functionality coming soon.</p>
            </TabsContent>

            <TabsContent value="email" className="mt-6">
              <h3 className="font-semibold mb-2">Send Email</h3>
              <p className="text-sm text-gray-500 mb-4">Send a message to {landlordEmail}</p>
              <div className="space-y-4">
                <div>
                  <label htmlFor="subject" className="text-sm font-medium text-gray-700">Subject</label>
                  <Input id="subject" value={emailSubject} readOnly className="mt-1 bg-gray-50" />
                </div>
                <div>
                  <label htmlFor="message" className="text-sm font-medium text-gray-700">Message</label>
                  <Textarea id="message" value={emailBody} readOnly rows={5} className="mt-1 bg-gray-50" />
                </div>
                <a
                  href={`mailto:${landlordEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                  className="w-full"
                >
                  <Button className="w-full bg-gray-900 text-white hover:bg-gray-800">
                    <Send className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                </a>
              </div>
            </TabsContent>

            <TabsContent value="phone" className="mt-6">
              <h3 className="font-semibold mb-2">Call</h3>
              <p className="text-sm text-gray-500 mb-4">Use the phone number below to call directly</p>
              <div className="flex items-center justify-between bg-gray-100 rounded-md p-3">
                <span className="font-mono text-sm">{landlordPhoneNumber}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleCopy(landlordPhoneNumber)}
                  disabled={landlordPhoneNumber === "Phone not available"}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <a
                href={`tel:${landlordPhoneNumber}`}
                className={`w-full mt-4 inline-block ${landlordPhoneNumber === "Phone not available" ? 'pointer-events-none' : ''}`}
              >
                <Button
                  className="w-full bg-gray-900 text-white hover:bg-gray-800"
                  disabled={landlordPhoneNumber === "Phone not available"}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call Property Owner
                </Button>
              </a>
              <p className="text-xs text-gray-400 mt-2 text-center">Clicking will open your phone app</p>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
