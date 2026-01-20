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
  recoveryListeners.forEach(listener => listener(recovering));
}

export function subscribeToRecovery(listener: (recovering: boolean) => void): () => void {
  recoveryListeners.add(listener);
  return () => recoveryListeners.delete(listener);
}

export function isCurrentlyRecovering(): boolean {
  return isRecovering;
}

/**
 * Central recovery function - call this instead of doing manual cache clears
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
        message: 'Waiting for internet connection' 
      };
    }

    // Step 2: Try to get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.warn('[Recovery] Session error:', sessionError.message);
    }

    // Step 3: If we have a session, try to refresh it
    if (session) {
      console.log('[Recovery] Attempting session refresh');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.warn('[Recovery] Session refresh failed:', refreshError.message);
        
        // If refresh fails with auth error, sign out cleanly
        if (refreshError.message.includes('expired') || 
            refreshError.message.includes('invalid') ||
            refreshError.message.includes('not authenticated')) {
          console.log('[Recovery] Session invalid - signing out');
          await forceSignOut();
          return {
            success: true,
            action: 'signed_out',
            message: 'Session expired. Please sign in again.'
          };
        }
      } else if (refreshData.session) {
        console.log('[Recovery] Session refreshed successfully');
      }
    }

    // Step 4: Invalidate all React Query caches to force re-fetch
    console.log('[Recovery] Invalidating query caches');
    await queryClient.invalidateQueries();

    // Step 5: Verify we can reach the backend
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
          message: 'Authentication failed. Please sign in again.'
        };
      }
      
      // Other errors - report failure but don't sign out
      return {
        success: false,
        action: 'failed',
        message: `Backend unreachable: ${healthState.lastError || 'Unknown error'}`
      };
    }

    console.log('[Recovery] Recovery successful');
    return {
      success: true,
      action: 'recovered',
      message: 'Connection restored'
    };

  } catch (error) {
    console.error('[Recovery] Unexpected error:', error);
    return {
      success: false,
      action: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error during recovery'
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
    
    preserveKeys.forEach(key => {
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
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
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
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(timeoutMessage)), ms)
    )
  ]);
}

/**
 * Utility: Fetch with timeout and auto-recovery
 */
export async function fetchWithRecovery<T>(
  fetchFn: () => Promise<T>,
  options: {
    timeout?: number;
    retryOnce?: boolean;
    context?: string;
  } = {}
): Promise<T> {
  const { timeout = 10000, retryOnce = true, context = 'fetch' } = options;
  
  try {
    return await withTimeout(fetchFn(), timeout, `${context} timeout`);
  } catch (error) {
    const err = error as Error;
    console.warn(`[FetchWithRecovery] ${context} failed:`, err.message);
    
    if (retryOnce) {
      // Attempt recovery
      const result = await recoverBackend('timeout');
      
      if (result.success && result.action === 'recovered') {
        // Retry once after recovery
        console.log(`[FetchWithRecovery] Retrying ${context} after recovery`);
        return await withTimeout(fetchFn(), timeout, `${context} timeout (retry)`);
      }
      
      if (result.action === 'signed_out') {
        throw new Error('Session expired');
      }
    }
    
    throw error;
  }
}
