"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Home, 
  Search, 
  Heart, 
  MessageSquare, 
  User, 
  Settings, 
  LogOut, 
  Building, 
  PlusCircle,
  Menu,
  X
} from "lucide-react"
import { useAuth } from "@/lib/auth"

interface NavbarProps {
  currentPage?: string
}

export function Navbar({ currentPage = "home" }: NavbarProps) {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const handlePostListing = () => {
    if (user) {
      router.push("/list-property")
    } else {
      router.push("/login")
    }
  }

  const isLandlord = profile?.role === 'landlord'
  const isTenant = profile?.role === 'tenant'

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <span className="text-xl font-bold text-gray-900">Casa8</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === "home" 
                  ? "text-primary bg-primary/10" 
                  : "text-gray-700 hover:text-primary hover:bg-gray-100"
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>

            <Link 
              href="/search" 
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === "search" 
                  ? "text-primary bg-primary/10" 
                  : "text-gray-700 hover:text-primary hover:bg-gray-100"
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </Link>

            {user && isTenant && (
              <Link 
                href="/favorites" 
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === "favorites" 
                    ? "text-primary bg-primary/10" 
                    : "text-gray-700 hover:text-primary hover:bg-gray-100"
                }`}
              >
                <Heart className="w-4 h-4" />
                <span>Favorites</span>
              </Link>
            )}

            {user && (
              <Link 
                href="/messages" 
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === "messages" 
                    ? "text-primary bg-primary/10" 
                    : "text-gray-700 hover:text-primary hover:bg-gray-100"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Messages</span>
              </Link>
            )}

            {user && isLandlord && (
              <Link 
                href="/dashboard" 
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === "dashboard" 
                    ? "text-primary bg-primary/10" 
                    : "text-gray-700 hover:text-primary hover:bg-gray-100"
                }`}
              >
                <Building className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                {isLandlord && (
                  <Button 
                    onClick={handlePostListing}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    List Property
                  </Button>
                )}

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || undefined} alt={`${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || ""} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {profile?.first_name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {`${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'User'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                        <Badge variant="secondary" className="w-fit mt-1">
                          {profile?.role || 'User'}
                        </Badge>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login">
                  <Button variant="ghost" className="text-gray-700 hover:text-primary">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-primary hover:bg-primary/90 text-white">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-2">
              <Link 
                href="/" 
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === "home" 
                    ? "text-primary bg-primary/10" 
                    : "text-gray-700 hover:text-primary hover:bg-gray-100"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>

              <Link 
                href="/search" 
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === "search" 
                    ? "text-primary bg-primary/10" 
                    : "text-gray-700 hover:text-primary hover:bg-gray-100"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </Link>

              {user && isTenant && (
                <Link 
                  href="/favorites" 
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === "favorites" 
                      ? "text-primary bg-primary/10" 
                      : "text-gray-700 hover:text-primary hover:bg-gray-100"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Heart className="w-4 h-4" />
                  <span>Favorites</span>
                </Link>
              )}

              {user && (
                <Link 
                  href="/messages" 
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === "messages" 
                      ? "text-primary bg-primary/10" 
                      : "text-gray-700 hover:text-primary hover:bg-gray-100"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Messages</span>
                </Link>
              )}

              {user && isLandlord && (
                <Link 
                  href="/dashboard" 
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === "dashboard" 
                      ? "text-primary bg-primary/10" 
                      : "text-gray-700 hover:text-primary hover:bg-gray-100"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Building className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
              )}

              {user ? (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  
                  {isLandlord && (
                    <Button 
                      onClick={() => {
                        handlePostListing()
                        setMobileMenuOpen(false)
                      }}
                      className="w-full justify-start bg-primary hover:bg-primary/90 text-white"
                    >
                      <PlusCircle className="w-4 h-4 mr-2" />
                      List Property
                    </Button>
                  )}

                  <Link 
                    href="/profile"
                    className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-100 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>

                  <button
                    onClick={() => {
                      handleSignOut()
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <Link 
                    href="/login"
                    className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-100 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    <span>Sign In</span>
                  </Link>
                  <Link 
                    href="/register"
                    className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Get Started</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
