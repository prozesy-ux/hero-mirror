/**
 * Backend Recovery Engine - Self-heals connection issues
 * CRITICAL: Never wipes auth tokens during page_load hydration
 */
import { supabase } from '@/integrations/supabase/client';
import { healthMonitor } from './health-monitor';
import { queryClient } from './query-client';

export type RecoveryReason =
  | 'timeout'
  | 'auth_error'
  | 'network_error'
  | 'reconnect'
  | 'loading_timeout'
  | 'page_load'
  | 'seller_profile_missing'
  | 'manual'
  | 'retry';

export interface RecoveryResult {
  success: boolean;
  action: 'recovered' | 'signed_out' | 'waiting_online' | 'failed' | 'hydration_pending';
  message: string;
}

let isRecovering = false;
let recoveryListeners: Set<(recovering: boolean) => void> = new Set();

function notifyRecoveryListeners(recovering: boolean) {
  recoveryListeners.forEach((listener) => listener(recovering));
}

export function subscribeToRecovery(listener: (recovering: boolean) => void): () => void {
  recoveryListeners.add(listener);
  return () => recoveryListeners.delete(listener);
}

export function isCurrentlyRecovering(): boolean {
  return isRecovering;
}

function isProtectedPath(pathname: string): boolean {
  return pathname.startsWith('/dashboard') || pathname.startsWith('/seller');
}

// Grace period constants for page_load recovery
const PAGE_LOAD_GRACE_MS = 3000;
const PAGE_LOAD_POLL_INTERVAL = 300;

/**
 * Attempts to get session with grace period for hydration
 * Returns session if found, null if genuinely no session after waiting
 */
async function getSessionWithGrace(): Promise<{ session: any; wasHydrationDelay: boolean }> {
  const startTime = Date.now();
  
  // First attempt
  let { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    return { session, wasHydrationDelay: false };
  }
  
  // Try refreshSession
  healthMonitor.log('recovery', 'No initial session, attempting refresh');
  const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
  
  if (refreshError) {
    healthMonitor.log('recovery', 'refreshSession error', { error: refreshError.message });
    
    // Check for definitive invalid token errors
    if (refreshError.message?.includes('invalid') || 
        refreshError.message?.includes('expired') ||
        refreshError.message?.includes('Invalid Refresh Token')) {
      return { session: null, wasHydrationDelay: false };
    }
  }
  
  if (refreshData?.session) {
    healthMonitor.log('recovery', 'Session restored via refresh');
    return { session: refreshData.session, wasHydrationDelay: true };
  }
  
  // Grace period polling
  while (Date.now() - startTime < PAGE_LOAD_GRACE_MS) {
    await new Promise(resolve => setTimeout(resolve, PAGE_LOAD_POLL_INTERVAL));
    
    const { data: { session: polledSession } } = await supabase.auth.getSession();
    
    if (polledSession) {
      healthMonitor.log('recovery', 'Session found during grace polling', {
        elapsedMs: Date.now() - startTime
      });
      return { session: polledSession, wasHydrationDelay: true };
    }
  }
  
  return { session: null, wasHydrationDelay: false };
}

/**
 * Central recovery function - call this instead of doing manual cache clears.
 * CRITICAL: For page_load reason, we NEVER call forceSignOut to prevent token deletion during hydration races.
 */
