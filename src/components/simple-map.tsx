"use client"

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Bed, Bath, Square, Heart } from 'lucide-react'
import Link from 'next/link'

interface Property {
  id: string
  title: string
  price: number
  location: string
  bedrooms: number
  bathrooms: number
  sqft: number
  type: string
  image: string
  coordinates?: {
    lat: number
    lng: number
  }
}

interface SimpleMapProps {
  properties: Property[]
  className?: string
}

export function SimpleMap({ properties, className = "" }: SimpleMapProps) {
  return (
    <div className={`w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
      <div className="text-center">
        <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">Map View</h3>
        <p className="text-gray-500 mb-4">Interactive map with {properties.length} properties</p>
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          Google Maps Integration Coming Soon
        </Badge>
      </div>
    </div>
  )
}
