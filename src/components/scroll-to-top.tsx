"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function ScrollToTop() {
  const pathname = usePathname()

  useEffect(() => {
    // Scroll to top on route change, especially important for mobile
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    
    // Reset zoom level on mobile devices
    if (typeof window !== 'undefined' && window.visualViewport) {
      // Force viewport reset on mobile
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
      }
    }
  }, [pathname])

  return null
}
