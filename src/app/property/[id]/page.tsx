import type { Metadata } from 'next'
import { getPropertyById } from '@/lib/properties'
import { getImageUrls } from '@/lib/storage'
import { PropertyDetailsClient } from '@/components/property-details-client'

// Generate metadata for social sharing
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const property = await getPropertyById(params.id)
    
    if (!property) {
      return {
        title: 'Property Not Found - Casa8',
        description: 'The property you are looking for does not exist.',
      }
    }

    const images = getImageUrls(property.images)
    const firstImage = images && images.length > 0 ? images[0] : null
    
    // Use image proxy for social media sharing to handle orientation correctly
    const socialImage = firstImage ? `/api/image-proxy?url=${encodeURIComponent(firstImage)}` : null
    const absoluteSocialImage = socialImage ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.casa8.com'}${socialImage}` : null

    return {
      title: `${property.title} - Casa8`,
      description: `${property.bedrooms} bedroom, ${property.bathrooms} bathroom home at ${property.address}. $${property.price.toLocaleString()} per month. Available on Casa8.`,
      openGraph: {
        title: `${property.title} - Casa8`,
        description: `${property.bedrooms} bedroom, ${property.bathrooms} bathroom home at ${property.address}. $${property.price.toLocaleString()} per month. Available on Casa8.`,
        images: absoluteSocialImage ? [
          {
            url: absoluteSocialImage,
            width: 1200,
            height: 630,
            alt: property.title,
          }
        ] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${property.title} - Casa8`,
        description: `${property.bedrooms} bedroom, ${property.bathrooms} bathroom home at ${property.address}. $${property.price.toLocaleString()} per month.`,
        images: absoluteSocialImage ? [absoluteSocialImage] : [],
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Property Details - Casa8',
      description: 'View property details on Casa8',
    }
  }
}

export default function PropertyDetailsPage({ params }: { params: { id: string } }) {
  return <PropertyDetailsClient propertyId={params.id} />
}
