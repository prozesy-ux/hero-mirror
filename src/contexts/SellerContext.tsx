import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { bffApi } from '@/lib/api-fetch';
import { toast } from 'sonner';

// Cache key for offline fallback
const CACHE_KEY = 'seller_dashboard_cache';

interface SellerLevel {
  id: string;
  name: string;
  badge_color: string;
  badge_icon: string;
  min_orders: number;
  min_rating: number;
  min_revenue: number;
  commission_rate: number;
  benefits: string[];
  display_order: number;
}

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
  two_factor_enabled: boolean;
  level_id: string | null;
  level?: SellerLevel | null;
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
  sellerLevels: SellerLevel[];
  loading: boolean;
  error: string | null;
  sessionExpiredLocal: boolean;
  usingCachedData: boolean;
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
  const { user, setSessionExpired } = useAuthContext();
  const [profile, setProfile] = useState<SellerProfile>(sellerProfile);
  const [wallet, setWallet] = useState<SellerWallet | null>(null);
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [withdrawals, setWithdrawals] = useState<SellerWithdrawal[]>([]);
  const [sellerLevels, setSellerLevels] = useState<SellerLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpiredLocal, setSessionExpiredLocal] = useState(false);
  const [usingCachedData, setUsingCachedData] = useState(false);
  
  // Refs for realtime channels
  const ordersChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const walletChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const productsChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const withdrawalsChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Load cached data on mount for instant UI
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        // Use cache if less than 5 minutes old
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          if (cachedData.wallet) setWallet(cachedData.wallet);
          if (cachedData.products) setProducts(cachedData.products);
          if (cachedData.orders) setOrders(cachedData.orders);
          if (cachedData.withdrawals) setWithdrawals(cachedData.withdrawals);
          if (cachedData.sellerLevels) setSellerLevels(cachedData.sellerLevels);
          setLoading(false);
        }
      } catch (e) { /* ignore parse errors */ }
    }
  }, []);

  // Fetch all data from BFF API (server-side validated)
  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await bffApi.getSellerDashboard();

      // SOFT unauthorized handling - no redirect, just show banner
      if (result.isUnauthorized) {
        console.log('[SellerContext] Unauthorized - showing soft banner (no redirect)');
        setSessionExpiredLocal(true);
        setSessionExpired?.(true);
        
        // Try to show cached data
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          try {
            const { data: cachedData } = JSON.parse(cached);
            if (cachedData.wallet) setWallet(cachedData.wallet);
            if (cachedData.products) setProducts(cachedData.products);
            if (cachedData.orders) setOrders(cachedData.orders);
            if (cachedData.withdrawals) setWithdrawals(cachedData.withdrawals);
            setUsingCachedData(true);
          } catch (e) { /* ignore */ }
        }
        setLoading(false);
        return;
      }

      if (result.error || !result.data) {
        console.error('[SellerContext] BFF fetch failed:', result.error);
        
        // Network/server error - try cache fallback
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          try {
            const { data: cachedData } = JSON.parse(cached);
            if (cachedData.wallet) setWallet(cachedData.wallet);
            if (cachedData.products) setProducts(cachedData.products);
            if (cachedData.orders) setOrders(cachedData.orders);
            if (cachedData.withdrawals) setWithdrawals(cachedData.withdrawals);
            setUsingCachedData(true);
            setError('Using cached data - refresh when online');
          } catch (e) {
            setError(result.error || 'Failed to load seller data');
          }
        } else {
          setError(result.error || 'Failed to load seller data');
          toast.error('Failed to load dashboard data');
        }
        setLoading(false);
        return;
      }

      const data = result.data;
      const newProfile = data.profile;
      const newWallet = data.wallet;
      const newProducts = data.products;
      const newOrders = data.orders;
      const newWithdrawals = data.withdrawals;
      const newSellerLevels = data.sellerLevels;

      if (newProfile) setProfile(newProfile);
      setWallet(newWallet);
      setProducts(newProducts || []);
      setOrders(newOrders || []);
      setWithdrawals(newWithdrawals || []);
      setSellerLevels(newSellerLevels || []);
      setUsingCachedData(false);

      // Cache for offline use
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: { wallet: newWallet, products: newProducts, orders: newOrders, withdrawals: newWithdrawals, sellerLevels: newSellerLevels },
        timestamp: Date.now()
      }));

      console.log('[SellerContext] Data loaded from BFF at:', data._meta?.fetchedAt);
    } catch (err) {
      console.error('[SellerContext] Unexpected error:', err);
      setError('Unexpected error loading data');
    } finally {
      setLoading(false);
    }
  }, [setSessionExpired]);

  // Individual refresh functions (still use BFF but could be optimized later)
  const refreshProfile = useCallback(async () => {
    await refreshAll();
  }, [refreshAll]);

  const refreshWallet = useCallback(async () => {
    // For wallet specifically, we can do a quick direct fetch while realtime handles updates
    // But BFF ensures consistency on page load
    await refreshAll();
  }, [refreshAll]);

  const refreshProducts = useCallback(async () => {
    await refreshAll();
  }, [refreshAll]);

  const refreshOrders = useCallback(async () => {
    await refreshAll();
  }, [refreshAll]);

  const refreshWithdrawals = useCallback(async () => {
    await refreshAll();
  }, [refreshAll]);

  // Initial data load from BFF
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Setup realtime subscriptions
  const setupRealtimeSubscriptions = useCallback(() => {
    if (!profile.id) return;

    // Clean up existing channels
    if (ordersChannelRef.current) supabase.removeChannel(ordersChannelRef.current);
    if (walletChannelRef.current) supabase.removeChannel(walletChannelRef.current);
    if (productsChannelRef.current) supabase.removeChannel(productsChannelRef.current);
    if (withdrawalsChannelRef.current) supabase.removeChannel(withdrawalsChannelRef.current);

    ordersChannelRef.current = supabase
      .channel('seller-orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'seller_orders',
        filter: `seller_id=eq.${profile.id}`
      }, () => {
        console.log('[SellerContext] Realtime: orders changed');
        refreshAll();
      })
      .subscribe();

    walletChannelRef.current = supabase
      .channel('seller-wallet')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'seller_wallets',
        filter: `seller_id=eq.${profile.id}`
      }, () => {
        console.log('[SellerContext] Realtime: wallet changed');
        refreshAll();
      })
      .subscribe();

    productsChannelRef.current = supabase
      .channel('seller-products-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'seller_products',
        filter: `seller_id=eq.${profile.id}`
      }, () => {
        console.log('[SellerContext] Realtime: products changed');
        refreshAll();
      })
      .subscribe();

    withdrawalsChannelRef.current = supabase
      .channel('seller-withdrawals-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'seller_withdrawals',
        filter: `seller_id=eq.${profile.id}`
      }, () => {
        console.log('[SellerContext] Realtime: withdrawals changed');
        refreshAll();
      })
      .subscribe();
  }, [profile.id, refreshAll]);

  // Real-time subscriptions (keep for instant updates, BFF for reliability)
  useEffect(() => {
    setupRealtimeSubscriptions();

    return () => {
      if (ordersChannelRef.current) supabase.removeChannel(ordersChannelRef.current);
      if (walletChannelRef.current) supabase.removeChannel(walletChannelRef.current);
      if (productsChannelRef.current) supabase.removeChannel(productsChannelRef.current);
      if (withdrawalsChannelRef.current) supabase.removeChannel(withdrawalsChannelRef.current);
    };
  }, [setupRealtimeSubscriptions]);

  // Resubscribe realtime channels on token refresh
  useEffect(() => {
    const handleSessionRefresh = () => {
      console.log('[SellerContext] Session refreshed - resubscribing realtime');
      setupRealtimeSubscriptions();
    };
    
    window.addEventListener('session-refreshed', handleSessionRefresh);
    return () => window.removeEventListener('session-refreshed', handleSessionRefresh);
  }, [setupRealtimeSubscriptions]);

  return (
    <SellerContext.Provider value={{
      profile,
      wallet,
      products,
      orders,
      withdrawals,
      sellerLevels,
      loading,
      error,
      sessionExpiredLocal,
      usingCachedData,
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
