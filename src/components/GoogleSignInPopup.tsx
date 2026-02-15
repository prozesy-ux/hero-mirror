import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { lovable } from '@/integrations/lovable/index';
import { X } from 'lucide-react';

const DISMISS_KEY = 'google-signin-popup-dismissed';

const GoogleSignInPopup = () => {
  const { isAuthenticated } = useAuthContext();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const hiddenRoutes = ['/signin', '/signup', '/reset-password'];
  const shouldHide = isAuthenticated || hiddenRoutes.includes(location.pathname);

  useEffect(() => {
    if (shouldHide || sessionStorage.getItem(DISMISS_KEY)) return;
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, [shouldHide]);

  if (!visible || shouldHide) return null;

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem(DISMISS_KEY, 'true');
  };

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await lovable.auth.signInWithOAuth('google', {
        redirect_uri: `${window.location.origin}/signin`,
      });
    } catch (err) {
      console.error('Google sign-in error:', err);
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed top-4 right-4 z-50 w-[300px] animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <div className="relative rounded-xl border border-border/60 bg-card/95 backdrop-blur-md shadow-xl p-4">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted/80 transition-colors text-muted-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Welcome to Uptoza</p>
            <p className="text-xs text-muted-foreground">Sign in for the best experience</p>
          </div>
        </div>

        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors px-4 py-2.5 text-sm font-medium text-foreground disabled:opacity-60"
        >
          {loading ? (
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          Continue with Google
        </button>
      </div>
    </div>
  );
};

export default GoogleSignInPopup;
