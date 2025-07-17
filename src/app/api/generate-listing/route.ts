import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import OpenAI from 'openai'

// Add stealth plugin to puppeteer
puppeteer.use(StealthPlugin())

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json()
    
    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }

    console.log('Searching for property:', address)

    // Launch puppeteer with stealth mode
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      ]
    })

    const page = await browser.newPage()
    
    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 })
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')

    // Navigate to Google and search for the property
    await page.goto('https://www.google.com', { waitUntil: 'networkidle2' })
    
    // Wait for search box and enter the address
    await page.waitForSelector('input[name="q"]')
    await page.type('input[name="q"]', `${address} real estate property details`)
    await page.keyboard.press('Enter' as any)
    
    // Wait for results to load
    await page.waitForSelector('#search', { timeout: 10000 })
    
    // Take a screenshot of the search results
    const screenshot = await page.screenshot({ 
      fullPage: true,
      type: 'png'
    } as any)
    
    await browser.close()

    // Convert screenshot to base64
    const base64Screenshot = Buffer.from(screenshot).toString('base64')

    // Send to OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Please analyze this Google search results screenshot for the property address: "${address}". 
              
              Extract the following information if available:
              - Property title (create an attractive title if not explicitly shown)
              - Property description (summarize key features and selling points)
              - Number of bedrooms
              - Number of bathrooms
              - Square footage
              - Property type (House, Apartment, Condo, Townhouse)
              - Estimated monthly rent (if available, otherwise provide a reasonable estimate based on the area)
              - Amenities (parking, laundry, pool, etc.)
              - Key features and highlights
              
              Please return the data in the following JSON format:
              {
                "title": "Attractive property title",
                "description": "Detailed property description highlighting key features",
                "bedrooms": number,
                "bathrooms": number,
                "sqft": number,
                "propertyType": "House|Apartment|Condo|Townhouse",
                "estimatedRent": number,
                "amenities": ["amenity1", "amenity2"],
                "features": ["feature1", "feature2"],
                "confidence": "high|medium|low"
              }
              
              If specific information is not available, make reasonable estimates based on typical properties in the area and property type. Always provide a complete response with all fields filled.`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${base64Screenshot}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })

    const aiResponse = response.choices[0]?.message?.content
    
    if (!aiResponse) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
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
      
      // Fallback: create a basic response
      propertyData = {
        title: `Property at ${address}`,
        description: 'Beautiful property in a great location with modern amenities and comfortable living spaces.',
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1200,
        propertyType: 'House',
        estimatedRent: 2500,
        amenities: ['Parking', 'Laundry'],
        features: ['Modern Kitchen', 'Spacious Rooms'],
        confidence: 'low'
      }
    }

    console.log('Generated property data:', propertyData)

    return NextResponse.json({
      success: true,
      data: propertyData
    })

  } catch (error) {
    console.error('Error in generate-listing API:', error)
    return NextResponse.json({ 
      error: 'Failed to generate listing', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
