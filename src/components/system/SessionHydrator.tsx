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

// Simplified hydration - trust Supabase's built-in session management
const MAX_HYDRATION_WAIT_MS = 2000;

function isProtectedPath(pathname: string): boolean {
  return pathname.startsWith('/dashboard') || pathname.startsWith('/seller');
}

/**
 * Simplified Session Hydrator - trusts Supabase's detectSessionInUrl and autoRefreshToken.
 * No aggressive recovery during page load - let the auth system work naturally.
 */
export function SessionHydrator({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionHydrationState>({
    hydrated: false,
    session: null,
    status: 'hydrating',
    error: null,
  });

  const stateRef = useRef<SessionHydrationState>(state);
  const initRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    mountedRef.current = true;

    const startTime = Date.now();
    let hydrationComplete = false;

    healthMonitor.log('auth', 'Session hydration started (simplified)');

    // Set up auth state listener FIRST (per Supabase best practices)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return;

      healthMonitor.log('auth', `Auth state change: ${event}`, {
        hasSession: !!session,
        userId: session?.user?.id,
        expiresAt: session?.expires_at,
      });

      // If we get INITIAL_SESSION or SIGNED_IN, that completes hydration
      if (!hydrationComplete && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        hydrationComplete = true;
        healthMonitor.log('auth', 'Hydration completed via auth event', { event, elapsedMs: Date.now() - startTime });
        
        setState({
          hydrated: true,
          session,
          status: session ? 'ready' : 'no_session',
          error: null,
        });
        return;
      }

      // After initial hydration, just keep state in sync
      if (hydrationComplete) {
        setState((prev) => ({
          ...prev,
          session,
          status: session ? 'ready' : 'no_session',
        }));
      }
    });

    // Fallback: Call getSession() to trigger hydration if no auth event fires
    const hydrateViaGetSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          healthMonitor.log('error', 'getSession error', { error: error.message });
        }

        // If we already completed hydration via onAuthStateChange, skip
        if (hydrationComplete || !mountedRef.current) return;

        // If no session, try refreshSession once (handles stored refresh tokens)
        if (!session) {
          healthMonitor.log('auth', 'No session from getSession, trying refreshSession');
          const { data: refreshData } = await supabase.auth.refreshSession();
          
          if (refreshData?.session && mountedRef.current && !hydrationComplete) {
            hydrationComplete = true;
            healthMonitor.log('auth', 'Session restored via refreshSession');
            setState({
              hydrated: true,
              session: refreshData.session,
              status: 'ready',
              error: null,
            });
            return;
          }
        }

        // Give a brief window for OAuth tokens to be processed from URL
        if (!session && !hydrationComplete) {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          if (hydrationComplete || !mountedRef.current) return;
          
          // Final check
          const { data: { session: finalSession } } = await supabase.auth.getSession();
          
          if (!hydrationComplete && mountedRef.current) {
            hydrationComplete = true;
            healthMonitor.log('auth', 'Hydration complete (fallback path)', { 
              hasSession: !!finalSession,
              elapsedMs: Date.now() - startTime 
            });
            setState({
              hydrated: true,
              session: finalSession,
              status: finalSession ? 'ready' : 'no_session',
              error: null,
            });
          }
        } else if (session && !hydrationComplete && mountedRef.current) {
          hydrationComplete = true;
          healthMonitor.log('auth', 'Session found via getSession');
          setState({
            hydrated: true,
            session,
            status: 'ready',
            error: null,
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Hydration failed';
        healthMonitor.log('error', 'Hydration error', { error: errorMessage });

        if (!hydrationComplete && mountedRef.current) {
          hydrationComplete = true;
          setState({
            hydrated: true,
            session: null,
            status: 'no_session',
            error: errorMessage,
          });
        }
      }
    };

    hydrateViaGetSession();

    // Safety timeout - ensure we always complete hydration
    const timeout = setTimeout(() => {
      if (!hydrationComplete && mountedRef.current) {
        hydrationComplete = true;
        healthMonitor.log('auth', 'Hydration timeout - completing with current state');
        setState((prev) => ({
          ...prev,
          hydrated: true,
          status: prev.session ? 'ready' : 'no_session',
        }));
      }
    }, MAX_HYDRATION_WAIT_MS);

    return () => {
      mountedRef.current = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const waitForHydration = useCallback(async (): Promise<Session | null> => {
    if (stateRef.current.hydrated) return stateRef.current.session;

    return new Promise((resolve) => {
      const check = () => {
        if (stateRef.current.hydrated) {
          resolve(stateRef.current.session);
          return;
        }
        setTimeout(check, 100);
      };
      check();
    });
  }, []);

  const contextValue: SessionHydrationContextValue = {
    ...state,
    waitForHydration,
  };

  // Loading UI during hydration
  if (!state.hydrated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        <p className="text-muted-foreground text-sm">Restoring session...</p>
      </div>
    );
  }

  // Protected route with no session - show sign in prompt
  if (state.status === 'no_session' && isProtectedPath(window.location.pathname)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-foreground text-sm font-medium">Session required</p>
        <p className="text-muted-foreground text-sm max-w-md">
          Please sign in again to continue.
        </p>
        <button
          type="button"
          onClick={() => {
            window.location.href = '/signin';
          }}
          className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  return (
    <SessionHydrationContext.Provider value={contextValue}>
      {children}
    </SessionHydrationContext.Provider>
  );
}

export function useSessionHydration(): SessionHydrationContextValue {
  const context = useContext(SessionHydrationContext);
  if (!context) {
    throw new Error('useSessionHydration must be used within SessionHydrator');
  }
  return context;
}

export function useIsSessionReady(): boolean {
  const context = useContext(SessionHydrationContext);
  return context?.status === 'ready';
}
