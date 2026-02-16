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
  renderRetryCount: number;
}

const MAX_RENDER_RETRIES = 3;
const MAX_CHUNK_REFRESHES = 3;
const CHUNK_RESET_MS = 5 * 60 * 1000;

/**
 * Global Error Boundary - PERMANENT FIX
 * 
 * Strategy:
 * 1. For ANY error: silently retry rendering up to 3 times before showing UI
 * 2. For chunk errors specifically: also auto-refresh the page (clears caches)
 * 3. Only shows "Something went wrong" if ALL retries exhausted
 * 4. "Try Again" fully resets all counters for fresh start
 */
class ErrorBoundary extends Component<Props, State> {
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, renderRetryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error?.message || error);
    console.error('[ErrorBoundary] Component stack:', errorInfo?.componentStack);

    const isChunkError = error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Loading CSS chunk') ||
      error?.message?.includes('Importing a module script failed');

    // === STEP 1: For chunk errors, try page refresh with cache bust ===
    if (isChunkError) {
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

      if (Date.now() - firstAttempt > CHUNK_RESET_MS) {
        count = 0;
        firstAttempt = Date.now();
      }

      if (count < MAX_CHUNK_REFRESHES) {
        sessionStorage.setItem('chunk_error_refresh', JSON.stringify({ count: count + 1, ts: firstAttempt }));
        console.log(`[ErrorBoundary] Chunk error - auto-refresh attempt ${count + 1}/${MAX_CHUNK_REFRESHES}`);
        const reload = () => { window.location.reload(); };
        if ('caches' in window) {
          caches.keys().then(names => {
            Promise.all(names.map(n => caches.delete(n))).then(reload).catch(reload);
          }).catch(reload);
        } else {
          reload();
        }
        return;
      }
      sessionStorage.removeItem('chunk_error_refresh');
    }

    // === STEP 2: For ALL errors, silently retry rendering ===
    if (this.state.renderRetryCount < MAX_RENDER_RETRIES) {
      const nextCount = this.state.renderRetryCount + 1;
      console.log(`[ErrorBoundary] Auto-retry render attempt ${nextCount}/${MAX_RENDER_RETRIES}`);
      
      // Small delay to let transient issues (network, race conditions) resolve
      this.retryTimeout = setTimeout(() => {
        this.setState({
          hasError: false,
          error: null,
          renderRetryCount: nextCount,
        });
      }, 500 * nextCount); // 500ms, 1000ms, 1500ms progressive delay
      return;
    }

    // === STEP 3: All retries exhausted — show error UI ===
    console.error('[ErrorBoundary] All render retries exhausted, showing error UI');
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  handleRefresh = () => {
    sessionStorage.removeItem('chunk_error_refresh');
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      }).catch(() => {});
    }
    window.location.reload();
  };

  handleRetry = () => {
    sessionStorage.removeItem('chunk_error_refresh');
    this.setState({ hasError: false, error: null, renderRetryCount: 0 });
  };

  render() {
    if (this.state.hasError) {
      // If we're still within retry count, don't show error UI yet
      // (componentDidCatch will reset hasError after timeout)
      if (this.state.renderRetryCount < MAX_RENDER_RETRIES) {
        // Show nothing while waiting for auto-retry
        return <div className="min-h-screen bg-background" />;
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }

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
