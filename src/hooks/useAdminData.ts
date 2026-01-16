import { useState, useCallback } from 'react';
import { toast } from 'sonner';

const ADMIN_SESSION_KEY = 'admin_session_token';

interface FilterOption {
  column: string;
  operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in';
  value: any;
}

interface FetchOptions {
  select?: string;
  order?: { column: string; ascending?: boolean };
  filters?: FilterOption[];
  limit?: number;
}

interface FetchResult<T> {
  data: T[] | null;
  error: string | null;
}

export const useAdminData = () => {
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async <T = any>(
    table: string,
    options?: FetchOptions
  ): Promise<FetchResult<T>> => {
    const token = localStorage.getItem(ADMIN_SESSION_KEY);
    
    if (!token) {
      return { data: null, error: 'No admin session' };
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-fetch-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            token,
            table,
            ...options,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error('Admin fetch error:', result.error);
        return { data: null, error: result.error || 'Failed to fetch data' };
      }

      return { data: result.data, error: null };
    } catch (error) {
      console.error('Admin fetch error:', error);
      return { data: null, error: 'Network error' };
    } finally {
      setLoading(false);
    }
  }, []);

  // Helper to fetch multiple tables in parallel
  const fetchMultiple = useCallback(async <T extends Record<string, any>>(
    queries: { [K in keyof T]: { table: string; options?: FetchOptions } }
  ): Promise<{ [K in keyof T]: T[K][] | null }> => {
    const entries = Object.entries(queries) as [keyof T, { table: string; options?: FetchOptions }][];
    
    const results = await Promise.all(
      entries.map(async ([key, query]) => {
        const result = await fetchData(query.table, query.options);
        return [key, result.data] as const;
      })
    );

    return Object.fromEntries(results) as { [K in keyof T]: T[K][] | null };
  }, [fetchData]);

  return { fetchData, fetchMultiple, loading };
};
