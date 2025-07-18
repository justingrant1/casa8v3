"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuthSimple } from "@/hooks/use-auth-simple"
import { useToast } from "@/hooks/use-toast-simple"
import { getLandlordProperties, deleteProperty, updatePropertyStatus } from "@/lib/property-management"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Navbar } from "@/components/navbar"

export default function SimpleDashboard() {
  const { user, profile, loading: authLoading } = useAuthSimple()
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("properties")
  const [landlordProperties, setLandlordProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [propertyStatuses, setPropertyStatuses] = useState<{ [key: string]: string }>({})
  const [initialized, setInitialized] = useState(false)

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
        acc[property.id] = property.available ? 'active' : 'inactive'
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

  const handleStatusChange = async (propertyId: number, newStatus: string) => {
    if (!user) return

    try {
      const available = newStatus === 'active'
      await updatePropertyStatus(propertyId.toString(), user.id, available)
      
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar currentPage="dashboard" />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Landlord Dashboard</h1>
          <p className="text-muted-foreground">Manage your rental properties</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="properties">Properties</TabsTrigger>
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

            {/* Properties Grid */}
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
        </Tabs>
      </div>
    </div>
  )
}
