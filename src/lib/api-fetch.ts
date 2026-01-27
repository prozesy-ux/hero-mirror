/**
 * API Fetch Utility - Frontend BFF Client
 * 
 * This is the single source of truth for making authenticated API calls
 * to the BFF (Backend-for-Frontend) layer. It handles:
 * - Adding authorization headers
 * - Request timeouts (no infinite loading)
 * - 401 handling with automatic refresh retry
 * - Clean error states
 */

import { supabase } from '@/integrations/supabase/client';

const API_TIMEOUT = 15000; // 15 seconds max
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export interface ApiFetchResult<T> {
  data: T | null;
  error: string | null;
  status: number;
  isUnauthorized: boolean;
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
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshData.session) {
        console.warn('[ApiFetch] Proactive refresh failed:', refreshError?.message);
        return session.access_token; // Return existing token, let the request try
      }
      
      console.log('[ApiFetch] Token refreshed proactively');
      return refreshData.session.access_token;
    }
    
    return session.access_token;
  } catch (error) {
    console.error('[ApiFetch] Failed to get session:', error);
    return null;
  }
}

/**
 * Attempt to refresh the session
 */
async function refreshSession(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) {
      console.log('[ApiFetch] Session refresh failed:', error?.message);
      return false;
    }
    console.log('[ApiFetch] Session refreshed successfully');
    return true;
  } catch (error) {
    console.error('[ApiFetch] Refresh error:', error);
    return false;
  }
}

/**
 * Main API fetch function with timeout, auth, and retry logic
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
  
  if (!accessToken) {
    return {
      data: null,
      error: 'No active session',
      status: 401,
      isUnauthorized: true
    };
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

    // Handle 401 - try refresh once
    if (response.status === 401 && !skipAuthRetry) {
      console.log('[ApiFetch] Got 401, attempting session refresh...');
      const refreshed = await refreshSession();
      
      if (refreshed) {
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

    return {
      data: result.data,
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
    _meta: { fetchedAt: string; userId: string };
  }>('bff-buyer-dashboard'),
};

/**
 * Handle unauthorized state - redirect to sign in
 */
export function handleUnauthorized(): void {
  // Clear any stale session state
  supabase.auth.signOut().catch(() => {});
  
  // Store current location for redirect after login
  const currentPath = window.location.pathname;
  if (currentPath !== '/signin' && currentPath !== '/signup') {
    sessionStorage.setItem('redirectAfterLogin', currentPath);
  }
  
  // Navigate to sign in
  window.location.href = '/signin';
}
