/**
 * Session Persistence Utilities
 * 
 * Tracks login timestamps to ensure users stay logged in for 24 hours
 * regardless of temporary session issues or network hiccups.
 */

const SESSION_KEY = 'app_session_start';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Mark the start of a new session (called on successful login)
 */
export const markSessionStart = () => {
  localStorage.setItem(SESSION_KEY, Date.now().toString());
  console.log('[SessionPersistence] Session started - 24h window begins');
};

/**
 * Check if the current session is still within the 24-hour validity window
 */
export const isSessionValid = (): boolean => {
  const start = localStorage.getItem(SESSION_KEY);
  if (!start) return true; // No timestamp = new session, allow
  
  const elapsed = Date.now() - parseInt(start, 10);
  const isValid = elapsed < SESSION_DURATION;
  
  if (!isValid) {
    console.log('[SessionPersistence] 24h window expired');
  }
  
  return isValid;
};

/**
 * Get remaining time in the 24-hour session window (in milliseconds)
 */
export const getSessionTimeRemaining = (): number => {
  const start = localStorage.getItem(SESSION_KEY);
  if (!start) return SESSION_DURATION;
  
  const elapsed = Date.now() - parseInt(start, 10);
  return Math.max(0, SESSION_DURATION - elapsed);
};

/**
 * Clear the session timestamp (called on manual logout)
 */
export const clearSessionTimestamp = () => {
  localStorage.removeItem(SESSION_KEY);
  console.log('[SessionPersistence] Session timestamp cleared');
};

/**
 * Extend the session by resetting the timestamp (optional - for activity-based extension)
 */
export const extendSession = () => {
  markSessionStart();
  console.log('[SessionPersistence] Session extended - new 24h window');
};
