import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import FirecrawlApp from '@mendable/firecrawl-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY,
})

interface PropertyData {
  title?: string
  bedrooms?: number
  bathrooms?: number
  sqft?: number
  price?: number
  propertyType?: string
  amenities?: string[]
  description?: string
  source?: string
}

// Property data extraction patterns
const extractionPatterns = {
  beds: /(\d+)\s*(?:bed|br|bedroom)/i,
  baths: /(\d+(?:\.\d+)?)\s*(?:bath|ba|bathroom)/i,
  sqft: /(\d+(?:,\d+)?)\s*(?:sq\.?\s*ft|sqft|square\s*feet)/i,
  price: /\$(\d+(?:,\d+)?)\s*(?:\/month|mo|monthly)?/i,
  propertyType: /(?:apartment|house|condo|townhouse|studio)/i,
  amenities: /(?:parking|laundry|pool|gym|dishwasher|ac|heating|balcony|patio|fireplace|hardwood|carpet|tile)/gi
}

async function scrapePropertyData(address: string): Promise<PropertyData> {
  const searchQueries = [
    `${address} zillow`,
    `${address} apartments for rent`,
    `${address} property details`,
    `${address} real estate`
  ]

  for (const query of searchQueries) {
    try {
      console.log(`Searching for: ${query}`)
      
      // Search for property information
      const searchResult = await firecrawl.search(query, {
        limit: 3
      })

      if (searchResult.success && searchResult.data && searchResult.data.length > 0) {
        // Process the first few results
        for (const result of searchResult.data.slice(0, 3)) {
          const extractedData = extractDataFromContent(result.markdown || result.html || '', result.url || '')
          
          if (extractedData.bedrooms || extractedData.bathrooms || extractedData.sqft) {
            console.log(`Found property data from: ${result.url}`)
            return extractedData
          }
        }
      }
    } catch (error) {
      console.error(`Error searching for "${query}":`, error)
      continue
    }
  }

  // If no specific property data found, try direct URL scraping
  const directUrls = [
    `https://www.zillow.com/homes/${encodeURIComponent(address)}_rb/`,
    `https://www.apartments.com/search?q=${encodeURIComponent(address)}`,
    `https://www.rent.com/search?q=${encodeURIComponent(address)}`
  ]

  for (const url of directUrls) {
    try {
      console.log(`Scraping direct URL: ${url}`)
      
      const scrapeResult = await firecrawl.scrapeUrl(url, {
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        includeTags: ['title', 'meta', 'span', 'div', 'p', 'h1', 'h2', 'h3'],
        excludeTags: ['script', 'style', 'nav', 'footer', 'header'],
        waitFor: 2000
      })

      if (scrapeResult.success && scrapeResult.markdown) {
        const content = scrapeResult.markdown || scrapeResult.html || ''
        const extractedData = extractDataFromContent(content, url)
        
        if (extractedData.bedrooms || extractedData.bathrooms || extractedData.sqft) {
          console.log(`Found property data from direct scrape: ${url}`)
          return extractedData
        }
      }
    } catch (error) {
      console.error(`Error scraping "${url}":`, error)
      continue
    }
  }

  return {}
}

function extractDataFromContent(content: string, source: string): PropertyData {
  const data: PropertyData = { source }

  // Extract bedrooms
  const bedsMatch = content.match(extractionPatterns.beds)
  if (bedsMatch) {
    data.bedrooms = parseInt(bedsMatch[1])
  }

  // Extract bathrooms
  const bathsMatch = content.match(extractionPatterns.baths)
  if (bathsMatch) {
    data.bathrooms = parseFloat(bathsMatch[1])
  }

  // Extract square footage
  const sqftMatch = content.match(extractionPatterns.sqft)
  if (sqftMatch) {
    data.sqft = parseInt(sqftMatch[1].replace(/,/g, ''))
  }

  // Extract price
  const priceMatch = content.match(extractionPatterns.price)
  if (priceMatch) {
    data.price = parseInt(priceMatch[1].replace(/,/g, ''))
  }

  // Extract property type
  const typeMatch = content.match(extractionPatterns.propertyType)
  if (typeMatch) {
    data.propertyType = typeMatch[0].toLowerCase()
  }

  // Extract amenities
  const amenityMatches = content.match(extractionPatterns.amenities)
  if (amenityMatches) {
    data.amenities = [...new Set(amenityMatches.map(a => a.toLowerCase()))]
  }

  return data
}

