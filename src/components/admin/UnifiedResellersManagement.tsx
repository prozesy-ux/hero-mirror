import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Users, Store, CheckCircle, TrendingUp, Search, Eye, Wallet,
  Package, ShoppingCart, Clock, XCircle, DollarSign, MessageSquare,
  AlertTriangle, UserPlus, Check, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  commission_rate: number;
  total_sales: number;
  total_orders: number;
  created_at: string;
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

type MainTab = 'sellers' | 'products' | 'withdrawals' | 'chat-requests';

const UnifiedResellersManagement = () => {
  const [mainTab, setMainTab] = useState<MainTab>('sellers');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Sellers state
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [sellerTab, setSellerTab] = useState('all');

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
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [processingRequest, setProcessingRequest] = useState(false);

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
        // Refund the balance
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
      // Fetch buyer and seller profiles
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

    setChatMessages(data || []);
  };

  const handleJoinChat = async (request: ChatJoinRequest) => {
    setProcessingRequest(true);
    
    // Update request status
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
      // Send system message to the chat
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

  // Stats
  const stats = {
    totalSellers: sellers.length,
    pendingSellers: sellers.filter(s => !s.is_verified).length,
    verifiedSellers: sellers.filter(s => s.is_verified).length,
    totalProducts: products.length,
    pendingProducts: products.filter(p => !p.is_approved).length,
    pendingWithdrawals: withdrawals.filter(w => w.status === 'pending').length,
    pendingWithdrawalAmount: withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0),
    pendingChatRequests: pendingChatRequests.length
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="cursor-pointer hover:border-blue-300 transition-colors" onClick={() => setMainTab('sellers')}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalSellers}</p>
              <p className="text-sm text-muted-foreground">
                Total Sellers {stats.pendingSellers > 0 && <Badge className="ml-1 bg-yellow-500">{stats.pendingSellers} pending</Badge>}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:border-purple-300 transition-colors" onClick={() => setMainTab('products')}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Package className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalProducts}</p>
              <p className="text-sm text-muted-foreground">
                Products {stats.pendingProducts > 0 && <Badge className="ml-1 bg-yellow-500">{stats.pendingProducts} pending</Badge>}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:border-emerald-300 transition-colors" onClick={() => setMainTab('withdrawals')}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">${stats.pendingWithdrawalAmount.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">
                Pending Withdrawals {stats.pendingWithdrawals > 0 && <Badge className="ml-1 bg-yellow-500">{stats.pendingWithdrawals}</Badge>}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:border-red-300 transition-colors" onClick={() => setMainTab('chat-requests')}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pendingChatRequests}</p>
              <p className="text-sm text-muted-foreground">
                Support Requests {stats.pendingChatRequests > 0 && <Badge className="ml-1 bg-red-500 animate-pulse">Action Needed</Badge>}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search across all sections..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Main Tabs */}
      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as MainTab)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sellers" className="gap-2">
            <Store className="h-4 w-4" />
            Sellers
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="gap-2">
            <Wallet className="h-4 w-4" />
            Withdrawals
          </TabsTrigger>
          <TabsTrigger value="chat-requests" className="gap-2">
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
            <TabsList>
              <TabsTrigger value="all">All ({sellers.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({stats.pendingSellers})</TabsTrigger>
              <TabsTrigger value="verified">Verified ({stats.verifiedSellers})</TabsTrigger>
              <TabsTrigger value="suspended">Suspended</TabsTrigger>
            </TabsList>

            <TabsContent value={sellerTab} className="mt-4">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Store</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Sales</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSellers.map((seller) => (
                      <TableRow key={seller.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                              <Store className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                              <p className="font-medium">{seller.store_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(seller.created_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{seller.total_orders}</TableCell>
                        <TableCell>${Number(seller.total_sales || 0).toFixed(2)}</TableCell>
                        <TableCell>{seller.commission_rate}%</TableCell>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="mt-4">
          <Tabs value={productTab} onValueChange={setProductTab}>
            <TabsList>
              <TabsTrigger value="pending">Pending ({stats.pendingProducts})</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="all">All ({products.length})</TabsTrigger>
            </TabsList>

            <TabsContent value={productTab} className="mt-4">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.icon_url ? (
                              <img src={product.icon_url} alt={product.name} className="h-10 w-10 rounded-lg object-cover" />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <Package className="h-5 w-5 text-purple-500" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(product.created_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Store className="h-3.5 w-3.5 text-emerald-500" />
                            {product.seller_profiles?.store_name || 'Unknown'}
                            {product.seller_profiles?.is_verified && (
                              <CheckCircle className="h-3.5 w-3.5 text-blue-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>${product.price}</TableCell>
                        <TableCell>{product.stock ?? '∞'}</TableCell>
                        <TableCell>
                          <Badge variant={product.is_approved ? 'default' : 'outline'}>
                            {product.is_approved ? 'Approved' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={product.is_approved ? 'outline' : 'default'}
                            onClick={() => toggleProductApproval(product)}
                            disabled={updatingProduct === product.id}
                          >
                            {product.is_approved ? (
                              <><X className="h-4 w-4 mr-1" /> Revoke</>
                            ) : (
                              <><Check className="h-4 w-4 mr-1" /> Approve</>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Withdrawals Tab */}
        <TabsContent value="withdrawals" className="mt-4">
          <Tabs value={withdrawalTab} onValueChange={setWithdrawalTab}>
            <TabsList>
              <TabsTrigger value="pending">Pending ({stats.pendingWithdrawals})</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <TabsContent value={withdrawalTab} className="mt-4">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Seller</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWithdrawals.map((withdrawal) => (
                      <TableRow key={withdrawal.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-emerald-500" />
                            {withdrawal.seller?.store_name || 'Unknown'}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">${withdrawal.amount.toFixed(2)}</TableCell>
                        <TableCell>{withdrawal.payment_method}</TableCell>
                        <TableCell>{format(new Date(withdrawal.created_at), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            withdrawal.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            withdrawal.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                            'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                          }>
                            {withdrawal.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                            {withdrawal.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {withdrawal.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                            {withdrawal.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {withdrawal.status === 'pending' && (
                            <Button size="sm" onClick={() => setSelectedWithdrawal(withdrawal)}>
                              Process
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Chat Requests Tab */}
        <TabsContent value="chat-requests" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Buyer Support Join Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingChatRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending support requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingChatRequests.map((request) => (
                    <div key={request.id} className="border rounded-xl p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-red-500">Action Required</Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(request.created_at), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          <p className="font-medium">
                            Buyer: {request.buyer_profile?.email || 'Unknown'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Seller: {request.seller_profile?.store_name || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                        <p className="text-sm font-medium text-red-700 dark:text-red-400">
                          Reason: {request.reason}
                        </p>
                        {request.description && (
                          <p className="text-sm text-red-600 dark:text-red-300 mt-1">
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
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Chat
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleJoinChat(request)}
                          disabled={processingRequest}
                          className="bg-emerald-500 hover:bg-emerald-600"
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Join Chat
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeclineRequest(request, 'Request declined')}
                          disabled={processingRequest}
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
      </Tabs>

      {/* Withdrawal Processing Dialog */}
      <Dialog open={!!selectedWithdrawal} onOpenChange={() => setSelectedWithdrawal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Withdrawal</DialogTitle>
            <DialogDescription>
              Review and process this withdrawal request.
            </DialogDescription>
          </DialogHeader>
          
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seller</span>
                  <span className="font-medium">{selectedWithdrawal.seller?.store_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold text-lg">${selectedWithdrawal.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method</span>
                  <span>{selectedWithdrawal.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account</span>
                  <span className="text-sm">{selectedWithdrawal.account_details}</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Admin Notes (optional)</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this withdrawal..."
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600"
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
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Chat History</DialogTitle>
            <DialogDescription>
              Buyer: {selectedRequest?.buyer_profile?.email} • 
              Seller: {selectedRequest?.seller_profile?.store_name}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[400px] border rounded-lg p-4">
            {chatMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
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
                      msg.sender_type === 'buyer' ? 'bg-emerald-500 text-white' :
                      msg.sender_type === 'system' ? 'bg-slate-200 dark:bg-slate-700' :
                      'bg-muted'
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
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                onClick={() => handleJoinChat(selectedRequest)}
                disabled={processingRequest}
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Join This Chat
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedRequest(null)}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnifiedResellersManagement;