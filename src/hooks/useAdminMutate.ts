import { useCallback, useState } from 'react';
import { toast } from 'sonner';

const ADMIN_SESSION_KEY = 'admin_session_token';

interface FilterOption {
  column: string;
  operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in';
  value: any;
}

interface MutateResult {
  success: boolean;
  data?: any;
  error?: string;
}

export const useAdminMutate = () => {
  const [mutating, setMutating] = useState(false);

  const mutateData = useCallback(async (
    table: string,
    operation: 'insert' | 'update' | 'delete',
    data?: any,
    id?: string,
    filters?: FilterOption[]
  ): Promise<MutateResult> => {
    const token = localStorage.getItem(ADMIN_SESSION_KEY);
    
    if (!token) {
      return { success: false, error: 'No admin session' };
    }

    setMutating(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-mutate-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            token,
            table,
            operation,
            data,
            id,
            filters,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error('Admin mutation error:', result.error);
        return { success: false, error: result.error || 'Failed to mutate data' };
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Admin mutation network error:', error);
      return { success: false, error: 'Network error' };
    } finally {
      setMutating(false);
    }
  }, []);

  // Helper functions for common operations
  const insertData = useCallback(async (table: string, data: any): Promise<MutateResult> => {
    return mutateData(table, 'insert', data);
  }, [mutateData]);

  const updateData = useCallback(async (table: string, id: string, data: any): Promise<MutateResult> => {
    return mutateData(table, 'update', data, id);
  }, [mutateData]);

  const deleteData = useCallback(async (table: string, id: string): Promise<MutateResult> => {
    return mutateData(table, 'delete', undefined, id);
  }, [mutateData]);

  const deleteWithFilters = useCallback(async (table: string, filters: FilterOption[]): Promise<MutateResult> => {
    return mutateData(table, 'delete', undefined, undefined, filters);
  }, [mutateData]);

  return { 
    mutateData, 
    insertData, 
    updateData, 
    deleteData, 
    deleteWithFilters,
    mutating 
  };
};
