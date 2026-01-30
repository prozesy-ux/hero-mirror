/**
 * API Fetch Utility - Frontend BFF Client
 * 
 * This is the single source of truth for making authenticated API calls
 * to the BFF (Backend-for-Frontend) layer. It handles:
 * - Adding authorization headers
 * - Request timeouts (no infinite loading)
 * - 401 handling with automatic refresh retry
 * - Request queuing during token refresh (prevents race conditions)
 * - Resilient to transient session null states (NO immediate unauthorized)
 * - 12-hour grace window enforcement
 */

import { supabase } from '@/integrations/supabase/client';
import { sessionRecovery } from '@/lib/session-recovery';
import { isSessionValid } from '@/lib/session-persistence';
import { hasLocalSession } from '@/lib/session-detector';

const API_TIMEOUT = 15000; // 15 seconds max
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Request queue for handling concurrent calls during token refresh
let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

const subscribeToRefresh = (callback: (token: string | null) => void) => {
  refreshSubscribers.push(callback);
};

const onRefreshComplete = (token: string | null) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

export interface ApiFetchResult<T> {
  data: T | null;
  error: string | null;
  status: number;
  isUnauthorized: boolean;
  isReconnecting?: boolean; // NEW: soft transient failure state
}

/**
 * Get the current access token from Supabase session
 * Proactively refreshes if token is near expiry
 */
async function getAccessToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return null;
    }
    
    // Check if token is near expiry (within 5 minutes)
    const exp = session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    const fiveMinutes = 5 * 60;
    
    if (exp && (exp - now) < fiveMinutes) {
      console.log('[ApiFetch] Token near expiry, refreshing proactively');
      
      // Use centralized recovery to prevent duplicate refresh attempts
      const refreshed = await sessionRecovery.recover();
      
      if (!refreshed) {
        console.warn('[ApiFetch] Proactive refresh failed');
        return session.access_token; // Return existing token, let the request try
      }
      
      // Get the new session after refresh
      const { data: { session: newSession } } = await supabase.auth.getSession();
      console.log('[ApiFetch] Token refreshed proactively');
      return newSession?.access_token || session.access_token;
    }
    
    return session.access_token;
  } catch (error) {
    console.error('[ApiFetch] Failed to get session:', error);
    return null;
  }
}

/**
 * Attempt to refresh the session with request queuing
 * All concurrent 401 handlers will wait for the same refresh
 */
async function refreshSessionWithQueue(): Promise<string | null> {
  // If already refreshing, wait for the result
  if (isRefreshing) {
    return new Promise(resolve => {
      subscribeToRefresh(resolve);
    });
  }

  isRefreshing = true;

  try {
    const success = await sessionRecovery.recover();
    
    if (!success) {
      console.log('[ApiFetch] Session refresh failed');
      onRefreshComplete(null);
      return null;
    }

    // Get the new token
    const { data: { session } } = await supabase.auth.getSession();
    const newToken = session?.access_token || null;
    
    console.log('[ApiFetch] Session refreshed successfully');
    onRefreshComplete(newToken);
    return newToken;
  } catch (error) {
    console.error('[ApiFetch] Refresh error:', error);
    onRefreshComplete(null);
    return null;
  } finally {
    isRefreshing = false;
  }
}

