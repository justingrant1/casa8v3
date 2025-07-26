import { NextRequest, NextResponse } from 'next/server'
import { ScraperImportService } from '@/lib/scraper-import'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'

export async function POST(request: NextRequest) {
  try {
    const { currentUrls, newProperties, sourceMarket } = await request.json()

    if (!currentUrls || !Array.isArray(currentUrls) || !sourceMarket) {
      return NextResponse.json(
        { error: 'Missing required parameters: currentUrls (array) and sourceMarket' },
        { status: 400 }
      )
    }

    // Initialize services
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)
    const importService = new ScraperImportService(supabaseUrl, supabaseServiceKey)

    // Get existing URLs from database for this market
    const { data: existingProperties, error } = await supabase
      .from('properties')
      .select('external_url')
      .eq('source_market', sourceMarket)
      .eq('data_source', 'scraped')
      .not('external_url', 'is', null)

    if (error) {
      throw new Error(`Failed to fetch existing properties: ${error.message}`)
    }

    const existingUrls = existingProperties?.map(p => p.external_url).filter(Boolean) || []

    // Find URLs that were removed (exist in DB but not in current scrape)
    const removedUrls = existingUrls.filter(url => !currentUrls.includes(url))

    // Find new URLs (exist in current scrape but not in DB)
    const newUrls = currentUrls.filter(url => !existingUrls.includes(url))

    // Filter new properties to only include those with new URLs
    const filteredNewProperties = (newProperties || []).filter(
      (property: any) => newUrls.includes(property.url)
    )

    console.log(`🔄 Sync analysis for ${sourceMarket}:`)
    console.log(`   Existing URLs: ${existingUrls.length}`)
    console.log(`   Current URLs: ${currentUrls.length}`)
    console.log(`   New URLs: ${newUrls.length}`)
    console.log(`   Removed URLs: ${removedUrls.length}`)

    // Perform incremental sync
    const result = await importService.incrementalSync(
      currentUrls,
      filteredNewProperties,
      removedUrls,
      sourceMarket
    )

    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? `Sync completed: ${result.summary.newProperties} new, ${result.summary.deactivatedProperties} deactivated`
        : 'Sync completed with errors',
      data: {
        ...result,
        analysis: {
          existingUrls: existingUrls.length,
          currentUrls: currentUrls.length,
          newUrls: newUrls.length,
          removedUrls: removedUrls.length
        }
      }
    })

  } catch (error) {
    console.error('Scraper sync API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check sync status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sourceMarket = searchParams.get('sourceMarket')

    if (!sourceMarket) {
      return NextResponse.json(
        { error: 'Missing sourceMarket parameter' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

    // Get sync statistics
    const { data: properties, error } = await supabase
      .from('properties')
      .select('id, is_active, last_scraped_at, created_at')
      .eq('source_market', sourceMarket)
      .eq('data_source', 'scraped')

    if (error) {
      throw new Error(`Failed to fetch properties: ${error.message}`)
    }

    const total = properties?.length || 0
    const active = properties?.filter(p => p.is_active).length || 0
    const inactive = total - active

    // Find most recent scrape
    const lastScraped = properties?.reduce((latest, prop) => {
      const scrapedAt = prop.last_scraped_at ? new Date(prop.last_scraped_at) : null
      const createdAt = new Date(prop.created_at)
      const propDate = scrapedAt || createdAt
      return !latest || propDate > latest ? propDate : latest
    }, null as Date | null)

    return NextResponse.json({
      success: true,
      data: {
        sourceMarket,
        statistics: {
          totalProperties: total,
          activeProperties: active,
          inactiveProperties: inactive,
          lastScrapedAt: lastScraped?.toISOString() || null
        }
      }
    })

  } catch (error) {
    console.error('Scraper status API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
