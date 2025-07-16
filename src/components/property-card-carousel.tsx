"use client"

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PropertyCardCarouselProps {
  images: string[]
  propertyTitle: string
  className?: string
}

export function PropertyCardCarousel({ images, propertyTitle, className = "" }: PropertyCardCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [translateX, setTranslateX] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  if (!images || images.length === 0) {
    return (
      <div className={`w-full h-48 bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-500">No image</span>
      </div>
    )
  }

  if (images.length === 1) {
    return (
      <div className={`relative w-full h-48 overflow-hidden ${className}`}>
        <Image
          src={images[0]}
          alt={propertyTitle}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
    )
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const goToImage = (index: number) => {
    setCurrentIndex(index)
  }

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setStartX(e.touches[0].clientX)
    setTranslateX(0)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    
    const currentX = e.touches[0].clientX
    const diff = currentX - startX
    setTranslateX(diff)
    
    // Prevent scrolling when swiping horizontally
    if (Math.abs(diff) > 10) {
      e.preventDefault()
    }
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    
    setIsDragging(false)
    
    // If swipe distance is significant, change image
    if (Math.abs(translateX) > 50) {
      if (translateX > 0) {
        prevImage()
      } else {
        nextImage()
      }
    }
    
    setTranslateX(0)
  }

  // Mouse event handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartX(e.clientX)
    setTranslateX(0)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    
    const currentX = e.clientX
    const diff = currentX - startX
    setTranslateX(diff)
  }

  const handleMouseUp = () => {
    if (!isDragging) return
    
    setIsDragging(false)
    
    // If swipe distance is significant, change image
    if (Math.abs(translateX) > 50) {
      if (translateX > 0) {
        prevImage()
      } else {
        nextImage()
      }
    }
    
    setTranslateX(0)
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false)
      setTranslateX(0)
    }
  }

  return (
    <div className={`relative w-full h-48 overflow-hidden group ${className}`}>
      <div
        ref={containerRef}
        className="flex transition-transform duration-300 ease-out h-full cursor-grab active:cursor-grabbing"
        style={{
          transform: `translateX(${-currentIndex * 100 + (translateX / (containerRef.current?.offsetWidth || 1)) * 100}%)`,
          width: `${images.length * 100}%`
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {images.map((image, index) => (
          <div
            key={index}
            className="w-full h-full flex-shrink-0"
            style={{ width: `${100 / images.length}%` }}
          >
            <Image
              src={image}
              alt={`${propertyTitle} image ${index + 1}`}
              fill
              className="object-contain bg-gray-100"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Navigation Arrows - Only show on hover */}
      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={prevImage}
          className="w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
      
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={nextImage}
          className="w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Dot Indicators */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToImage(index)}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              index === currentIndex 
                ? 'bg-white' 
                : 'bg-white/50 hover:bg-white/70'
            }`}
          />
        ))}
      </div>

      {/* Image Counter */}
      <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
        {currentIndex + 1}/{images.length}
      </div>
    </div>
  )
}
