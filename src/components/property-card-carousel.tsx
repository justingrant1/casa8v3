"use client"

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PropertyCardCarouselProps {
  images: string[]
  propertyTitle: string
  className?: string
}

export function PropertyCardCarousel({ images, propertyTitle, className = "" }: PropertyCardCarouselProps) {
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
      <div className={`w-full h-48 bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-500">No image</span>
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
    <div className={`relative w-full h-48 overflow-hidden group ${className}`}>
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
            {imageErrors.has(index) ? (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-sm">Image unavailable</span>
              </div>
            ) : (
              <Image
                src={image}
                alt={`${propertyTitle} image ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                draggable={false}
                onError={() => handleImageError(index)}
                priority={index === 0}
              />
            )}
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              onClick={prevImage}
              size="icon"
              variant="secondary"
              className="rounded-full h-8 w-8 bg-white/80 hover:bg-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              onClick={nextImage}
              size="icon"
              variant="secondary"
              className="rounded-full h-8 w-8 bg-white/80 hover:bg-white"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToImage(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex ? 'bg-white scale-125' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
          
          <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-0.5 rounded-full text-xs">
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  )
}
