import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { healthMonitor } from '@/lib/health-monitor';
import { recoverBackend } from '@/lib/backend-recovery';

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

function isProtectedPath(pathname: string): boolean {
  return pathname.startsWith('/dashboard') || pathname.startsWith('/seller');
}

/**
 * Global session hydration gate - ensures auth is ready before rendering protected routes.
 * Prevents blank pages/infinite loaders by guaranteeing that auth state is settled before any data queries run.
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

  // Keep ref in sync so waitForHydration never uses stale state (prevents hangs).
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

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
        expiresAt: session.expires_at,
      });
      return session;
    }

    // Step 2: No session yet - try refreshSession (may restore from stored refresh token)
    healthMonitor.log('auth', 'No session found, attempting refreshSession');

    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

    if (refreshError) {
      // Don't treat this as fatal - might just be no stored tokens
      healthMonitor.log('auth', 'refreshSession returned error (may be expected)', {
        error: refreshError.message,
      });
    }

    if (refreshData?.session) {
      healthMonitor.log('auth', 'Session restored via refreshSession', {
        userId: refreshData.session.user.id,
        expiresAt: refreshData.session.expires_at,
      });
      return refreshData.session;
    }

    // Step 3: Grace period polling - handles race where tokens exist but aren't hydrated yet
    healthMonitor.log('auth', 'Entering grace period polling');

    while (Date.now() - startTime < HYDRATION_GRACE_MS) {
      await new Promise((resolve) => setTimeout(resolve, HYDRATION_POLL_INTERVAL));

      if (!mountedRef.current) return null;

      const { data: { session: polledSession } } = await supabase.auth.getSession();

      if (polledSession) {
        healthMonitor.log('auth', 'Session found during grace polling', {
          userId: polledSession.user.id,
          elapsedMs: Date.now() - startTime,
        });
        return polledSession;
      }
    }

    // Step 4: Grace period expired - no session available
    healthMonitor.log('auth', 'Hydration complete - no session found', {
      elapsedMs: Date.now() - startTime,
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

        const nextState: SessionHydrationState = {
          hydrated: true,
          session,
          status: session ? 'ready' : 'no_session',
          error: null,
        };

        setState(nextState);

        // If we are on a protected route with no session, attempt a safe recovery once.
        // (This does NOT wipe tokens on page_load.)
        if (!session && isProtectedPath(window.location.pathname)) {
          healthMonitor.log('recovery', 'No session on protected route after hydration - attempting page_load recovery');
          await recoverBackend('page_load');
        }
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

    // Keep state in sync after hydration
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return;

      healthMonitor.log('auth', `Auth state change: ${event}`, {
        hasSession: !!session,
        userId: session?.user?.id,
        expiresAt: session?.expires_at,
      });

      setState((prev) => {
        if (!prev.hydrated) return prev;
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

  // Hydration UI
  if (!state.hydrated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        <p className="text-muted-foreground text-sm">Restoring session...</p>
      </div>
    );
  }

  // If user is on a protected route and there is no session, show a safe UI instead of blank.
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

