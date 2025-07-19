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
  title: "Casa8",
  description: "A modern property management platform",
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