function validatePropertyData(data: PropertyData): boolean {
  return (
    (data.bedrooms !== undefined && data.bedrooms > 0 && data.bedrooms <= 10) ||
    (data.bathrooms !== undefined && data.bathrooms > 0 && data.bathrooms <= 8) ||
    (data.sqft !== undefined && data.sqft > 200 && data.sqft <= 10000) ||
    (data.price !== undefined && data.price > 500 && data.price <= 50000)
  )
}

async function generateAIContent(address: string, scrapedData: PropertyData): Promise<any> {
  const hasRealData = validatePropertyData(scrapedData)
  
  const systemPrompt = hasRealData 
    ? `You are an expert real estate assistant specializing in rental properties.

TASK: Use the provided REAL property data to generate an engaging rental listing for ${address}.

REAL PROPERTY DATA PROVIDED:
${JSON.stringify(scrapedData, null, 2)}

YOUR ROLE:
1. Use the factual data as the foundation
2. Generate compelling, renter-focused descriptions
3. Highlight the most attractive features
4. Add neighborhood context and lifestyle benefits
5. Create engaging titles that sell the lifestyle

DESCRIPTION GUIDELINES:
- Build on the REAL data provided
- Focus on renter benefits and lifestyle
- Mention verified amenities and features
- Use engaging but honest language
- Keep to 2-3 sentences
- Avoid exaggeration or false claims

OUTPUT FORMAT: Respond with ONLY this JSON structure:
{
  "title": "Engaging property title based on real features",
  "bedrooms": ${scrapedData.bedrooms || 2},
  "bathrooms": ${scrapedData.bathrooms || 1},
  "sqft": ${scrapedData.sqft || 1000},
  "description": "Compelling description highlighting real amenities",
  "propertyType": "${scrapedData.propertyType || 'apartment'}",
  "amenities": ${JSON.stringify(scrapedData.amenities || ['parking', 'laundry'])},
  "price": ${scrapedData.price || 2000},
  "source": "${scrapedData.source || ''}"
}`
    : `You are an expert real estate assistant specializing in rental properties.

TASK: Generate a compelling rental listing for ${address}. No specific property data was found, so create reasonable estimates based on the location and market.

YOUR ROLE:
1. Generate realistic property details based on the address location
2. Create compelling, renter-focused descriptions
3. Provide reasonable estimates for beds, baths, sqft, and price
4. Add neighborhood context and lifestyle benefits
5. Create engaging titles that sell the lifestyle

DESCRIPTION GUIDELINES:
- Focus on renter benefits and lifestyle
- Use engaging but honest language
- Keep to 2-3 sentences
- Provide realistic estimates for the area

OUTPUT FORMAT: Respond with ONLY this JSON structure:
{
  "title": "Engaging property title for the location",
  "bedrooms": 2,
  "bathrooms": 1,
  "sqft": 1000,
  "description": "Compelling description highlighting location benefits",
  "propertyType": "apartment",
  "amenities": ["parking", "laundry", "ac"],
  "price": 2000,
  "source": "AI Generated"
}`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate a rental listing for ${address}` }
      ],
      temperature: 0.7,
      max_tokens: 800,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from OpenAI')
    }

    // Parse JSON response
    const parsedResponse = JSON.parse(response)
    
    // Validate response structure
    if (!parsedResponse.title || !parsedResponse.description) {
      throw new Error('Invalid response structure')
    }

    return parsedResponse
  } catch (error) {
    console.error('Error generating AI content:', error)
    
    // Fallback response
    return {
      title: "Beautiful Property for Rent",
      bedrooms: scrapedData.bedrooms || 2,
      bathrooms: scrapedData.bathrooms || 1,
      sqft: scrapedData.sqft || 1000,
      description: "This lovely property offers comfortable living in a great location. Perfect for those seeking quality housing with modern amenities.",
      propertyType: scrapedData.propertyType || "apartment",
      amenities: scrapedData.amenities || ["parking", "laundry"],
      price: scrapedData.price || 2000,
      source: scrapedData.source || "Fallback"
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json()

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      )
    }

    console.log(`Generating listing for address: ${address}`)

    // Step 1: Scrape property data
    const scrapedData = await scrapePropertyData(address)
    console.log('Scraped data:', scrapedData)

    // Step 2: Generate AI content
    const aiContent = await generateAIContent(address, scrapedData)
    console.log('AI generated content:', aiContent)

    return NextResponse.json(aiContent)
  } catch (error) {
    console.error('Error in generate-listing API:', error)
    return NextResponse.json(
      { error: 'Failed to generate listing' },
      { status: 500 }
    )
  }
}
