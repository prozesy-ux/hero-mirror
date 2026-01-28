import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SearchSuggestion {
  type: 'recent' | 'trending' | 'product' | 'category' | 'tag' | 'seller';
  id: string;
  text: string;
  subtitle?: string;
  icon_url?: string;
  price?: number;
  result_count?: number;
}

export interface SearchSuggestions {
  recent: SearchSuggestion[];
  trending: SearchSuggestion[];
  products: SearchSuggestion[];
  categories: SearchSuggestion[];
  tags: SearchSuggestion[];
  sellers: SearchSuggestion[];
  recentlyViewed?: SearchSuggestion[];
}

const DEBOUNCE_MS = 150; // Reduced from 300ms for faster response
const CACHE_TTL_MS = 30000; // 30 seconds cache
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// In-memory cache for instant results
interface CacheEntry {
  data: SearchSuggestions;
  timestamp: number;
}
const searchCache = new Map<string, CacheEntry>();

// Prefetched base data (recent/trending) for instant display
let prefetchedData: SearchSuggestions | null = null;
let prefetchTimestamp = 0;

export function useSearchSuggestions() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestions>({
    recent: [],
    trending: [],
    products: [],
    categories: [],
    tags: [],
    sellers: [],
    recentlyViewed: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasPrefetched = useRef(false);

  // Check cache validity
  const isCacheValid = useCallback((timestamp: number) => {
    return Date.now() - timestamp < CACHE_TTL_MS;
  }, []);

  // Get cached result
  const getCachedResult = useCallback((cacheKey: string): SearchSuggestions | null => {
    const cached = searchCache.get(cacheKey);
    if (cached && isCacheValid(cached.timestamp)) {
      return cached.data;
    }
    return null;
  }, [isCacheValid]);

  // Set cache
  const setCacheResult = useCallback((cacheKey: string, data: SearchSuggestions) => {
    searchCache.set(cacheKey, { data, timestamp: Date.now() });
    
    // Limit cache size to prevent memory bloat
    if (searchCache.size > 50) {
      const oldestKey = searchCache.keys().next().value;
      if (oldestKey) searchCache.delete(oldestKey);
    }
  }, []);

  const fetchSuggestions = useCallback(async (searchQuery: string, skipCache = false) => {
    const cacheKey = searchQuery.toLowerCase().trim() || '__base__';
    
    // Check cache first (instant response)
    if (!skipCache) {
      const cached = getCachedResult(cacheKey);
      if (cached) {
        setSuggestions(cached);
        setIsLoading(false);
        return;
      }
    }

    // Show prefetched data immediately while fetching
    if (searchQuery.length < 2 && prefetchedData && isCacheValid(prefetchTimestamp)) {
      setSuggestions(prefetchedData);
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const url = `${SUPABASE_URL}/functions/v1/bff-marketplace-search?q=${encodeURIComponent(searchQuery)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setSuggestions(data);
      setCacheResult(cacheKey, data);
      
      // Store base data for instant prefetch
      if (searchQuery.length < 2) {
        prefetchedData = data;
        prefetchTimestamp = Date.now();
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Search suggestions error:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [getCachedResult, setCacheResult, isCacheValid]);

  // Prefetch base data on mount (recent/trending)
  useEffect(() => {
    if (!hasPrefetched.current) {
      hasPrefetched.current = true;
      // Prefetch in background after a small delay to not block initial render
      const timer = setTimeout(() => {
        fetchSuggestions('', true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [fetchSuggestions]);

  // Debounced search with instant cache display
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Show cached results immediately
    const cacheKey = query.toLowerCase().trim() || '__base__';
    const cached = getCachedResult(cacheKey);
    if (cached) {
      setSuggestions(cached);
    }

    // Then fetch fresh data in background
    const delay = query.length >= 2 ? DEBOUNCE_MS : 0;
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, delay);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, fetchSuggestions, getCachedResult]);

  const logSearch = useCallback(async (searchQuery: string, categoryId?: string) => {
    if (searchQuery.length < 2) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${session.access_token}`,
      };

      let url = `${SUPABASE_URL}/functions/v1/bff-marketplace-search?q=${encodeURIComponent(searchQuery)}&log=true`;
      if (categoryId && categoryId !== 'all') {
        url += `&category=${categoryId}`;
      }

      await fetch(url, { method: 'GET', headers });
    } catch (error) {
      console.error('Failed to log search:', error);
    }
  }, []);

  const clearRecentSearches = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase
        .from('search_history')
        .delete()
        .eq('user_id', session.user.id);

      setSuggestions(prev => ({ ...prev, recent: [] }));
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
    // Fetch immediately when opening (for recent/trending)
    fetchSuggestions(query);
  }, [query, fetchSuggestions]);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const hasResults = 
    suggestions.recent.length > 0 ||
    suggestions.trending.length > 0 ||
    suggestions.products.length > 0 ||
    suggestions.categories.length > 0 ||
    suggestions.tags.length > 0 ||
    suggestions.sellers.length > 0;

  return {
    query,
    setQuery,
    suggestions,
    isLoading,
    isOpen,
    open,
    close,
    logSearch,
    clearRecentSearches,
    hasResults,
  };
}
