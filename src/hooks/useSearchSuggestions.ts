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

const DEBOUNCE_MS = 300;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

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

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
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
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Search suggestions error:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Always fetch on focus (for recent/trending) or when query changes
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, query.length >= 2 ? DEBOUNCE_MS : 0);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, fetchSuggestions]);

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
