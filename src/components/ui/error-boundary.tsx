import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global Error Boundary - Catches React errors and shows recovery UI
 * Prevents white screens and provides graceful degradation
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error?.message || error);
    console.error('[ErrorBoundary] Error name:', error?.name);
    console.error('[ErrorBoundary] Stack:', error?.stack);
    console.error('[ErrorBoundary] Component stack:', errorInfo?.componentStack);
    
    const isChunkError = error?.message?.includes('Failed to fetch dynamically imported module') ||
        error?.message?.includes('Loading chunk') ||
        error?.message?.includes('Loading CSS chunk') ||
        error?.message?.includes('Importing a module script failed');
    
    if (isChunkError) {
      const MAX_RETRIES = 3;
      const RESET_AFTER_MS = 5 * 60 * 1000; // 5 minutes

      const stored = sessionStorage.getItem('chunk_error_refresh');
      let count = 0;
      let firstAttempt = Date.now();

      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          count = parsed.count || 0;
          firstAttempt = parsed.ts || Date.now();
        } catch { /* ignore */ }
      }

      // Reset counter if it's been more than 5 minutes since first attempt
      if (Date.now() - firstAttempt > RESET_AFTER_MS) {
        count = 0;
        firstAttempt = Date.now();
      }

      if (count < MAX_RETRIES) {
        sessionStorage.setItem('chunk_error_refresh', JSON.stringify({ count: count + 1, ts: firstAttempt }));
        console.log(`[ErrorBoundary] Chunk error - auto-refresh attempt ${count + 1}/${MAX_RETRIES}`);
        // Clear caches before reload to bust stale chunks
        const reload = () => { window.location.reload(); };
        if ('caches' in window) {
          caches.keys().then(names => {
            Promise.all(names.map(n => caches.delete(n))).then(reload);
          }).catch(reload);
        } else {
          reload();
        }
        return;
      }
      // Exhausted retries - clear counter and show error UI
      sessionStorage.removeItem('chunk_error_refresh');
    }
  }

  handleRefresh = () => {
    // Clear any stale caches and reload
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    window.location.reload();
  };

  handleRetry = () => {
    // Clear chunk error counter so retries aren't blocked on next failure
    sessionStorage.removeItem('chunk_error_refresh');
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Something went wrong
              </h1>
              <p className="text-muted-foreground">
                We encountered an unexpected error. This might be due to a network issue or outdated cached files.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={this.handleRetry}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              <Button 
                onClick={this.handleRefresh}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left mt-4 p-4 bg-muted rounded-lg">
                <summary className="cursor-pointer text-sm font-medium">
                  Error Details (Dev Only)
                </summary>
                <pre className="mt-2 text-xs overflow-auto text-destructive">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
