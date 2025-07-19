import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
 
export const alt = 'Casa8 - Section 8 Housing Search & Listing Platform'
export const size = {
  width: 1200,
  height: 630,
}
 
export const contentType = 'image/png'
 
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1e293b',
          backgroundImage: 'linear-gradient(45deg, #1e293b 0%, #334155 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '60px',
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: 'bold',
              color: '#f1f5f9',
              marginBottom: '20px',
              letterSpacing: '-0.02em',
            }}
          >
            Casa8
          </div>
          <div
            style={{
              fontSize: 36,
              color: '#cbd5e1',
              marginBottom: '40px',
              maxWidth: '800px',
              lineHeight: 1.4,
            }}
          >
            Section 8 Housing Search & Listing Platform
          </div>
          <div
            style={{
              fontSize: 24,
              color: '#94a3b8',
              maxWidth: '900px',
              lineHeight: 1.5,
              textAlign: 'center',
            }}
          >
            Find and list Section 8 approved rental properties. Connecting tenants with quality affordable housing and landlords who accept housing vouchers.
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: '40px',
              padding: '16px 32px',
              backgroundColor: '#3b82f6',
              borderRadius: '8px',
              color: 'white',
              fontSize: 20,
              fontWeight: '600',
            }}
          >
            Find Section 8 Housing
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
