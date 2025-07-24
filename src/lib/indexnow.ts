// IndexNow API integration for instant search engine indexing
// Supports Bing, Yandex, and other IndexNow-compatible search engines

const INDEXNOW_API_KEY = '4b4980e5ad4149af8e384689f626b6f1'
const BASE_URL = 'https://casa8.com'
const KEY_LOCATION = `${BASE_URL}/${INDEXNOW_API_KEY}.txt`

// IndexNow endpoints for different search engines
const INDEXNOW_ENDPOINTS = [
  'https://api.indexnow.org/indexnow', // Primary endpoint
  'https://www.bing.com/indexnow', // Bing
  'https://yandex.com/indexnow', // Yandex
]

export interface IndexNowSubmission {
  host: string
  key: string
  keyLocation: string
  urlList: string[]
}

export class IndexNowService {
  private static instance: IndexNowService
  private submissionQueue: string[] = []
  private isProcessing = false

  static getInstance(): IndexNowService {
    if (!IndexNowService.instance) {
      IndexNowService.instance = new IndexNowService()
    }
    return IndexNowService.instance
  }

  /**
   * Submit a single URL to IndexNow
   */
  async submitUrl(url: string): Promise<boolean> {
    return this.submitUrls([url])
  }

  /**
   * Submit multiple URLs to IndexNow
   */
  async submitUrls(urls: string[]): Promise<boolean> {
    if (!urls.length) return false

    // Validate URLs belong to our domain
    const validUrls = urls.filter(url => 
      url.startsWith(BASE_URL) && this.isValidUrl(url)
    )

    if (!validUrls.length) {
      console.warn('No valid URLs to submit to IndexNow')
      return false
    }

    const submission: IndexNowSubmission = {
      host: 'casa8.com',
      key: INDEXNOW_API_KEY,
      keyLocation: KEY_LOCATION,
      urlList: validUrls
    }

    try {
      // Submit to all IndexNow endpoints
      const results = await Promise.allSettled(
        INDEXNOW_ENDPOINTS.map(endpoint => this.submitToEndpoint(endpoint, submission))
      )

      // Check if at least one submission succeeded
      const successCount = results.filter(result => result.status === 'fulfilled').length
      
      if (successCount > 0) {
        console.log(`IndexNow: Successfully submitted ${validUrls.length} URLs to ${successCount} endpoints`)
        return true
      } else {
        console.error('IndexNow: All submissions failed')
        return false
      }
    } catch (error) {
      console.error('IndexNow submission error:', error)
      return false
    }
  }

  /**
   * Add URL to queue for batch processing
   */
  queueUrl(url: string): void {
    if (this.isValidUrl(url) && !this.submissionQueue.includes(url)) {
      this.submissionQueue.push(url)
      this.processQueue()
    }
  }

  /**
   * Process queued URLs in batches
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.submissionQueue.length === 0) return

    this.isProcessing = true

    try {
      // Process in batches of 10 URLs (IndexNow limit is typically 10,000 but we'll be conservative)
      const batchSize = 10
      const batch = this.submissionQueue.splice(0, batchSize)
      
      if (batch.length > 0) {
        await this.submitUrls(batch)
      }

      // Continue processing if more URLs in queue
      if (this.submissionQueue.length > 0) {
        setTimeout(() => this.processQueue(), 1000) // 1 second delay between batches
      }
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Submit to a specific IndexNow endpoint
   */
  private async submitToEndpoint(endpoint: string, submission: IndexNowSubmission): Promise<Response> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(submission)
    })

    if (!response.ok) {
      throw new Error(`IndexNow API error: ${response.status} ${response.statusText}`)
    }

    return response
  }

  /**
   * Validate URL format and domain
   */
  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname === 'casa8.com' && urlObj.protocol === 'https:'
    } catch {
      return false
    }
  }

  /**
   * Submit all programmatic SEO pages at once (for initial setup)
   */
  async submitAllSEOPages(): Promise<boolean> {
    const { MAJOR_CITIES, STATES_DATA } = await import('./locations')
    
    const urls: string[] = [
      // Static pages
      BASE_URL,
      `${BASE_URL}/search`,
      `${BASE_URL}/list-property`,
      
      // State pages
      ...STATES_DATA.map(state => `${BASE_URL}/locations/${state.slug}`),
      
      // City pages
      ...MAJOR_CITIES.map(city => `${BASE_URL}/locations/${city.stateSlug}/${city.slug}`),
      
      // Property type pages
      ...MAJOR_CITIES.flatMap(city => [
        `${BASE_URL}/locations/${city.stateSlug}/${city.slug}/apartments`,
        `${BASE_URL}/locations/${city.stateSlug}/${city.slug}/houses`
      ]),
      
      // Bedroom-specific pages for top 5 cities
      ...MAJOR_CITIES.slice(0, 5).flatMap(city => 
        ['studio', '1-bedroom', '2-bedroom', '3-bedroom', '4-bedroom'].flatMap(bedroom => [
          `${BASE_URL}/locations/${city.stateSlug}/${city.slug}/${bedroom}-apartments`,
          `${BASE_URL}/locations/${city.stateSlug}/${city.slug}/${bedroom}-houses`
        ])
      )
    ]

    console.log(`Submitting ${urls.length} SEO pages to IndexNow...`)
    return this.submitUrls(urls)
  }
}

// Utility functions for easy access
export const indexNow = IndexNowService.getInstance()

export async function notifySearchEngines(url: string): Promise<boolean> {
  return indexNow.submitUrl(url)
}

export async function notifySearchEnginesMultiple(urls: string[]): Promise<boolean> {
  return indexNow.submitUrls(urls)
}

export function queueForIndexing(url: string): void {
  indexNow.queueUrl(url)
}

// Auto-submit function for new programmatic pages
export async function autoSubmitNewPage(
  type: 'city' | 'state' | 'neighborhood' | 'property-type' | 'bedroom',
  params: Record<string, string>
): Promise<void> {
  let url = BASE_URL

  switch (type) {
    case 'state':
      url += `/locations/${params.state}`
      break
    case 'city':
      url += `/locations/${params.state}/${params.city}`
      break
    case 'neighborhood':
      url += `/locations/${params.state}/${params.city}/${params.neighborhood}`
      break
    case 'property-type':
      url += `/locations/${params.state}/${params.city}/${params.propertyType}`
      break
    case 'bedroom':
      url += `/locations/${params.state}/${params.city}/${params.bedroom}-${params.propertyType}`
      break
  }

  queueForIndexing(url)
}
