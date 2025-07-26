import { NextRequest, NextResponse } from 'next/server'
import { ScraperImportService } from '@/lib/scraper-import'

export async function POST(request: NextRequest) {
  try {
    const { filePath, sourceMarket } = await request.json()

    if (!filePath || !sourceMarket) {
      return NextResponse.json(
        { error: 'Missing required parameters: filePath and sourceMarket' },
        { status: 400 }
      )
    }

    // Initialize scraper import service
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const importService = new ScraperImportService(supabaseUrl, supabaseServiceKey)

    // Import properties from file
    const result = await importService.importFromFile(filePath, sourceMarket)

    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? `Successfully imported ${result.summary.newProperties} new and updated ${result.summary.updatedProperties} properties`
        : 'Import completed with errors',
      data: result
    })

  } catch (error) {
    console.error('Scraper import API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
