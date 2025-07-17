import { NextRequest, NextResponse } from 'next/server'

interface PerplexityResponse {
  id: string
  model: string
  object: string
  created: number
  choices: Array<{
    index: number
    finish_reason: string
    message: {
      role: string
      content: string
    }
    delta: {
      role: string
      content: string
    }
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

interface PropertyData {
  title: string
  description: string
  bedrooms: number
  bathrooms: number
  sqft: number
  propertyType: string
  price: number
  amenities: string[]
}

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json()

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }

    const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY
    if (!PERPLEXITY_API_KEY) {
      return NextResponse.json({ error: 'Perplexity API key not configured' }, { status: 500 })
    }

    // Create a detailed prompt for property information extraction
    const prompt = `Search for detailed information about the property at this address: ${address}

Please find and extract the following information about this property:
- Property type (House, Apartment, Condo, Townhouse)
- Number of bedrooms
- Number of bathrooms
- Square footage
- Estimated rental price range
- Key amenities and features
- Property description and notable characteristics

Search real estate websites, property listings, public records, and any available information about this specific address. 

Please respond with a JSON object in this exact format:
{
  "title": "Descriptive property title",
  "description": "Detailed property description highlighting key features",
  "bedrooms": number,
  "bathrooms": number,
  "sqft": number,
  "propertyType": "House|Apartment|Condo|Townhouse",
  "price": estimated_monthly_rent_number,
  "amenities": ["amenity1", "amenity2", "amenity3"]
}

If you cannot find specific information for some fields, use reasonable estimates based on similar properties in the area. Always return valid JSON format.`

    // Make request to Perplexity API
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful real estate assistant that extracts property information from web searches. Always respond with valid JSON format as requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.2,
        top_p: 0.9,
        return_citations: true,
        search_domain_filter: ['realtor.com', 'zillow.com', 'apartments.com', 'rent.com', 'trulia.com'],
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'month',
        top_k: 0,
        stream: false,
        presence_penalty: 0,
        frequency_penalty: 1
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Perplexity API error:', errorText)
      return NextResponse.json({ error: 'Failed to fetch property information' }, { status: 500 })
    }

    const data: PerplexityResponse = await response.json()
    
    if (!data.choices || data.choices.length === 0) {
      return NextResponse.json({ error: 'No response from AI service' }, { status: 500 })
    }

    const content = data.choices[0].message.content
    
    // Try to extract JSON from the response
    let propertyData: PropertyData
    try {
      // Look for JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        propertyData = JSON.parse(jsonMatch[0])
      } else {
        // Fallback: try to parse the entire content as JSON
        propertyData = JSON.parse(content)
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', content)
      
      // Fallback: create a basic response structure
      propertyData = {
        title: `Property at ${address}`,
        description: `A rental property located at ${address}. Please update with specific details about the property's features, amenities, and characteristics.`,
        bedrooms: 2,
        bathrooms: 1,
        sqft: 1000,
        propertyType: 'Apartment',
        price: 1500,
        amenities: ['Parking', 'Air Conditioning']
      }
    }

    // Validate and sanitize the response
    const sanitizedData = {
      title: propertyData.title || `Property at ${address}`,
      description: propertyData.description || 'Please add a description for this property.',
      bedrooms: Math.max(1, Math.min(10, propertyData.bedrooms || 2)),
      bathrooms: Math.max(1, Math.min(5, propertyData.bathrooms || 1)),
      sqft: Math.max(200, Math.min(10000, propertyData.sqft || 1000)),
      propertyType: ['House', 'Apartment', 'Condo', 'Townhouse'].includes(propertyData.propertyType) 
        ? propertyData.propertyType 
        : 'Apartment',
      price: Math.max(100, Math.min(50000, propertyData.price || 1500)),
      amenities: Array.isArray(propertyData.amenities) 
        ? propertyData.amenities.slice(0, 10) 
        : ['Parking', 'Air Conditioning']
    }

    return NextResponse.json({ 
      success: true,
      data: sanitizedData
    })

  } catch (error) {
    console.error('Error generating listing:', error)
    return NextResponse.json({ 
      error: 'Failed to generate listing data' 
    }, { status: 500 })
  }
}
