import { useState, useEffect, useRef, useMemo } from 'react';
import { ShoppingCart, Loader2, Search, TrendingUp, Check, Eye, Users, Package, BarChart3, Clock, CheckCircle, Copy, EyeOff, Wallet, AlertTriangle, X, MessageCircle, Send, Star, ChevronRight, ExternalLink, ArrowRight, Filter, Store, Truck, ThumbsUp, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import MarketplaceSidebar from './MarketplaceSidebar';
import { useFloatingChat } from '@/contexts/FloatingChatContext';
import { fetchWithRecovery } from '@/lib/backend-recovery';

// Import real product images
import chatgptLogo from '@/assets/chatgpt-logo.avif';
import midjourneyLogo from '@/assets/midjourney-logo.avif';
import geminiLogo from '@/assets/gemini-logo.avif';

interface AIAccount {
  id: string;
  name: string;
  description: string | null;
  price: number;
  icon_url: string | null;
  category: string | null;
  category_id: string | null;
  is_available: boolean;
  is_trending: boolean;
  is_featured: boolean;
  original_price: number | null;
  tags: string[] | null;
  stock: number | null;
  chat_allowed?: boolean | null;
}

interface SellerProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  icon_url: string | null;
  category_id: string | null;
  is_available: boolean;
  is_approved: boolean;
  tags: string[] | null;
  stock: number | null;
  sold_count: number | null;
  seller_id: string;
  chat_allowed: boolean | null;
  requires_email: boolean | null;
  seller_profiles: {
    id: string;
    store_name: string;
    store_logo_url: string | null;
    is_verified: boolean;
  } | null;
}

interface PurchasedAccount {
  id: string;
  amount: number;
  payment_status: string;
  delivery_status: string;
  account_credentials: string | null;
  purchased_at: string;
  delivered_at: string | null;
  ai_accounts: {
    name: string;
    category: string | null;
    icon_url: string | null;
  } | null;
}

interface SellerOrderPurchase {
  id: string;
  amount: number;
  seller_earning: number;
  status: string;
  credentials: string | null;
  buyer_approved: boolean;
  created_at: string;
  delivered_at: string | null;
  product_id: string;
  seller_id: string;
  seller_products: {
    name: string;
    icon_url: string | null;
    description: string | null;
  } | null;
  seller_profiles: {
    id: string;
    store_name: string;
    store_logo_url: string | null;
    user_id: string;
  } | null;
}

interface InsufficientFundsModal {
  show: boolean;
  required: number;
  current: number;
  shortfall: number;
  accountName?: string;
}

interface SupportMessage {
  id: string;
  user_id: string;
  message: string;
  sender_type: 'user' | 'admin';
  is_read: boolean;
  created_at: string;
}

interface DynamicCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  is_active: boolean;
}

// Pending purchase/chat interfaces for post-auth flows
interface PendingPurchase {
  productId: string;
  productName: string;
  sellerId: string;
  price: number;
  storeSlug: string;
  iconUrl: string | null;
}

interface PendingChat {
  productId: string;
  productName: string;
  sellerId: string;
  storeSlug: string;
  sellerName: string;
}

// Generate stable random purchase count per account
const getPurchaseCount = (accountId: string) => {
  const hash = accountId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return 150 + (hash % 350);
};

type TabType = 'browse' | 'purchases' | 'stats' | 'chat';

