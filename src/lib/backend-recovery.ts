/**
 * Backend Recovery Engine - Self-heals connection issues
 * SIMPLIFIED: Only signs out on definitive auth failures (401/403), never during page load
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
  action: 'recovered' | 'signed_out' | 'waiting_online' | 'failed' | 'skipped';
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

/**
 * Simplified recovery function - only invalidates caches and checks connectivity.
 * NEVER signs out automatically except for definitive 401/403 from API.
 */
export async function recoverBackend(reason: RecoveryReason): Promise<RecoveryResult> {
  // Prevent concurrent recovery attempts
  if (isRecovering) {
    healthMonitor.log('recovery', 'Already recovering, skipping duplicate call');
    return { success: false, action: 'failed', message: 'Recovery already in progress' };
  }

  // Skip recovery for page_load - let Supabase handle session hydration naturally
  if (reason === 'page_load') {
    healthMonitor.log('recovery', 'Skipping recovery for page_load - trusting Supabase hydration');
    return { success: true, action: 'skipped', message: 'Page load - using normal hydration' };
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

    // Step 2: Check current session
    const { data: { session } } = await supabase.auth.getSession();
    
    // Step 3: If no session, try to refresh
    if (!session) {
      healthMonitor.log('recovery', 'No session found, attempting refresh');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        healthMonitor.log('recovery', 'Refresh failed', { error: refreshError.message });
        
        // Only sign out if the error is definitive (invalid/expired token)
        const isDefinitiveAuthFailure = 
          refreshError.message?.includes('invalid') ||
          refreshError.message?.includes('Invalid Refresh Token') ||
          refreshError.message?.includes('Refresh Token Not Found');
        
        if (isDefinitiveAuthFailure && reason === 'auth_error') {
          healthMonitor.log('recovery', 'Definitive auth failure - signing out');
          await signOutCleanly();
          return {
            success: true,
            action: 'signed_out',
            message: 'Session expired. Please sign in again.',
          };
        }
      }
      
      if (refreshData?.session) {
        healthMonitor.log('recovery', 'Session restored via refresh');
      }
    }

    // Step 4: Invalidate React Query caches to force re-fetch
    healthMonitor.log('recovery', 'Invalidating query caches');
    await queryClient.invalidateQueries();

    // Step 5: Ping backend if we have a session
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    if (currentSession) {
      const pingSuccess = await healthMonitor.ping();

      if (!pingSuccess) {
        const healthState = healthMonitor.getState();

        // Only sign out for definitive 401/403 errors
        if (healthState.lastErrorCode === 401 || healthState.lastErrorCode === 403) {
          healthMonitor.log('recovery', 'Auth error on ping (401/403) - signing out');
          await signOutCleanly();
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
 * Clean sign out - let Supabase handle its own storage cleanup
 * DO NOT manually delete sb-* keys - let supabase.auth.signOut() handle it
 */
export async function signOutCleanly(): Promise<void> {
  healthMonitor.log('auth', 'Clean sign out initiated');

  try {
    await supabase.auth.signOut();
  } catch (error) {
    healthMonitor.log('error', 'Sign out error (continuing anyway)', { 
      error: error instanceof Error ? error.message : 'Unknown' 
    });
  }

  // Clear query cache
  queryClient.clear();
  
  healthMonitor.log('auth', 'Sign out complete');
}

/**
 * Legacy alias for signOutCleanly
 * @deprecated Use signOutCleanly instead
 */
export const forceSignOut = signOutCleanly;

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
 * Utility: Fetch with timeout + optional auth check
 * Simplified - no aggressive recovery during fetch
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
      throw new Error('No session');
    }
  };

  try {
    await assertAuth();
    return await withTimeout(fetchFn(), timeout, `${context} timeout`);
  } catch (error) {
    const err = error as Error;
    healthMonitor.log('error', `FetchWithRecovery ${context} failed`, { error: err.message });

    if (retryOnce) {
      // Simple retry - just invalidate caches and try again
      healthMonitor.log('recovery', `Retrying ${context} after cache invalidation`);
      await queryClient.invalidateQueries();
      
      try {
        await assertAuth();
        return await withTimeout(fetchFn(), timeout, `${context} timeout (retry)`);
      } catch (retryError) {
        healthMonitor.log('error', `Retry failed for ${context}`, { 
          error: retryError instanceof Error ? retryError.message : 'Unknown' 
        });
        throw retryError;
      }
    }

    throw error;
  }
}
