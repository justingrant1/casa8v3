import type { Metadata } from "next";
import { GeistSans as Geist } from "geist/font/sans";
import { GeistMono as Geist_Mono } from "geist/font/mono";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { FavoritesProvider } from "@/lib/favorites-context";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/error-boundary";
import { ScrollToTop } from "@/components/scroll-to-top";


export const metadata: Metadata = {
  title: {
    default: "Casa8 - Section 8 Housing Search & Listing Platform",
    template: "%s | Casa8"
  },
  description: "Find and list Section 8 approved rental properties with Casa8. The premier platform connecting Section 8 tenants with quality affordable housing and landlords who accept housing vouchers.",
  keywords: [
    "section 8 housing",
    "section 8 rentals",
    "housing vouchers",
    "affordable housing",
    "section 8 approved properties",
    "rental assistance",
    "subsidized housing",
    "housing choice voucher",
    "section 8 landlords",
    "low income housing"
  ],
  authors: [{ name: "Casa8 Team" }],
  creator: "Casa8",
  publisher: "Casa8",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://casa8.com'),
  alternates: {
    canonical: '/',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16', type: 'image/x-icon' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'icon', url: '/favicon.ico', sizes: '16x16', type: 'image/x-icon' },
      { rel: 'icon', url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://casa8.com',
    title: 'Casa8 - Section 8 Housing Search & Listing Platform',
    description: 'Find and list Section 8 approved rental properties with Casa8. The premier platform connecting Section 8 tenants with quality affordable housing and landlords who accept housing vouchers.',
    siteName: 'Casa8',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Casa8 - Section 8 Housing Search & Listing Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Casa8 - Section 8 Housing Search & Listing Platform',
    description: 'Find and list Section 8 approved rental properties with Casa8. The premier platform connecting Section 8 tenants with quality affordable housing and landlords who accept housing vouchers.',
    images: ['/twitter-image'],
    creator: '@casa8app',
    site: '@casa8app',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body
        className={`${Geist.variable} ${Geist_Mono.variable} antialiased`}
      >
        <ErrorBoundary>
          <AuthProvider>
            <FavoritesProvider>
              <ScrollToTop />
              {children}
              <Toaster />
            </FavoritesProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
