import type { Metadata } from "next";
import { GeistSans as Geist } from "geist/font/sans";
import { GeistMono as Geist_Mono } from "geist/font/mono";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { FavoritesProvider } from "@/lib/favorites-context";
import { Toaster } from "@/components/ui/toaster";


export const metadata: Metadata = {
  title: "Casa8",
  description: "A modern property management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${Geist.variable} ${Geist_Mono.variable} antialiased`}
      >
        <AuthProvider>
          <FavoritesProvider>
            {children}
            <Toaster />
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
