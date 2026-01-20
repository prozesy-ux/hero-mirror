import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { healthMonitor } from '@/lib/health-monitor';

type HydrationStatus = 'hydrating' | 'ready' | 'no_session';

interface SessionHydrationState {
  hydrated: boolean;
  session: Session | null;
  status: HydrationStatus;
  error: string | null;
}

interface SessionHydrationContextValue extends SessionHydrationState {
  waitForHydration: () => Promise<Session | null>;
}

const SessionHydrationContext = createContext<SessionHydrationContextValue | null>(null);

const HYDRATION_GRACE_MS = 3000; // Wait up to 3 seconds for session
const HYDRATION_POLL_INTERVAL = 300; // Poll every 300ms

/**
 * Global session hydration gate - ensures auth is ready before rendering protected routes.
 * This prevents the "works until refresh" issue by blocking data fetches until session is confirmed.
 */
export function SessionHydrator({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionHydrationState>({
    hydrated: false,
    session: null,
    status: 'hydrating',
    error: null,
  });
  
  const initRef = useRef(false);
  const mountedRef = useRef(true);

  const hydrateSession = useCallback(async (): Promise<Session | null> => {
    const startTime = Date.now();
    
    healthMonitor.log('auth', 'Session hydration started');
    
    // Step 1: Try to get existing session
    let { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      healthMonitor.log('error', 'getSession error during hydration', { error: error.message });
    }
    
    if (session) {
      healthMonitor.log('auth', 'Session found immediately', { 
        userId: session.user.id,
        expiresAt: session.expires_at 
      });
      return session;
    }
    
    // Step 2: No session yet - try refreshSession (may restore from stored refresh token)
    healthMonitor.log('auth', 'No session found, attempting refreshSession');
    
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      // Don't treat this as fatal - might just be no stored tokens
      healthMonitor.log('auth', 'refreshSession returned error (may be expected)', { 
        error: refreshError.message 
      });
    }
    
    if (refreshData?.session) {
      healthMonitor.log('auth', 'Session restored via refreshSession', {
        userId: refreshData.session.user.id,
        expiresAt: refreshData.session.expires_at
      });
      return refreshData.session;
    }
    
    // Step 3: Grace period polling - wait for onAuthStateChange to potentially fire
    // This handles race conditions where tokens exist but aren't hydrated yet
    healthMonitor.log('auth', 'Entering grace period polling');
    
    while (Date.now() - startTime < HYDRATION_GRACE_MS) {
      await new Promise(resolve => setTimeout(resolve, HYDRATION_POLL_INTERVAL));
      
      if (!mountedRef.current) return null;
      
      const { data: { session: polledSession } } = await supabase.auth.getSession();
      
      if (polledSession) {
        healthMonitor.log('auth', 'Session found during grace polling', {
          userId: polledSession.user.id,
          elapsedMs: Date.now() - startTime
        });
        return polledSession;
      }
    }
    
    // Step 4: Grace period expired - no session available
    healthMonitor.log('auth', 'Hydration complete - no session found', {
      elapsedMs: Date.now() - startTime
    });
    
    return null;
  }, []);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    mountedRef.current = true;

    const runHydration = async () => {
      try {
        const session = await hydrateSession();
        
        if (!mountedRef.current) return;
        
        setState({
          hydrated: true,
          session,
          status: session ? 'ready' : 'no_session',
          error: null,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Hydration failed';
        healthMonitor.log('error', 'Session hydration failed', { error: errorMessage });
        
        if (!mountedRef.current) return;
        
        setState({
          hydrated: true,
          session: null,
          status: 'no_session',
          error: errorMessage,
        });
      }
    };

    runHydration();

    // Also listen for auth state changes to update session after hydration
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return;
      
      healthMonitor.log('auth', `Auth state change: ${event}`, {
        hasSession: !!session,
        userId: session?.user?.id,
        expiresAt: session?.expires_at
      });
      
      // Update state if we're already hydrated
      setState(prev => {
        if (!prev.hydrated) return prev; // Don't update during initial hydration
        
        return {
          ...prev,
          session,
          status: session ? 'ready' : 'no_session',
        };
      });
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [hydrateSession]);

  // Function to wait for hydration - useful for fetchWithRecovery
  const waitForHydration = useCallback(async (): Promise<Session | null> => {
    if (state.hydrated) return state.session;
    
    // Wait for hydration to complete
    return new Promise((resolve) => {
      const checkHydration = () => {
        if (state.hydrated) {
          resolve(state.session);
        } else {
          setTimeout(checkHydration, 100);
        }
      };
      checkHydration();
    });
  }, [state.hydrated, state.session]);

  const contextValue: SessionHydrationContextValue = {
    ...state,
    waitForHydration,
  };

  // Show hydration UI while waiting
  if (!state.hydrated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        <p className="text-muted-foreground text-sm">Restoring session...</p>
      </div>
    );
  }

  return (
    <SessionHydrationContext.Provider value={contextValue}>
      {children}
    </SessionHydrationContext.Provider>
  );
}

/**
 * Hook to access session hydration state
 */
export function useSessionHydration(): SessionHydrationContextValue {
  const context = useContext(SessionHydrationContext);
  if (!context) {
    throw new Error('useSessionHydration must be used within SessionHydrator');
  }
  return context;
}

/**
 * Hook to check if session is ready (hydrated + has session)
 */
export function useIsSessionReady(): boolean {
  const context = useContext(SessionHydrationContext);
  return context?.status === 'ready';
}
