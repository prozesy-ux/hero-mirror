import React, { Component, ReactNode, ErrorInfo } from 'react';
import { forceClearAllCaches } from '@/lib/cache-utils';
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

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleForceRefresh = (): void => {
    forceClearAllCaches();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">Something went wrong</h2>
              <p className="text-slate-600 text-sm">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={this.handleReset}
                variant="outline"
                className="gap-2"
              >
                Try Again
              </Button>
              <Button 
                onClick={this.handleForceRefresh}
                className="gap-2 bg-violet-600 hover:bg-violet-700"
              >
                <RefreshCcw className="w-4 h-4" />
                Clear Cache & Reload
              </Button>
            </div>
            
            <p className="text-xs text-slate-500">
              If this problem persists, try clearing your browser cache or contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;