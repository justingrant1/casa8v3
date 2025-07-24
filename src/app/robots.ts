import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://casa8.com'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/dashboard-simple/',
          '/profile/',
          '/favorites/',
          '/admin/',
          '/auth/',
          '/(auth)/',
          '/apply/',
          '/messages/',
          '/_next/',
          '/private/',
          '*.json',
          '*.xml',
          '/search?*', // Allow search page but not search queries
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/dashboard-simple/',
          '/profile/',
          '/favorites/',
          '/admin/',
          '/auth/',
          '/(auth)/',
          '/apply/',
          '/messages/',
          '/_next/',
          '/private/',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/dashboard-simple/',
          '/profile/',
          '/favorites/',
          '/admin/',
          '/auth/',
          '/(auth)/',
          '/apply/',
          '/messages/',
          '/_next/',
          '/private/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
