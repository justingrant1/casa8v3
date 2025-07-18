"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Edit, Trash2, MessageSquare, FileText } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuthSimple } from "@/hooks/use-auth-simple"
import { useToast } from "@/hooks/use-toast-simple"
import { getLandlordProperties, deleteProperty, updatePropertyStatus } from "@/lib/property-management"
import { getApplicationsForLandlord, updateApplicationStatus, Application } from "@/lib/applications"
import { getMessageThreads, markAllMessagesAsRead, sendMessage, MessageThread, getUnreadMessageCount } from "@/lib/messaging"
import { RealtimeChat } from "@/components/realtime-chat"
import { realtimeMessaging } from "@/lib/realtime-messaging"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navbar } from "@/components/navbar"
import { ApplicationDetailsModal } from "@/components/application-details-modal"

export default function SimpleDashboard() {
  const { user, profile, loading: authLoading } = useAuthSimple()
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("properties")
  const [landlordProperties, setLandlordProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [propertyStatuses, setPropertyStatuses] = useState<{ [key: string]: string }>({})
  const [initialized, setInitialized] = useState(false)
  const [applications, setApplications] = useState<Application[]>([])
  const [applicationsLoading, setApplicationsLoading] = useState(false)
  const [messageThreads, setMessageThreads] = useState<MessageThread[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [replyMessage, setReplyMessage] = useState('')
  const [replySubject, setReplySubject] = useState('')
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null)
  const [showRealtimeChat, setShowRealtimeChat] = useState(false)
  const [activeChatThread, setActiveChatThread] = useState<MessageThread | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  // Set up real-time subscriptions for messages
  useEffect(() => {
    if (!user) return

    console.log('🔔 Setting up real-time message subscriptions for user:', user.id)

    let cleanupFunctions: (() => void)[] = []

    // Setup presence tracking
    const cleanupPresence = realtimeMessaging.setupPresenceTracking()
    cleanupFunctions.push(cleanupPresence)

    // Subscribe to new messages for all properties the landlord owns
    landlordProperties.forEach(property => {
      const unsubscribe = realtimeMessaging.subscribeToMessages(
        property.id.toString(),
        (message) => {
          console.log('📨 New real-time message received:', message)
          // Refresh message threads when new message arrives
          fetchMessages()
          
          // Update unread count
          if (message.recipient_id === user.id) {
            setUnreadCount(prev => prev + 1)
          }

          // Show toast notification
          if (message.recipient_id === user.id) {
            toast({
              title: "New Message",
              description: `New message from ${message.sender_profile?.full_name || 'a tenant'}`,
            })
          }
        },
        (message) => {
          console.log('📝 Message updated:', message)
          // Refresh message threads when message is updated (e.g., marked as read)
          fetchMessages()
        }
      )
      cleanupFunctions.push(unsubscribe)
    })

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up real-time subscriptions')
      cleanupFunctions.forEach(cleanup => cleanup())
    }
  }, [user, landlordProperties]) // Re-subscribe when properties change

  // Load initial unread count
  useEffect(() => {
    if (!user) return

    const loadUnreadCount = async () => {
      try {
        const count = await getUnreadMessageCount(user.id)
        setUnreadCount(count)
      } catch (error) {
        console.error('Error loading unread count:', error)
      }
    }

    loadUnreadCount()
  }, [user])

  const getSenderName = (message: any, userId: string) => {
    if (message.sender_id === userId) return 'You'
    return message.sender ? `${message.sender.first_name || ''} ${message.sender.last_name || ''}`.trim() || 
           message.sender?.email || 
           'Unknown User' : 'Unknown User'
  }

  const getOtherParticipantName = (thread: MessageThread) => {
    const lastMessage = thread.last_message
    const senderName = getSenderName(lastMessage, user?.id || '')
    
    return senderName === 'You' 
      ? (lastMessage.recipient ? `${lastMessage.recipient.first_name || ''} ${lastMessage.recipient.last_name || ''}`.trim() || 
         lastMessage.recipient?.email || 'Unknown User' : 'Unknown User')
      : senderName
  }

  const fetchMessages = async () => {
    if (!user) {
      console.log('DEBUG: No user available for fetching messages')
      return
    }
    
    try {
      console.log('DEBUG: Fetching message threads for landlord:', user.id)
      setMessagesLoading(true)
      const threads = await getMessageThreads(user.id)
      console.log('DEBUG: Fetched message threads:', threads)
      
      setMessageThreads(threads)
    } catch (error) {
      console.error('ERROR: Fetching messages failed:', error)
      toast({
        title: "Error loading messages",
        description: "Failed to load messages. Please try again.",
        variant: "destructive"
      })
      setMessageThreads([])
    } finally {
      setMessagesLoading(false)
    }
  }

  const handleOpenRealtimeChat = (thread: MessageThread) => {
    const otherParticipant = thread.participants.find(p => p !== user?.id)
    if (!otherParticipant) return

    setActiveChatThread(thread)
    setShowRealtimeChat(true)
  }

  const handleCloseRealtimeChat = () => {
    setShowRealtimeChat(false)
    setActiveChatThread(null)
    // Refresh messages after closing chat
    fetchMessages()
  }

  useEffect(() => {
    console.log('🔍 Simple Dashboard useEffect - authLoading:', authLoading, 'user:', !!user, 'initialized:', initialized)
    
    // Only redirect if auth is definitely done loading and there's no user
    if (!authLoading && !user) {
      console.log('🔍 No user, redirecting to login')
      router.push("/login")
      return
    }

    // Check if user is a landlord - only landlords should access dashboard
    if (!authLoading && user && profile && profile.role !== 'landlord') {
      console.log('🔍 User is not landlord, redirecting home')
      toast({
        title: "Access Denied",
        description: "This page is only available to landlords",
        variant: "destructive"
      })
      router.push("/")
      return
    }

    // Fetch properties when user is available and we haven't initialized yet
    if (user && profile && !authLoading && !initialized) {
      console.log('🔍 User available, fetching properties for first time')
      setInitialized(true)
      fetchLandlordProperties()
      fetchApplications()
      fetchMessages()
    }
  }, [user, profile, authLoading, initialized])

  // Show loading screen while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Only show "not authenticated" if auth loading is complete and no user
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  const fetchLandlordProperties = async () => {
    if (!user) {
      console.log('DEBUG: No user available for fetching properties')
      return
    }
    
    try {
      console.log('DEBUG: Fetching properties for user:', user.id)
      
      setLoading(true)
      const properties = await getLandlordProperties(user.id)
      console.log('DEBUG: Fetched properties:', properties)
      
      setLandlordProperties(properties)
      
      // Initialize property statuses
      const statuses = properties.reduce((acc: any, property: any) => {
        acc[property.id] = property.is_active ? 'active' : 'inactive'
        return acc
      }, {})
      setPropertyStatuses(statuses)
    } catch (error) {
      console.error('ERROR: Fetching properties failed:', error)
      toast({
        title: "Error loading properties",
        description: "Failed to load your properties. Please try again.",
        variant: "destructive"
      })
      setLandlordProperties([])
    } finally {
      setLoading(false)
    }
  }

  const fetchApplications = async () => {
    if (!user) {
      console.log('DEBUG: No user available for fetching applications')
      return
    }
    
    try {
      console.log('DEBUG: Fetching applications for landlord:', user.id)
      setApplicationsLoading(true)
      const fetchedApplications = await getApplicationsForLandlord(user.id)
      console.log('DEBUG: Fetched applications:', fetchedApplications)
      
      setApplications(fetchedApplications)
    } catch (error) {
      console.error('ERROR: Fetching applications failed:', error)
      toast({
        title: "Error loading applications",
        description: "Failed to load rental applications. Please try again.",
        variant: "destructive"
      })
      setApplications([])
    } finally {
      setApplicationsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "occupied":
        return "bg-green-100 text-green-800"
      case "vacant":
        return "bg-yellow-100 text-yellow-800"
      case "pending":
        return "bg-blue-100 text-blue-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleStatusChange = async (propertyId: number, newStatus: string) => {
    if (!user) return

    try {
      const is_active = newStatus === 'active'
      await updatePropertyStatus(propertyId.toString(), user.id, is_active)
      
      setPropertyStatuses((prev) => ({
        ...prev,
        [propertyId]: newStatus,
      }))

      toast({
        title: "Property status updated",
        description: `Property is now ${newStatus}`
      })
    } catch (error) {
      console.error('Error updating property status:', error)
      toast({
        title: "Error updating status",
        description: "Failed to update property status. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (propertyId: number) => {
    router.push(`/list-property?edit=${propertyId}`)
  }

  const handleDelete = async (propertyId: number) => {
    if (!user) return

    setLoading(true)
    try {
      await deleteProperty(propertyId.toString(), user.id)
      
      // Refetch properties to ensure consistency
      await fetchLandlordProperties()
      
      toast({
        title: "Property deleted",
        description: "Property has been successfully removed from your listings"
      })
    } catch (error) {
      console.error('Error deleting property:', error)
      toast({
        title: "Error deleting property",
        description: "Failed to delete property. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleApplicationAction = async (applicationId: string, status: 'approved' | 'rejected' | 'pending') => {
    if (!user) return

    try {
      await updateApplicationStatus(applicationId, status)
      
      // Update the application in local state
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { ...app, status, updated_at: new Date().toISOString() }
          : app
      ))

      toast({
        title: `Application ${status}`,
        description: `The application has been ${status}.`
      })
    } catch (error) {
      console.error('Error updating application status:', error)
      toast({
        title: "Error updating application",
        description: "Failed to update application status. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleReply = async (thread: MessageThread) => {
    if (!user || !replyMessage.trim()) return

    try {
      const otherParticipant = thread.participants.find(p => p !== user.id)
      if (!otherParticipant) return

      await sendMessage({
        recipient_id: otherParticipant,
        property_id: thread.property_id,
        application_id: thread.application_id,
        subject: replySubject || `Re: ${thread.last_message.subject || 'Message'}`,
        message_text: replyMessage,
        message_type: 'general'
      })

      // Mark messages in this thread as read
      await markAllMessagesAsRead(user.id, otherParticipant, thread.property_id, thread.application_id)

      // Refresh messages
      await fetchMessages()

      // Reset form
      setReplyMessage('')
      setReplySubject('')
      setSelectedThread(null)

      toast({
        title: "Message sent",
        description: "Your reply has been sent successfully."
      })
    } catch (error) {
      console.error('Error sending reply:', error)
      toast({
        title: "Error sending message",
        description: "Failed to send your reply. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleMarkAsRead = async (thread: MessageThread) => {
    if (!user) return

    try {
      const otherParticipant = thread.participants.find(p => p !== user.id)
      if (!otherParticipant) return

      await markAllMessagesAsRead(user.id, otherParticipant, thread.property_id, thread.application_id)
      
      // Update local state
      setMessageThreads(prev => prev.map(t => 
        t.id === thread.id 
          ? { ...t, unread_count: 0 }
          : t
      ))

      toast({
        title: "Messages marked as read",
        description: "All messages in this conversation have been marked as read."
      })
    } catch (error) {
      console.error('Error marking messages as read:', error)
      toast({
        title: "Error updating messages",
        description: "Failed to mark messages as read. Please try again.",
        variant: "destructive"
      })
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`
    
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar currentPage="dashboard" />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Landlord Dashboard</h1>
          <p className="text-muted-foreground">Manage your rental properties</p>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="messages">
              Messages {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1 bg-red-100 text-red-800">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xl md:text-2xl font-bold">My Properties</h2>
              <Link href="/list-property">
                <Button className="w-full md:w-auto bg-black hover:bg-gray-800 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Property
                </Button>
              </Link>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading your properties...</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && landlordProperties.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <Plus className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No properties listed yet</h3>
                <p className="text-muted-foreground mb-4">Start by adding your first property to the platform</p>
                <Link href="/list-property">
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Property
                  </Button>
                </Link>
              </div>
            )}

            {/* Properties Grid - Mobile Optimized */}
            {!loading && landlordProperties.length > 0 && (
              <div className="space-y-4">
                {landlordProperties.map((property) => (
                  <Card key={property.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Property Info */}
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                            <div className="space-y-1">
                              <h3 className="font-semibold text-lg md:text-xl text-gray-900 line-clamp-1">
                                {property.title}
                              </h3>
                              <p className="text-sm md:text-base text-gray-600 line-clamp-2">
                                {property.address}, {property.city}, {property.state}
                              </p>
                            </div>
                            <div className="mt-2 md:mt-0 md:ml-4">
                              <p className="text-xl md:text-2xl font-bold text-gray-900">
                                ${property.price}
                                <span className="text-sm md:text-base font-normal text-gray-500">/month</span>
                              </p>
                            </div>
                          </div>

                          {/* Mobile Status */}
                          <div className="flex items-center justify-between md:hidden">
                            <span className="text-sm font-medium text-gray-700">Status:</span>
                            <Select
                              value={propertyStatuses[property.id]}
                              onValueChange={(value: string) => handleStatusChange(property.id, value)}
                            >
                              <SelectTrigger className="w-24 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Desktop Status & Actions */}
                        <div className="hidden md:flex md:items-center md:space-x-4">
                          <Select
                            value={propertyStatuses[property.id]}
                            onValueChange={(value: string) => handleStatusChange(property.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>

                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-gray-600 hover:text-gray-900"
                              onClick={() => handleEdit(property.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Property</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{property.title}"? This action cannot be undone and will remove all associated images and data.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(property.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete Property
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>

                        {/* Mobile Actions */}
                        <div className="flex items-center justify-end space-x-2 md:hidden">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(property.id)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-[90vw] md:max-w-md">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Property</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{property.title}"? This action cannot be undone and will remove all associated images and data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-col md:flex-row gap-2">
                                <AlertDialogCancel className="w-full md:w-auto">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(property.id)}
                                  className="w-full md:w-auto bg-red-600 hover:bg-red-700"
                                >
                                  Delete Property
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="applications" className="space-y-6">
            <h2 className="text-2xl font-bold">Rental Applications</h2>

            {/* Loading State */}
            {applicationsLoading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading applications...</p>
              </div>
            )}

            {/* Empty State */}
            {!applicationsLoading && applications.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No applications yet</h3>
                <p className="text-muted-foreground">Applications will appear here when tenants apply to your properties</p>
              </div>
            )}

            {/* Applications List */}
            {!applicationsLoading && applications.length > 0 && (
              <div className="space-y-4">
                {applications.map((application) => (
                  <Card key={application.id}>
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarFallback>
                              {application.tenant_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-semibold">{application.tenant_name}</div>
                            <div className="text-sm text-muted-foreground">
                              Applied for: {application.properties?.address ? 
                                `${application.properties.address}${(application.properties as any).city ? `, ${(application.properties as any).city}` : ''}${(application.properties as any).state ? ` ${(application.properties as any).state}` : ''}` : 
                                application.properties?.title || 'Property'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Applied on: {new Date(application.created_at).toLocaleDateString()}
                            </div>
                            {application.move_in_date && (
                              <div className="text-xs text-muted-foreground">
                                Move-in date: {new Date(application.move_in_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4">
                          <Badge className={getStatusColor(application.status)}>
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </Badge>
                          <div className="flex flex-wrap gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedApplication(application)
                                setIsDetailsModalOpen(true)
                              }}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                            {application.status === "pending" ? (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="default"
                                  onClick={() => handleApplicationAction(application.id, 'approved')}
                                >
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleApplicationAction(application.id, 'rejected')}
                                >
                                  Reject
                                </Button>
                              </>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="secondary"
                                onClick={() => handleApplicationAction(application.id, 'pending')}
                              >
                                Change Status
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Additional application details */}
                      {application.message && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm text-muted-foreground mb-1">Message from applicant:</p>
                          <p className="text-sm">{application.message}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <h2 className="text-2xl font-bold">Messages</h2>

            {/* Loading State */}
            {messagesLoading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading messages...</p>
              </div>
            )}

            {/* Empty State */}
            {!messagesLoading && messageThreads.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                <p className="text-muted-foreground">Messages from tenants will appear here</p>
              </div>
            )}

            {/* Message Threads */}
            {!messagesLoading && messageThreads.length > 0 && (
              <div className="space-y-4">
                {messageThreads.map((thread) => {
                  const otherParticipant = thread.participants.find(p => p !== user?.id)
                  const lastMessage = thread.last_message
                  const senderName = getSenderName(lastMessage, user?.id || '')
                  
                  return (
                    <Card key={thread.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 md:p-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex items-start space-x-4 flex-1">
                            <Avatar>
                              <AvatarFallback>
                                {lastMessage.sender ? `${lastMessage.sender.first_name || ''} ${lastMessage.sender.last_name || ''}`.trim() || 
                                  lastMessage.sender.email || 'U' : 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <div className="font-semibold truncate">
                                  {senderName === 'You' 
                                    ? (lastMessage.recipient ? `${lastMessage.recipient.first_name || ''} ${lastMessage.recipient.last_name || ''}`.trim() || 
                                       lastMessage.recipient.email || 'Unknown User' : 'Unknown User')
                                    : senderName
                                  }
                                </div>
                                {thread.unread_count > 0 && (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                                    {thread.unread_count} new
                                  </Badge>
                                )}
                              </div>
                              
                              {/* Property/Application Context */}
                              {(thread.property_id || thread.application_id) && (
                                <div className="text-sm text-muted-foreground mb-2">
                                  {thread.property_id && `Property inquiry`}
                                  {thread.application_id && `Application discussion`}
                                </div>
                              )}

                              {/* Subject */}
                              {lastMessage.subject && (
                                <div className="text-sm font-medium text-gray-700 mb-1 truncate">
                                  {lastMessage.subject}
                                </div>
                              )}

                              {/* Last Message Preview */}
                              <div className="text-sm text-gray-600 line-clamp-2 mb-2">
                                <span className="font-medium">{senderName}:</span> {lastMessage.message_text}
                              </div>

                              <div className="text-xs text-muted-foreground">
                                {formatTimeAgo(lastMessage.created_at)}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col md:flex-row gap-2 md:items-center">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleOpenRealtimeChat(thread)}
                            >
                              <MessageSquare className="w-4 h-4 mr-1" />
                              Open Chat
                            </Button>
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => setSelectedThread(thread)}
                                >
                                  Quick Reply
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Reply to Message</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  {/* Conversation History */}
                                  <div className="max-h-60 overflow-y-auto border rounded-lg p-4 space-y-3">
                                    {thread.messages.slice(-5).map((msg) => (
                                      <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-3 rounded-lg ${
                                          msg.sender_id === user?.id 
                                            ? 'bg-primary text-primary-foreground' 
                                            : 'bg-gray-100'
                                        }`}>
                                          <div className="text-xs opacity-75 mb-1">
                                            {getSenderName(msg, user?.id || '')} • {formatTimeAgo(msg.created_at)}
                                          </div>
                                          {msg.subject && (
                                          <div className="font-medium text-sm mb-1">{msg.subject}</div>
                                          )}
                                          <div className="text-sm">{msg.message_text}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Reply Form */}
                                  <div className="space-y-3">
                                    <div>
                                      <Label htmlFor="reply-subject">Subject (optional)</Label>
                                      <Input
                                        id="reply-subject"
                                        value={replySubject}
                                        onChange={(e) => setReplySubject(e.target.value)}
                                        placeholder="Enter subject..."
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="reply-message">Message</Label>
                                      <Textarea
                                        id="reply-message"
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        placeholder="Type your reply..."
                                        rows={4}
                                      />
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                      <Button 
                                        variant="outline"
                                        onClick={() => {
                                          setReplyMessage('')
                                          setReplySubject('')
                                          setSelectedThread(null)
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                      <Button 
                                        onClick={() => handleReply(thread)}
                                        disabled={!replyMessage.trim()}
                                      >
                                        Send Reply
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            {thread.unread_count > 0 && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleMarkAsRead(thread)}
                              >
                                Mark as Read
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Real-time Chat Modal */}
      {showRealtimeChat && activeChatThread && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Chat with {getOtherParticipantName(activeChatThread)}
              </h3>
              <Button variant="ghost" size="sm" onClick={handleCloseRealtimeChat}>
                ×
              </Button>
            </div>
            <div className="h-[600px]">
              <RealtimeChat
                propertyId={activeChatThread.property_id || ''}
                participantId={activeChatThread.participants.find(p => p !== user?.id) || ''}
                participantName={getOtherParticipantName(activeChatThread)}
                onClose={handleCloseRealtimeChat}
              />
            </div>
          </div>
        </div>
      )}

      <ApplicationDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        application={selectedApplication}
      />
    </div>
  )
}
