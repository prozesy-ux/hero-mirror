import React, { Component, ReactNode, ErrorInfo } from 'react';
import { forceClearAllCaches } from '@/lib/cache-utils';
import { recoverBackend } from '@/lib/backend-recovery';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = async (): Promise<void> => {
    // Soft recovery (no hard reload)
    await recoverBackend('manual');
    this.setState({ hasError: false, error: null });
  };

  handleForceRefresh = async (): Promise<void> => {
    // Clear caches but do not hard reload; then recover.
    await forceClearAllCaches();
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
              <p className="text-muted-foreground text-sm">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleReset} variant="outline" className="gap-2">
                Try Again
              </Button>
              <Button onClick={this.handleForceRefresh} className="gap-2">
                <RefreshCcw className="w-4 h-4" />
                Clear Cache
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              If this problem persists, sign out and sign in again.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;