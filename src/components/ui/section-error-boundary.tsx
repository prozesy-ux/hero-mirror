import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { recoverBackend } from '@/lib/backend-recovery';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onRetry?: () => void;
  sectionName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class SectionErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Section error:', this.props.sectionName || 'Unknown', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      
      return (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-destructive mb-2">
            {this.props.sectionName ? `${this.props.sectionName} failed to load` : 'Section failed to load'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={async () => {
              // Use smart recovery instead of hard reload
              await recoverBackend('manual');
              this.setState({ hasError: false, error: undefined });
              this.props.onRetry?.();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-destructive/20 hover:bg-destructive/30 text-destructive rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
