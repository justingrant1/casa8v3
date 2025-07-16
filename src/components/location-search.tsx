"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Search, MapPin, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { geocodeAddress } from "@/lib/location"

interface LocationSearchProps {
  placeholder?: string
  className?: string
  onLocationSelect?: (location: {
    city: string
    state: string
    coordinates: { lat: number; lng: number }
  }) => void
}

export function LocationSearch({ 
  placeholder = "Enter location...",
  className = "",
  onLocationSelect
}: LocationSearchProps) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Common US cities for suggestions
  const commonCities = [
    "New York, NY",
    "Los Angeles, CA",
    "Chicago, IL",
    "Houston, TX",
    "Phoenix, AZ",
    "Philadelphia, PA",
    "San Antonio, TX",
    "San Diego, CA",
    "Dallas, TX",
    "San Jose, CA",
    "Austin, TX",
    "Jacksonville, FL",
    "Fort Worth, TX",
    "Columbus, OH",
    "Charlotte, NC",
    "San Francisco, CA",
    "Indianapolis, IN",
    "Seattle, WA",
    "Denver, CO",
    "Boston, MA",
    "Miami, FL",
    "Atlanta, GA",
    "Tampa, FL",
    "Nashville, TN",
    "Detroit, MI",
    "Portland, OR",
    "Sacramento, CA",
    "Las Vegas, NV",
    "Orlando, FL",
    "Minneapolis, MN"
  ]

  useEffect(() => {
    if (query.length > 0) {
      const filtered = commonCities.filter(city =>
        city.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
      setSuggestions(filtered)
      setIsOpen(true)
    } else {
      setSuggestions([])
      setIsOpen(false)
    }
  }, [query])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = async (location: string) => {
    setQuery(location)
    setIsOpen(false)
    setLoading(true)

    try {
      const [city, state] = location.split(", ")
      const coordinates = await geocodeAddress(location)
      
      if (coordinates && onLocationSelect) {
        onLocationSelect({
          city: city.trim(),
          state: state.trim(),
          coordinates
        })
      }
    } catch (error) {
      console.error("Error geocoding location:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && suggestions.length > 0) {
      e.preventDefault()
      handleSelect(suggestions[0])
    }
  }

  const clearInput = () => {
    setQuery("")
    setSuggestions([])
    setIsOpen(false)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          className="pl-10 pr-10 h-14 text-lg border-gray-200 focus:border-primary focus:ring-primary/20"
          disabled={loading}
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearInput}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSelect(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center space-x-3 transition-colors"
            >
              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm">{suggestion}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
