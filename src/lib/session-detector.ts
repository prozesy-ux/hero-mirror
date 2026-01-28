/**
 * Fast Session Detector
 * 
 * Synchronous check for Supabase session token existence in localStorage.
 * This enables INSTANT page rendering without waiting for async auth checks.
 * 
 * CRITICAL: This does NOT validate the token - just checks if one exists.
 * Validation happens in the background after UI is rendered.
 */

const SUPABASE_PROJECT_REF = 'bzooojifrzwdyvbuyoel';

/**
 * Check if a local Supabase session exists
 * Fast, synchronous - suitable for immediate routing decisions
 */
export function hasLocalSession(): boolean {
  try {
    // Supabase stores session with key: sb-<project-ref>-auth-token
    const authKey = `sb-${SUPABASE_PROJECT_REF}-auth-token`;
    const stored = localStorage.getItem(authKey);
    
    if (!stored) return false;
    
    // Basic parse to ensure it's valid JSON with expected structure
    const parsed = JSON.parse(stored);
    return !!(parsed?.access_token || parsed?.refresh_token);
  } catch {
    return false;
  }
}

/**
 * Get stored session expiry timestamp (in milliseconds)
 * Returns null if no session or parse error
 */
export function getStoredSessionExpiry(): number | null {
  try {
    const authKey = `sb-${SUPABASE_PROJECT_REF}-auth-token`;
    const stored = localStorage.getItem(authKey);
    
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    // expires_at is Unix timestamp in seconds
    return parsed?.expires_at ? parsed.expires_at * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Get the stored access token (for header use)
 * Returns null if no session
 */
export function getStoredAccessToken(): string | null {
  try {
    const authKey = `sb-${SUPABASE_PROJECT_REF}-auth-token`;
    const stored = localStorage.getItem(authKey);
    
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    return parsed?.access_token || null;
  } catch {
    return null;
  }
}

/**
 * Check if the stored token is definitely expired (beyond grace period)
 * Returns true if token expired more than 12 hours ago
 */
export function isDefinitelyExpired(): boolean {
  const expiry = getStoredSessionExpiry();
  if (!expiry) return true;
  
  const now = Date.now();
  const twelveHoursMs = 12 * 60 * 60 * 1000;
  
  // Token is definitely expired if it's been more than 12h past expiry
  return now > (expiry + twelveHoursMs);
}

/**
 * Quick check: Should we render protected content?
 * Returns true if local session exists and isn't definitely expired
 */
export function shouldRenderProtectedContent(): boolean {
  return hasLocalSession() && !isDefinitelyExpired();
}
