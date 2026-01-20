import { supabase } from '@/integrations/supabase/client';

/**
 * Get session with automatic refresh attempt if expired
 */
export const getSessionWithRefresh = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.warn('[Session] Get session error:', error.message);
    return null;
  }
  
  if (!session) {
    // Try to refresh in case there's a valid refresh token
    const { data: { session: refreshedSession }, error: refreshError } = 
      await supabase.auth.refreshSession();
    
    if (refreshError) {
      console.warn('[Session] Refresh failed:', refreshError.message);
      return null;
    }
    
    return refreshedSession;
  }
  
  return session;
};

/**
 * Check if localStorage is accessible (detects private browsing issues)
 */
export const testLocalStorageAccess = (): boolean => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    console.warn('[Session] localStorage not accessible');
    return false;
  }
};

/**
 * Count Supabase auth keys in localStorage
 */
export const countSupabaseKeys = (): number => {
  let count = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('sb-')) count++;
    }
  } catch {
    // Ignore errors
  }
  return count;
};

/**
 * Get last token refresh/expiry timestamp
 */
export const getLastRefreshTime = (): string | null => {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.includes('-auth-token')) {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed.expires_at) {
            return new Date(parsed.expires_at * 1000).toLocaleTimeString();
          }
        }
      }
    }
  } catch {
    // Ignore errors
  }
  return null;
};
