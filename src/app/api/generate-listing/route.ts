import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json()
    
    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }

    console.log('Generating property listing for:', address)

    // Use Perplexity API to search for real property data
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a real estate data analyst that searches for current property information using internet sources. You provide accurate, real-time property data based on actual listings, recent sales, and market information.'
          },
          {
            role: 'user',
            content: `Search for current property information for the address: "${address}". 
            
            Look for:
            - Current or recent property listings at this address
            - Property details (bedrooms, bathrooms, square footage, type)
            - Recent sale prices or current rental rates
            - Property features and amenities
            - Neighborhood information
            - Property history and characteristics
            
            Return ONLY a JSON object with the following format (no additional text):
            {
              "title": "Property title based on actual listing or create appropriate title",
              "description": "Property description based on actual features and neighborhood",
              "bedrooms": number,
              "bathrooms": number,
              "sqft": number,
              "propertyType": "House|Apartment|Condo|Townhouse",
              "estimatedRent": number,
              "amenities": ["amenity1", "amenity2", "amenity3"],
              "features": ["feature1", "feature2", "feature3"],
              "confidence": "high|medium|low",
              "dataSource": "Brief description of where the data came from"
            }
            
            Use actual property data found online. If no specific data is found for this exact address, use comparable properties in the same area/neighborhood. Set confidence level based on data availability.`
          }
        ],
        temperature: 0.2,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content
    
    if (!aiResponse) {
      throw new Error('No response from Perplexity API')
    }

    console.log('Perplexity raw response:', aiResponse)

    // Try to parse JSON response
    let propertyData
    try {
      // Extract JSON from response (in case there's additional text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        propertyData = JSON.parse(jsonMatch[0])
      } else {
        // Try parsing the entire response as JSON
        propertyData = JSON.parse(aiResponse)
      }
    } catch (parseError) {
      console.error('Error parsing Perplexity response:', parseError)
      console.error('Raw Perplexity response:', aiResponse)
      
      // Fallback: create a basic response using the address
      const cityState = address.split(',').slice(-2).join(',').trim()
      propertyData = {
        title: `Property at ${address}`,
        description: `Property located at ${address}. Please verify details and update listing information as needed.`,
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1200,
        propertyType: 'House',
        estimatedRent: 2500,
        amenities: ['Parking', 'Air Conditioning', 'Washer/Dryer'],
        features: ['Modern Kitchen', 'Spacious Rooms', 'Updated Fixtures'],
        confidence: 'low',
        dataSource: 'Fallback data - please verify property details'
      }
    }

    // Validate required fields
    const requiredFields = ['title', 'description', 'bedrooms', 'bathrooms', 'sqft', 'propertyType', 'estimatedRent']
    const missingFields = requiredFields.filter(field => !propertyData[field])
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields)
      // Fill in missing fields with defaults
      if (!propertyData.title) propertyData.title = `Property at ${address}`
      if (!propertyData.description) propertyData.description = 'Property details to be verified and updated.'
      if (!propertyData.bedrooms) propertyData.bedrooms = 3
      if (!propertyData.bathrooms) propertyData.bathrooms = 2
      if (!propertyData.sqft) propertyData.sqft = 1200
      if (!propertyData.propertyType) propertyData.propertyType = 'House'
      if (!propertyData.estimatedRent) propertyData.estimatedRent = 2500
    }

    // Ensure arrays exist
    if (!propertyData.amenities) propertyData.amenities = ['Parking', 'Air Conditioning']
    if (!propertyData.features) propertyData.features = ['Modern Kitchen', 'Spacious Rooms']
    if (!propertyData.confidence) propertyData.confidence = 'medium'
    if (!propertyData.dataSource) propertyData.dataSource = 'Internet search results'

    // Filter amenities to match available form options
    const availableAmenities = ['Washer/Dryer', 'Air Conditioning', 'Parking', 'Dishwasher', 'Pet Friendly', 'Gym', 'Pool', 'Balcony', 'Garden', 'Fireplace']
    propertyData.amenities = propertyData.amenities.filter((amenity: string) => {
      return availableAmenities.some(available => 
        available.toLowerCase().includes(amenity.toLowerCase()) ||
        amenity.toLowerCase().includes(available.toLowerCase())
      )
    }).slice(0, 5) // Limit to 5 amenities

    console.log('Generated property data:', propertyData)

    return NextResponse.json({
      success: true,
      data: propertyData
    })

  } catch (error) {
    console.error('Error in generate-listing API:', error)
    
    // Return detailed error information for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json({ 
      error: 'Failed to generate listing', 
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
