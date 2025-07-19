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
          backgroundColor: '#0f172a',
          backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
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
              fontSize: 85,
              fontWeight: 'bold',
              color: '#f8fafc',
              marginBottom: '20px',
              letterSpacing: '-0.03em',
              textShadow: '0 4px 8px rgba(0,0,0,0.3)',
            }}
          >
            Casa8
          </div>
          <div
            style={{
              fontSize: 38,
              color: '#e2e8f0',
              marginBottom: '35px',
              maxWidth: '850px',
              lineHeight: 1.3,
              fontWeight: '500',
            }}
          >
            Section 8 Housing Search & Listing Platform
          </div>
          <div
            style={{
              fontSize: 26,
              color: '#cbd5e1',
              maxWidth: '950px',
              lineHeight: 1.4,
              textAlign: 'center',
              marginBottom: '35px',
            }}
          >
            Connecting Section 8 tenants with quality affordable housing
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '30px',
              marginTop: '20px',
            }}
          >
            <div
              style={{
                padding: '14px 28px',
                backgroundColor: '#3b82f6',
                borderRadius: '8px',
                color: 'white',
                fontSize: 18,
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              }}
            >
              Find Housing
            </div>
            <div
              style={{
                padding: '14px 28px',
                backgroundColor: '#10b981',
                borderRadius: '8px',
                color: 'white',
                fontSize: 18,
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              }}
            >
              List Property
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
