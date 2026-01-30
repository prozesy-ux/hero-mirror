// Query Deduplication - Prevents duplicate concurrent requests
// Enterprise-grade request management for 10M+ daily traffic

const pendingRequests = new Map<string, Promise<unknown>>();

/**
 * Deduplicated fetch - returns existing promise if request is in-flight
 * Prevents duplicate API calls when multiple components request same data
 */
export async function deduplicatedFetch<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  // Return existing promise if request is already in-flight
  if (pendingRequests.has(key)) {
    console.log(`[Dedup] Reusing in-flight request: ${key}`);
    return pendingRequests.get(key) as Promise<T>;
  }
  
  // Create new request and track it
  const promise = fetcher().finally(() => {
    pendingRequests.delete(key);
  });
  
  pendingRequests.set(key, promise);
  console.log(`[Dedup] New request started: ${key}`);
  
  return promise;
}

/**
 * Clear a pending request (useful for force refresh)
 */
export function clearPendingRequest(key: string): void {
  pendingRequests.delete(key);
}

/**
 * Check if a request is currently in-flight
 */
export function isRequestPending(key: string): boolean {
  return pendingRequests.has(key);
}

/**
 * Get count of pending requests (for debugging)
 */
export function getPendingRequestCount(): number {
  return pendingRequests.size;
}

// Request keys for consistent usage across the app
export const REQUEST_KEYS = {
  MARKETPLACE_HOME: 'marketplace-home',
  STORE_PUBLIC: (slug: string) => `store-public-${slug}`,
  FLASH_SALES: 'flash-sales',
  CATEGORIES: 'categories',
  SEARCH: (query: string) => `search-${query}`,
} as const;
