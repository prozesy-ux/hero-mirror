/**
 * Auth Context - Enterprise Grade
 * 
 * Provides authentication state with UI state machine properties:
 * - uiReady: Always true - render UI immediately
 * - sessionVerified: True after background validation
 * - canMutate: Only true when session is verified (safe for writes)
 * - sessionExpired: True when 12h+ expired (show soft banner)
 */

import React, { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_pro: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  isAuthenticated: boolean;
  isPro: boolean;
  isAdmin: boolean;
  
  // NEW - UI State Machine
  uiReady: boolean;          // Always true after mount - render UI immediately
  sessionVerified: boolean;  // True after background server validation
  canMutate: boolean;        // True only when session is verified (safe for writes)
  sessionExpired: boolean;   // True when 12h+ expired - show soft banner
  
  // NEW - Actions
  revalidateSession: () => Promise<void>;
  setSessionExpired: (expired: boolean) => void;
  softLogout: () => void;    // Clears state without redirect
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuth();
  
  // UI State Machine
  const [uiReady] = useState(true); // Always true - render immediately
  const [sessionVerified, setSessionVerified] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Computed: Can mutate only when session is verified and not expired
  const canMutate = sessionVerified && !sessionExpired && auth.isAuthenticated;

  // Mark session as verified once auth finishes loading with a valid user
  useEffect(() => {
    if (!auth.loading && auth.isAuthenticated && auth.user) {
      setSessionVerified(true);
      setSessionExpired(false);
    }
  }, [auth.loading, auth.isAuthenticated, auth.user]);

  // Revalidate session - called by heartbeat or manually
  const revalidateSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.log('[AuthContext] Revalidation found no session');
        setSessionVerified(false);
        return;
      }

      // Try to refresh if we have a session
      const { error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.warn('[AuthContext] Session refresh failed:', refreshError.message);
        // Don't mark as expired - let heartbeat handle that with 12h logic
        return;
      }

      setSessionVerified(true);
      setSessionExpired(false);
      console.log('[AuthContext] Session revalidated successfully');
    } catch (err) {
      console.error('[AuthContext] Revalidation error:', err);
    }
  }, []);

  // Soft logout - clears state but doesn't redirect
  // Used when user wants to view cached data even after expiry
  const softLogout = useCallback(() => {
    setSessionVerified(false);
    setSessionExpired(true);
  }, []);

  // Listen for session refresh events to resubscribe realtime channels
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('[AuthContext] Token refreshed - emitting event for realtime resubscription');
        window.dispatchEvent(new CustomEvent('session-refreshed'));
        setSessionVerified(true);
        setSessionExpired(false);
      }
      
      if (event === 'SIGNED_OUT') {
        setSessionVerified(false);
        setSessionExpired(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthContextType = {
    ...auth,
    uiReady,
    sessionVerified,
    canMutate,
    sessionExpired,
    revalidateSession,
    setSessionExpired,
    softLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
