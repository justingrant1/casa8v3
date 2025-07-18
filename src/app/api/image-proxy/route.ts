import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

// Force the route to be dynamic
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const imageUrl = searchParams.get('url')

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    // Fetch the image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 400 })
    }

    const imageBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(imageBuffer)

    // Process the image with Sharp to auto-orient and optimize for social sharing
    const processedImage = await sharp(buffer)
      .rotate() // Auto-rotate based on EXIF data
      .resize(1200, 630, { 
        fit: 'cover', 
        position: 'center' 
      })
      .jpeg({ 
        quality: 80,
        progressive: true 
      })
      .toBuffer()

    return new NextResponse(processedImage, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': processedImage.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error processing image:', error)
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 })
  }
}
