/**
 * Session Expired Banner
 * 
 * A soft, non-intrusive notification that appears when the session
 * has expired. Does NOT force redirect - user stays on page and
 * can click to re-login when ready.
 * 
 * This follows the "enterprise UX" pattern: never kick users out,
 * let them choose when to re-authenticate.
 */

import { useState } from 'react';
import { Clock, X, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface SessionExpiredBannerProps {
  onRelogin?: () => void;
  onDismiss?: () => void;
}

const SessionExpiredBanner = ({ onRelogin, onDismiss }: SessionExpiredBannerProps) => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleRelogin = () => {
    // Store current path for redirect after login
    sessionStorage.setItem('authRedirectPath', window.location.pathname);
    
    if (onRelogin) {
      onRelogin();
    } else {
      navigate('/signin');
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 shadow-lg backdrop-blur-sm">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-warning/20">
          <Clock className="h-5 w-5 text-warning" />
        </div>
        
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">Session Expired</span>
          <span className="text-xs text-muted-foreground">Click to sign in again</span>
        </div>

        <Button 
          size="sm" 
          onClick={handleRelogin}
          className="ml-2 gap-1.5"
        >
          <LogIn className="h-3.5 w-3.5" />
          Sign In
        </Button>

        <button
          onClick={handleDismiss}
          className="ml-1 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default SessionExpiredBanner;