const AIAccountsSection = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('browse');
  const [accounts, setAccounts] = useState<AIAccount[]>([]);
  const [dynamicCategories, setDynamicCategories] = useState<DynamicCategory[]>([]);
  const [purchases, setPurchases] = useState<PurchasedAccount[]>([]);
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasesLoading, setPurchasesLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});
  const [insufficientFundsModal, setInsufficientFundsModal] = useState<InsufficientFundsModal>({
    show: false,
    required: 0,
    current: 0,
    shortfall: 0
  });

  // Seller orders (purchases from marketplace sellers)
  const [sellerOrders, setSellerOrders] = useState<SellerOrderPurchase[]>([]);
  const [approvingOrder, setApprovingOrder] = useState<string | null>(null);
  const [approvedOrders, setApprovedOrders] = useState<Set<string>>(new Set());

  // Seller products state
  const [sellerProducts, setSellerProducts] = useState<SellerProduct[]>([]);
  const { openChat } = useFloatingChat();

  // View Details Modal state
  const [selectedAccount, setSelectedAccount] = useState<AIAccount | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Seller Product Details Modal state
  const [selectedSellerProduct, setSelectedSellerProduct] = useState<SellerProduct | null>(null);
  const [showSellerDetailsModal, setShowSellerDetailsModal] = useState(false);

  // Quick View Modal state
  const [quickViewProduct, setQuickViewProduct] = useState<{ type: 'account' | 'seller'; data: AIAccount | SellerProduct } | null>(null);
  const [showQuickViewModal, setShowQuickViewModal] = useState(false);

  // Email-required product purchase modal
  const [emailRequiredModal, setEmailRequiredModal] = useState<{
    show: boolean;
    product: SellerProduct | null;
    email: string;
  }>({ show: false, product: null, email: '' });

  // Chat state
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Pending purchase state (for post-auth flow from store)
  const [pendingPurchaseData, setPendingPurchaseData] = useState<PendingPurchase | null>(null);

  useEffect(() => {
    // Parallel fetch ALL initial data for maximum speed with timeout protection
    const fetchInitialData = async () => {
      try {
        const [accountsRes, categoriesRes, productsRes] = await Promise.allSettled([
          fetchWithRecovery(
            async () => await supabase.from('ai_accounts').select('*').eq('is_available', true).order('created_at', { ascending: false }),
            { timeout: 10000, context: 'AI Accounts' }
          ),
          fetchWithRecovery(
            async () => await supabase.from('categories').select('id, name, icon, color, is_active').eq('is_active', true).order('display_order', { ascending: true }),
            { timeout: 10000, context: 'Categories' }
          ),
          fetchWithRecovery(
            async () => await supabase.from('seller_products').select(`*, seller_profiles (id, store_name, store_logo_url, is_verified)`).eq('is_available', true).eq('is_approved', true).order('created_at', { ascending: false }),
            { timeout: 10000, context: 'Seller Products' }
          )
        ]);

        if (accountsRes.status === 'fulfilled' && (accountsRes.value as any)?.data) {
          setAccounts((accountsRes.value as any).data);
        }
        if (categoriesRes.status === 'fulfilled' && (categoriesRes.value as any)?.data) {
          setDynamicCategories((categoriesRes.value as any).data);
        }
        if (productsRes.status === 'fulfilled' && (productsRes.value as any)?.data) {
          setSellerProducts((productsRes.value as any).data as SellerProduct[]);
        }
      } catch (error) {
        console.error('AIAccountsSection fetchInitialData error:', error);
        toast.error('Some marketplace data failed to load');
      }
      
      setLoading(false);
    };

    fetchInitialData();
    
    // Single combined realtime channel for all updates
    const channel = supabase
      .channel('marketplace-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, fetchCategories)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_accounts' }, fetchAccounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seller_products' }, fetchSellerProducts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, icon, color, is_active')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (!error && data) {
      setDynamicCategories(data);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    // Parallel fetch all user-specific data
    const fetchUserData = async () => {
      const [purchasesRes, ordersRes, walletRes] = await Promise.allSettled([
        supabase.from('ai_account_purchases').select('*, ai_accounts(name, category, icon_url)').eq('user_id', user.id).order('purchased_at', { ascending: false }),
        supabase.from('seller_orders').select('*, seller_products(name, icon_url, description), seller_profiles(id, store_name, store_logo_url, user_id)').eq('buyer_id', user.id).order('created_at', { ascending: false }),
        supabase.from('user_wallets').select('balance').eq('user_id', user.id).maybeSingle()
      ]);

      if (purchasesRes.status === 'fulfilled' && purchasesRes.value.data) {
        setPurchases(purchasesRes.value.data);
      }
      if (ordersRes.status === 'fulfilled' && ordersRes.value.data) {
        setSellerOrders(ordersRes.value.data as SellerOrderPurchase[]);
      }
      if (walletRes.status === 'fulfilled') {
        if (walletRes.value.data) {
          setWallet(walletRes.value.data);
        } else {
          // Create wallet if doesn't exist
          const { data: newWallet } = await supabase
            .from('user_wallets')
            .insert({ user_id: user.id, balance: 0 })
            .select('balance')
            .single();
          setWallet(newWallet);
        }
      }
      setPurchasesLoading(false);
    };

    fetchUserData();
    fetchChatMessages();
    fetchUnreadCount();
    
    const unsubscribe = subscribeToUpdates();
    const unsubscribeWallet = subscribeToWallet();
    const unsubscribeChat = subscribeToChatMessages();
    const unsubscribeSellerOrders = subscribeToSellerOrders();
    
    return () => {
      unsubscribe();
      unsubscribeWallet();
      unsubscribeChat();
      unsubscribeSellerOrders();
    };
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle pending purchase or chat from store redirect
  useEffect(() => {
    if (!user) return;
    
    // Handle pending purchase
    const storedPurchase = localStorage.getItem('pendingPurchase');
    if (storedPurchase) {
      try {
        const data = JSON.parse(storedPurchase) as PendingPurchase;
        localStorage.removeItem('pendingPurchase');
        
        // Try to find the product in sellerProducts to open full modal
        const product = sellerProducts.find(p => p.id === data.productId);
        if (product) {
          setSelectedSellerProduct(product);
          setShowSellerDetailsModal(true);
          toast.success(`Welcome! Complete your purchase of "${data.productName}"`);
        } else {
          // Product not in current list - show custom pending purchase modal
          setPendingPurchaseData(data);
          toast.success(`Welcome! Complete your purchase of "${data.productName}"`);
        }
      } catch (e) {
        console.error('Failed to parse pendingPurchase', e);
        localStorage.removeItem('pendingPurchase');
      }
    }

    // Handle pending chat
    const storedChat = localStorage.getItem('pendingChat');
    if (storedChat) {
      try {
        const data = JSON.parse(storedChat) as PendingChat;
        localStorage.removeItem('pendingChat');
        
        // Open floating chat directly
        openChat({
          sellerId: data.sellerId,
          sellerName: data.sellerName,
          productId: data.productId,
          productName: data.productName,
          type: 'seller'
        });
        toast.success(`Chat opened with ${data.sellerName} about "${data.productName}"`);
      } catch (e) {
        console.error('Failed to parse pendingChat', e);
        localStorage.removeItem('pendingChat');
      }
    }
  }, [user, sellerProducts, openChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatMessages = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as SupportMessage[]);
    }
  };

  const fetchUnreadCount = async () => {
    if (!user) return;
    
    const { count, error } = await supabase
      .from('support_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('sender_type', 'admin')
      .eq('is_read', false);

    if (!error) {
      setUnreadCount(count || 0);
    }
  };

  const subscribeToChatMessages = () => {
    if (!user) return () => {};

    const channel = supabase
      .channel('user-support-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchChatMessages();
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendChatMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setSendingMessage(true);
    const { error } = await supabase
      .from('support_messages')
      .insert({
        user_id: user.id,
        message: newMessage.trim(),
        sender_type: 'user'
      });

    if (error) {
      toast.error('Failed to send message');
      console.error('Error sending message:', error);
    } else {
      setNewMessage('');
      toast.success('Message sent!');
      fetchChatMessages();
    }
    setSendingMessage(false);
  };

  const fetchWallet = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // No wallet exists, create one
      const { data: newWallet } = await supabase
        .from('user_wallets')
        .insert({ user_id: user.id, balance: 0 })
        .select('balance')
        .single();
      
      setWallet(newWallet);
    } else if (data) {
      setWallet(data);
    }
  };

  const subscribeToWallet = () => {
    if (!user) return () => {};

    const channel = supabase
      .channel('my-wallet-ai-accounts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_wallets',
          filter: `user_id=eq.${user.id}`
        },
        () => fetchWallet()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from('ai_accounts')
      .select('*')
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAccounts(data);
    }
    setLoading(false);
  };

  const fetchSellerProducts = async () => {
    const { data, error } = await supabase
      .from('seller_products')
      .select(`
        *,
        seller_profiles (id, store_name, store_logo_url, is_verified)
      `)
      .eq('is_available', true)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSellerProducts(data as SellerProduct[]);
    }
  };

  const handleSellerProductPurchase = async (product: SellerProduct, buyerEmailInput?: string) => {
    if (!user) {
      toast.error('Please sign in to purchase');
      return;
    }

    // Check if email is required and not provided
    if (product.requires_email && !buyerEmailInput) {
      setEmailRequiredModal({
        show: true,
        product: product,
        email: ''
      });
      return;
    }

    // Check wallet balance first
    const { data: walletData, error: walletError } = await supabase
      .from('user_wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (walletError && walletError.code === 'PGRST116') {
      setInsufficientFundsModal({
        show: true,
        required: product.price,
        current: 0,
        shortfall: product.price,
        accountName: product.name
      });
      return;
    }

    const currentBalance = Number(walletData?.balance) || 0;

    if (currentBalance < product.price) {
      setInsufficientFundsModal({
        show: true,
        required: product.price,
        current: currentBalance,
        shortfall: product.price - currentBalance,
        accountName: product.name
      });
      return;
    }

    setPurchasing(product.id);

    try {
      const commissionRate = 0.10; // 10% platform commission
      const sellerEarning = product.price * (1 - commissionRate);

      // 1. Deduct from buyer wallet
      // Use atomic purchase function to prevent race conditions
      const { data: purchaseResult, error: purchaseError } = await supabase.rpc('purchase_seller_product', {
        p_buyer_id: user.id,
        p_seller_id: product.seller_id,
        p_product_id: product.id,
        p_amount: product.price,
        p_seller_earning: sellerEarning,
        p_product_name: product.name
      });

      if (purchaseError) throw purchaseError;
      
      const result = purchaseResult as { success: boolean; error?: string; order_id?: string; new_balance?: number };
      
      if (!result.success) {
        throw new Error(result.error || 'Purchase failed');
      }

      // If email required, update order with buyer email
      if (product.requires_email && buyerEmailInput && result.order_id) {
        await supabase
          .from('seller_orders')
          .update({ buyer_email_input: buyerEmailInput })
          .eq('id', result.order_id);
      }

      // Create notifications (optional - don't block on failure)
      Promise.allSettled([
        supabase.from('notifications').insert({
          user_id: user.id,
          type: 'purchase',
          title: 'Purchase Successful',
          message: `You purchased ${product.name} for $${product.price}`,
          link: '/dashboard/ai-accounts?tab=purchases',
          is_read: false
        }),
        supabase.from('seller_notifications').insert({
          seller_id: product.seller_id,
          type: 'new_order',
          title: 'New Order!',
          message: `You have a new order for "${product.name}" - $${sellerEarning.toFixed(2)} pending`,
          link: '/seller/orders',
          is_read: false
        })
      ]);

      // Close email modal if open
      setEmailRequiredModal({ show: false, product: null, email: '' });

      toast.success('Purchase successful! The seller will deliver your account soon.');
      fetchWallet();
      fetchPurchases();
      fetchSellerOrders();
      setActiveTab('purchases');
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error(error.message || 'Failed to complete purchase');
    } finally {
      setPurchasing(null);
    }
  };

  // Handle pending purchase from store redirect
  const handlePendingPurchase = async (data: PendingPurchase) => {
    if (!user) return;
    
    const currentBalance = wallet?.balance || 0;
    if (currentBalance < data.price) {
      toast.error('Insufficient balance. Please top up your wallet.');
      setPendingPurchaseData(null);
      navigate('/dashboard/billing');
      return;
    }

    setPurchasing(data.productId);

    try {
      const commissionRate = 0.10;
      const sellerEarning = data.price * (1 - commissionRate);

      // Use atomic purchase function
      const { data: purchaseResult, error: purchaseError } = await supabase.rpc('purchase_seller_product', {
        p_buyer_id: user.id,
        p_seller_id: data.sellerId,
        p_product_id: data.productId,
        p_amount: data.price,
        p_seller_earning: sellerEarning,
        p_product_name: data.productName
      });

      if (purchaseError) throw purchaseError;
      
      const result = purchaseResult as { success: boolean; error?: string; order_id?: string };
      
      if (!result.success) {
        throw new Error(result.error || 'Purchase failed');
      }

      toast.success('Purchase successful! The seller will deliver your order soon.');
      setPendingPurchaseData(null);
      fetchWallet();
      fetchSellerOrders();
      setActiveTab('purchases');
    } catch (error: any) {
      console.error('Pending purchase error:', error);
      toast.error(error.message || 'Purchase failed');
    } finally {
      setPurchasing(null);
    }
  };

  const fetchPurchases = async () => {
    const { data, error } = await supabase
      .from('ai_account_purchases')
      .select(`
        *,
        ai_accounts (name, category, icon_url)
      `)
      .eq('user_id', user?.id)
      .order('purchased_at', { ascending: false });

    if (!error && data) {
      setPurchases(data as PurchasedAccount[]);
    }
    setPurchasesLoading(false);
  };

  const fetchSellerOrders = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('seller_orders')
      .select(`
        *,
        seller_products (name, icon_url, description),
        seller_profiles (id, store_name, store_logo_url, user_id)
      `)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSellerOrders(data as SellerOrderPurchase[]);
    }
  };

  const subscribeToSellerOrders = () => {
    if (!user) return () => {};

    const channel = supabase
      .channel('my-seller-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seller_orders',
          filter: `buyer_id=eq.${user.id}`
        },
        () => {
          fetchSellerOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleApproveDelivery = async (orderId: string) => {
    // Prevent double approval
    if (!user || approvingOrder === orderId || approvedOrders.has(orderId)) {
      return;
    }
    
    setApprovingOrder(orderId);
    
    try {
      const order = sellerOrders.find(o => o.id === orderId);
      if (!order) throw new Error('Order not found');
      if (order.status !== 'delivered') throw new Error('Order must be delivered first');

      // Use the database function for atomic approval + wallet update (bypasses RLS issues)
      const { error: rpcError } = await supabase.rpc('approve_seller_delivery', {
        p_order_id: orderId,
        p_buyer_id: user.id
      });

      if (rpcError) throw rpcError;

      // Create notifications (these are optional, RLS allows inserts)
      await Promise.allSettled([
        // Notification for seller (generic)
        order.seller_profiles?.user_id ? supabase.from('notifications').insert({
          user_id: order.seller_profiles.user_id,
          type: 'approval',
          title: 'Delivery Approved!',
          message: `Buyer approved "${order.seller_products?.name}". $${Number(order.seller_earning).toFixed(2)} released!`,
          link: '/seller/orders',
          is_read: false
        }) : Promise.resolve(),
        // Seller notification
        supabase.from('seller_notifications').insert({
          seller_id: order.seller_id,
          type: 'order_approved',
          title: 'Delivery Approved!',
          message: `"${order.seller_products?.name}" approved. $${Number(order.seller_earning).toFixed(2)} in wallet!`,
          link: '/seller/wallet',
          is_read: false
        }),
        // System chat message
        supabase.from('seller_chats').insert({
          buyer_id: user.id,
          seller_id: order.seller_id,
          message: `✅ Buyer approved "${order.seller_products?.name}". $${Number(order.seller_earning).toFixed(2)} released!`,
          sender_type: 'system',
          product_id: order.product_id
        })
      ]);

      // Mark as approved locally to prevent re-click
      setApprovedOrders(prev => new Set(prev).add(orderId));
      
      toast.success('Delivery approved! Thank you for your purchase.');
      fetchSellerOrders();
    } catch (error: any) {
      console.error('Approval error:', error);
      toast.error(error.message || 'Failed to approve delivery');
    } finally {
      setApprovingOrder(null);
    }
  };

  const subscribeToUpdates = () => {
    if (!user) return () => {};

    const channel = supabase
      .channel('my-account-purchases')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_account_purchases',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchPurchases();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handlePurchase = async (account: AIAccount) => {
    if (!user) {
      toast.error('Please sign in to purchase');
      return;
    }

    // Check wallet balance first
    const { data: walletData, error: walletError } = await supabase
      .from('user_wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (walletError && walletError.code === 'PGRST116') {
      // No wallet exists
      setInsufficientFundsModal({
        show: true,
        required: account.price,
        current: 0,
        shortfall: account.price,
        accountName: account.name
      });
      return;
    }

    const currentBalance = Number(walletData?.balance) || 0;

    if (currentBalance < account.price) {
      // Show insufficient balance modal
      setInsufficientFundsModal({
        show: true,
        required: account.price,
        current: currentBalance,
        shortfall: account.price - currentBalance,
        accountName: account.name
      });
      return;
    }

    // Proceed with purchase
    setPurchasing(account.id);

    try {
      // Use atomic purchase function to prevent race conditions
      const { data: purchaseResult, error: purchaseError } = await supabase.rpc('purchase_ai_account', {
        p_user_id: user.id,
        p_account_id: account.id,
        p_amount: account.price,
        p_account_name: account.name
      });

      if (purchaseError) throw purchaseError;
      
      const result = purchaseResult as { success: boolean; error?: string; purchase_id?: string; new_balance?: number };
      
      if (!result.success) {
        throw new Error(result.error || 'Purchase failed');
      }

      // Create notification (optional - don't block on failure)
      supabase.from('notifications').insert({
        user_id: user.id,
        type: 'purchase',
        title: 'Purchase Successful',
        message: `You purchased ${account.name} for $${account.price}`,
        link: '/dashboard/ai-accounts?tab=purchases',
        is_read: false
      }).then(() => {});

      toast.success('Purchase successful! Account credentials will be delivered soon.');
      fetchWallet();
      fetchPurchases();
      setActiveTab('purchases');
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error(error.message || 'Failed to complete purchase');
    } finally {
      setPurchasing(null);
    }
  };

  const getProductImage = (category: string | null) => {
    switch (category) {
      case 'chatgpt': return chatgptLogo;
      case 'midjourney': return midjourneyLogo;
      case 'gemini': return geminiLogo;
      case 'claude': return chatgptLogo;
      default: return chatgptLogo;
    }
  };

  const toggleCredentials = (id: string) => {
    setShowCredentials(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyCredentials = (credentials: string) => {
    navigator.clipboard.writeText(credentials);
    toast.success('Credentials copied to clipboard');
  };

  const handleTagSelect = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const getCategoryCount = (categoryId: string) => {
    return accounts.filter(a => a.category_id === categoryId).length;
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'AI';
    const category = dynamicCategories.find(c => c.id === categoryId);
    return category?.name || 'AI';
  };

  const getCategoryColor = (categoryId: string | null) => {
    if (!categoryId) return 'violet';
    const category = dynamicCategories.find(c => c.id === categoryId);
    return category?.color || 'violet';
  };

  const filteredAccounts = useMemo(() => {
    return accounts.filter(account => {
      const matchesSearch = account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || account.category_id === categoryFilter || account.category === categoryFilter;
      const matchesTags = selectedTags.length === 0 || 
        account.tags?.some(tag => selectedTags.includes(tag));
      return matchesSearch && matchesCategory && matchesTags;
    });
  }, [accounts, searchQuery, categoryFilter, selectedTags]);

  // Trending accounts
  const trendingAccounts = accounts.filter(account => account.is_trending);

  // Stats calculations
  const totalPurchases = purchases.length;
  const totalSpent = purchases.reduce((sum, p) => sum + Number(p.amount), 0);
  const deliveredCount = purchases.filter(p => p.delivery_status === 'delivered').length;
  const pendingCount = purchases.filter(p => p.delivery_status === 'pending').length;

  const getCategoryColorClass = (color: string | null) => {
    const colorMap: Record<string, string> = {
      violet: 'bg-violet-500',
      emerald: 'bg-emerald-500',
      blue: 'bg-blue-500',
      rose: 'bg-rose-500',
      amber: 'bg-amber-500',
      cyan: 'bg-cyan-500',
      pink: 'bg-pink-500',
      indigo: 'bg-indigo-500',
      teal: 'bg-teal-500',
      orange: 'bg-orange-500',
    };
    return colorMap[color || 'violet'] || 'bg-violet-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-gray-900 animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      {/* Tab Navigation - Clean and Simple */}
      <div className="bg-white rounded-2xl p-1.5 lg:p-2 mb-4 lg:mb-8 border border-gray-200 shadow-md">
        <div className="flex gap-1 lg:gap-2 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-3 lg:px-6 py-2 lg:py-3.5 rounded-xl font-semibold text-xs lg:text-sm transition-all duration-200 flex items-center gap-1.5 lg:gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'browse'
                ? 'bg-gray-900 text-white shadow-lg'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 active:scale-95'
            }`}
          >
            <ShoppingCart size={14} />
            Browse
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-3 lg:px-6 py-2 lg:py-3.5 rounded-xl font-semibold text-xs lg:text-sm transition-all duration-200 flex items-center gap-1.5 lg:gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'purchases'
                ? 'bg-gray-900 text-white shadow-lg'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 active:scale-95'
            }`}
          >
            <Package size={14} />
            Purchases
            {purchases.length > 0 && (
              <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${
                activeTab === 'purchases' ? 'bg-white text-gray-900' : 'bg-gray-200 text-gray-700'
              }`}>
                {purchases.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3 lg:px-6 py-2 lg:py-3.5 rounded-xl font-semibold text-xs lg:text-sm transition-all duration-200 flex items-center gap-1.5 lg:gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'stats'
                ? 'bg-gray-900 text-white shadow-lg'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 active:scale-95'
            }`}
          >
            <BarChart3 size={14} />
            Stats
          </button>
        </div>
      </div>

      {/* Browse Accounts Tab - New Layout with Sidebar */}
      {activeTab === 'browse' && (
        <div className="flex gap-6">
          {/* Left Sidebar */}
          <MarketplaceSidebar
            trendingAccounts={trendingAccounts}
            categories={dynamicCategories}
            accounts={accounts}
            selectedCategory={categoryFilter}
            selectedTags={selectedTags}
            onCategorySelect={setCategoryFilter}
            onTagSelect={handleTagSelect}
            onAccountClick={(account) => {
              setSelectedAccount(account);
              setShowDetailsModal(true);
            }}
            getCategoryCount={getCategoryCount}
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search and Filter Row */}
            <div className="flex gap-3 mb-6">
              {/* Mobile Filter Button */}
              <div className="lg:hidden">
                <MarketplaceSidebar
                  trendingAccounts={trendingAccounts}
                  categories={dynamicCategories}
                  accounts={accounts}
                  selectedCategory={categoryFilter}
                  selectedTags={selectedTags}
                  onCategorySelect={setCategoryFilter}
                  onTagSelect={handleTagSelect}
                  onAccountClick={(account) => {
                    setSelectedAccount(account);
                    setShowDetailsModal(true);
                  }}
                  getCategoryCount={getCategoryCount}
                />
              </div>

              {/* Search Bar */}
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-gray-100 rounded-lg">
                  <Search size={18} className="text-gray-500" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, categories, tags..."
                  className="w-full bg-white border border-gray-200 rounded-2xl pl-14 pr-4 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all font-medium shadow-md"
                />
                {(searchQuery || selectedTags.length > 0 || categoryFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedTags([]);
                      setCategoryFilter('all');
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={18} className="text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Active Filters Pills */}
            {(selectedTags.length > 0 || categoryFilter !== 'all') && (
              <div className="flex flex-wrap gap-2 mb-4">
                {categoryFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-full text-xs font-medium">
                    {getCategoryName(categoryFilter)}
                    <button onClick={() => setCategoryFilter('all')} className="hover:bg-white/20 rounded-full p-0.5">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {selectedTags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-500 text-white rounded-full text-xs font-medium">
                    {tag}
                    <button onClick={() => handleTagSelect(tag)} className="hover:bg-white/20 rounded-full p-0.5">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}


            {/* Products Grid */}
            {filteredAccounts.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 text-center border border-gray-200 shadow-md">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                  <ShoppingCart className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">No Products Found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTags([]);
                    setCategoryFilter('all');
                  }}
                  className="text-violet-600 font-medium hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
                {filteredAccounts.map((account) => {
                  const hasEnoughBalance = (wallet?.balance || 0) >= account.price;
                  
                  return (
                    <div
                      key={account.id}
                      className="group bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-md hover:shadow-xl hover:border-gray-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                    >
                      {/* Image */}
                      <div className="relative aspect-[4/3] overflow-hidden">
                        {account.icon_url ? (
                          <img 
                            src={account.icon_url} 
                            alt={account.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <img 
                              src={getProductImage(account.category)} 
                              alt={account.name}
                              className="h-20 w-20 object-contain"
                            />
                          </div>
                        )}

                        {/* Uptoza Badge - Admin Products */}
                        <div className="absolute top-3 left-3 px-3 py-1.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                          <span className="w-2 h-2 rounded-full bg-white/80" />
                          Uptoza
                        </div>

                        {/* Trending Badge */}
                        {account.is_trending && (
                          <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg">
                            <TrendingUp size={16} className="text-white" />
                          </div>
                        )}

                        {/* Low Balance Overlay */}
                        {!hasEnoughBalance && (
                          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center">
                            <Wallet size={28} className="text-white mb-2" />
                            <span className="text-white text-sm font-semibold">Low Balance</span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h3 className="font-bold text-gray-900 text-base leading-tight line-clamp-2 mb-2">
                          {account.name}
                        </h3>
                        
                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {account.description || 'Premium account with full access'}
                        </p>

                        {/* Tags */}
                        {account.tags && account.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {account.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Price Badge */}
                        <div className="mb-3 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                            <Check size={12} />
                            ${account.price}
                          </span>
                          {account.original_price && account.original_price > account.price && (
                            <span className="text-xs text-gray-400 line-through">${account.original_price}</span>
                          )}
                        </div>

                        {/* Review Section */}
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600 font-medium">{getPurchaseCount(account.id)}+ sold</span>
                        </div>

                        {/* Action Buttons - 3 buttons */}
                        <div className="flex gap-2">
                          {/* Chat Button - Only show if chat is allowed */}
                          {account.chat_allowed !== false && (
                            <button
                              onClick={() => {
                                openChat({
                                  sellerId: 'support',
                                  sellerName: 'Uptoza Support',
                                  productId: account.id,
                                  productName: account.name,
                                  type: 'support'
                                });
                              }}
                              className="flex-1 font-semibold py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors bg-violet-100 hover:bg-violet-200 text-violet-700"
                            >
                              <MessageCircle size={14} />
                              Chat
                            </button>
                          )}
                          {/* View Button - Opens Quick View */}
                          <button
                            onClick={() => {
                              setQuickViewProduct({ type: 'account', data: account });
                              setShowQuickViewModal(true);
                            }}
                            className="flex-1 font-semibold py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors bg-gray-100 hover:bg-gray-200 text-gray-700"
                          >
                            <Eye size={14} />
                            View
                          </button>
                          {/* Buy Button */}
                          <button
                            onClick={() => handlePurchase(account)}
                            disabled={purchasing === account.id}
                            className={`flex-1 font-bold py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
                              purchasing === account.id
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : hasEnoughBalance
                                ? 'bg-yellow-400 hover:bg-yellow-500 text-black'
                                : 'bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-300'
                            }`}
                          >
                            {purchasing === account.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : !hasEnoughBalance ? (
                              <>
                                <Wallet className="w-4 h-4" />
                                Top Up
                              </>
                            ) : (
                              'Buy'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Seller Products */}
                {sellerProducts.filter(p => {
                  const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
                  const matchesCategory = categoryFilter === 'all' || p.category_id === categoryFilter;
                  const matchesTags = selectedTags.length === 0 || p.tags?.some(tag => selectedTags.includes(tag));
                  return matchesSearch && matchesCategory && matchesTags;
                }).map((product) => {
                  const hasEnoughBalance = (wallet?.balance || 0) >= product.price;
                  
                  return (
                    <div
                      key={`seller-${product.id}`}
                      className="group bg-white rounded-2xl overflow-hidden border-2 border-emerald-200 shadow-md hover:shadow-xl hover:border-emerald-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                    >
                      {/* Image */}
                      <div className="relative aspect-[4/3] overflow-hidden">
                        {product.icon_url ? (
                          <img src={product.icon_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <Package className="h-16 w-16 text-gray-300" />
                          </div>
                        )}

                        {/* Seller Badge */}
                        <div className="absolute top-3 left-3 px-3 py-1.5 bg-emerald-500 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                          <Store size={12} />
                          {product.seller_profiles?.store_name || 'Seller'}
                        </div>

                        {!hasEnoughBalance && (
                          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center">
                            <Wallet size={28} className="text-white mb-2" />
                            <span className="text-white text-sm font-semibold">Low Balance</span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h3 className="font-bold text-gray-900 text-base leading-tight line-clamp-2 mb-2">{product.name}</h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description || 'Premium account from verified seller'}</p>
                        
                        <div className="mb-3 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                            <Check size={12} />${product.price}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600 font-medium">{product.sold_count || 0}+ sold</span>
                        </div>

                        {/* Action Buttons - 3 buttons */}
                        <div className="flex gap-2">
                          {/* Chat Button - Only show if chat is allowed */}
                          {product.chat_allowed !== false && (
                            <button
                              onClick={() => {
                                openChat({
                                  sellerId: product.seller_id,
                                  sellerName: product.seller_profiles?.store_name || 'Seller',
                                  productId: product.id,
                                  productName: product.name,
                                  type: 'seller'
                                });
                              }}
                              className="flex-1 font-semibold py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors bg-emerald-100 hover:bg-emerald-200 text-emerald-700"
                            >
                              <MessageCircle size={14} />
                              Chat
                            </button>
                          )}
                          {/* View Button - Opens Quick View */}
                          <button
                            onClick={() => {
                              setQuickViewProduct({ type: 'seller', data: product });
                              setShowQuickViewModal(true);
                            }}
                            className="flex-1 font-semibold py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors bg-gray-100 hover:bg-gray-200 text-gray-700"
                          >
                            <Eye size={14} />
                            View
                          </button>
                          {/* Buy Button */}
                          <button
                            onClick={() => handleSellerProductPurchase(product)}
                            disabled={purchasing === product.id}
                            className={`flex-1 font-bold py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
                              purchasing === product.id
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : hasEnoughBalance
                                ? 'bg-yellow-400 hover:bg-yellow-500 text-black'
                                : 'bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-300'
                            }`}
                          >
                            {purchasing === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buy'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Seller Product Details Modal */}
      <Dialog open={showSellerDetailsModal} onOpenChange={setShowSellerDetailsModal}>
        <DialogContent className="max-w-lg p-0 overflow-hidden bg-white border-gray-200">
          {selectedSellerProduct && (
            <>
              {/* Product Image */}
              <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200">
                {selectedSellerProduct.icon_url ? (
                  <img 
                    src={selectedSellerProduct.icon_url} 
                    alt={selectedSellerProduct.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-20 w-20 text-gray-300" />
                  </div>
                )}
                {/* Seller Badge */}
                <div className="absolute top-3 left-3 px-3 py-1.5 bg-emerald-500 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                  <Store size={12} />
                  {selectedSellerProduct.seller_profiles?.store_name || 'Seller'}
                </div>
                {selectedSellerProduct.seller_profiles?.is_verified && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-blue-500 text-white rounded-full text-xs font-medium">
                    Verified
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-xl font-bold text-gray-900">
                    {selectedSellerProduct.name}
                  </DialogTitle>
                </DialogHeader>

                {/* Rating & Sales */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <span className="text-gray-600 text-sm">{selectedSellerProduct.sold_count || 0}+ sold</span>
                </div>

                {/* Tags */}
                {selectedSellerProduct.tags && selectedSellerProduct.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedSellerProduct.tags.map(tag => (
                      <span key={tag} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description */}
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {selectedSellerProduct.description || 'Premium product from verified seller.'}
                </p>

                {/* Price */}
                <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Price</p>
                    <p className="text-2xl font-bold text-gray-900">${selectedSellerProduct.price}</p>
                  </div>
                  {selectedSellerProduct.stock !== null && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">In Stock</p>
                      <p className="text-xl font-bold text-gray-900">{selectedSellerProduct.stock}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons - Chat + Buy */}
                <div className="flex gap-3">
                  {/* Chat Button - Only show if chat is allowed */}
                  {selectedSellerProduct.chat_allowed !== false && (
                    <button
                      onClick={() => {
                        setShowSellerDetailsModal(false);
                        openChat({
                          sellerId: selectedSellerProduct.seller_id,
                          sellerName: selectedSellerProduct.seller_profiles?.store_name || 'Seller',
                          productId: selectedSellerProduct.id,
                          productName: selectedSellerProduct.name,
                          type: 'seller'
                        });
                      }}
                      className="flex-1 px-4 py-3 bg-emerald-100 text-emerald-700 rounded-xl font-semibold hover:bg-emerald-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={16} />
                      Chat with {selectedSellerProduct.seller_profiles?.store_name || 'Seller'}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowSellerDetailsModal(false);
                      handleSellerProductPurchase(selectedSellerProduct);
                    }}
                    className={`${selectedSellerProduct.chat_allowed !== false ? 'flex-1' : 'w-full'} px-4 py-3 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl font-bold transition-colors flex items-center justify-center gap-2`}
                  >
                    Buy Now
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* My Purchases Tab */}
      {activeTab === 'purchases' && (
        <>
          {purchasesLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-gray-900 animate-spin" />
            </div>
          ) : purchases.length === 0 && sellerOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center border border-gray-200 shadow-md">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">No Purchases Yet</h3>
              <p className="text-gray-500 mb-6">Your purchased accounts will appear here</p>
              <button
                onClick={() => setActiveTab('browse')}
                className="bg-gray-900 text-white font-semibold px-6 py-3 rounded-xl hover:bg-gray-800 transition-all"
              >
                Browse Products
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Seller Orders (Marketplace Purchases) */}
              {sellerOrders.map((order) => (
                <div
                  key={`seller-order-${order.id}`}
                  className="bg-white rounded-2xl p-6 border-2 border-emerald-200 shadow-md hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center overflow-hidden">
                        {order.seller_products?.icon_url ? (
                          <img 
                            src={order.seller_products.icon_url}
                            alt={order.seller_products?.name || 'Product'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Store className="w-8 h-8 text-emerald-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                            {order.seller_products?.name || 'Product'}
                          </h3>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                            Marketplace
                          </span>
                        </div>
                        <p className="text-gray-500 text-sm">
                          From: {order.seller_profiles?.store_name || 'Seller'}
                        </p>
                        <p className="text-gray-400 text-xs">
                          Purchased on {new Date(order.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 bg-violet-50 text-violet-600 px-3 py-1.5 rounded-full text-sm font-medium">
                        <Wallet className="w-4 h-4" />
                        ${Number(order.amount).toFixed(2)}
                      </span>
                      {order.status === 'pending' && (
                        <span className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full text-sm font-medium">
                          <Clock className="w-4 h-4" />
                          Awaiting Delivery
                        </span>
                      )}
                      {order.status === 'delivered' && !order.buyer_approved && (
                        <span className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-sm font-medium">
                          <Truck className="w-4 h-4" />
                          Delivered
                        </span>
                      )}
                      {order.status === 'completed' && order.buyer_approved && (
                        <span className="flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1.5 rounded-full text-sm font-medium">
                          <CheckCircle className="w-4 h-4" />
                          Approved
                        </span>
                      )}
                      {order.status === 'completed' && !order.buyer_approved && (
                        <span className="flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1.5 rounded-full text-sm font-medium">
                          <CheckCircle className="w-4 h-4" />
                          Completed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Credentials display for delivered orders */}
                  {order.status === 'delivered' && order.credentials && (
                    <div className="mt-5 p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-700">Account Credentials</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleCredentials(`seller-${order.id}`)}
                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            {showCredentials[`seller-${order.id}`] ? (
                              <EyeOff className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Eye className="w-4 h-4 text-blue-600" />
                            )}
                          </button>
                          <button
                            onClick={() => copyCredentials(order.credentials!)}
                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <Copy className="w-4 h-4 text-blue-600" />
                          </button>
                        </div>
                      </div>
                      <code className="text-sm text-blue-900 font-mono block bg-blue-100 p-3 rounded-lg whitespace-pre-wrap">
                        {showCredentials[`seller-${order.id}`] 
                          ? order.credentials 
                          : '••••••••••••••••'}
                      </code>
                      
                      {/* Approve Delivery Button */}
                      <div className="mt-4 flex items-center gap-3">
                        <button
                          onClick={() => handleApproveDelivery(order.id)}
                          disabled={approvingOrder === order.id}
                          className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-50"
                        >
                          {approvingOrder === order.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <ThumbsUp className="w-4 h-4" />
                              Approve Delivery
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            openChat({
                              sellerId: order.seller_id,
                              sellerName: order.seller_profiles?.store_name || 'Seller',
                              productId: order.product_id,
                              productName: order.seller_products?.name,
                              type: 'seller'
                            });
                          }}
                          className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Chat
                        </button>
                      </div>
                      
                      <p className="text-xs text-blue-600 mt-3">
                        Please verify the credentials work before approving. This will release payment to the seller.
                      </p>
                    </div>
                  )}

                  {/* Completed order credentials display */}
                  {order.status === 'completed' && order.credentials && (
                    <div className="mt-5 p-4 bg-gray-100 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Account Credentials</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleCredentials(`seller-${order.id}`)}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            {showCredentials[`seller-${order.id}`] ? (
                              <EyeOff className="w-4 h-4 text-gray-500" />
                            ) : (
                              <Eye className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                          <button
                            onClick={() => copyCredentials(order.credentials!)}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <Copy className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                      <code className="text-sm text-gray-800 font-mono block bg-gray-200 p-3 rounded-lg whitespace-pre-wrap">
                        {showCredentials[`seller-${order.id}`] 
                          ? order.credentials 
                          : '••••••••••••••••'}
                      </code>
                    </div>
                  )}

                  {/* Pending delivery message */}
                  {order.status === 'pending' && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-3">
                      <Clock className="w-5 h-5 text-amber-600" />
                      <p className="text-sm text-amber-700">
                        Waiting for seller to deliver your account credentials.
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {/* Admin Account Purchases */}
              {purchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden">
                                <img 
                                  src={purchase.ai_accounts?.icon_url || getProductImage(purchase.ai_accounts?.category)}
                                  alt={purchase.ai_accounts?.name || 'Account'}
                                  className="w-10 h-10 object-contain"
                                />
                              </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                          {purchase.ai_accounts?.name || 'Account'}
                        </h3>
                        <p className="text-gray-500 text-sm">
                          Purchased on {new Date(purchase.purchased_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Paid from Wallet Badge */}
                      <span className="flex items-center gap-1.5 bg-violet-50 text-violet-600 px-3 py-1.5 rounded-full text-sm font-medium">
                        <Wallet className="w-4 h-4" />
                        Wallet
                      </span>
                      {purchase.delivery_status === 'pending' ? (
                        <span className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full text-sm font-medium">
                          <Clock className="w-4 h-4" />
                          Pending
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1.5 rounded-full text-sm font-medium">
                          <CheckCircle className="w-4 h-4" />
                          Delivered
                        </span>
                      )}
                    </div>
                  </div>

                  {purchase.delivery_status === 'delivered' && purchase.account_credentials && (
                    <div className="mt-5 p-4 bg-gray-100 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Account Credentials</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleCredentials(purchase.id)}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            {showCredentials[purchase.id] ? (
                              <EyeOff className="w-4 h-4 text-gray-500" />
                            ) : (
                              <Eye className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                          <button
                            onClick={() => copyCredentials(purchase.account_credentials!)}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <Copy className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                      <code className="text-sm text-gray-800 font-mono block bg-gray-200 p-3 rounded-lg">
                        {showCredentials[purchase.id] 
                          ? purchase.account_credentials 
                          : '••••••••••••••••'}
                      </code>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
            <div className="bg-white rounded-2xl p-4 lg:p-6 border border-gray-200 shadow-md">
              <p className="text-xs lg:text-sm text-gray-500 mb-1">Total Purchases</p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">{totalPurchases}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 lg:p-6 border border-gray-200 shadow-md">
              <p className="text-xs lg:text-sm text-gray-500 mb-1">Total Spent</p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">${totalSpent.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 lg:p-6 border border-gray-200 shadow-md">
              <p className="text-xs lg:text-sm text-gray-500 mb-1">Delivered</p>
              <p className="text-2xl lg:text-3xl font-bold text-emerald-600 tracking-tight">{deliveredCount}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 lg:p-6 border border-gray-200 shadow-md">
              <p className="text-xs lg:text-sm text-gray-500 mb-1">Pending</p>
              <p className="text-2xl lg:text-3xl font-bold text-amber-600 tracking-tight">{pendingCount}</p>
            </div>
          </div>

          {/* Wallet Section */}
          <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-6 lg:p-8 text-white shadow-xl mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white/70 text-sm">Current Balance</p>
                  <p className="text-3xl lg:text-4xl font-bold tracking-tight">
                    ${wallet?.balance?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/dashboard/billing')}
                className="px-6 py-3 bg-white text-violet-700 rounded-xl font-semibold hover:bg-white/90 transition-all"
              >
                Top Up
              </button>
            </div>
          </div>
        </>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
              <MessageCircle className="text-violet-600" size={20} />
            </div>
            <div>
              <h3 className="text-gray-900 font-semibold">Support Chat</h3>
              <p className="text-gray-500 text-sm">We typically reply within a few hours</p>
            </div>
          </div>
          
          {/* Messages Area */}
          <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No messages yet</p>
                  <p className="text-gray-500 text-sm">Send us a message and we'll get back to you</p>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      msg.sender_type === 'user'
                        ? 'bg-violet-500 text-white'
                        : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    <span className={`text-xs mt-1 block ${msg.sender_type === 'user' ? 'opacity-60' : 'text-gray-400'}`}>
                      {format(new Date(msg.created_at), 'h:mm a')}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-300"
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
              />
              <button
                onClick={sendChatMessage}
                disabled={!newMessage.trim() || sendingMessage}
                className="bg-violet-500 hover:bg-violet-600 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} />
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          {selectedAccount && (
            <>
              {/* Account Image */}
              <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200">
                {selectedAccount.icon_url ? (
                  <img 
                    src={selectedAccount.icon_url} 
                    alt={selectedAccount.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <img 
                      src={getProductImage(selectedAccount.category)} 
                      alt={selectedAccount.name}
                      className="h-20 w-20 object-contain"
                    />
                  </div>
                )}
                {/* Category Badge */}
                <div className={`absolute top-3 left-3 px-3 py-1.5 ${getCategoryColorClass(getCategoryColor(selectedAccount.category_id))} text-white rounded-full text-xs font-bold uppercase shadow-lg`}>
                  {getCategoryName(selectedAccount.category_id) || selectedAccount.category || 'AI'}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-xl font-bold text-gray-900">
                    {selectedAccount.name}
                  </DialogTitle>
                </DialogHeader>

                {/* Rating & Sales */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                    ))}
                    <span className="text-gray-600 text-sm font-medium ml-1">5.0</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                    <Users size={14} />
                    <span className="font-medium">{getPurchaseCount(selectedAccount.id)}+ sold</span>
                  </div>
                </div>

                {/* Tags */}
                {selectedAccount.tags && selectedAccount.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedAccount.tags.map(tag => (
                      <span key={tag} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description */}
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {selectedAccount.description || 'Premium account with full access to all features. Get instant access to the most powerful tools available.'}
                </p>

                {/* Price & Stock */}
                <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Price</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-gray-900">${selectedAccount.price}</p>
                      {selectedAccount.original_price && selectedAccount.original_price > selectedAccount.price && (
                        <span className="text-sm text-gray-400 line-through">${selectedAccount.original_price}</span>
                      )}
                    </div>
                    <p className="text-xs text-emerald-600 font-medium">One-time payment</p>
                  </div>
                  {selectedAccount.stock !== null && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">In Stock</p>
                      <p className="text-xl font-bold text-gray-900">{selectedAccount.stock}</p>
                      <p className="text-xs text-gray-500">Available</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {/* Chat Button - Only show if chat is allowed */}
                  {selectedAccount.chat_allowed !== false && (
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        openChat({
                          sellerId: 'support',
                          sellerName: 'Uptoza Support',
                          productId: selectedAccount.id,
                          productName: selectedAccount.name,
                          type: 'support'
                        });
                      }}
                      className="flex-1 px-4 py-3 bg-violet-100 text-violet-700 rounded-xl font-semibold hover:bg-violet-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={16} />
                      Chat with Uptoza
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handlePurchase(selectedAccount);
                    }}
                    className={`${selectedAccount.chat_allowed !== false ? 'flex-1' : 'w-full'} px-4 py-3 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl font-bold transition-colors flex items-center justify-center gap-2`}
                  >
                    Buy Now
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick View Modal */}
      <Dialog open={showQuickViewModal} onOpenChange={setShowQuickViewModal}>
        <DialogContent className="max-w-sm p-0 overflow-hidden bg-white border-gray-200">
          {quickViewProduct && (
            <>
              {/* Product Image */}
              <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200">
                {quickViewProduct.data.icon_url ? (
                  <img 
                    src={quickViewProduct.data.icon_url} 
                    alt={quickViewProduct.data.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-16 w-16 text-gray-300" />
                  </div>
                )}
                {/* Badge */}
                {quickViewProduct.type === 'seller' ? (
                  <div className="absolute top-3 left-3 px-3 py-1.5 bg-emerald-500 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                    <Store size={12} />
                    {(quickViewProduct.data as SellerProduct).seller_profiles?.store_name || 'Seller'}
                  </div>
                ) : (
                  <div className="absolute top-3 left-3 px-3 py-1.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-white/80" />
                    Uptoza
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-bold text-gray-900 text-lg mb-2">{quickViewProduct.data.name}</h3>
                
                {/* Price */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-700">
                    <Check size={14} />
                    ${quickViewProduct.data.price}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-4 whitespace-pre-line" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  {quickViewProduct.data.description || 'No description available'}
                </p>

                {/* Action Buttons - 1 Row */}
                <div className="flex items-center gap-2">
                  {/* Chat Button */}
                  {quickViewProduct.data.chat_allowed !== false && (
                    <button
                      onClick={() => {
                        setShowQuickViewModal(false);
                        if (quickViewProduct.type === 'seller') {
                          const product = quickViewProduct.data as SellerProduct;
                          openChat({
                            sellerId: product.seller_id,
                            sellerName: product.seller_profiles?.store_name || 'Seller',
                            productId: product.id,
                            productName: product.name,
                            type: 'seller'
                          });
                        } else {
                          openChat({
                            sellerId: 'support',
                            sellerName: 'Uptoza Support',
                            productId: quickViewProduct.data.id,
                            productName: quickViewProduct.data.name,
                            type: 'support'
                          });
                        }
                      }}
                      className={`flex-1 font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors text-sm ${
                        quickViewProduct.type === 'seller'
                          ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
                          : 'bg-violet-100 hover:bg-violet-200 text-violet-700'
                      }`}
                    >
                      <MessageCircle size={16} />
                      Chat
                    </button>
                  )}

                  {/* Full View Button */}
                  <button
                    onClick={() => {
                      setShowQuickViewModal(false);
                      navigate(`/dashboard/ai-accounts/product/${quickViewProduct.data.id}`);
                    }}
                    className="flex-1 font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
                  >
                    <Eye size={16} />
                    View
                  </button>

                  {/* Buy Now Button */}
                  <button
                    onClick={() => {
                      setShowQuickViewModal(false);
                      if (quickViewProduct.type === 'seller') {
                        handleSellerProductPurchase(quickViewProduct.data as SellerProduct);
                      } else {
                        handlePurchase(quickViewProduct.data as AIAccount);
                      }
                    }}
                    disabled={purchasing === quickViewProduct.data.id}
                    className="flex-1 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors bg-yellow-400 hover:bg-yellow-500 text-black text-sm"
                  >
                    {purchasing === quickViewProduct.data.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShoppingCart size={16} />
                        Buy
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Insufficient Funds Modal */}
      {insufficientFundsModal.show && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setInsufficientFundsModal({ show: false, required: 0, current: 0, shortfall: 0 })}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Insufficient Balance</h3>
              
              <p className="text-gray-600 mb-4">
                To purchase <span className="font-semibold text-gray-900">{insufficientFundsModal.accountName}</span>
              </p>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Required Amount:</span>
                  <span className="text-gray-900 font-bold">${insufficientFundsModal.required.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Your Balance:</span>
                  <span className="text-amber-600 font-bold">${insufficientFundsModal.current.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-sm">
                  <span className="text-gray-500">Amount Needed:</span>
                  <span className="text-violet-600 font-bold">${insufficientFundsModal.shortfall.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setInsufficientFundsModal({ show: false, required: 0, current: 0, shortfall: 0 })}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setInsufficientFundsModal({ show: false, required: 0, current: 0, shortfall: 0 });
                    navigate('/dashboard/billing');
                  }}
                  className="flex-1 px-4 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                >
                  <Wallet size={18} />
                  Top Up Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Required Modal */}
      {emailRequiredModal.show && emailRequiredModal.product && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setEmailRequiredModal({ show: false, product: null, email: '' })}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Email Required</h3>
              
              <p className="text-gray-600 mb-4">
                <span className="font-semibold text-gray-900">{emailRequiredModal.product.name}</span> requires your email for shared access. The seller will use this to add your account.
              </p>
              
              <div className="mb-6">
                <input
                  type="email"
                  value={emailRequiredModal.email}
                  onChange={(e) => setEmailRequiredModal(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2">
                  This email will be shared with the seller for product access
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setEmailRequiredModal({ show: false, product: null, email: '' })}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!emailRequiredModal.email.trim() || !emailRequiredModal.email.includes('@')) {
                      toast.error('Please enter a valid email address');
                      return;
                    }
                    handleSellerProductPurchase(emailRequiredModal.product!, emailRequiredModal.email.trim());
                  }}
                  disabled={!emailRequiredModal.email.trim() || purchasing === emailRequiredModal.product?.id}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {purchasing === emailRequiredModal.product?.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Confirm Purchase'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Purchase Modal - for products from external stores */}
      {pendingPurchaseData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            {/* Product Image */}
            <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200">
              {pendingPurchaseData.iconUrl ? (
                <img 
                  src={pendingPurchaseData.iconUrl} 
                  alt={pendingPurchaseData.productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-20 w-20 text-gray-300" />
                </div>
              )}
              <div className="absolute top-3 left-3 px-3 py-1.5 bg-emerald-500 text-white rounded-full text-xs font-bold">
                From {pendingPurchaseData.storeSlug}
              </div>
              <button
                onClick={() => setPendingPurchaseData(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {pendingPurchaseData.productName}
              </h3>

              {/* Price & Wallet */}
              <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Price</p>
                  <p className="text-2xl font-bold text-gray-900">${pendingPurchaseData.price.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Your Balance</p>
                  <p className={`text-xl font-bold ${(wallet?.balance || 0) >= pendingPurchaseData.price ? 'text-emerald-600' : 'text-red-500'}`}>
                    ${(wallet?.balance || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Insufficient Balance Warning */}
              {(wallet?.balance || 0) < pendingPurchaseData.price && (
                <div className="flex items-start gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-700">Insufficient Balance</p>
                    <p className="text-xs text-red-600">
                      You need ${(pendingPurchaseData.price - (wallet?.balance || 0)).toFixed(2)} more to complete this purchase.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setPendingPurchaseData(null)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                {(wallet?.balance || 0) < pendingPurchaseData.price ? (
                  <button
                    onClick={() => {
                      setPendingPurchaseData(null);
                      navigate('/dashboard/billing');
                    }}
                    className="flex-1 px-4 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                  >
                    <Wallet size={18} />
                    Top Up Wallet
                  </button>
                ) : (
                  <button
                    onClick={() => handlePendingPurchase(pendingPurchaseData)}
                    disabled={purchasing === pendingPurchaseData.productId}
                    className="flex-1 px-4 py-3 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {purchasing === pendingPurchaseData.productId ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        Buy Now
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAccountsSection;