/**
 * Main API fetch function with timeout, auth, and retry logic
 * 
 * CRITICAL: This function is RESILIENT to transient null sessions.
 * - If getSession() returns null, we attempt recovery BEFORE returning unauthorized.
 * - If recovery fails but we're within the 12h grace window, we return a soft error
 *   (isReconnecting: true) instead of isUnauthorized: true.
 * - This prevents dashboard pages from showing "Session Expired" during tab switch.
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    skipAuthRetry?: boolean;
  } = {}
): Promise<ApiFetchResult<T>> {
  const { method = 'GET', body, skipAuthRetry = false } = options;

  // Get current access token
  let accessToken = await getAccessToken();
  
  // RESILIENT NULL SESSION HANDLING
  if (!accessToken) {
    console.log('[ApiFetch] getSession returned null, trying recovery...');
    
    // Attempt recovery before giving up
    const recovered = await sessionRecovery.recover();
    
    if (recovered) {
      // Recovery succeeded - get new token and continue
      accessToken = await getAccessToken();
      console.log('[ApiFetch] Recovery succeeded, got new token');
    }
    
    if (!accessToken) {
      // Recovery failed - check 12h grace window
      if (hasLocalSession() && isSessionValid()) {
        // Still within 12h window - soft fail, NOT unauthorized
        console.log('[ApiFetch] Recovery failed but within 12h window - soft failing (no logout)');
        return {
          data: null,
          error: 'Reconnecting...',
          status: 503,
          isUnauthorized: false,
          isReconnecting: true
        };
      }
      
      // Truly expired (12h+ since login) - return unauthorized
      console.log('[ApiFetch] No session and outside 12h window - truly unauthorized');
      return {
        data: null,
        error: 'Session expired',
        status: 401,
        isUnauthorized: true
      };
    }
  }

  // Build full URL
  const url = `${SUPABASE_URL}/functions/v1/${endpoint}`;

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Handle 401 - try refresh once with queuing
    if (response.status === 401 && !skipAuthRetry) {
      console.log('[ApiFetch] Got 401, attempting session refresh...');
      
      // Use queue-based refresh to prevent race conditions
      const newToken = await refreshSessionWithQueue();
      
      if (newToken) {
        // Retry the request with new token
        return apiFetch<T>(endpoint, { ...options, skipAuthRetry: true });
      }
      
      return {
        data: null,
        error: 'Session expired',
        status: 401,
        isUnauthorized: true
      };
    }

    // Parse response
    const result = await response.json();

    if (!response.ok) {
      return {
        data: null,
        error: result.error || `Request failed with status ${response.status}`,
        status: response.status,
        isUnauthorized: response.status === 401
      };
    }

    // Smart detection: Handle both wrapped { data: ... } and root-level responses
    // validate-session returns { data: { valid: true, ... } }
    // BFF endpoints return { profile, wallet, orders, ... } at root level
    const isWrappedResponse = result && 
      typeof result === 'object' && 
      'data' in result && 
      (
        // validate-session pattern: has 'data' key with 'valid' property
        (result.data && typeof result.data === 'object' && 'valid' in result.data) ||
        // Simple wrapped response with only 'data' key (and maybe error/status)
        Object.keys(result).every(key => ['data', 'error', 'status', 'message'].includes(key))
      );

    const payload = isWrappedResponse ? result.data : result;

    // Dev-only logging to confirm format detection
    if (import.meta.env.DEV) {
      console.log(`[ApiFetch] ${endpoint} -> ${isWrappedResponse ? 'wrapped' : 'root'} format`);
    }

    return {
      data: payload,
      error: null,
      status: 200,
      isUnauthorized: false
    };

  } catch (error: any) {
    clearTimeout(timeoutId);

    // Handle timeout
    if (error.name === 'AbortError') {
      console.error('[ApiFetch] Request timeout for:', endpoint);
      return {
        data: null,
        error: 'Request timeout - please try again',
        status: 408,
        isUnauthorized: false
      };
    }

    // Handle network errors
    console.error('[ApiFetch] Network error:', error);
    return {
      data: null,
      error: 'Network error - please check your connection',
      status: 0,
      isUnauthorized: false
    };
  }
}

/**
 * Convenience methods for common endpoints
 */
export const bffApi = {
  // Seller endpoints
  getSellerDashboard: () => apiFetch<{
    profile: any;
    wallet: any;
    products: any[];
    orders: any[];
    withdrawals: any[];
    withdrawalMethods: any[];
    sellerLevels: any[];
    sellerCountry: string;
    _meta: { fetchedAt: string; userId: string; sellerId: string };
  }>('bff-seller-dashboard'),

  // Buyer endpoints
  getBuyerWallet: () => apiFetch<{
    wallet: { balance: number };
    withdrawals: any[];
    withdrawalMethods: any[];
    userCountry: string;
    _meta: { fetchedAt: string; userId: string };
  }>('bff-buyer-wallet'),

  getBuyerDashboard: () => apiFetch<{
    profile: any;
    wallet: { balance: number };
    purchases: any[];
    sellerOrders: any[];
    favorites: string[];
    wishlistCount: number;
    orderStats: {
      total: number;
      pending: number;
      delivered: number;
      completed: number;
      cancelled: number;
      totalSpent: number;
    };
    _meta: { fetchedAt: string; userId: string };
  }>('bff-buyer-dashboard'),
};

/**
 * Handle unauthorized state - SOFT notification only
 * 
 * CRITICAL: This function NEVER forces logout or redirect.
 * It emits an event for UI components to show a soft banner.
 * 
 * Enterprise UX: Let users stay on page, show banner, they click to re-login when ready.
 */
export function handleUnauthorized(): void {
  // DO NOT call signOut() - this causes forced logout
  // DO NOT redirect - let user stay on page with cached data
  
  // Emit soft event for UI to show "Session Expired" banner
  window.dispatchEvent(new CustomEvent('session-unauthorized'));
  
  console.warn('[ApiFetch] Session unauthorized - soft banner triggered (no redirect)');
}
