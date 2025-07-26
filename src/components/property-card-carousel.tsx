"use client"

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PropertyCardImage } from '@/components/ui/optimized-image'

interface PropertyCardCarouselProps {
  images: string[]
  propertyTitle: string
  className?: string
  onImageClick?: () => void
}

export function PropertyCardCarousel({ images, propertyTitle, className = "", onImageClick }: PropertyCardCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())
  const [isScrolling, setIsScrolling] = useState(false)
  const [clickStartTime, setClickStartTime] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft
      const itemWidth = container.offsetWidth
      const newIndex = Math.round(scrollLeft / itemWidth)
      setCurrentIndex(newIndex)
      
      // Set scrolling state
      setIsScrolling(true)
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      
      // Reset scrolling state after scroll ends
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false)
      }, 150)
    }

    container.addEventListener('scroll', handleScroll)
    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
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

  const handleContainerClick = (e: React.MouseEvent) => {
    // Only trigger click if we're not scrolling and it's been a short time since click started
    if (onImageClick && !isScrolling) {
      const clickDuration = Date.now() - clickStartTime
      if (clickDuration < 200) { // Quick click, not a drag
        onImageClick()
      }
    }
  }

  const handleMouseDown = () => {
    setClickStartTime(Date.now())
  }

  const handleTouchStart = () => {
    setClickStartTime(Date.now())
  }

  return (
    <div className={`relative w-full h-48 overflow-hidden group ${className}`}>
      <div
        ref={scrollContainerRef}
        className="flex h-full overflow-x-auto snap-x snap-mandatory scroll-smooth cursor-pointer"
        style={{ scrollbarWidth: 'none' }}
        onClick={handleContainerClick}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {images.map((image, index) => (
          <div
            key={index}
            className="w-full h-full flex-shrink-0 snap-center relative"
          >
            <PropertyCardImage
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


      {images.length > 1 && (
        <>
          <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
            <Button
              onClick={prevImage}
              size="icon"
              variant="secondary"
              className="rounded-full h-8 w-8 bg-white/80 hover:bg-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
            <Button
              onClick={nextImage}
              size="icon"
              variant="secondary"
              className="rounded-full h-8 w-8 bg-white/80 hover:bg-white"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
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
          
          <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-0.5 rounded-full text-xs z-10">
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  )
}
