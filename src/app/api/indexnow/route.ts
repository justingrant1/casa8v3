import { NextRequest, NextResponse } from 'next/server'
import { indexNow, notifySearchEngines, notifySearchEnginesMultiple } from '@/lib/indexnow'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { urls, action } = body

    if (!urls) {
      return NextResponse.json(
        { error: 'URLs are required' },
        { status: 400 }
      )
    }

    let result: boolean = false

    switch (action) {
      case 'submit-single':
        if (typeof urls === 'string') {
          result = await notifySearchEngines(urls)
        } else {
          return NextResponse.json(
            { error: 'Single URL must be a string' },
            { status: 400 }
          )
        }
        break

      case 'submit-multiple':
        if (Array.isArray(urls)) {
          result = await notifySearchEnginesMultiple(urls)
        } else {
          return NextResponse.json(
            { error: 'Multiple URLs must be an array' },
            { status: 400 }
          )
        }
        break

      case 'submit-all-seo':
        result = await indexNow.submitAllSEOPages()
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: submit-single, submit-multiple, or submit-all-seo' },
          { status: 400 }
        )
    }

    if (result) {
      return NextResponse.json({
        success: true,
        message: 'URLs submitted to IndexNow successfully',
        submittedUrls: Array.isArray(urls) ? urls.length : 1
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to submit URLs to IndexNow' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('IndexNow API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to verify IndexNow setup
export async function GET() {
  return NextResponse.json({
    indexNowEnabled: true,
    keyFile: 'https://casa8.com/4b4980e5ad4149af8e384689f626b6f1.txt',
    endpoints: [
      'https://api.indexnow.org/indexnow',
      'https://www.bing.com/indexnow',
      'https://yandex.com/indexnow'
    ],
    usage: {
      'POST /api/indexnow': {
        'submit-single': 'Submit a single URL',
        'submit-multiple': 'Submit multiple URLs',
        'submit-all-seo': 'Submit all programmatic SEO pages'
      }
    }
  })
}
