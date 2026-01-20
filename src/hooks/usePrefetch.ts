import { useCallback } from 'react';
import { queryClient } from '@/lib/query-client';
import { supabase } from '@/integrations/supabase/client';

/**
 * Prefetch hook for preloading dashboard data on hover
 * Dramatically reduces perceived load time for navigation
 */
export function usePrefetch() {
  const prefetchPrompts = useCallback(async () => {
    await queryClient.prefetchQuery({
      queryKey: ['prompts-preview'],
      queryFn: async () => {
        const { data } = await supabase
          .from('prompts')
          .select('id, title, image_url, tool, is_free, is_trending')
          .eq('is_trending', true)
          .limit(12);
        return data;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  }, []);

  const prefetchAIAccounts = useCallback(async () => {
    await queryClient.prefetchQuery({
      queryKey: ['ai-accounts-preview'],
      queryFn: async () => {
        const { data } = await supabase
          .from('ai_accounts')
          .select('id, name, price, icon_url, category')
          .eq('is_available', true)
          .limit(12);
        return data;
      },
      staleTime: 1000 * 60 * 5,
    });
  }, []);

  const prefetchCategories = useCallback(async () => {
    await queryClient.prefetchQuery({
      queryKey: ['categories'],
      queryFn: async () => {
        const { data } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order');
        return data;
      },
      staleTime: 1000 * 60 * 10, // 10 minutes - categories rarely change
    });
  }, []);

  const prefetchUserData = useCallback(async (userId: string) => {
    await Promise.allSettled([
      queryClient.prefetchQuery({
        queryKey: ['wallet', userId],
        queryFn: async () => {
          const { data } = await supabase
            .from('user_wallets')
            .select('balance')
            .eq('user_id', userId)
            .single();
          return data;
        },
        staleTime: 1000 * 60 * 2,
      }),
      queryClient.prefetchQuery({
        queryKey: ['favorites', userId],
        queryFn: async () => {
          const { data } = await supabase
            .from('favorites')
            .select('prompt_id')
            .eq('user_id', userId);
          return data;
        },
        staleTime: 1000 * 60 * 2,
      }),
    ]);
  }, []);

  return {
    prefetchPrompts,
    prefetchAIAccounts,
    prefetchCategories,
    prefetchUserData,
    // Prefetch all dashboard data at once
    prefetchDashboard: useCallback(async (userId?: string) => {
      await Promise.allSettled([
        prefetchPrompts(),
        prefetchAIAccounts(),
        prefetchCategories(),
        ...(userId ? [prefetchUserData(userId)] : []),
      ]);
    }, [prefetchPrompts, prefetchAIAccounts, prefetchCategories, prefetchUserData]),
  };
}
