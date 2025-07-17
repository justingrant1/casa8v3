import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json()
    
    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }

    console.log('Generating property listing for:', address)

    // Use OpenAI to generate property data based on the address
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a real estate expert AI that generates property listing data based on addresses. You have extensive knowledge of real estate markets, property types, and typical rental rates across different areas. Create realistic and appealing property listings that would be competitive in the local market.`
        },
        {
          role: 'user',
          content: `Generate a comprehensive property listing for the address: "${address}". 
          
          Please analyze the location, neighborhood characteristics, and typical property features for this area to create realistic listing details.
          
          Return the data in the following JSON format:
          {
            "title": "Attractive property title that highlights key selling points",
            "description": "Detailed property description (3-4 sentences) highlighting key features, neighborhood benefits, and what makes it special",
            "bedrooms": number,
            "bathrooms": number,
            "sqft": number,
            "propertyType": "House|Apartment|Condo|Townhouse",
            "estimatedRent": number,
            "amenities": ["amenity1", "amenity2", "amenity3"],
            "features": ["feature1", "feature2", "feature3"],
            "confidence": "high|medium|low"
          }
          
          Guidelines:
          - Make realistic estimates based on the location and area
          - Include 3-5 relevant amenities from: ["Washer/Dryer", "Air Conditioning", "Parking", "Dishwasher", "Pet Friendly", "Gym", "Pool", "Balcony", "Garden", "Fireplace"]
          - Include 3-5 appealing features
          - Set confidence to "medium" since this is AI-generated without direct property inspection
          - Ensure all fields are filled with appropriate data
          - Make the title and description appealing but realistic`
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })

    const aiResponse = response.choices[0]?.message?.content
    
    if (!aiResponse) {
      throw new Error('No response from AI')
    }

    // Try to parse JSON response
    let propertyData
    try {
      // Extract JSON from response (in case there's additional text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        propertyData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in AI response')
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      console.error('Raw AI response:', aiResponse)
      
      // Fallback: create a basic response using the address
      const cityState = address.split(',').slice(-2).join(',').trim()
      propertyData = {
        title: `Beautiful Property in ${cityState}`,
        description: `This well-maintained property offers comfortable living in a desirable location. Features modern amenities and is conveniently located near local attractions, shopping, and dining. Perfect for those seeking quality housing in ${cityState}.`,
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1200,
        propertyType: 'House',
        estimatedRent: 2500,
        amenities: ['Parking', 'Air Conditioning', 'Washer/Dryer'],
        features: ['Modern Kitchen', 'Spacious Rooms', 'Updated Fixtures'],
        confidence: 'low'
      }
    }

    // Validate required fields
    const requiredFields = ['title', 'description', 'bedrooms', 'bathrooms', 'sqft', 'propertyType', 'estimatedRent']
    const missingFields = requiredFields.filter(field => !propertyData[field])
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields)
      // Fill in missing fields with defaults
      if (!propertyData.title) propertyData.title = `Property at ${address}`
      if (!propertyData.description) propertyData.description = 'Beautiful property in a great location with modern amenities.'
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
