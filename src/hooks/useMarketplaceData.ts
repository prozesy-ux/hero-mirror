import { useState, useEffect, useCallback } from 'react';
import { deduplicatedFetch, REQUEST_KEYS } from '@/lib/query-deduplication';

export interface ProductSummary {
  id: string;
  name: string;
  price: number;
  iconUrl: string | null;
  soldCount: number;
  viewCount: number;
  createdAt: string;
  type: 'ai' | 'seller';
  sellerName: string | null;
  isVerified: boolean;
}

export interface CategoryWithCount {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  display_order: number;
  productCount: number;
}

export interface FeaturedSeller {
  id: string;
  storeName: string;
  logoUrl: string | null;
  isVerified: boolean;
  storeSlug: string;
}

export interface MarketplaceHomeData {
  categories: CategoryWithCount[];
  hotProducts: ProductSummary[];
  topRated: ProductSummary[];
  newArrivals: ProductSummary[];
  featuredSellers: FeaturedSeller[];
  totalProducts: number;
  cachedAt: string;
}

// In-memory cache with tiered TTLs
let cachedData: MarketplaceHomeData | null = null;
let cacheTimestamp: number = 0;

// Tiered cache TTLs for enterprise scaling
const CACHE_TIERS = {
  fresh: 60 * 1000,      // 1 min - serve immediately
  stale: 5 * 60 * 1000,  // 5 min - serve + revalidate in background
  expired: 15 * 60 * 1000, // 15 min - force refresh
};

export function useMarketplaceData() {
  const [data, setData] = useState<MarketplaceHomeData | null>(cachedData);
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  const fetchData = useCallback(async (force = false) => {
    const now = Date.now();
    const age = now - cacheTimestamp;

    // Fresh cache - use directly, no network
    if (!force && cachedData && age < CACHE_TIERS.fresh) {
      setData(cachedData);
      setLoading(false);
      setIsStale(false);
      return;
    }

    // Stale cache - show immediately, refresh in background
    if (cachedData && age < CACHE_TIERS.stale) {
      setData(cachedData);
      setLoading(false);
      setIsStale(true);
      
      // Background refresh (don't await)
      backgroundRefresh();
      return;
    }

    // Expired or no cache - show stale while fetching
    if (cachedData) {
      setData(cachedData);
      setIsStale(true);
    }

    try {
      // Use deduplicated fetch to prevent duplicate requests
      const result = await deduplicatedFetch<MarketplaceHomeData>(
        REQUEST_KEYS.MARKETPLACE_HOME,
        async () => {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bff-marketplace-home`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              },
            }
          );

          if (!response.ok) {
            // Check for rate limit
            if (response.status === 429) {
              const retryAfter = response.headers.get('Retry-After');
              console.warn(`[useMarketplaceData] Rate limited, retry after ${retryAfter}s`);
            }
            throw new Error(`HTTP ${response.status}`);
          }

          return response.json();
        }
      );
      
      // Update cache
      cachedData = result;
      cacheTimestamp = Date.now();
      
      setData(result);
      setError(null);
      setIsStale(false);
    } catch (err) {
      console.error('[useMarketplaceData] Fetch error:', err);
      setError('Failed to load marketplace data');
      // Keep showing cached data if available
    } finally {
      setLoading(false);
    }
  }, []);

  // Background refresh without blocking UI
  const backgroundRefresh = useCallback(async () => {
    try {
      const result = await deduplicatedFetch<MarketplaceHomeData>(
        REQUEST_KEYS.MARKETPLACE_HOME,
        async () => {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bff-marketplace-home`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              },
            }
          );
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        }
      );
      
      cachedData = result;
      cacheTimestamp = Date.now();
      setData(result);
      setIsStale(false);
      console.log('[useMarketplaceData] Background refresh complete');
    } catch (err) {
      console.log('[useMarketplaceData] Background refresh failed, serving stale');
    }
  }, []);

  // Prefetch on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  return {
    data,
    loading,
    error,
    isStale,
    refetch,
    // Expose individual sections for easy access
    categories: data?.categories || [],
    hotProducts: data?.hotProducts || [],
    topRated: data?.topRated || [],
    newArrivals: data?.newArrivals || [],
    featuredSellers: data?.featuredSellers || [],
  };
}

// Prefetch function to call early (e.g., on route hover)
export function prefetchMarketplaceData() {
  const now = Date.now();
  if (!cachedData || now - cacheTimestamp >= CACHE_TIERS.fresh) {
    deduplicatedFetch(REQUEST_KEYS.MARKETPLACE_HOME, async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bff-marketplace-home`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      const data = await response.json();
      cachedData = data;
      cacheTimestamp = Date.now();
      return data;
    }).catch(() => {}); // Silent fail for prefetch
  }
}
