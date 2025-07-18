"use client"

import { useState, useCallback } from "react"

interface ToastMessage {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

let toastCounter = 0

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const toast = useCallback(({ title, description, variant = "default" }: {
    title?: string
    description?: string
    variant?: "default" | "destructive"
  }) => {
    const id = `toast-${++toastCounter}`
    const newToast: ToastMessage = { id, title, description, variant }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
    
    return { id, dismiss: () => setToasts(prev => prev.filter(t => t.id !== id)) }
  }, [])

  const dismiss = useCallback((toastId?: string) => {
    if (toastId) {
      setToasts(prev => prev.filter(t => t.id !== toastId))
    } else {
      setToasts([])
    }
  }, [])

  return {
    toasts,
    toast,
    dismiss,
  }
}
