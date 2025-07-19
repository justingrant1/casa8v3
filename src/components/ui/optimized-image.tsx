"use client"

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  priority?: boolean
  sizes?: string
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  loading?: 'lazy' | 'eager'
  onError?: () => void
  fallbackSrc?: string
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  priority = false,
  sizes,
  quality = 90,
  placeholder = 'empty',
  blurDataURL,
  objectFit = 'cover',
  loading = 'lazy',
  onError,
  fallbackSrc = '/placeholder.svg',
  ...props
}: OptimizedImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleError = useCallback(() => {
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc)
      setHasError(true)
    }
    onError?.()
  }, [currentSrc, fallbackSrc, onError])

  const handleLoad = useCallback(() => {
    setIsLoading(false)
  }, [])

  // Generate blur placeholder for better loading experience
  const generateBlurDataURL = (width: number = 400, height: number = 300): string => {
    return `data:image/svg+xml;base64,${Buffer.from(
      `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f1f5f9;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#e2e8f0;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#cbd5e1;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)" />
      </svg>`
    ).toString('base64')}`
  }

  // Smart sizes calculation for responsive images
  const getOptimalSizes = (): string => {
    if (sizes) return sizes
    
    // Property card images
    if (className?.includes('property-card')) {
      return '(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw'
    }
    
    // Property detail images
    if (className?.includes('property-detail')) {
      return '(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw'
    }
    
    // Thumbnail images
    if (className?.includes('thumbnail')) {
      return '120px'
    }
    
    // Default responsive sizes
    return '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Loading skeleton */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 animate-pulse" />
      )}
      
      {/* Optimized Image */}
      <Image
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        priority={priority}
        quality={quality}
        sizes={getOptimalSizes()}
        className={cn(
          'transition-opacity duration-300',
          objectFit === 'cover' && 'object-cover',
          objectFit === 'contain' && 'object-contain',
          objectFit === 'fill' && 'object-fill',
          objectFit === 'none' && 'object-none',
          objectFit === 'scale-down' && 'object-scale-down',
          isLoading && 'opacity-0',
          !isLoading && 'opacity-100'
        )}
        placeholder={placeholder}
        blurDataURL={blurDataURL || generateBlurDataURL(width, height)}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
      
      {/* Error state */}
      {hasError && currentSrc === fallbackSrc && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">Image unavailable</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Preset components for common use cases
export function PropertyCardImage(props: Omit<OptimizedImageProps, 'className'> & { className?: string }) {
  return (
    <OptimizedImage
      {...props}
      className={cn('property-card', props.className)}
      quality={85}
      placeholder="blur"
      priority={false}
    />
  )
}

export function PropertyDetailImage(props: Omit<OptimizedImageProps, 'className'> & { className?: string }) {
  return (
    <OptimizedImage
      {...props}
      className={cn('property-detail', props.className)}
      quality={90}
      placeholder="blur"
      priority={true}
    />
  )
}

export function ThumbnailImage(props: Omit<OptimizedImageProps, 'className'> & { className?: string }) {
  return (
    <OptimizedImage
      {...props}
      className={cn('thumbnail', props.className)}
      quality={80}
      placeholder="blur"
      priority={false}
    />
  )
}
