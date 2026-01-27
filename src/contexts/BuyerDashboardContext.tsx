import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { bffApi, handleUnauthorized } from '@/lib/api-fetch';

interface Order {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  product?: {
    id: string;
    name: string;
    icon_url: string | null;
    description?: string;
    category_id?: string | null;
  };
  seller?: {
    id: string;
    store_name: string;
    store_logo_url?: string | null;
  };
}

interface WishlistItem {
  id: string;
  product_id: string;
  product_type: string;
  created_at: string;
  product?: {
    id: string;
    name: string;
    price: number;
    icon_url: string | null;
    is_available: boolean;
    seller?: {
      store_name: string;
      store_slug: string;
    };
  };
}

interface OrderStats {
  total: number;
  pending: number;
  delivered: number;
  completed: number;
  cancelled: number;
  totalSpent: number;
}

interface BuyerDashboardData {
  wallet: { balance: number };
  sellerOrders: Order[];
  wishlist: WishlistItem[];
  wishlistCount: number;
  orderStats: OrderStats;
  profile: any;
  favorites: string[];
}

interface BuyerDashboardContextType {
  data: BuyerDashboardData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const BuyerDashboardContext = createContext<BuyerDashboardContextType | null>(null);

export const useBuyerDashboard = () => {
  const context = useContext(BuyerDashboardContext);
  if (!context) {
    throw new Error('useBuyerDashboard must be used within BuyerDashboardProvider');
  }
  return context;
};

// Optional hook that doesn't throw - for components that may or may not be wrapped
export const useBuyerDashboardOptional = () => {
  return useContext(BuyerDashboardContext);
};

interface BuyerDashboardProviderProps {
  children: ReactNode;
}

export const BuyerDashboardProvider = ({ children }: BuyerDashboardProviderProps) => {
  const { user } = useAuthContext();
  const [data, setData] = useState<BuyerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setError(null);
    
    const result = await bffApi.getBuyerDashboard();
    
    if (result.isUnauthorized) {
      handleUnauthorized();
      return;
    }
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    
    if (result.data) {
      setData({
        wallet: result.data.wallet || { balance: 0 },
        sellerOrders: result.data.sellerOrders || [],
        wishlist: result.data.wishlist || [],
        wishlistCount: result.data.wishlistCount || 0,
        orderStats: result.data.orderStats || {
          total: 0,
          pending: 0,
          delivered: 0,
          completed: 0,
          cancelled: 0,
          totalSpent: 0
        },
        profile: result.data.profile,
        favorites: result.data.favorites || []
      });
    }
    setLoading(false);
  };

  // Initial load
  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Realtime updates
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('buyer-dashboard-context')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'seller_orders',
        filter: `buyer_id=eq.${user.id}`
      }, fetchData)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'user_wallets',
        filter: `user_id=eq.${user.id}`
      }, fetchData)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'buyer_wishlist',
        filter: `user_id=eq.${user.id}`
      }, fetchData)
      .subscribe();
      
    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [user]);

  return (
    <BuyerDashboardContext.Provider value={{ data, loading, error, refresh: fetchData }}>
      {children}
    </BuyerDashboardContext.Provider>
  );
};
