import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

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
    const { data } = await supabase
      .from('seller_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (data) setProfile(data);
  }, [user]);

  const refreshWallet = useCallback(async () => {
    const { data } = await supabase
      .from('seller_wallets')
      .select('*')
      .eq('seller_id', profile.id)
      .single();
    if (data) setWallet(data);
  }, [profile.id]);

  const refreshProducts = useCallback(async () => {
    const { data } = await supabase
      .from('seller_products')
      .select('*')
      .eq('seller_id', profile.id)
      .order('created_at', { ascending: false });
    if (data) setProducts(data);
  }, [profile.id]);

  const refreshOrders = useCallback(async () => {
    const { data } = await supabase
      .from('seller_orders')
      .select(`
        *,
        product:seller_products(name, icon_url)
      `)
      .eq('seller_id', profile.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      // Fetch buyer info for each order
      const ordersWithBuyers = await Promise.all(
        data.map(async (order) => {
          const { data: buyerProfile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('user_id', order.buyer_id)
            .single();
          return { ...order, buyer: buyerProfile };
        })
      );
      setOrders(ordersWithBuyers);
    }
  }, [profile.id]);

  const refreshWithdrawals = useCallback(async () => {
    const { data } = await supabase
      .from('seller_withdrawals')
      .select('*')
      .eq('seller_id', profile.id)
      .order('created_at', { ascending: false });
    if (data) setWithdrawals(data);
  }, [profile.id]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      refreshProfile(),
      refreshWallet(),
      refreshProducts(),
      refreshOrders(),
      refreshWithdrawals()
    ]);
    setLoading(false);
  }, [refreshProfile, refreshWallet, refreshProducts, refreshOrders, refreshWithdrawals]);

  useEffect(() => {
    refreshAll();
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    const ordersChannel = supabase
      .channel('seller-orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'seller_orders',
        filter: `seller_id=eq.${profile.id}`
      }, () => {
        refreshOrders();
        refreshProfile();
      })
      .subscribe();

    const walletChannel = supabase
      .channel('seller-wallet')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'seller_wallets',
        filter: `seller_id=eq.${profile.id}`
      }, () => {
        refreshWallet();
      })
      .subscribe();

    const productsChannel = supabase
      .channel('seller-products-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'seller_products',
        filter: `seller_id=eq.${profile.id}`
      }, () => {
        refreshProducts();
      })
      .subscribe();

    const withdrawalsChannel = supabase
      .channel('seller-withdrawals-realtime')
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
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(walletChannel);
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(withdrawalsChannel);
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
