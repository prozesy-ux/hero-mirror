import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

// In-memory cache
let cachedData: MarketplaceHomeData | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60 * 1000; // 60 seconds

export function useMarketplaceData() {
  const [data, setData] = useState<MarketplaceHomeData | null>(cachedData);
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (force = false) => {
    // Return cached data if still valid
    const now = Date.now();
    if (!force && cachedData && now - cacheTimestamp < CACHE_TTL) {
      setData(cachedData);
      setLoading(false);
      return;
    }

    // If we have stale cache, show it while fetching fresh
    if (cachedData) {
      setData(cachedData);
    }

    try {
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
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      // Update cache
      cachedData = result;
      cacheTimestamp = Date.now();
      
      setData(result);
      setError(null);
    } catch (err) {
      console.error('[useMarketplaceData] Fetch error:', err);
      setError('Failed to load marketplace data');
      // Keep showing cached data if available
    } finally {
      setLoading(false);
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
  if (!cachedData || now - cacheTimestamp >= CACHE_TTL) {
    fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bff-marketplace-home`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      }
    )
      .then(res => res.json())
      .then(data => {
        cachedData = data;
        cacheTimestamp = Date.now();
      })
      .catch(() => {}); // Silent fail for prefetch
  }
}
