import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminDataState {
  profiles: any[];
  purchases: any[];
  prompts: any[];
  categories: any[];
  aiAccounts: any[];
  accountOrders: any[];
  wallets: any[];
  transactions: any[];
  supportMessages: any[];
  sellerSupportMessages: any[];
  paymentMethods: any[];
  refundRequests: any[];
  cancellationRequests: any[];
  deletionRequests: any[];
  sellerProfiles: any[];
  isLoading: boolean;
  isInitialized: boolean;
}

interface AdminDataContextType extends AdminDataState {
  refreshAll: () => Promise<void>;
  refreshTable: (table: string) => Promise<void>;
  updateLocalData: (table: string, data: any[]) => void;
}

const AdminDataContext = createContext<AdminDataContextType | null>(null);

const ADMIN_SESSION_KEY = 'admin_session_token';

export const AdminDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AdminDataState>({
    profiles: [],
    purchases: [],
    prompts: [],
    categories: [],
    aiAccounts: [],
    accountOrders: [],
    wallets: [],
    transactions: [],
    supportMessages: [],
    sellerSupportMessages: [],
    paymentMethods: [],
    refundRequests: [],
    cancellationRequests: [],
    deletionRequests: [],
    sellerProfiles: [],
    isLoading: true,
    isInitialized: false,
  });

  const fetchData = async <T,>(table: string, options?: { select?: string; order?: { column: string; ascending?: boolean }; filters?: Record<string, any> }): Promise<{ data: T[] | null; error: any }> => {
    const token = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!token) return { data: null, error: 'No session' };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-fetch-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ token, table, ...options }),
        }
      );
      return await response.json();
    } catch (error) {
      return { data: null, error };
    }
  };

  const refreshAll = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    const [
      profilesRes,
      purchasesRes,
      promptsRes,
      categoriesRes,
      aiAccountsRes,
      accountOrdersRes,
      walletsRes,
      transactionsRes,
      supportMessagesRes,
      sellerSupportMessagesRes,
      paymentMethodsRes,
      refundRequestsRes,
      cancellationRequestsRes,
      deletionRequestsRes,
      sellerProfilesRes,
    ] = await Promise.all([
      fetchData('profiles'),
      fetchData('purchases', { order: { column: 'purchased_at', ascending: false } }),
      fetchData('prompts'),
      fetchData('categories'),
      fetchData('ai_accounts'),
      fetchData('ai_account_purchases', { order: { column: 'purchased_at', ascending: false } }),
      fetchData('user_wallets'),
      fetchData('wallet_transactions', { order: { column: 'created_at', ascending: false } }),
      fetchData('support_messages', { order: { column: 'created_at', ascending: false } }),
      fetchData('seller_support_messages', { order: { column: 'created_at', ascending: false } }),
      fetchData('payment_methods', { order: { column: 'display_order', ascending: true } }),
      fetchData('refund_requests', { order: { column: 'created_at', ascending: false } }),
      fetchData('cancellation_requests', { order: { column: 'created_at', ascending: false } }),
      fetchData('account_deletion_requests', { order: { column: 'requested_at', ascending: false } }),
      fetchData('seller_profiles'),
    ]);

    setState({
      profiles: profilesRes.data || [],
      purchases: purchasesRes.data || [],
      prompts: promptsRes.data || [],
      categories: categoriesRes.data || [],
      aiAccounts: aiAccountsRes.data || [],
      accountOrders: accountOrdersRes.data || [],
      wallets: walletsRes.data || [],
      transactions: transactionsRes.data || [],
      supportMessages: supportMessagesRes.data || [],
      sellerSupportMessages: sellerSupportMessagesRes.data || [],
      paymentMethods: paymentMethodsRes.data || [],
      refundRequests: refundRequestsRes.data || [],
      cancellationRequests: cancellationRequestsRes.data || [],
      deletionRequests: deletionRequestsRes.data || [],
      sellerProfiles: sellerProfilesRes.data || [],
      isLoading: false,
      isInitialized: true,
    });
  }, []);

  const refreshTable = useCallback(async (table: string) => {
    const tableMap: Record<string, keyof AdminDataState> = {
      profiles: 'profiles',
      purchases: 'purchases',
      prompts: 'prompts',
      categories: 'categories',
      ai_accounts: 'aiAccounts',
      ai_account_purchases: 'accountOrders',
      user_wallets: 'wallets',
      wallet_transactions: 'transactions',
      support_messages: 'supportMessages',
      seller_support_messages: 'sellerSupportMessages',
      payment_methods: 'paymentMethods',
      refund_requests: 'refundRequests',
      cancellation_requests: 'cancellationRequests',
      account_deletion_requests: 'deletionRequests',
      seller_profiles: 'sellerProfiles',
    };

    const stateKey = tableMap[table];
    if (!stateKey) return;

    const res = await fetchData(table);
    if (res.data) {
      setState(prev => ({ ...prev, [stateKey]: res.data }));
    }
  }, []);

  const updateLocalData = useCallback((table: string, data: any[]) => {
    const tableMap: Record<string, keyof AdminDataState> = {
      profiles: 'profiles',
      purchases: 'purchases',
      prompts: 'prompts',
      categories: 'categories',
      ai_accounts: 'aiAccounts',
      ai_account_purchases: 'accountOrders',
      user_wallets: 'wallets',
      wallet_transactions: 'transactions',
      support_messages: 'supportMessages',
      seller_support_messages: 'sellerSupportMessages',
      payment_methods: 'paymentMethods',
      refund_requests: 'refundRequests',
      cancellation_requests: 'cancellationRequests',
      account_deletion_requests: 'deletionRequests',
      seller_profiles: 'sellerProfiles',
    };

    const stateKey = tableMap[table];
    if (stateKey) {
      setState(prev => ({ ...prev, [stateKey]: data }));
    }
  }, []);

  // Real-time subscriptions for all admin tables
  const channelsRef = useRef<any[]>([]);
  
  useEffect(() => {
    const tables = [
      { table: 'profiles', key: 'profiles' },
      { table: 'purchases', key: 'purchases' },
      { table: 'ai_account_purchases', key: 'ai_account_purchases' },
      { table: 'prompts', key: 'prompts' },
      { table: 'categories', key: 'categories' },
      { table: 'seller_profiles', key: 'seller_profiles' },
      { table: 'seller_products', key: 'seller_products' },
      { table: 'seller_withdrawals', key: 'seller_withdrawals' },
      { table: 'seller_feature_requests', key: 'seller_feature_requests' },
      { table: 'seller_orders', key: 'seller_orders' },
      { table: 'user_wallets', key: 'user_wallets' },
      { table: 'wallet_transactions', key: 'wallet_transactions' },
      { table: 'support_messages', key: 'support_messages' },
      { table: 'seller_support_messages', key: 'seller_support_messages' },
      { table: 'refund_requests', key: 'refund_requests' },
      { table: 'cancellation_requests', key: 'cancellation_requests' },
      { table: 'account_deletion_requests', key: 'account_deletion_requests' },
    ];

    channelsRef.current = tables.map(({ table, key }) =>
      supabase
        .channel(`admin-realtime-${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          refreshTable(key);
        })
        .subscribe()
    );

    return () => {
      channelsRef.current.forEach(channel => supabase.removeChannel(channel));
    };
  }, [refreshTable]);

  return (
    <AdminDataContext.Provider value={{ ...state, refreshAll, refreshTable, updateLocalData }}>
      {children}
    </AdminDataContext.Provider>
  );
};

export const useAdminDataContext = () => {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error('useAdminDataContext must be used within AdminDataProvider');
  }
  return context;
};
