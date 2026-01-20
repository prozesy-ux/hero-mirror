/**
 * Backend Recovery Engine - Self-heals connection issues
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
  | 'manual';

export interface RecoveryResult {
  success: boolean;
  action: 'recovered' | 'signed_out' | 'waiting_online' | 'failed';
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

/**
 * Central recovery function - call this instead of doing manual cache clears.
 * Updated to handle full page reload hydration issues by attempting refreshSession even when getSession() is null.
 */
export async function recoverBackend(reason: RecoveryReason): Promise<RecoveryResult> {
  // Prevent concurrent recovery attempts
  if (isRecovering) {
    console.log('[Recovery] Already recovering, skipping duplicate call');
    return { success: false, action: 'failed', message: 'Recovery already in progress' };
  }

  isRecovering = true;
  notifyRecoveryListeners(true);
  healthMonitor.setRecovering(true);

  console.log(`[Recovery] Starting recovery (reason: ${reason})`);

  try {
    // Step 1: Check if we're online
    if (!navigator.onLine) {
      console.log('[Recovery] Offline - waiting for connection');
      return {
        success: false,
        action: 'waiting_online',
        message: 'Waiting for internet connection',
      };
    }

    // Step 2: Attempt to hydrate/refresh session (important on full page reload)
    const { data: { session: initialSession }, error: initialSessionError } = await supabase.auth.getSession();

    if (initialSessionError) {
      console.warn('[Recovery] Session getSession error:', initialSessionError.message);
    }

    // Always attempt refreshSession: if a refresh token exists in storage, this will restore the session
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

    if (refreshError) {
      console.warn('[Recovery] Session refresh failed:', refreshError.message);
    } else if (refreshData.session) {
      console.log('[Recovery] Session refreshed successfully');
    }

    const { data: { session: finalSession } } = await supabase.auth.getSession();

    // If we're on a protected route and STILL don't have a session, sign out cleanly.
    if (!finalSession && isProtectedPath(window.location.pathname)) {
      console.log('[Recovery] No session on protected route - signing out');
      await forceSignOut();
      return {
        success: true,
        action: 'signed_out',
        message: 'Session expired. Please sign in again.',
      };
    }

    // Step 3: Invalidate all React Query caches to force re-fetch
    console.log('[Recovery] Invalidating query caches');
    await queryClient.invalidateQueries();

    // Step 4: Verify we can reach the backend
    const pingSuccess = await healthMonitor.ping();

    if (!pingSuccess) {
      const healthState = healthMonitor.getState();

      // Check if it's an auth issue
      if (healthState.lastErrorCode === 401 || healthState.lastErrorCode === 403) {
        console.log('[Recovery] Auth error on ping - signing out');
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

    console.log('[Recovery] Recovery successful');
    return {
      success: true,
      action: 'recovered',
      message: 'Connection restored',
    };
  } catch (error) {
    console.error('[Recovery] Unexpected error:', error);
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
 */
export async function forceSignOut(): Promise<void> {
  console.log('[Recovery] Forcing sign out');

  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.warn('[Recovery] Sign out error (continuing anyway):', error);
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
  } catch (error) {
    console.warn('[Recovery] Storage cleanup error:', error);
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
  const { timeout = 10000, retryOnce = true, context = 'fetch', requireAuth = true } = options;

  const assertAuth = async () => {
    if (!requireAuth) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // Try to hydrate quickly (common after full page refresh)
      await supabase.auth.refreshSession();
      const { data: { session: hydrated } } = await supabase.auth.getSession();
      if (!hydrated) throw new Error('No session');
    }
  };

  try {
    await assertAuth();
    return await withTimeout(fetchFn(), timeout, `${context} timeout`);
  } catch (error) {
    const err = error as Error;
    console.warn(`[FetchWithRecovery] ${context} failed:`, err.message);

    if (retryOnce) {
      const result = await recoverBackend(err.message === 'No session' ? 'page_load' : 'timeout');

      if (result.success && result.action === 'recovered') {
        console.log(`[FetchWithRecovery] Retrying ${context} after recovery`);
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
