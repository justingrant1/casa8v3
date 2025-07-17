"use client"

import { useState, useRef, useCallback, useEffect } from 'react'
import { flushSync } from 'react-dom'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Star, 
  StarOff, 
  GripVertical,
  AlertCircle,
  Check
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface ImageFile {
  id: string
  file: File
  preview: string
  isMain: boolean
  uploadProgress?: number
  error?: string
}

interface EnhancedImageUploadProps {
  onImagesChange: (images: File[]) => void
  onMainImageChange?: (imageIndex: number) => void
  existingImages?: File[]
  maxImages?: number
  maxSizeInMB?: number
  acceptedFormats?: string[]
  showProgress?: boolean
  className?: string
}

export function EnhancedImageUpload({
  onImagesChange,
  onMainImageChange,
  existingImages = [],
  maxImages = 20,
  maxSizeInMB = 10,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
  showProgress = true,
  className
}: EnhancedImageUploadProps) {
  const [images, setImages] = useState<ImageFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)
  const timeoutsRef = useRef<NodeJS.Timeout[]>([])
  const intervalsRef = useRef<NodeJS.Timeout[]>([])
  const mountedRef = useRef(true)
  const imagesRef = useRef<ImageFile[]>([])
  const cleanupRef = useRef<() => void>()

  // Initialize with existing images
  useEffect(() => {
    if (existingImages.length > 0) {
      const imageFiles = existingImages.map((file, index) => ({
        id: `existing-${index}`,
        file,
        preview: URL.createObjectURL(file),
        isMain: index === 0,
        uploadProgress: 100
      }))
      setImages(imageFiles)
    }
  }, [existingImages])

  // Cleanup on unmount only - no dependencies to prevent running while mounted
  useEffect(() => {
    return () => {
      mountedRef.current = false
      // Clear all timeouts and intervals
      timeoutsRef.current.forEach(clearTimeout)
      intervalsRef.current.forEach(clearInterval)
      // Cleanup object URLs for current images using ref
      imagesRef.current.forEach(img => {
        if (img.preview.startsWith('blob:')) {
          URL.revokeObjectURL(img.preview)
        }
      })
    }
  }, []) // No dependencies - only runs on mount/unmount

  // File validation
  const validateFile = (file: File): string | null => {
    if (!acceptedFormats.includes(file.type)) {
      return `Invalid format. Accepted formats: ${acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}`
    }
    
    if (file.size > maxSizeInMB * 1024 * 1024) {
      return `File too large. Maximum size: ${maxSizeInMB}MB`
    }
    
    return null
  }

  // Process files
  const processFiles = useCallback((files: FileList) => {
    if (!mountedRef.current) return
    
    const newFiles = Array.from(files)
    
    if (images.length + newFiles.length > maxImages) {
      if (mountedRef.current) {
        toast({
          title: "Too many images",
          description: `You can only upload up to ${maxImages} images`,
          variant: "destructive"
        })
      }
      return
    }

    if (mountedRef.current) {
      setUploading(true)
    }
    
    const processedImages: ImageFile[] = []
    let hasErrors = false

    newFiles.forEach((file, index) => {
      const error = validateFile(file)
      
      if (error) {
        hasErrors = true
        if (mountedRef.current) {
          toast({
            title: "Invalid file",
            description: `${file.name}: ${error}`,
            variant: "destructive"
          })
        }
        return
      }

      const imageFile: ImageFile = {
        id: `${Date.now()}-${index}`,
        file,
        preview: URL.createObjectURL(file),
        isMain: images.length === 0 && processedImages.length === 0,
        uploadProgress: 0
      }
      
      processedImages.push(imageFile)
    })

    if (processedImages.length > 0 && mountedRef.current) {
      // Simulate upload progress for bulk uploads
      if (processedImages.length >= 10 && showProgress) {
        processedImages.forEach((img, index) => {
          const timeout = setTimeout(() => {
            if (!mountedRef.current) return
            
            const progressInterval = setInterval(() => {
              if (!mountedRef.current) {
                clearInterval(progressInterval)
                return
              }
              
              setImages(prev => 
                prev.map(prevImg => 
                  prevImg.id === img.id 
                    ? { ...prevImg, uploadProgress: Math.min((prevImg.uploadProgress || 0) + 10, 100) }
                    : prevImg
                )
              )
            }, 100)
            
            intervalsRef.current.push(progressInterval)
            
            const cleanupTimeout = setTimeout(() => {
              if (!mountedRef.current) return
              
              clearInterval(progressInterval)
              if (mountedRef.current) {
                setImages(prev => 
                  prev.map(prevImg => 
                    prevImg.id === img.id 
                      ? { ...prevImg, uploadProgress: 100 }
                      : prevImg
                  )
                )
              }
            }, 1000)
            
            timeoutsRef.current.push(cleanupTimeout)
          }, index * 100)
          
          timeoutsRef.current.push(timeout)
        })
      } else {
        processedImages.forEach(img => {
          img.uploadProgress = 100
        })
      }

      setImages(prev => [...prev, ...processedImages])
      
      if (mountedRef.current) {
        toast({
          title: "Images uploaded",
          description: `Successfully uploaded ${processedImages.length} image${processedImages.length > 1 ? 's' : ''}`,
        })
      }
    }

    if (mountedRef.current) {
      setUploading(false)
    }
  }, [images, maxImages, maxSizeInMB, acceptedFormats, showProgress])

  // Update parent component and images ref
  useEffect(() => {
    if (!mountedRef.current) return
    
    imagesRef.current = images
    const files = images.map(img => img.file)
    
    // Schedule parent callbacks to happen after render to prevent React error #185
    setTimeout(() => {
      if (mountedRef.current) {
        onImagesChange(files)
        
        const mainImageIndex = images.findIndex(img => img.isMain)
        if (mainImageIndex !== -1 && onMainImageChange) {
          onMainImageChange(mainImageIndex)
        }
      }
    }, 0)
  }, [images, onImagesChange, onMainImageChange])

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setDragActive(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    dragCounter.current = 0
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }

  // File input handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
    }
    
    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Remove image
  const removeImage = (id: string) => {
    if (!mountedRef.current) return
    
    console.log('Removing image with ID:', id)
    console.log('Current images:', images.map(img => img.id))
    
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === id)
      const filtered = prev.filter(img => img.id !== id)
      
      console.log('Image to remove:', imageToRemove?.id)
      console.log('Filtered images:', filtered.map(img => img.id))
      
      // If we removed the main image, make the first remaining image the main one
      if (imageToRemove?.isMain && filtered.length > 0) {
        filtered[0].isMain = true
      }
      
      // Schedule blob URL cleanup for next tick to avoid rendering issues
      if (imageToRemove?.preview.startsWith('blob:')) {
        setTimeout(() => {
          URL.revokeObjectURL(imageToRemove.preview)
        }, 100) // Increased delay to ensure image is removed from DOM first
      }
      
      return filtered
    })
    
    if (mountedRef.current) {
      toast({
        title: "Image removed",
        description: "Image has been removed successfully"
      })
    }
  }

  // Set main image
  const setMainImage = (id: string) => {
    if (!mountedRef.current) return
    
    setImages(prev => 
      prev.map(img => ({ ...img, isMain: img.id === id }))
    )
  }

  // Move image (for reordering)
  const moveImage = (dragIndex: number, hoverIndex: number) => {
    if (!mountedRef.current) return
    
    setImages(prev => {
      const newImages = [...prev]
      const draggedImage = newImages[dragIndex]
      newImages.splice(dragIndex, 1)
      newImages.splice(hoverIndex, 0, draggedImage)
      return newImages
    })
  }

  const canUploadMore = images.length < maxImages

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Property Images</Label>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {images.length}/{maxImages} images
          </span>
          {images.some(img => img.isMain) && (
            <Badge variant="secondary" className="text-xs">
              <Star className="h-3 w-3 mr-1" />
              Main selected
            </Badge>
          )}
        </div>
      </div>

      {/* Upload Area */}
      {canUploadMore && (
        <div className="space-y-2">
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 relative",
              dragActive 
                ? "border-blue-500 bg-blue-50 scale-105" 
                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            )}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <ImageIcon className={cn(
              "mx-auto h-12 w-12 mb-4 transition-colors",
              dragActive ? "text-blue-500" : "text-gray-400"
            )} />
            
            <div className="space-y-2">
              <p className={cn(
                "text-sm transition-colors",
                dragActive ? "text-blue-700" : "text-gray-600"
              )}>
                {dragActive ? "Drop images here" : "Drag and drop images here, or click to select"}
              </p>
              <p className="text-xs text-gray-500">
                JPEG, PNG, WebP up to {maxSizeInMB}MB each • Max {maxImages} images
              </p>
            </div>
            
            <Input
              ref={fileInputRef}
              type="file"
              accept={acceptedFormats.join(',')}
              multiple
              onChange={handleFileSelect}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
          </div>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? "Processing..." : "Choose Images"}
          </Button>
        </div>
      )}

      {/* Upload Progress */}
      {showProgress && images.some(img => (img.uploadProgress || 0) < 100) && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Uploading images...</Label>
              {images
                .filter(img => (img.uploadProgress || 0) < 100)
                .map(img => (
                  <div key={img.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate">{img.file.name}</span>
                      <span>{Math.round(img.uploadProgress || 0)}%</span>
                    </div>
                    <Progress value={img.uploadProgress || 0} className="h-2" />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Selected Images</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={image.id} className="relative group">
                <Card className="overflow-hidden">
                  <div className="aspect-square bg-gray-100 relative">
                    <img
                      src={image.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Loading overlay */}
                    {(image.uploadProgress || 0) < 100 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <span className="text-xs">{Math.round(image.uploadProgress || 0)}%</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Main image badge */}
                    {image.isMain && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="default" className="text-xs bg-yellow-500 text-white">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Main
                        </Badge>
                      </div>
                    )}
                    
                    {/* Success indicator */}
                    {(image.uploadProgress || 0) === 100 && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    )}
                    
                    {/* Error indicator */}
                    {image.error && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                          <AlertCircle className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 truncate mr-2">
                        {image.file.name}
                      </span>
                      <div className="flex items-center space-x-1">
                        {/* Set as main button */}
                        {!image.isMain && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setMainImage(image.id)}
                            className="p-1 h-6 w-6 text-gray-500 hover:text-yellow-500"
                            title="Set as main image"
                          >
                            <StarOff className="h-3 w-3" />
                          </Button>
                        )}
                        
                        {/* Remove button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeImage(image.id)}
                          className="p-1 h-6 w-6 text-gray-500 hover:text-red-500"
                          title="Remove image"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Error message */}
                    {image.error && (
                      <p className="text-xs text-red-500 mt-1">{image.error}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Information */}
      <div className="text-sm text-gray-500 space-y-1">
        <p>• Drag and drop multiple images at once</p>
        <p>• First image is automatically set as main image</p>
        <p>• Click the star icon to change the main image</p>
        <p>• Supported formats: JPEG, PNG, WebP</p>
        <p>• Maximum file size: {maxSizeInMB}MB per image</p>
        <p>• Maximum images: {maxImages} per property</p>
      </div>
    </div>
  )
}
