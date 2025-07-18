'use client'

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

// Generic loading spinner
export function LoadingSpinner({ size = 'md', className = '' }: { 
  size?: 'sm' | 'md' | 'lg'
  className?: string 
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-2 border-primary border-t-transparent ${sizeClasses[size]}`}></div>
    </div>
  )
}

// Page-level loading component
export function PageLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-lg text-gray-600">{message}</p>
      </div>
    </div>
  )
}

// Property card skeleton
export function PropertyCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <Skeleton className="h-64 w-full" />
        <div className="absolute top-4 right-4">
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <div className="absolute top-4 left-4">
          <Skeleton className="h-6 w-16 rounded" />
        </div>
      </div>
      
      <CardHeader className="pb-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="flex justify-between items-start mt-4">
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex justify-between">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 flex-1" />
        </div>
      </CardContent>
    </Card>
  )
}

// Property grid loading
export function PropertyGridLoading({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, index) => (
        <PropertyCardSkeleton key={index} />
      ))}
    </div>
  )
}

// Search results loading
export function SearchResultsLoading() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </div>
      
      <PropertyGridLoading />
    </div>
  )
}

// Form loading state
export function FormLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  )
}

// Navigation loading
export function NavLoading() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-24" />
            <div className="hidden md:flex space-x-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>
    </nav>
  )
}

// Table loading
export function TableLoading({ rows = 5, columns = 4 }: { rows?: number, columns?: number }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4 pb-4 border-b">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-20" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-4 gap-4 py-3 border-b border-gray-100">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  )
}

// Dots loading animation
export function DotsLoading({ className = '' }: { className?: string }) {
  return (
    <div className={`flex space-x-1 ${className}`}>
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
    </div>
  )
}