export async function recoverBackend(reason: RecoveryReason): Promise<RecoveryResult> {
  // Prevent concurrent recovery attempts
  if (isRecovering) {
    healthMonitor.log('recovery', 'Already recovering, skipping duplicate call');
    return { success: false, action: 'failed', message: 'Recovery already in progress' };
  }

  isRecovering = true;
  notifyRecoveryListeners(true);
  healthMonitor.setRecovering(true);

  healthMonitor.log('recovery', `Starting recovery (reason: ${reason})`);

  try {
    // Step 1: Check if we're online
    if (!navigator.onLine) {
      healthMonitor.log('recovery', 'Offline - waiting for connection');
      return {
        success: false,
        action: 'waiting_online',
        message: 'Waiting for internet connection',
      };
    }

    // Step 2: Session handling with grace period
    const { session: finalSession, wasHydrationDelay } = await getSessionWithGrace();
    
    // CRITICAL: For page_load reason, NEVER sign out even if no session
    // This prevents the race condition where tokens exist but aren't hydrated yet
    if (reason === 'page_load') {
      if (!finalSession && isProtectedPath(window.location.pathname)) {
        healthMonitor.log('recovery', 'No session on protected route during page_load - NOT signing out (hydration pending)');
        // Don't sign out - let the SessionHydrator handle this
        return {
          success: false,
          action: 'hydration_pending',
          message: 'Session hydration pending - authentication may complete shortly',
        };
      }
      
      if (finalSession) {
        healthMonitor.log('recovery', 'Session confirmed during page_load', {
          userId: finalSession.user?.id,
          wasHydrationDelay
        });
      }
    } else {
      // For other reasons (timeout, auth_error, manual, etc.)
      // Only sign out if we have strong evidence of invalid auth
      if (!finalSession && isProtectedPath(window.location.pathname)) {
        // Check if we should sign out - only for explicit auth errors or manual trigger
        if (reason === 'auth_error' || reason === 'manual') {
          healthMonitor.log('recovery', `No session on protected route (reason: ${reason}) - signing out`);
          await forceSignOut();
          return {
            success: true,
            action: 'signed_out',
            message: 'Session expired. Please sign in again.',
          };
        } else {
          // For timeout/network errors, don't sign out - might be temporary
          healthMonitor.log('recovery', `No session but reason (${reason}) is not definitive - not signing out`);
        }
      }
    }

    // Step 3: Invalidate all React Query caches to force re-fetch
    healthMonitor.log('recovery', 'Invalidating query caches');
    await queryClient.invalidateQueries();

    // Step 4: Verify we can reach the backend (only if we have a session)
    if (finalSession) {
      const pingSuccess = await healthMonitor.ping();

      if (!pingSuccess) {
        const healthState = healthMonitor.getState();

        // Check if it's an auth issue (401/403 after we had a session)
        if (healthState.lastErrorCode === 401 || healthState.lastErrorCode === 403) {
          healthMonitor.log('recovery', 'Auth error on ping (401/403) - signing out');
          await forceSignOut();
          return {
            success: true,
            action: 'signed_out',
            message: 'Authentication failed. Please sign in again.',
          };
        }

        // Other errors - report failure but don't sign out
        return {
          success: false,
          action: 'failed',
          message: `Backend unreachable: ${healthState.lastError || 'Unknown error'}`,
        };
      }
    }

    healthMonitor.log('recovery', 'Recovery successful');
    return {
      success: true,
      action: 'recovered',
      message: 'Connection restored',
    };
  } catch (error) {
    healthMonitor.log('error', 'Unexpected recovery error', { 
      error: error instanceof Error ? error.message : 'Unknown' 
    });
    return {
      success: false,
      action: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error during recovery',
    };
  } finally {
    isRecovering = false;
    notifyRecoveryListeners(false);
    healthMonitor.setRecovering(false);
  }
}

/**
 * Force sign out - clean state and redirect to login
 * IMPORTANT: This clears auth tokens - only call when we're sure auth is invalid
 */
export async function forceSignOut(): Promise<void> {
  healthMonitor.log('auth', 'Force sign out initiated');

  try {
    await supabase.auth.signOut();
  } catch (error) {
    healthMonitor.log('error', 'Sign out error (continuing anyway)', { 
      error: error instanceof Error ? error.message : 'Unknown' 
    });
  }

  // Clear query cache
  queryClient.clear();

  // Clear any stale session data
  try {
    // Preserve essential keys
    const preserveKeys = ['storeReturn', 'pendingPurchase', 'pendingChat', 'sidebar-collapsed'];
    const preserved: Record<string, string> = {};

    preserveKeys.forEach((key) => {
      const value = localStorage.getItem(key);
      if (value) preserved[key] = value;
    });

    // Clear session-related storage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    // Restore preserved keys
    Object.entries(preserved).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    
    healthMonitor.log('auth', 'Auth storage cleared', { keysRemoved: keysToRemove.length });
  } catch (error) {
    healthMonitor.log('error', 'Storage cleanup error', { 
      error: error instanceof Error ? error.message : 'Unknown' 
    });
  }
}

/**
 * Utility: Wrap a promise with a timeout
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage = 'Request timeout'): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(timeoutMessage)), ms)),
  ]);
}

/**
 * Utility: Fetch with timeout + optional auth guard + auto-recovery
 * Now respects SessionHydrator - waits for hydration before checking auth
 */
export async function fetchWithRecovery<T>(
  fetchFn: () => Promise<T>,
  options: {
    timeout?: number;
    retryOnce?: boolean;
    context?: string;
    requireAuth?: boolean;
  } = {}
): Promise<T> {
  const { timeout = 15000, retryOnce = true, context = 'fetch', requireAuth = true } = options;

  const assertAuth = async () => {
    if (!requireAuth) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // Give a brief moment for session to hydrate (common after full page refresh)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data: { session: retrySession } } = await supabase.auth.getSession();
      if (!retrySession) {
        throw new Error('No session');
      }
    }
  };

  try {
    await assertAuth();
    return await withTimeout(fetchFn(), timeout, `${context} timeout`);
  } catch (error) {
    const err = error as Error;
    healthMonitor.log('error', `FetchWithRecovery ${context} failed`, { error: err.message });

    if (retryOnce) {
      // Use 'retry' reason instead of 'page_load' to allow proper recovery
      const recoveryReason: RecoveryReason = err.message === 'No session' ? 'auth_error' : 'timeout';
      const result = await recoverBackend(recoveryReason);

      if (result.success && result.action === 'recovered') {
        healthMonitor.log('recovery', `Retrying ${context} after recovery`);
        await assertAuth();
        return await withTimeout(fetchFn(), timeout, `${context} timeout (retry)`);
      }

      if (result.action === 'signed_out') {
        throw new Error('Session expired');
      }
    }

    throw error;
  }
}
