import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Users, Store, CheckCircle, Search, Eye, Wallet,
  Package, Clock, XCircle, DollarSign, MessageSquare,
  AlertTriangle, UserPlus, Check, X, Trash2, ShoppingCart,
  Calendar, Mail, FileText, Loader2, Send, LogOut, Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

// Types
interface SellerProfile {
  id: string;
  user_id: string;
  store_name: string;
  store_description: string | null;
  store_logo_url: string | null;
  is_verified: boolean;
  is_active: boolean;
  total_sales: number;
  total_orders: number;
  created_at: string;
}

interface SellerDetails {
  profile: SellerProfile;
  wallet: { balance: number; pending_balance: number } | null;
  products: any[];
  orders: any[];
  withdrawals: any[];
  email: string | null;
}

interface SellerProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  icon_url: string | null;
  stock: number | null;
  is_available: boolean;
  is_approved: boolean;
  sold_count: number | null;
  created_at: string;
  seller_profiles: { id: string; store_name: string; is_verified: boolean } | null;
  categories: { name: string; color: string | null } | null;
}

interface Withdrawal {
  id: string;
  seller_id: string;
  amount: number;
  payment_method: string;
  account_details: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
  seller: { store_name: string; user_id: string } | null;
}

interface ChatJoinRequest {
  id: string;
  buyer_id: string;
  seller_id: string;
  reason: string;
  description: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  buyer_profile?: { email: string; full_name: string | null } | null;
  seller_profile?: { store_name: string } | null;
}

interface ChatMessage {
  id: string;
  buyer_id: string;
  seller_id: string;
  message: string;
  sender_type: 'buyer' | 'seller' | 'system' | 'support';
  created_at: string;
  admin_joined?: boolean;
}

interface ActiveChatSession {
  request: ChatJoinRequest;
  messages: ChatMessage[];
}

type MainTab = 'sellers' | 'products' | 'withdrawals' | 'chat-requests';
type ChatRequestTab = 'pending' | 'active';

