import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

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
  paymentMethods: any[];
  refundRequests: any[];
  cancellationRequests: any[];
  deletionRequests: any[];
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
    paymentMethods: [],
    refundRequests: [],
    cancellationRequests: [],
    deletionRequests: [],
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
      paymentMethodsRes,
      refundRequestsRes,
      cancellationRequestsRes,
      deletionRequestsRes,
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
      fetchData('payment_methods', { order: { column: 'display_order', ascending: true } }),
      fetchData('refund_requests', { order: { column: 'created_at', ascending: false } }),
      fetchData('cancellation_requests', { order: { column: 'created_at', ascending: false } }),
      fetchData('account_deletion_requests', { order: { column: 'requested_at', ascending: false } }),
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
      paymentMethods: paymentMethodsRes.data || [],
      refundRequests: refundRequestsRes.data || [],
      cancellationRequests: cancellationRequestsRes.data || [],
      deletionRequests: deletionRequestsRes.data || [],
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
      payment_methods: 'paymentMethods',
      refund_requests: 'refundRequests',
      cancellation_requests: 'cancellationRequests',
      account_deletion_requests: 'deletionRequests',
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
      payment_methods: 'paymentMethods',
      refund_requests: 'refundRequests',
      cancellation_requests: 'cancellationRequests',
      account_deletion_requests: 'deletionRequests',
    };

    const stateKey = tableMap[table];
    if (stateKey) {
      setState(prev => ({ ...prev, [stateKey]: data }));
    }
  }, []);

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
