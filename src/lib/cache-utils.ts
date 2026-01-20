// App version - update this with each deployment to trigger cache clear
export const APP_VERSION = '1.0.2';

import { recoverBackend } from '@/lib/backend-recovery';

/**
 * Handle critical errors by triggering a soft recovery (no hard reload).
 */
export const handleCriticalError = async (): Promise<void> => {
  console.error('[Cache] Critical error detected, starting recovery');
  try {
    await recoverBackend('manual');
  } catch {
    // ignore
  }
};

const VERSION_KEY = 'app_version';
const CACHE_CLEARED_KEY = 'cache_cleared_at';

/**
 * Clear browser caches (Cache API for service workers/PWA)
 */
export const clearBrowserCaches = async (): Promise<void> => {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
      console.log('[Cache] Browser caches cleared:', cacheNames.length);
    }
  } catch (error) {
    console.warn('[Cache] Failed to clear browser caches:', error);
  }
};

/**
 * Clear sessionStorage (preserves nothing - it's session-based anyway)
 */
export const clearSessionStorage = (): void => {
  try {
    sessionStorage.clear();
    console.log('[Cache] Session storage cleared');
  } catch (error) {
    console.warn('[Cache] Failed to clear session storage:', error);
  }
};

/**
 * Clear localStorage except for auth-related keys
 */
export const clearLocalStorageSelectively = (): void => {
  try {
    const keysToPreserve = [
      'sb-', // Auth tokens
      'supabase',
      VERSION_KEY,
      CACHE_CLEARED_KEY,
      // User intent keys
      'storeReturn',
      'pendingPurchase',
      'pendingChat',
      // UI state keys
      'sidebar-collapsed',
      'seller-sidebar-collapsed',
      'admin-sidebar-collapsed',
      'admin_session_token',
    ];

    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !keysToPreserve.some((preserve) => key.startsWith(preserve) || key === preserve)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
    console.log('[Cache] Cleared localStorage keys:', keysToRemove.length);
  } catch (error) {
    console.warn('[Cache] Failed to clear localStorage:', error);
  }
};

/**
 * Check if app version has changed
 */
export const hasVersionChanged = (): boolean => {
  try {
    const storedVersion = localStorage.getItem(VERSION_KEY);
    return storedVersion !== APP_VERSION;
  } catch {
    return true;
  }
};

/**
 * Update stored version
 */
export const updateStoredVersion = (): void => {
  try {
    localStorage.setItem(VERSION_KEY, APP_VERSION);
    localStorage.setItem(CACHE_CLEARED_KEY, new Date().toISOString());
  } catch (error) {
    console.warn('[Cache] Failed to update stored version:', error);
  }
};

/**
 * Perform full cache reset if version changed
 * Returns true if cache was cleared
 */
export const performCacheReset = async (): Promise<boolean> => {
  if (!hasVersionChanged()) {
    console.log('[Cache] Version unchanged, skipping cache clear');
    return false;
  }

  console.log('[Cache] Version changed, clearing caches...');

  await clearBrowserCaches();
  clearSessionStorage();
  clearLocalStorageSelectively();

  updateStoredVersion();

  console.log('[Cache] Cache reset complete');
  return true;
};

/**
 * Force clear all caches (manual trigger) - soft recovery only (no page reload).
 */
export const forceClearAllCaches = async (): Promise<void> => {
  console.log('[Cache] Force clearing all caches...');

  await clearBrowserCaches();
  clearSessionStorage();
  clearLocalStorageSelectively();
  updateStoredVersion();

  // Soft recovery to refetch everything
  await recoverBackend('manual');
};