const UnifiedResellersManagement = () => {
  const [mainTab, setMainTab] = useState<MainTab>('sellers');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Sellers state
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [sellerTab, setSellerTab] = useState('all');
  const [selectedSeller, setSelectedSeller] = useState<SellerDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [deletingSeller, setDeletingSeller] = useState<SellerProfile | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Products state
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [productTab, setProductTab] = useState('pending');
  const [updatingProduct, setUpdatingProduct] = useState<string | null>(null);

  // Withdrawals state
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [withdrawalTab, setWithdrawalTab] = useState('pending');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processingWithdrawal, setProcessingWithdrawal] = useState(false);

  // Chat Join Requests state
  const [chatRequests, setChatRequests] = useState<ChatJoinRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ChatJoinRequest | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [processingRequest, setProcessingRequest] = useState(false);
  const [chatRequestTab, setChatRequestTab] = useState<ChatRequestTab>('pending');

  // Active Chat Session state (for joined chats)
  const [activeChatSession, setActiveChatSession] = useState<ActiveChatSession | null>(null);
  const [supportMessage, setSupportMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchSellers(),
      fetchProducts(),
      fetchWithdrawals(),
      fetchChatRequests()
    ]);
    setLoading(false);
  };

  // Sellers Functions
  const fetchSellers = async () => {
    const { data, error } = await supabase
      .from('seller_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSellers(data);
    }
  };

  const fetchSellerDetails = async (seller: SellerProfile) => {
    setDetailsLoading(true);
    
    const [walletRes, productsRes, ordersRes, withdrawalsRes, profileRes] = await Promise.all([
      supabase.from('seller_wallets').select('balance, pending_balance').eq('seller_id', seller.id).single(),
      supabase.from('seller_products').select('*').eq('seller_id', seller.id).order('created_at', { ascending: false }),
      supabase.from('seller_orders').select('*').eq('seller_id', seller.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('seller_withdrawals').select('*').eq('seller_id', seller.id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('email').eq('user_id', seller.user_id).single()
    ]);

    setSelectedSeller({
      profile: seller,
      wallet: walletRes.data,
      products: productsRes.data || [],
      orders: ordersRes.data || [],
      withdrawals: withdrawalsRes.data || [],
      email: profileRes.data?.email || null
    });
    setDetailsLoading(false);
  };

  const toggleVerification = async (sellerId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('seller_profiles')
      .update({ is_verified: !currentStatus })
      .eq('id', sellerId);

    if (error) {
      toast.error('Failed to update verification');
    } else {
      toast.success(`Seller ${!currentStatus ? 'verified' : 'unverified'}`);
      fetchSellers();
    }
  };

  const toggleActive = async (sellerId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('seller_profiles')
      .update({ is_active: !currentStatus })
      .eq('id', sellerId);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(`Seller ${!currentStatus ? 'activated' : 'suspended'}`);
      fetchSellers();
    }
  };

  const handleDeleteSeller = async () => {
    if (!deletingSeller) return;
    setDeleteLoading(true);

    try {
      // Delete all related data in order
      await Promise.all([
        supabase.from('seller_products').delete().eq('seller_id', deletingSeller.id),
        supabase.from('seller_orders').delete().eq('seller_id', deletingSeller.id),
        supabase.from('seller_withdrawals').delete().eq('seller_id', deletingSeller.id),
        supabase.from('seller_wallets').delete().eq('seller_id', deletingSeller.id),
        supabase.from('seller_chats').delete().eq('seller_id', deletingSeller.id),
        supabase.from('chat_join_requests').delete().eq('seller_id', deletingSeller.id),
      ]);

      // Remove seller role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', deletingSeller.user_id)
        .eq('role', 'seller');

      // Finally delete seller profile
      await supabase.from('seller_profiles').delete().eq('id', deletingSeller.id);

      toast.success('Seller deleted successfully');
      setDeletingSeller(null);
      fetchSellers();
      fetchProducts();
      fetchWithdrawals();
      fetchChatRequests();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete seller');
    }
    
    setDeleteLoading(false);
  };

  // Products Functions
  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('seller_products')
      .select(`*, seller_profiles (id, store_name, is_verified), categories (name, color)`)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProducts(data as SellerProduct[]);
    }
  };

  const toggleProductApproval = async (product: SellerProduct) => {
    setUpdatingProduct(product.id);
    const { error } = await supabase
      .from('seller_products')
      .update({ is_approved: !product.is_approved })
      .eq('id', product.id);

    if (error) {
      toast.error('Failed to update product');
    } else {
      toast.success(product.is_approved ? 'Product unapproved' : 'Product approved!');
      fetchProducts();
    }
    setUpdatingProduct(null);
  };

  // Withdrawals Functions
  const fetchWithdrawals = async () => {
    const { data, error } = await supabase
      .from('seller_withdrawals')
      .select(`*, seller:seller_profiles(store_name, user_id)`)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setWithdrawals(data as Withdrawal[]);
    }
  };

  const handleProcessWithdrawal = async (action: 'approved' | 'rejected') => {
    if (!selectedWithdrawal) return;
    setProcessingWithdrawal(true);

    const { error } = await supabase
      .from('seller_withdrawals')
      .update({
        status: action,
        admin_notes: adminNotes.trim() || null,
        processed_at: new Date().toISOString()
      })
      .eq('id', selectedWithdrawal.id);

    if (error) {
      toast.error('Failed to process withdrawal');
    } else {
      if (action === 'rejected') {
        const { data: wallet } = await supabase
          .from('seller_wallets')
          .select('balance')
          .eq('seller_id', selectedWithdrawal.seller_id)
          .single();

        if (wallet) {
          await supabase
            .from('seller_wallets')
            .update({ balance: wallet.balance + selectedWithdrawal.amount })
            .eq('seller_id', selectedWithdrawal.seller_id);
        }
      }
      toast.success(`Withdrawal ${action}`);
      setSelectedWithdrawal(null);
      setAdminNotes('');
      fetchWithdrawals();
    }
    setProcessingWithdrawal(false);
  };

  // Chat Join Requests Functions
  const fetchChatRequests = async () => {
    const { data, error } = await supabase
      .from('chat_join_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const buyerIds = [...new Set(data.map(r => r.buyer_id))];
      const sellerIds = [...new Set(data.map(r => r.seller_id))];

      const [buyerProfiles, sellerProfiles] = await Promise.all([
        supabase.from('profiles').select('user_id, email, full_name').in('user_id', buyerIds),
        supabase.from('seller_profiles').select('id, store_name').in('id', sellerIds)
      ]);

      const enrichedData = data.map(request => ({
        ...request,
        buyer_profile: buyerProfiles.data?.find(p => p.user_id === request.buyer_id) || null,
        seller_profile: sellerProfiles.data?.find(p => p.id === request.seller_id) || null
      }));

      setChatRequests(enrichedData);
    }
  };

  const fetchChatHistory = async (buyerId: string, sellerId: string) => {
    const { data } = await supabase
      .from('seller_chats')
      .select('*')
      .eq('buyer_id', buyerId)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: true })
      .limit(50);

    setChatMessages((data as ChatMessage[]) || []);
  };

  const handleJoinChat = async (request: ChatJoinRequest) => {
    setProcessingRequest(true);
    
    const { error } = await supabase
      .from('chat_join_requests')
      .update({
        status: 'joined',
        resolved_at: new Date().toISOString()
      })
      .eq('id', request.id);

    if (error) {
      toast.error('Failed to join chat');
    } else {
      await supabase.from('seller_chats').insert({
        buyer_id: request.buyer_id,
        seller_id: request.seller_id,
        message: '🛡️ Uptoza Support has joined this conversation to help resolve your issue.',
        sender_type: 'system',
        admin_joined: true
      });

      toast.success('Joined chat successfully');
      setSelectedRequest(null);
      fetchChatRequests();
    }
    setProcessingRequest(false);
  };

  const handleDeclineRequest = async (request: ChatJoinRequest, notes: string) => {
    setProcessingRequest(true);
    
    const { error } = await supabase
      .from('chat_join_requests')
      .update({
        status: 'declined',
        admin_notes: notes,
        resolved_at: new Date().toISOString()
      })
      .eq('id', request.id);

    if (error) {
      toast.error('Failed to decline request');
    } else {
      toast.success('Request declined');
      setSelectedRequest(null);
      fetchChatRequests();
    }
    setProcessingRequest(false);
  };

  // Open active chat session
  const openActiveChat = async (request: ChatJoinRequest) => {
    const { data } = await supabase
      .from('seller_chats')
      .select('*')
      .eq('buyer_id', request.buyer_id)
      .eq('seller_id', request.seller_id)
      .order('created_at', { ascending: true })
      .limit(100);

    setActiveChatSession({
      request,
      messages: (data as ChatMessage[]) || []
    });
  };

  // Send support message
  const sendSupportMessage = async () => {
    if (!supportMessage.trim() || !activeChatSession || sendingMessage) return;
    
    setSendingMessage(true);
    
    const { error } = await supabase.from('seller_chats').insert({
      buyer_id: activeChatSession.request.buyer_id,
      seller_id: activeChatSession.request.seller_id,
      message: supportMessage.trim(),
      sender_type: 'support',
      admin_joined: true
    });

    if (error) {
      toast.error('Failed to send message');
    } else {
      setSupportMessage('');
      // Refresh messages
      const { data } = await supabase
        .from('seller_chats')
        .select('*')
        .eq('buyer_id', activeChatSession.request.buyer_id)
        .eq('seller_id', activeChatSession.request.seller_id)
        .order('created_at', { ascending: true })
        .limit(100);
      
      setActiveChatSession(prev => prev ? {
        ...prev,
        messages: (data as ChatMessage[]) || []
      } : null);
    }
    
    setSendingMessage(false);
  };

  // Close/Resolve chat
  const handleCloseChat = async () => {
    if (!activeChatSession) return;
    
    // Send closing message
    await supabase.from('seller_chats').insert({
      buyer_id: activeChatSession.request.buyer_id,
      seller_id: activeChatSession.request.seller_id,
      message: '🛡️ Uptoza Support has left the conversation. Issue resolved.',
      sender_type: 'system',
      admin_joined: true
    });

    // Update request status
    await supabase
      .from('chat_join_requests')
      .update({ status: 'resolved' })
      .eq('id', activeChatSession.request.id);

    toast.success('Chat closed and marked as resolved');
    setActiveChatSession(null);
    fetchChatRequests();
  };

  // Realtime subscription for active chat
  useEffect(() => {
    if (!activeChatSession) return;

    const channel = supabase
      .channel('support-chat-' + activeChatSession.request.id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'seller_chats',
        filter: `buyer_id=eq.${activeChatSession.request.buyer_id}`
      }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        if (newMsg.seller_id === activeChatSession.request.seller_id) {
          setActiveChatSession(prev => prev ? {
            ...prev,
            messages: [...prev.messages, newMsg]
          } : null);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChatSession?.request.id]);

  // Filter functions
  const filteredSellers = sellers.filter(seller => {
    const matchesSearch = seller.store_name.toLowerCase().includes(searchQuery.toLowerCase());
    if (sellerTab === 'all') return matchesSearch;
    if (sellerTab === 'pending') return matchesSearch && !seller.is_verified;
    if (sellerTab === 'verified') return matchesSearch && seller.is_verified;
    if (sellerTab === 'suspended') return matchesSearch && !seller.is_active;
    return matchesSearch;
  });

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.seller_profiles?.store_name.toLowerCase().includes(searchQuery.toLowerCase());
    if (productTab === 'all') return matchesSearch;
    if (productTab === 'pending') return matchesSearch && !product.is_approved;
    if (productTab === 'approved') return matchesSearch && product.is_approved;
    return matchesSearch;
  });

  const filteredWithdrawals = withdrawals.filter(w => {
    const matchesSearch = w.seller?.store_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.payment_method.toLowerCase().includes(searchQuery.toLowerCase());
    if (withdrawalTab === 'all') return matchesSearch;
    if (withdrawalTab === 'pending') return matchesSearch && w.status === 'pending';
    if (withdrawalTab === 'approved') return matchesSearch && w.status === 'approved';
    if (withdrawalTab === 'rejected') return matchesSearch && w.status === 'rejected';
    return matchesSearch;
  });

  const pendingChatRequests = chatRequests.filter(r => r.status === 'pending');
  const joinedChatRequests = chatRequests.filter(r => r.status === 'joined');

  // Stats
  const stats = {
    totalSellers: sellers.length,
    pendingSellers: sellers.filter(s => !s.is_verified).length,
    verifiedSellers: sellers.filter(s => s.is_verified).length,
    totalProducts: products.length,
    pendingProducts: products.filter(p => !p.is_approved).length,
    pendingWithdrawals: withdrawals.filter(w => w.status === 'pending').length,
    pendingWithdrawalAmount: withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0),
    pendingChatRequests: pendingChatRequests.length,
    activeChats: joinedChatRequests.length
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 bg-slate-200" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 bg-slate-200" />)}
        </div>
        <Skeleton className="h-96 bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview - White Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card 
          className="bg-white border border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 transition-colors" 
          onClick={() => setMainTab('sellers')}
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <Users className="h-6 w-6 text-slate-600" />
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.totalSellers}</p>
                <p className="text-sm text-slate-500">
                  Total Sellers
                </p>
                {stats.pendingSellers > 0 && (
                  <Badge className="mt-1 bg-amber-100 text-amber-700 hover:bg-amber-100">{stats.pendingSellers} pending</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className="bg-white border border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 transition-colors" 
          onClick={() => setMainTab('products')}
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <Package className="h-6 w-6 text-slate-600" />
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.totalProducts}</p>
                <p className="text-sm text-slate-500">
                  Products
                </p>
                {stats.pendingProducts > 0 && (
                  <Badge className="mt-1 bg-amber-100 text-amber-700 hover:bg-amber-100">{stats.pendingProducts} pending</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className="bg-white border border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 transition-colors" 
          onClick={() => setMainTab('withdrawals')}
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <DollarSign className="h-6 w-6 text-slate-600" />
              <div>
                <p className="text-2xl font-bold text-slate-900">${stats.pendingWithdrawalAmount.toFixed(2)}</p>
                <p className="text-sm text-slate-500">
                  Pending Withdrawals
                </p>
                {stats.pendingWithdrawals > 0 && (
                  <Badge className="mt-1 bg-amber-100 text-amber-700 hover:bg-amber-100">{stats.pendingWithdrawals}</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className="bg-white border border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 transition-colors" 
          onClick={() => setMainTab('chat-requests')}
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-6 w-6 text-slate-600" />
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.pendingChatRequests}</p>
                <p className="text-sm text-slate-500">
                  Support Requests
                </p>
                {stats.pendingChatRequests > 0 && (
                  <Badge className="mt-1 bg-red-100 text-red-700 hover:bg-red-100 animate-pulse">Action Needed</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search across all sections..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white border-slate-200"
        />
      </div>

      {/* Main Tabs */}
      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as MainTab)}>
        <TabsList className="grid w-full grid-cols-4 bg-slate-100">
          <TabsTrigger value="sellers" className="gap-2 data-[state=active]:bg-white">
            <Store className="h-4 w-4" />
            Sellers
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2 data-[state=active]:bg-white">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="gap-2 data-[state=active]:bg-white">
            <Wallet className="h-4 w-4" />
            Withdrawals
          </TabsTrigger>
          <TabsTrigger value="chat-requests" className="gap-2 data-[state=active]:bg-white">
            <MessageSquare className="h-4 w-4" />
            Chat Requests
            {stats.pendingChatRequests > 0 && (
              <Badge className="bg-red-500 text-white ml-1">{stats.pendingChatRequests}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Sellers Tab */}
        <TabsContent value="sellers" className="mt-4">
          <Tabs value={sellerTab} onValueChange={setSellerTab}>
            <TabsList className="bg-slate-100">
              <TabsTrigger value="all" className="data-[state=active]:bg-white">All ({sellers.length})</TabsTrigger>
              <TabsTrigger value="pending" className="data-[state=active]:bg-white">Pending ({stats.pendingSellers})</TabsTrigger>
              <TabsTrigger value="verified" className="data-[state=active]:bg-white">Verified ({stats.verifiedSellers})</TabsTrigger>
              <TabsTrigger value="suspended" className="data-[state=active]:bg-white">Suspended</TabsTrigger>
            </TabsList>

            <TabsContent value={sellerTab} className="mt-4">
              <Card className="bg-white border border-slate-200 shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-slate-600">Store</TableHead>
                      <TableHead className="text-slate-600">Orders</TableHead>
                      <TableHead className="text-slate-600">Sales</TableHead>
                      <TableHead className="text-slate-600">Verified</TableHead>
                      <TableHead className="text-slate-600">Active</TableHead>
                      <TableHead className="text-slate-600">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSellers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                          No sellers found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSellers.map((seller) => (
                        <TableRow key={seller.id} className="hover:bg-slate-50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                                <Store className="h-5 w-5 text-slate-600" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">{seller.store_name}</p>
                                <p className="text-xs text-slate-500">
                                  {format(new Date(seller.created_at), 'MMM d, yyyy')}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-700">{seller.total_orders}</TableCell>
                          <TableCell className="text-slate-700">${Number(seller.total_sales || 0).toFixed(2)}</TableCell>
                          <TableCell>
                            <Switch
                              checked={seller.is_verified}
                              onCheckedChange={() => toggleVerification(seller.id, seller.is_verified)}
                            />
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={seller.is_active}
                              onCheckedChange={() => toggleActive(seller.id, seller.is_active)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchSellerDetails(seller)}
                                className="text-slate-600 border-slate-200 hover:bg-slate-50"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingSeller(seller)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="mt-4">
          <Tabs value={productTab} onValueChange={setProductTab}>
            <TabsList className="bg-slate-100">
              <TabsTrigger value="pending" className="data-[state=active]:bg-white">Pending ({stats.pendingProducts})</TabsTrigger>
              <TabsTrigger value="approved" className="data-[state=active]:bg-white">Approved</TabsTrigger>
              <TabsTrigger value="all" className="data-[state=active]:bg-white">All ({products.length})</TabsTrigger>
            </TabsList>

            <TabsContent value={productTab} className="mt-4">
              <Card className="bg-white border border-slate-200 shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-slate-600">Product</TableHead>
                      <TableHead className="text-slate-600">Seller</TableHead>
                      <TableHead className="text-slate-600">Price</TableHead>
                      <TableHead className="text-slate-600">Stock</TableHead>
                      <TableHead className="text-slate-600">Status</TableHead>
                      <TableHead className="text-slate-600">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                          No products found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((product) => (
                        <TableRow key={product.id} className="hover:bg-slate-50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {product.icon_url ? (
                                <img src={product.icon_url} alt={product.name} className="h-10 w-10 rounded-lg object-cover" />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                                  <Package className="h-5 w-5 text-slate-600" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-slate-900">{product.name}</p>
                                <p className="text-xs text-slate-500">
                                  {format(new Date(product.created_at), 'MMM d, yyyy')}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Store className="h-3.5 w-3.5 text-slate-500" />
                              {product.seller_profiles?.store_name || 'Unknown'}
                              {product.seller_profiles?.is_verified && (
                                <CheckCircle className="h-3.5 w-3.5 text-blue-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-700">${product.price}</TableCell>
                          <TableCell className="text-slate-700">{product.stock ?? '∞'}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={product.is_approved 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                              }
                            >
                              {product.is_approved ? 'Approved' : 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant={product.is_approved ? 'outline' : 'default'}
                              onClick={() => toggleProductApproval(product)}
                              disabled={updatingProduct === product.id}
                              className={product.is_approved 
                                ? 'border-slate-200 text-slate-600 hover:bg-slate-50' 
                                : 'bg-slate-900 hover:bg-slate-800'
                              }
                            >
                              {product.is_approved ? (
                                <><X className="h-4 w-4 mr-1" /> Revoke</>
                              ) : (
                                <><Check className="h-4 w-4 mr-1" /> Approve</>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Withdrawals Tab */}
        <TabsContent value="withdrawals" className="mt-4">
          <Tabs value={withdrawalTab} onValueChange={setWithdrawalTab}>
            <TabsList className="bg-slate-100">
              <TabsTrigger value="pending" className="data-[state=active]:bg-white">Pending ({stats.pendingWithdrawals})</TabsTrigger>
              <TabsTrigger value="approved" className="data-[state=active]:bg-white">Approved</TabsTrigger>
              <TabsTrigger value="rejected" className="data-[state=active]:bg-white">Rejected</TabsTrigger>
              <TabsTrigger value="all" className="data-[state=active]:bg-white">All</TabsTrigger>
            </TabsList>

            <TabsContent value={withdrawalTab} className="mt-4">
              <Card className="bg-white border border-slate-200 shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-slate-600">Seller</TableHead>
                      <TableHead className="text-slate-600">Amount</TableHead>
                      <TableHead className="text-slate-600">Method</TableHead>
                      <TableHead className="text-slate-600">Date</TableHead>
                      <TableHead className="text-slate-600">Status</TableHead>
                      <TableHead className="text-slate-600">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWithdrawals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                          No withdrawals found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredWithdrawals.map((withdrawal) => (
                        <TableRow key={withdrawal.id} className="hover:bg-slate-50">
                          <TableCell>
                            <div className="flex items-center gap-2 text-slate-700">
                              <Store className="h-4 w-4 text-slate-500" />
                              {withdrawal.seller?.store_name || 'Unknown'}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-slate-900">${withdrawal.amount.toFixed(2)}</TableCell>
                          <TableCell className="text-slate-700">{withdrawal.payment_method}</TableCell>
                          <TableCell className="text-slate-700">{format(new Date(withdrawal.created_at), 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              withdrawal.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                              withdrawal.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }>
                              {withdrawal.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                              {withdrawal.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {withdrawal.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                              {withdrawal.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {withdrawal.status === 'pending' && (
                              <Button 
                                size="sm" 
                                onClick={() => setSelectedWithdrawal(withdrawal)}
                                className="bg-slate-900 hover:bg-slate-800"
                              >
                                Process
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Chat Requests Tab */}
        <TabsContent value="chat-requests" className="mt-4">
          <Tabs value={chatRequestTab} onValueChange={(v) => setChatRequestTab(v as ChatRequestTab)}>
            <TabsList className="bg-slate-100 mb-4">
              <TabsTrigger value="pending" className="data-[state=active]:bg-white">
                Pending Requests
                {pendingChatRequests.length > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white">{pendingChatRequests.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="active" className="data-[state=active]:bg-white">
                Active Chats
                {joinedChatRequests.length > 0 && (
                  <Badge className="ml-2 bg-blue-500 text-white">{joinedChatRequests.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Pending Requests Tab */}
            <TabsContent value="pending">
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Pending Support Join Requests
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {pendingChatRequests.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No pending support requests</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingChatRequests.map((request) => (
                        <div key={request.id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Action Required</Badge>
                                <span className="text-xs text-slate-500">
                                  {format(new Date(request.created_at), 'MMM d, h:mm a')}
                                </span>
                              </div>
                              <p className="font-medium text-slate-900">
                                Buyer: {request.buyer_profile?.email || 'Unknown'}
                              </p>
                              <p className="text-sm text-slate-600">
                                Seller: {request.seller_profile?.store_name || 'Unknown'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                            <p className="text-sm font-medium text-amber-800">
                              Reason: {request.reason}
                            </p>
                            {request.description && (
                              <p className="text-sm text-amber-700 mt-1">
                                {request.description}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRequest(request);
                                fetchChatHistory(request.buyer_id, request.seller_id);
                              }}
                              className="border-slate-200 text-slate-600 hover:bg-slate-50"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Chat
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleJoinChat(request)}
                              disabled={processingRequest}
                              className="bg-slate-900 hover:bg-slate-800"
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Join Chat
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeclineRequest(request, 'Request declined')}
                              disabled={processingRequest}
                              className="border-slate-200 text-slate-600 hover:bg-slate-50"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Active Chats Tab */}
            <TabsContent value="active">
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    Active Support Chats
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {joinedChatRequests.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No active support chats</p>
                      <p className="text-sm mt-1">Join a pending request to start helping users</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {joinedChatRequests.map((request) => (
                        <div key={request.id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white hover:border-blue-200 transition-colors">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Active</Badge>
                                <span className="text-xs text-slate-500">
                                  Joined: {request.resolved_at ? format(new Date(request.resolved_at), 'MMM d, h:mm a') : 'N/A'}
                                </span>
                              </div>
                              <p className="font-medium text-slate-900">
                                Buyer: {request.buyer_profile?.email || 'Unknown'}
                              </p>
                              <p className="text-sm text-slate-600">
                                Seller: {request.seller_profile?.store_name || 'Unknown'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <p className="text-sm font-medium text-slate-700">
                              Original Issue: {request.reason}
                            </p>
                            {request.description && (
                              <p className="text-sm text-slate-600 mt-1">
                                {request.description}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => openActiveChat(request)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Open Chat
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      {/* Seller Details Dialog */}
      <Dialog open={!!selectedSeller || detailsLoading} onOpenChange={() => setSelectedSeller(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Seller Details</DialogTitle>
            <DialogDescription>
              Complete information about this seller
            </DialogDescription>
          </DialogHeader>
          
          {detailsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : selectedSeller && (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                  <div className="h-16 w-16 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Store className="h-8 w-8 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold text-slate-900">{selectedSeller.profile.store_name}</h3>
                      {selectedSeller.profile.is_verified && (
                        <Badge className="bg-blue-100 text-blue-700">Verified</Badge>
                      )}
                      {!selectedSeller.profile.is_active && (
                        <Badge className="bg-red-100 text-red-700">Suspended</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                      <Mail className="h-3.5 w-3.5" />
                      {selectedSeller.email || 'No email'}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <p className="text-lg font-bold text-slate-900">${selectedSeller.wallet?.balance?.toFixed(2) || '0.00'}</p>
                    <p className="text-xs text-slate-500">Available Balance</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <p className="text-lg font-bold text-slate-900">${selectedSeller.wallet?.pending_balance?.toFixed(2) || '0.00'}</p>
                    <p className="text-xs text-slate-500">Pending Balance</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <p className="text-lg font-bold text-slate-900">{selectedSeller.products.length}</p>
                    <p className="text-xs text-slate-500">Products</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <p className="text-lg font-bold text-slate-900">{selectedSeller.orders.length}</p>
                    <p className="text-xs text-slate-500">Orders</p>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Store Description</span>
                    <span className="text-sm text-slate-700">{selectedSeller.profile.store_description || 'No description'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Joined</span>
                    <span className="text-sm text-slate-700">{format(new Date(selectedSeller.profile.created_at), 'MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Total Sales</span>
                    <span className="text-sm text-slate-700">${Number(selectedSeller.profile.total_sales || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Total Orders</span>
                    <span className="text-sm text-slate-700">{selectedSeller.profile.total_orders}</span>
                  </div>
                </div>

                {/* Products */}
                <div>
                  <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Products ({selectedSeller.products.length})
                  </h4>
                  {selectedSeller.products.length > 0 ? (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead className="text-slate-600">Name</TableHead>
                            <TableHead className="text-slate-600">Price</TableHead>
                            <TableHead className="text-slate-600">Stock</TableHead>
                            <TableHead className="text-slate-600">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedSeller.products.slice(0, 5).map((product: any) => (
                            <TableRow key={product.id}>
                              <TableCell className="text-slate-700">{product.name}</TableCell>
                              <TableCell className="text-slate-700">${product.price}</TableCell>
                              <TableCell className="text-slate-700">{product.stock ?? '∞'}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={product.is_approved 
                                  ? 'bg-green-50 text-green-700 border-green-200' 
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                                }>
                                  {product.is_approved ? 'Approved' : 'Pending'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No products yet</p>
                  )}
                </div>

                {/* Orders */}
                <div>
                  <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Recent Orders ({selectedSeller.orders.length})
                  </h4>
                  {selectedSeller.orders.length > 0 ? (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead className="text-slate-600">Date</TableHead>
                            <TableHead className="text-slate-600">Amount</TableHead>
                            <TableHead className="text-slate-600">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedSeller.orders.slice(0, 5).map((order: any) => (
                            <TableRow key={order.id}>
                              <TableCell className="text-slate-700">{format(new Date(order.created_at), 'MMM d, yyyy')}</TableCell>
                              <TableCell className="text-slate-700">${order.total_amount}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">{order.status}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No orders yet</p>
                  )}
                </div>

                {/* Withdrawals */}
                <div>
                  <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Withdrawal History ({selectedSeller.withdrawals.length})
                  </h4>
                  {selectedSeller.withdrawals.length > 0 ? (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead className="text-slate-600">Date</TableHead>
                            <TableHead className="text-slate-600">Amount</TableHead>
                            <TableHead className="text-slate-600">Method</TableHead>
                            <TableHead className="text-slate-600">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedSeller.withdrawals.map((w: any) => (
                            <TableRow key={w.id}>
                              <TableCell className="text-slate-700">{format(new Date(w.created_at), 'MMM d, yyyy')}</TableCell>
                              <TableCell className="text-slate-700">${w.amount}</TableCell>
                              <TableCell className="text-slate-700">{w.payment_method}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={
                                  w.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                  w.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                  'bg-amber-50 text-amber-700 border-amber-200'
                                }>
                                  {w.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No withdrawals yet</p>
                  )}
                </div>

                {/* Delete Button */}
                <div className="pt-4 border-t border-slate-100">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setSelectedSeller(null);
                      setDeletingSeller(selectedSeller.profile);
                    }}
                    className="w-full bg-red-500 hover:bg-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete This Seller
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingSeller} onOpenChange={() => setDeletingSeller(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900">Delete Seller?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              This will permanently delete <span className="font-semibold">{deletingSeller?.store_name}</span> and all their data including products, orders, wallet, and withdrawal history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading} className="border-slate-200">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteSeller}
              disabled={deleteLoading}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Seller
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Withdrawal Processing Dialog */}
      <Dialog open={!!selectedWithdrawal} onOpenChange={() => setSelectedWithdrawal(null)}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Process Withdrawal</DialogTitle>
            <DialogDescription className="text-slate-600">
              Review and process this withdrawal request.
            </DialogDescription>
          </DialogHeader>
          
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Seller</span>
                  <span className="font-medium text-slate-900">{selectedWithdrawal.seller?.store_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount</span>
                  <span className="font-bold text-lg text-slate-900">${selectedWithdrawal.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Method</span>
                  <span className="text-slate-700">{selectedWithdrawal.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account</span>
                  <span className="text-sm text-slate-700">{selectedWithdrawal.account_details}</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block text-slate-700">Admin Notes (optional)</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this withdrawal..."
                  className="border-slate-200"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-slate-900 hover:bg-slate-800"
                  onClick={() => handleProcessWithdrawal('approved')}
                  disabled={processingWithdrawal}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleProcessWithdrawal('rejected')}
                  disabled={processingWithdrawal}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Chat History Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Chat History</DialogTitle>
            <DialogDescription className="text-slate-600">
              Buyer: {selectedRequest?.buyer_profile?.email} • 
              Seller: {selectedRequest?.seller_profile?.store_name}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[400px] border border-slate-200 rounded-lg p-4">
            {chatMessages.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No messages in this conversation</p>
              </div>
            ) : (
              <div className="space-y-3">
                {chatMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${
                      msg.sender_type === 'buyer' ? 'justify-end' : 
                      msg.sender_type === 'system' ? 'justify-center' : 'justify-start'
                    }`}
                  >
                    <div className={`max-w-[80%] rounded-xl px-4 py-2 ${
                      msg.sender_type === 'buyer' ? 'bg-slate-900 text-white' :
                      msg.sender_type === 'system' ? 'bg-slate-200 text-slate-700' :
                      'bg-slate-100 text-slate-900'
                    }`}>
                      {msg.sender_type !== 'system' && (
                        <p className="text-xs font-medium mb-1 opacity-70">
                          {msg.sender_type === 'buyer' ? 'Buyer' : 'Seller'}
                        </p>
                      )}
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-[10px] opacity-70 mt-1">
                        {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          {selectedRequest && (
            <div className="flex gap-2 pt-4">
              <Button
                className="flex-1 bg-slate-900 hover:bg-slate-800"
                onClick={() => handleJoinChat(selectedRequest)}
                disabled={processingRequest}
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Join This Chat
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedRequest(null)}
                className="border-slate-200"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Active Chat Session Dialog - Full Chat Interface */}
      <Dialog open={!!activeChatSession} onOpenChange={() => setActiveChatSession(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col bg-white">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Shield className="h-5 w-5 text-blue-500" />
              Support Chat
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Buyer: {activeChatSession?.request.buyer_profile?.email} • 
              Seller: {activeChatSession?.request.seller_profile?.store_name}
            </DialogDescription>
          </DialogHeader>
          
          {activeChatSession && (
            <>
              {/* Chat Messages */}
              <ScrollArea className="flex-1 min-h-[400px] border border-slate-200 rounded-lg p-4">
                {activeChatSession.messages.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No messages yet. Start helping!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeChatSession.messages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`flex ${
                          msg.sender_type === 'buyer' ? 'justify-end' : 
                          msg.sender_type === 'system' ? 'justify-center' : 
                          msg.sender_type === 'support' ? 'justify-start' :
                          'justify-start'
                        }`}
                      >
                        <div className={`max-w-[80%] rounded-xl px-4 py-2 ${
                          msg.sender_type === 'buyer' ? 'bg-slate-900 text-white' :
                          msg.sender_type === 'system' ? 'bg-amber-100 text-amber-800 text-center' :
                          msg.sender_type === 'support' ? 'bg-blue-600 text-white' :
                          'bg-slate-100 text-slate-900'
                        }`}>
                          {msg.sender_type !== 'system' && (
                            <p className="text-xs font-medium mb-1 opacity-70 flex items-center gap-1">
                              {msg.sender_type === 'buyer' && 'Buyer'}
                              {msg.sender_type === 'seller' && 'Seller'}
                              {msg.sender_type === 'support' && (
                                <>
                                  <Shield className="h-3 w-3" />
                                  Uptoza Support
                                </>
                              )}
                            </p>
                          )}
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-[10px] opacity-70 mt-1">
                            {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              
              {/* Message Input */}
              <div className="flex-shrink-0 pt-4 space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Type your message as Uptoza Support..."
                    className="flex-1 border-slate-200"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendSupportMessage();
                      }
                    }}
                    disabled={sendingMessage}
                  />
                  <Button
                    onClick={sendSupportMessage}
                    disabled={!supportMessage.trim() || sendingMessage}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {sendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setActiveChatSession(null)}
                    className="flex-1 border-slate-200"
                  >
                    Close Window
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCloseChat}
                    className="flex-1"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Leave & Resolve
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnifiedResellersManagement;
