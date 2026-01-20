import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { withTimeout } from '@/lib/backend-recovery';

interface SellerProfile {
  id: string;
  user_id: string;
  store_name: string;
  store_description: string | null;
  store_logo_url: string | null;
  is_verified: boolean;
  is_active: boolean;
  commission_rate: number;
  total_sales: number;
  total_orders: number;
}

interface SellerWallet {
  id: string;
  seller_id: string;
  balance: number;
  pending_balance: number;
}

interface SellerProduct {
  id: string;
  seller_id: string;
  name: string;
  description: string | null;
  price: number;
  icon_url: string | null;
  category_id: string | null;
  stock: number;
  is_available: boolean;
  is_approved: boolean;
  sold_count: number;
  tags: string[];
  chat_allowed: boolean | null;
  created_at: string;
}

interface SellerOrder {
  id: string;
  seller_id: string;
  buyer_id: string;
  product_id: string;
  amount: number;
  seller_earning: number;
  status: string;
  credentials: string | null;
  delivered_at: string | null;
  created_at: string;
  product?: { name: string; icon_url: string | null };
  buyer?: { email: string; full_name: string | null };
}

interface SellerChat {
  id: string;
  seller_id: string;
  buyer_id: string;
  product_id: string | null;
  message: string;
  sender_type: string;
  is_read: boolean;
  created_at: string;
}

interface SellerWithdrawal {
  id: string;
  seller_id: string;
  amount: number;
  payment_method: string;
  account_details: string;
  status: string;
  admin_notes: string | null;
  processed_at: string | null;
  created_at: string;
}

interface SellerContextType {
  profile: SellerProfile;
  wallet: SellerWallet | null;
  products: SellerProduct[];
  orders: SellerOrder[];
  withdrawals: SellerWithdrawal[];
  loading: boolean;
  refreshProfile: () => Promise<void>;
  refreshWallet: () => Promise<void>;
  refreshProducts: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  refreshWithdrawals: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const SellerContext = createContext<SellerContextType | null>(null);

export const SellerProvider = ({ 
  children, 
  sellerProfile 
}: { 
  children: ReactNode; 
  sellerProfile: SellerProfile;
}) => {
  const { user } = useAuthContext();
  const [profile, setProfile] = useState<SellerProfile>(sellerProfile);
  const [wallet, setWallet] = useState<SellerWallet | null>(null);
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [withdrawals, setWithdrawals] = useState<SellerWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('seller_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) {
      console.error('[SellerContext] Profile fetch error:', error);
      throw error;
    }
    if (data) setProfile(data);
  }, [user]);

  const refreshWallet = useCallback(async () => {
    const { data, error } = await supabase
      .from('seller_wallets')
      .select('*')
      .eq('seller_id', profile.id)
      .maybeSingle();
    if (error) {
      console.error('[SellerContext] Wallet fetch error:', error);
      throw error;
    }
    if (data) setWallet(data);
  }, [profile.id]);

  const refreshProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('seller_products')
      .select('*')
      .eq('seller_id', profile.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[SellerContext] Products fetch error:', error);
      throw error;
    }
    if (data) setProducts(data);
  }, [profile.id]);

  const refreshOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('seller_orders')
      .select(`
        *,
        product:seller_products(name, icon_url)
      `)
      .eq('seller_id', profile.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[SellerContext] Orders fetch error:', error);
      throw error;
    }
    
    if (data && data.length > 0) {
      // Batch fetch ALL buyer profiles in ONE query (fixes N+1 problem)
      const buyerIds = [...new Set(data.map(o => o.buyer_id))];
      const { data: buyerProfiles } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .in('user_id', buyerIds);
      
      // Create lookup map for O(1) access
      const buyerMap = new Map(buyerProfiles?.map(p => [p.user_id, p]) || []);
      
      // Merge buyer info instantly (no await needed)
      const ordersWithBuyers = data.map(order => ({
        ...order,
        buyer: buyerMap.get(order.buyer_id) || null
      }));
      
      setOrders(ordersWithBuyers);
    } else {
      setOrders(data || []);
    }
  }, [profile.id]);

  const refreshWithdrawals = useCallback(async () => {
    const { data, error } = await supabase
      .from('seller_withdrawals')
      .select('*')
      .eq('seller_id', profile.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[SellerContext] Withdrawals fetch error:', error);
      throw error;
    }
    if (data) setWithdrawals(data);
  }, [profile.id]);

  const refreshAll = useCallback(async (retryCount = 0) => {
    setLoading(true);
    const FETCH_TIMEOUT = 10000; // 10 second timeout per fetch
    
    try {
      // Fetch all data in parallel with timeouts
      const results = await Promise.allSettled([
        withTimeout(refreshProfile(), FETCH_TIMEOUT, 'Profile fetch timeout'),
        withTimeout(refreshWallet(), FETCH_TIMEOUT, 'Wallet fetch timeout'),
        withTimeout(refreshProducts(), FETCH_TIMEOUT, 'Products fetch timeout'),
        withTimeout(refreshOrders(), FETCH_TIMEOUT, 'Orders fetch timeout'),
        withTimeout(refreshWithdrawals(), FETCH_TIMEOUT, 'Withdrawals fetch timeout')
      ]);
      
      // Check if any critical fetches failed
      const failures = results.filter(r => r.status === 'rejected');
      
      if (failures.length > 0 && retryCount < 2) {
        console.warn(`[SellerContext] ${failures.length} failures, retrying (attempt ${retryCount + 1})...`, 
          failures.map(f => (f as PromiseRejectedResult).reason?.message || 'Unknown error'));
        // Wait 1 second then retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        return refreshAll(retryCount + 1);
      }
      
      if (failures.length > 0) {
        console.error('[SellerContext] Some data failed to load after retries:', 
          failures.map(f => (f as PromiseRejectedResult).reason?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('[SellerContext] Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  }, [refreshProfile, refreshWallet, refreshProducts, refreshOrders, refreshWithdrawals]);

  useEffect(() => {
    refreshAll();
  }, []);

  // Real-time subscriptions - SINGLE consolidated channel for efficiency
  useEffect(() => {
    const channel = supabase
      .channel(`seller-realtime-${profile.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'seller_orders',
        filter: `seller_id=eq.${profile.id}`
      }, () => {
        refreshOrders();
        refreshProfile();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'seller_wallets',
        filter: `seller_id=eq.${profile.id}`
      }, () => refreshWallet())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'seller_products',
        filter: `seller_id=eq.${profile.id}`
      }, () => refreshProducts())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'seller_withdrawals',
        filter: `seller_id=eq.${profile.id}`
      }, () => {
        refreshWithdrawals();
        refreshWallet();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile.id, refreshOrders, refreshProfile, refreshWallet, refreshProducts, refreshWithdrawals]);

  return (
    <SellerContext.Provider value={{
      profile,
      wallet,
      products,
      orders,
      withdrawals,
      loading,
      refreshProfile,
      refreshWallet,
      refreshProducts,
      refreshOrders,
      refreshWithdrawals,
      refreshAll
    }}>
      {children}
    </SellerContext.Provider>
  );
};

export const useSellerContext = () => {
  const context = useContext(SellerContext);
  if (!context) {
    throw new Error('useSellerContext must be used within a SellerProvider');
  }
  return context;
};
