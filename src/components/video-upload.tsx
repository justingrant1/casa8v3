"use client"

import { useState, useRef } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Progress } from './ui/progress'
import { X, Upload, Video, Play, Pause } from 'lucide-react'
import { uploadPropertyVideo, deletePropertyVideo } from '@/lib/storage'
import { toast } from '@/hooks/use-toast'

interface VideoUploadProps {
  onVideoUpload: (videoUrl: string) => void
  onVideoRemove: (videoUrl: string) => void
  existingVideos?: string[]
  maxVideos?: number
  maxSizeInMB?: number
}

export function VideoUpload({
  onVideoUpload,
  onVideoRemove,
  existingVideos = [],
  maxVideos = 5,
  maxSizeInMB = 50
}: VideoUploadProps) {
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [isUploading, setIsUploading] = useState(false)
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Check if adding these files would exceed the maximum
    if (existingVideos.length + files.length > maxVideos) {
      toast({
        title: "Too many videos",
        description: `You can only upload up to ${maxVideos} videos per property`,
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileId = `${Date.now()}-${i}`

        // Validate file type
        if (!file.type.startsWith('video/')) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not a video file`,
            variant: "destructive"
          })
          continue
        }

        // Validate file size
        if (file.size > maxSizeInMB * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} is larger than ${maxSizeInMB}MB`,
            variant: "destructive"
          })
          continue
        }

        // Upload with progress tracking
        try {
          const videoUrl = await uploadPropertyVideo(file, (progress) => {
            setUploadProgress(prev => ({ ...prev, [fileId]: progress }))
          })

          // Remove progress tracking for this file
          setUploadProgress(prev => {
            const newProgress = { ...prev }
            delete newProgress[fileId]
            return newProgress
          })

          onVideoUpload(videoUrl)
          
          toast({
            title: "Video uploaded",
            description: `${file.name} has been uploaded successfully`
          })
        } catch (error) {
          console.error('Upload error:', error)
          toast({
            title: "Upload failed",
            description: `Failed to upload ${file.name}. Please try again.`,
            variant: "destructive"
          })
        }
      }
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveVideo = async (videoUrl: string) => {
    try {
      await deletePropertyVideo(videoUrl)
      onVideoRemove(videoUrl)
      toast({
        title: "Video removed",
        description: "Video has been removed successfully"
      })
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "Delete failed",
        description: "Failed to delete video. Please try again.",
        variant: "destructive"
      })
    }
  }

  const toggleVideoPlay = (videoUrl: string) => {
    if (playingVideo === videoUrl) {
      setPlayingVideo(null)
    } else {
      setPlayingVideo(videoUrl)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const canUploadMore = existingVideos.length < maxVideos

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Property Videos</Label>
        <span className="text-sm text-gray-500">
          {existingVideos.length}/{maxVideos} videos
        </span>
      </div>

      {/* Upload Area */}
      {canUploadMore && (
        <div className="space-y-2">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors relative">
            <Video className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Click to upload videos or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                MP4, MOV, AVI up to {maxSizeInMB}MB each
              </p>
            </div>
            <Input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              multiple
              onChange={handleFileSelect}
              disabled={isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
          </div>
          
          {!isUploading && (
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose Video Files
            </Button>
          )}
        </div>
      )}

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Uploading...</Label>
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <div key={fileId} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading video...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          ))}
        </div>
      )}

      {/* Existing Videos */}
      {existingVideos.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Uploaded Videos</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {existingVideos.map((videoUrl, index) => (
              <div key={index} className="relative group bg-gray-50 rounded-lg overflow-hidden">
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  {playingVideo === videoUrl ? (
                    <video
                      src={videoUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-cover"
                      onEnded={() => setPlayingVideo(null)}
                    />
                  ) : (
                    <div className="relative w-full h-full">
                      <video
                        src={videoUrl}
                        className="w-full h-full object-cover"
                        muted
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => toggleVideoPlay(videoUrl)}
                          className="text-white hover:bg-white hover:text-black"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Video Controls */}
                <div className="p-2 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 truncate">
                      Video {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveVideo(videoUrl)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Information */}
      <div className="text-sm text-gray-500 space-y-1">
        <p>• Videos help showcase your property better</p>
        <p>• Supported formats: MP4, MOV, AVI</p>
        <p>• Maximum file size: {maxSizeInMB}MB per video</p>
        <p>• Maximum videos: {maxVideos} per property</p>
      </div>
    </div>
  )
}
