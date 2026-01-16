import { useState, useCallback } from 'react';

const ADMIN_API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`;
const SESSION_TOKEN_KEY = 'adminpro_session_token';

interface QueryOptions {
  select?: string;
  order?: { column: string; ascending?: boolean };
  limit?: number;
  eq?: Record<string, any>;
  neq?: Record<string, any>;
  gt?: Record<string, any>;
  lt?: Record<string, any>;
}

export const useAdminApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSessionToken = () => sessionStorage.getItem(SESSION_TOKEN_KEY);

  const apiCall = useCallback(async (body: any) => {
    const token = getSessionToken();
    if (!token) {
      throw new Error('No admin session token');
    }

    const response = await fetch(ADMIN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API call failed');
    }

    return data;
  }, []);

  const fetchData = useCallback(async <T = any>(
    table: string, 
    options?: QueryOptions
  ): Promise<{ data: T[]; count?: number }> => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall({ action: 'select', table, options });
      return result;
    } catch (err: any) {
      setError(err.message);
      return { data: [] };
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const insertData = useCallback(async <T = any>(
    table: string, 
    data: any
  ): Promise<{ data: T[] | null; error: string | null }> => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall({ action: 'insert', table, data });
      return { data: result.data, error: null };
    } catch (err: any) {
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const updateData = useCallback(async <T = any>(
    table: string, 
    id: string | null, 
    data: any,
    options?: { eq?: Record<string, any> }
  ): Promise<{ data: T[] | null; error: string | null }> => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall({ action: 'update', table, id, data, options });
      return { data: result.data, error: null };
    } catch (err: any) {
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const deleteData = useCallback(async (
    table: string, 
    id?: string,
    options?: { eq?: Record<string, any>; lt?: Record<string, any> }
  ): Promise<{ success: boolean; error: string | null }> => {
    setLoading(true);
    setError(null);
    try {
      await apiCall({ action: 'delete', table, id, options });
      return { success: true, error: null };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const countData = useCallback(async (table: string): Promise<number> => {
    try {
      const result = await apiCall({ action: 'count', table });
      return result.count || 0;
    } catch {
      return 0;
    }
  }, [apiCall]);

  const callRpc = useCallback(async <T = any>(
    functionName: string, 
    args: Record<string, any>
  ): Promise<{ data: T | null; error: string | null }> => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall({ action: 'rpc', functionName, args });
      return { data: result.data, error: null };
    } catch (err: any) {
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  return {
    loading,
    error,
    fetchData,
    insertData,
    updateData,
    deleteData,
    countData,
    callRpc,
  };
};

// Utility function to create admin session
export const createAdminSession = async (token: string): Promise<boolean> => {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // Session expires in 24 hours

  try {
    // Use the anon key for initial session creation
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/admin_sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        session_token: token,
        expires_at: expiresAt.toISOString(),
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to create admin session:', error);
    return false;
  }
};

// Utility function to delete admin session
export const deleteAdminSession = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/admin_sessions?session_token=eq.${token}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Failed to delete admin session:', error);
    return false;
  }
};
