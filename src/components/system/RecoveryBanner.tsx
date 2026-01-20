import React, { useState, useEffect } from 'react';
import { RefreshCw, WifiOff, LogOut, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  subscribeToRecovery, 
  recoverBackend, 
  forceSignOut,
  isCurrentlyRecovering 
} from '@/lib/backend-recovery';
import { useConnectivityRecovery } from '@/hooks/useReliableFetch';

interface RecoveryBannerProps {
  onRecoveryComplete?: () => void;
}

export const RecoveryBanner: React.FC<RecoveryBannerProps> = ({ onRecoveryComplete }) => {
  const [isRecovering, setIsRecovering] = useState(isCurrentlyRecovering());
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [dismissed, setDismissed] = useState(false);

  // Subscribe to recovery state
  useEffect(() => {
    const unsubscribe = subscribeToRecovery((recovering) => {
      setIsRecovering(recovering);
      if (recovering) {
        setShowBanner(true);
        setDismissed(false);
        setStatusMessage('Reconnecting to server...');
      }
    });
    return unsubscribe;
  }, []);

  // Track online/offline
  useConnectivityRecovery(() => {
    setIsOffline(false);
    if (showBanner) {
      handleRetry();
    }
  });

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setShowBanner(true);
      setDismissed(false);
      setStatusMessage('You are offline');
    };
    
    window.addEventListener('offline', handleOffline);
    return () => window.removeEventListener('offline', handleOffline);
  }, []);

  const handleRetry = async () => {
    setStatusMessage('Reconnecting...');
    const result = await recoverBackend('manual');
    
    if (result.success) {
      if (result.action === 'recovered') {
        setStatusMessage('Connected!');
        setTimeout(() => {
          setShowBanner(false);
          onRecoveryComplete?.();
        }, 1000);
      } else if (result.action === 'signed_out') {
        setStatusMessage('Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/signin';
        }, 500);
      }
    } else {
      setStatusMessage(result.message || 'Recovery failed. Please try again.');
    }
  };

  const handleSignOut = async () => {
    setStatusMessage('Signing out...');
    await forceSignOut();
    window.location.href = '/signin';
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowBanner(false);
  };

  if (!showBanner || dismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500/95 backdrop-blur-sm text-white px-4 py-2 shadow-lg animate-in slide-in-from-top duration-300">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {isOffline ? (
            <WifiOff className="h-5 w-5 animate-pulse" />
          ) : (
            <RefreshCw className={`h-5 w-5 ${isRecovering ? 'animate-spin' : ''}`} />
          )}
          <span className="text-sm font-medium">{statusMessage}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {!isRecovering && !isOffline && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRetry}
              className="text-white hover:bg-white/20 h-7 px-3"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSignOut}
            className="text-white hover:bg-white/20 h-7 px-3"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Sign Out
          </Button>
          
          {!isRecovering && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-white hover:bg-white/20 h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecoveryBanner;
