'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorBoundaryState>
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })

    // Log error to external service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Implement error logging service
      console.error('Production error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      })
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent {...this.state} onRetry={this.handleRetry} />
    }

    return this.props.children
  }
}

interface DefaultErrorFallbackProps extends ErrorBoundaryState {
  onRetry?: () => void
}

function DefaultErrorFallback({ error, onRetry }: DefaultErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            We're sorry, but something unexpected happened. Please try again.
          </p>
          
          {process.env.NODE_ENV === 'development' && error && (
            <details className="text-left bg-red-50 p-4 rounded-lg">
              <summary className="cursor-pointer text-sm font-medium text-red-800 mb-2">
                Error Details (Development Only)
              </summary>
              <pre className="text-xs text-red-700 overflow-auto">
                {error.message}
                {error.stack}
              </pre>
            </details>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={onRetry} 
              className="flex-1"
              variant="default"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="flex-1"
            >
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<ErrorBoundaryState>
) {
  const ComponentWithErrorBoundary = (props: P) => {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
  
  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return ComponentWithErrorBoundary
}

// Hook for handling async errors in components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const handleError = React.useCallback((error: Error) => {
    console.error('Async error caught:', error)
    setError(error)
  }, [])

  const clearError = React.useCallback(() => {
    setError(null)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { handleError, clearError }
}
