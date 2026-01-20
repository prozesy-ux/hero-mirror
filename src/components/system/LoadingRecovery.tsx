import React, { useEffect, useState } from 'react';
import { RefreshCw, AlertTriangle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { recoverBackend, forceSignOut } from '@/lib/backend-recovery';

interface LoadingRecoveryProps {
  /** What we're trying to load */
  context: string;
  /** Callback when retry is clicked */
  onRetry: () => void;
  /** Whether to show auto-recovery message */
  showAutoRecovery?: boolean;
  /** Custom message */
  message?: string;
}

/**
 * A recovery UI shown when data fails to load.
 * Replaces blank screens with actionable recovery options.
 */
export const LoadingRecovery: React.FC<LoadingRecoveryProps> = ({
  context,
  onRetry,
  showAutoRecovery = true,
  message
}) => {
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [autoRecoveryAttempted, setAutoRecoveryAttempted] = useState(false);

  // Auto-attempt recovery once on mount
  useEffect(() => {
    if (showAutoRecovery && !autoRecoveryAttempted) {
      setAutoRecoveryAttempted(true);
      handleRecovery();
    }
  }, [showAutoRecovery, autoRecoveryAttempted]);

  const handleRecovery = async () => {
    setIsRecovering(true);
    setRecoveryMessage('Attempting to reconnect...');
    
    try {
      const result = await recoverBackend('loading_timeout');
      
      if (result.success && result.action === 'recovered') {
        setRecoveryMessage('Connection restored! Retrying...');
        setTimeout(() => {
          onRetry();
        }, 500);
      } else if (result.action === 'signed_out') {
        setRecoveryMessage('Session expired. Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/signin';
        }, 1000);
      } else {
        setRecoveryMessage(result.message || 'Unable to connect. Please try again.');
        setIsRecovering(false);
      }
    } catch (error) {
      setRecoveryMessage('Recovery failed. Please try again.');
      setIsRecovering(false);
    }
  };

  const handleSignOut = async () => {
    await forceSignOut();
    window.location.href = '/signin';
  };

  return (
    <div className="min-h-[300px] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
          <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>
        
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {message || `Unable to load ${context}`}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-6">
          {isRecovering 
            ? recoveryMessage 
            : recoveryMessage || 'There was a problem connecting to the server. This might be a temporary issue.'
          }
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={handleRecovery}
            disabled={isRecovering}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRecovering ? 'animate-spin' : ''}`} />
            {isRecovering ? 'Reconnecting...' : 'Try Again'}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-6">
          If this keeps happening, try refreshing the page or clearing your browser cache.
        </p>
      </div>
    </div>
  );
};

export default LoadingRecovery;
