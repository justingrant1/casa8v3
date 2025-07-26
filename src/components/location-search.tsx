"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Search, MapPin, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { loadGoogleMaps, initializeAutocomplete, parsePlaceResult, geocodeAddress } from "@/lib/google-maps"

interface LocationSearchProps {
  placeholder?: string
  className?: string
  value?: string
  onLocationSelect?: (location: {
    city: string
    state: string
    coordinates: { lat: number; lng: number }
  }) => void
}

interface PlacePrediction {
  description: string
  place_id: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

export function LocationSearch({ 
  placeholder = "Enter location...",
  className = "",
  value = "",
  onLocationSelect
}: LocationSearchProps) {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null)

  // Update query when value prop changes
  useEffect(() => {
    setQuery(value)
  }, [value])

  // Initialize Google Maps services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        await loadGoogleMaps()
        
        if (typeof google !== 'undefined' && google.maps && google.maps.places) {
          autocompleteServiceRef.current = new google.maps.places.AutocompleteService()
          
          // Create a dummy div for places service
          const dummyDiv = document.createElement('div')
          placesServiceRef.current = new google.maps.places.PlacesService(dummyDiv)
        }
      } catch (error) {
        console.error('Error initializing Google Maps services:', error)
      }
    }

    initializeServices()
  }, [])

  // Debounced search for places
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length > 2 && autocompleteServiceRef.current) {
        searchPlaces(query)
      } else {
        setSuggestions([])
        setIsOpen(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  const searchPlaces = async (searchQuery: string) => {
    if (!autocompleteServiceRef.current) return

    try {
      setLoading(true)
      
      const request = {
        input: searchQuery,
        types: ['(cities)'],
        componentRestrictions: { country: 'us' }
      }

      autocompleteServiceRef.current.getPlacePredictions(request, (predictions, status) => {
        setLoading(false)
        
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions)
          setIsOpen(true)
        } else {
          setSuggestions([])
          setIsOpen(false)
        }
      })
    } catch (error) {
      console.error('Error searching places:', error)
      setLoading(false)
      setSuggestions([])
      setIsOpen(false)
    }
  }

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

  const handleSelect = async (prediction: PlacePrediction) => {
    const locationText = prediction.description
    setQuery(locationText)
    setSuggestions([]) // Clear suggestions immediately
    setIsOpen(false)
    setLoading(true)

    try {
      // Use Places service to get detailed place information
      if (placesServiceRef.current) {
        const request = {
          placeId: prediction.place_id,
          fields: ['geometry', 'address_components', 'formatted_address']
        }

        placesServiceRef.current.getDetails(request, async (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            const city = place.address_components?.find(comp => 
              comp.types.includes('locality') || comp.types.includes('administrative_area_level_1')
            )?.long_name || prediction.structured_formatting.main_text

            const state = place.address_components?.find(comp => 
              comp.types.includes('administrative_area_level_1')
            )?.short_name || prediction.structured_formatting.secondary_text

            const coordinates = {
              lat: place.geometry?.location?.lat() || 0,
              lng: place.geometry?.location?.lng() || 0
            }

            if (onLocationSelect) {
              onLocationSelect({
                city: city,
                state: state,
                coordinates
              })
            }
          } else {
            // Fallback to geocoding
            try {
              const result = await geocodeAddress(locationText)
              if (result && onLocationSelect) {
                const [city, state] = locationText.split(", ")
                onLocationSelect({
                  city: city?.trim() || prediction.structured_formatting.main_text,
                  state: state?.trim() || prediction.structured_formatting.secondary_text,
                  coordinates: { lat: result.lat, lng: result.lng }
                })
              }
            } catch (error) {
              console.error("Error in fallback geocoding:", error)
            }
          }
          setLoading(false)
        })
      } else {
        // Fallback to geocoding
        const result = await geocodeAddress(locationText)
        if (result && onLocationSelect) {
          const [city, state] = locationText.split(", ")
          onLocationSelect({
            city: city?.trim() || prediction.structured_formatting.main_text,
            state: state?.trim() || prediction.structured_formatting.secondary_text,
            coordinates: { lat: result.lat, lng: result.lng }
          })
        }
        setLoading(false)
      }
    } catch (error) {
      console.error("Error geocoding location:", error)
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
          className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleSelect(suggestion)
              }}
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onTouchEnd={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleSelect(suggestion)
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center space-x-3 transition-colors touch-manipulation"
            >
              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm">{suggestion.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
