"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Users, Home, Mail, Shield, Trash2, Edit, Search, BarChart3, TrendingUp, AlertTriangle } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { Navbar } from "@/components/navbar"
import { Profile } from "@/lib/database.types"

interface User {
  id: string
  email: string
  full_name: string
  role: 'tenant' | 'landlord' | 'admin'
  created_at: string
  phone?: string
  onboarding_completed?: boolean
}

interface Property {
  id: string
  title: string
  address: string
  city: string
  state: string
  price: number
  bedrooms: number
  bathrooms: number
  property_type: string
  created_at: string
  available: boolean
  landlord_id: string
  landlord: {
    full_name: string
    email: string
  }
}

interface AdminStats {
  totalUsers: number
  totalLandlords: number
  totalTenants: number
  totalProperties: number
  activeProperties: number
  totalApplications: number
  pendingApplications: number
}

export default function AdminDashboard() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState("stats")
  const [users, setUsers] = useState<User[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalLandlords: 0,
    totalTenants: 0,
    totalProperties: 0,
    activeProperties: 0,
    totalApplications: 0,
    pendingApplications: 0
  })
  
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [userFilter, setUserFilter] = useState("all")
  const [propertyFilter, setPropertyFilter] = useState("all")

  // Check if user is admin
  useEffect(() => {
    // Enhanced debugging
    console.log('🔍 ADMIN PAGE DEBUG - Full state check:', {
      authLoading,
      user: user ? { 
        id: user.id, 
        email: user.email,
        fullUser: user 
      } : null,
      profile: profile ? { 
        id: profile.id, 
        email: profile.email, 
        role: profile.role,
        fullProfile: profile 
      } : null,
      profileIsNull: profile === null,
      profileIsUndefined: profile === undefined,
      timestamp: new Date().toISOString()
    })

    // Wait for auth to finish loading
    if (authLoading) {
      console.log('🔍 ADMIN PAGE DEBUG - Still loading auth...')
      return
    }

    // Check if user is not logged in
    if (!user) {
      console.log('🔍 ADMIN PAGE DEBUG - No user found, redirecting to login')
      router.push("/login")
      return
    }

    // Check if profile is still loading or null
    if (!profile) {
      console.log('🔍 ADMIN PAGE DEBUG - Profile is null/undefined, waiting for profile to load...')
      // Don't redirect yet, profile might still be loading
      return
    }

    // Check if user has admin role
    const roleString = String(profile.role)
    if (roleString !== 'admin') {
      console.log('🔍 ADMIN PAGE DEBUG - Access denied. Role check:', {
        profileRole: profile.role,
        roleString: roleString,
        expectedRole: 'admin',
        comparison: roleString === 'admin'
      })
      toast({
        title: "Access Denied",
        description: `This page is only accessible to administrators. Your role: ${profile?.role || 'undefined'}`,
        variant: "destructive"
      })
      router.push("/")
      return
    }

    // User has admin access
    console.log('🔍 ADMIN PAGE DEBUG - Admin access granted! Loading admin data...')
    fetchAdminData()
  }, [user, profile, authLoading])

  const fetchAdminData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchUsers(),
        fetchProperties(),
        fetchStats()
      ])
    } catch (error) {
      console.error('Error fetching admin data:', error)
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return
    }

    setUsers(data || [])
  }

  const fetchProperties = async () => {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        landlord:profiles!landlord_id (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching properties:', error)
      return
    }

    setProperties(data || [])
  }

  const fetchStats = async () => {
    try {
      // Get user counts
      const { data: usersData } = await supabase
        .from('profiles')
        .select('role')

      const totalUsers = usersData?.length || 0
      const totalLandlords = usersData?.filter(u => u.role === 'landlord').length || 0
      const totalTenants = usersData?.filter(u => u.role === 'tenant').length || 0

      // Get property counts
      const { data: propertiesData } = await supabase
        .from('properties')
        .select('available')

      const totalProperties = propertiesData?.length || 0
      const activeProperties = propertiesData?.filter(p => p.available).length || 0

      // Get application counts
      const { data: applicationsData } = await supabase
        .from('applications')
        .select('status')

      const totalApplications = applicationsData?.length || 0
      const pendingApplications = applicationsData?.filter(a => a.status === 'pending').length || 0

      setStats({
        totalUsers,
        totalLandlords,
        totalTenants,
        totalProperties,
        activeProperties,
        totalApplications,
        pendingApplications
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) throw error

      setUsers(users.filter(u => u.id !== userId))
      toast({
        title: "User deleted",
        description: "User has been successfully deleted"
      })
    } catch (error) {
      console.error('Error deleting user:', error)
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      })
    }
  }

  const handleDeleteProperty = async (propertyId: string) => {
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId)

      if (error) throw error

      setProperties(properties.filter(p => p.id !== propertyId))
      toast({
        title: "Property deleted",
        description: "Property has been successfully deleted"
      })
    } catch (error) {
      console.error('Error deleting property:', error)
      toast({
        title: "Error",
        description: "Failed to delete property",
        variant: "destructive"
      })
    }
  }

  const handleUpdateUserRole = async (userId: string, newRole: 'tenant' | 'landlord' | 'admin') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
      toast({
        title: "User role updated",
        description: `User role has been changed to ${newRole}`
      })
    } catch (error) {
      console.error('Error updating user role:', error)
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      })
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = userFilter === "all" || user.role === userFilter
    return matchesSearch && matchesFilter
  })

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.city?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = propertyFilter === "all" || 
                         (propertyFilter === "active" && property.available) ||
                         (propertyFilter === "inactive" && !property.available)
    return matchesSearch && matchesFilter
  })

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'landlord':
        return 'bg-blue-100 text-blue-800'
      case 'tenant':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar currentPage="admin" />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, properties, and platform settings</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stats">Analytics</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalLandlords} landlords, {stats.totalTenants} tenants
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Properties</CardTitle>
                  <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalProperties}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeProperties} active listings
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Applications</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalApplications}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.pendingApplications} pending review
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Health</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">Good</div>
                  <p className="text-xs text-muted-foreground">
                    All systems operational
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">New user registered</p>
                        <p className="text-xs text-muted-foreground">2 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Property listed</p>
                        <p className="text-xs text-muted-foreground">15 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Application submitted</p>
                        <p className="text-xs text-muted-foreground">1 hour ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button className="w-full justify-start" variant="outline">
                      <Users className="mr-2 h-4 w-4" />
                      Export User Data
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Home className="mr-2 h-4 w-4" />
                      Export Property Data
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Generate Reports
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Shield className="mr-2 h-4 w-4" />
                      Security Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="userSearch" className="sr-only">Search users</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="userSearch"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="tenant">Tenants</SelectItem>
                  <SelectItem value="landlord">Landlords</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Users ({filteredUsers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>
                            {user.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.full_name || 'No name'}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          <div className="text-xs text-muted-foreground">
                            Joined {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Select
                          value={user.role}
                          onValueChange={(value: 'tenant' | 'landlord' | 'admin') => 
                            handleUpdateUserRole(user.id, value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tenant">Tenant</SelectItem>
                            <SelectItem value="landlord">Landlord</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {user.full_name || user.email}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="properties" className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="propertySearch" className="sr-only">Search properties</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="propertySearch"
                    placeholder="Search properties..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Properties ({filteredProperties.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredProperties.map((property) => (
                    <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{property.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {property.address}, {property.city}, {property.state}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Landlord: {property.landlord?.full_name || 'Unknown'} ({property.landlord?.email || 'No email'})
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Listed {new Date(property.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-bold text-lg">${property.price}</div>
                          <div className="text-sm text-muted-foreground">
                            {property.bedrooms} bed, {property.bathrooms} bath
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={property.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {property.available ? 'Active' : 'Inactive'}
                          </Badge>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Property</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{property.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteProperty(property.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
