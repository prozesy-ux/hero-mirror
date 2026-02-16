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

const RELOAD_KEY = 'eb_auto_reload';
const RELOAD_RESET_MS = 60 * 1000; // Reset after 1 minute

/**
 * Global Error Boundary - PERMANENT FIX v2
 * 
 * Strategy: On ANY first error, clear all caches and do a full page reload.
 * Only show "Something went wrong" if the reload ALSO fails (second crash).
 * This catches stale SW cache errors, chunk errors, type errors — everything.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught:', error?.message);

    // Check if we already tried an auto-reload recently
    const stored = sessionStorage.getItem(RELOAD_KEY);
    if (stored) {
      const ts = parseInt(stored, 10);
      // If the reload was recent and we crashed again, show error UI (don't loop)
      if (Date.now() - ts < RELOAD_RESET_MS) {
        console.error('[ErrorBoundary] Already reloaded recently, showing error UI');
        sessionStorage.removeItem(RELOAD_KEY);
        return;
      }
    }

    // First crash: mark timestamp, clear caches, reload
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    console.log('[ErrorBoundary] First error — clearing caches and reloading');

    const reload = () => { window.location.reload(); };

    // Clear SW caches then reload
    if ('caches' in window) {
      caches.keys()
        .then(names => Promise.all(names.map(n => caches.delete(n))))
        .then(reload)
        .catch(reload);
    } else {
      reload();
    }
  }

  handleRefresh = () => {
    sessionStorage.removeItem(RELOAD_KEY);
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      }).catch(() => {});
    }
    window.location.reload();
  };

  handleRetry = () => {
    sessionStorage.removeItem(RELOAD_KEY);
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
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
