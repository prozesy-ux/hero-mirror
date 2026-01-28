/**
 * Session Warning Banner - Enterprise Grade
 * 
 * Shows a non-blocking warning when session is about to expire.
 * Allows users to proactively refresh before getting logged out.
 */

import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface SessionWarningBannerProps {
  minutesRemaining: number;
  onRefresh: () => void;
  onDismiss?: () => void;
}

const SessionWarningBanner = ({ 
  minutesRemaining, 
  onRefresh,
  onDismiss 
}: SessionWarningBannerProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 lg:bottom-6">
      <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-50 px-4 py-3 shadow-lg dark:border-amber-600/30 dark:bg-amber-950/90">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-500" />
        
        <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
          Session expires in {minutesRemaining} {minutesRemaining === 1 ? 'minute' : 'minutes'}
        </span>

        <Button
          size="sm"
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="ml-2 border-amber-600/30 bg-amber-100 text-amber-800 hover:bg-amber-200 dark:border-amber-500/30 dark:bg-amber-900 dark:text-amber-200 dark:hover:bg-amber-800"
        >
          {isRefreshing ? (
            <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="mr-1 h-3 w-3" />
          )}
          Refresh Now
        </Button>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-1 rounded-full p-1 text-amber-600 hover:bg-amber-200 dark:text-amber-400 dark:hover:bg-amber-800"
            aria-label="Dismiss warning"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SessionWarningBanner;
