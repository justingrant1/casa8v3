"use client"

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PropertyDetailImage, ThumbnailImage } from '@/components/ui/optimized-image'

interface ImageCarouselProps {
  images: string[]
  propertyTitle: string
  propertyType?: string
}

export function ImageCarousel({ images, propertyTitle, propertyType }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft
      const itemWidth = container.offsetWidth
      const newIndex = Math.round(scrollLeft / itemWidth)
      setCurrentIndex(newIndex)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center mb-8">
        <span className="text-gray-500">No images available</span>
      </div>
    )
  }

  const handleImageError = (index: number) => {
    setImageErrors(prev => new Set(prev).add(index))
  }

  const scrollToImage = (index: number) => {
    const container = scrollContainerRef.current
    if (container) {
      container.scrollTo({
        left: index * container.offsetWidth,
        behavior: 'smooth'
      })
    }
  }

  const nextImage = () => {
    const newIndex = (currentIndex + 1) % images.length
    scrollToImage(newIndex)
  }

  const prevImage = () => {
    const newIndex = (currentIndex - 1 + images.length) % images.length
    scrollToImage(newIndex)
  }

  return (
    <div className="mb-8">
      <div className="relative w-full h-96 rounded-lg overflow-hidden group">
        <div
          ref={scrollContainerRef}
          className="flex h-full overflow-x-auto snap-x snap-mandatory scroll-smooth"
          style={{ scrollbarWidth: 'none' }}
        >
          {images.map((image, index) => (
            <div
              key={index}
              className="w-full h-full flex-shrink-0 snap-center relative"
            >
              <PropertyDetailImage
                src={image}
                alt={`${propertyTitle} image ${index + 1}`}
                fill
                className="w-full h-full"
                priority={index === 0}
                onError={() => handleImageError(index)}
              />
            </div>
          ))}
        </div>

        {/* Property Type Badge */}
        {propertyType && (
          <Badge className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-gray-800 border-0 shadow-md">
            {propertyType}
          </Badge>
        )}

        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 bg-black/10 hover:bg-black/20 border-0 opacity-0 group-hover:opacity-80 transition-all duration-300 rounded-full"
              onClick={prevImage}
            >
              <ChevronLeft className="h-3 w-3 text-white" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 bg-black/10 hover:bg-black/20 border-0 opacity-0 group-hover:opacity-80 transition-all duration-300 rounded-full"
              onClick={nextImage}
            >
              <ChevronRight className="h-3 w-3 text-white" />
            </Button>
            <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => scrollToImage(index)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex 
                  ? 'border-primary ring-2 ring-primary/20' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <ThumbnailImage
                src={image}
                alt={`${propertyTitle} thumbnail ${index + 1}`}
                fill
                className="w-full h-full"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
