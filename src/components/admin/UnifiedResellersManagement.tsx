import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Store, CheckCircle, XCircle, Eye, Trash2, Package, 
  DollarSign, Clock, Search, Users, ShoppingBag, 
  Wallet, AlertTriangle, Shield, Star, Loader2,
  Lightbulb, Settings, Zap, MessageSquare
} from 'lucide-react';

const ADMIN_SESSION_KEY = 'admin_session_token';

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
  auto_approve_products: boolean;
  created_at: string;
  updated_at: string;
}

interface SellerDetails {
  profile: SellerProfile;
  wallet: any;
  products: any[];
  orders: any[];
  withdrawals: any[];
  email?: string;
}

interface SellerProduct {
  id: string;
  seller_id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  is_available: boolean;
  is_approved: boolean;
  created_at: string;
  seller_profiles?: { store_name: string; is_verified: boolean };
}

interface Withdrawal {
  id: string;
  seller_id: string;
  amount: number;
  status: string;
  payment_method: string;
  account_details: string;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
  seller_profiles?: { store_name: string };
}

interface FeatureRequest {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  admin_notes: string | null;
  votes: number;
  created_at: string;
  updated_at: string;
  seller_profiles?: { store_name: string; is_verified: boolean };
}

interface AutoApprovalSettings {
  auto_approve_all: boolean;
  auto_approve_verified_only: boolean;
}

type MainTab = 'sellers' | 'products' | 'withdrawals' | 'feature-requests' | 'settings';

const UnifiedResellersManagement: React.FC = () => {
  const [mainTab, setMainTab] = useState<MainTab>('sellers');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sellers state
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [sellerTab, setSellerTab] = useState('all');
  const [selectedSeller, setSelectedSeller] = useState<SellerDetails | null>(null);
  const [sellerDialogOpen, setSellerDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sellerToDelete, setSellerToDelete] = useState<string | null>(null);

  // Products state
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [productTab, setProductTab] = useState('all');

  // Withdrawals state
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [withdrawalTab, setWithdrawalTab] = useState('pending');
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  // Feature requests state
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
  const [featureTab, setFeatureTab] = useState('pending');
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<FeatureRequest | null>(null);
  const [featureNotes, setFeatureNotes] = useState('');
  const [featureStatus, setFeatureStatus] = useState('');

  // Auto-approval state
  const [autoApprovalSettings, setAutoApprovalSettings] = useState<AutoApprovalSettings>({
    auto_approve_all: false,
    auto_approve_verified_only: false
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchData = async <T,>(table: string, options?: { select?: string; order?: { column: string; ascending?: boolean } }): Promise<{ data: T[] | null; error: any }> => {
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

  const mutateData = async (table: string, operation: string, data?: any, id?: string): Promise<{ success: boolean; error?: string }> => {
    const token = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!token) return { success: false, error: 'No session' };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-mutate-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ token, table, operation, data, id }),
        }
      );
      const result = await response.json();
      return { success: result.success, error: result.error };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    
    const [sellersRes, productsRes, withdrawalsRes, featureRequestsRes, settingsRes] = await Promise.all([
      fetchData<SellerProfile>('seller_profiles', { order: { column: 'created_at', ascending: false } }),
      fetchData<SellerProduct>('seller_products', { order: { column: 'created_at', ascending: false } }),
      fetchData<Withdrawal>('seller_withdrawals', { order: { column: 'created_at', ascending: false } }),
      fetchData<FeatureRequest>('seller_feature_requests', { order: { column: 'created_at', ascending: false } }),
      fetchData<AutoApprovalSettings>('auto_approval_settings'),
    ]);

    setSellers(sellersRes.data || []);
    setProducts(productsRes.data || []);
    setWithdrawals(withdrawalsRes.data || []);
    setFeatureRequests(featureRequestsRes.data || []);
    
    if (settingsRes.data && settingsRes.data.length > 0) {
      setAutoApprovalSettings({
        auto_approve_all: (settingsRes.data[0] as any).auto_approve_all || false,
        auto_approve_verified_only: (settingsRes.data[0] as any).auto_approve_verified_only || false
      });
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAllData();
    
    // Set up realtime subscription for feature requests
    const channel = supabase
      .channel('feature-requests-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seller_feature_requests' }, 
        () => {
          fetchData<FeatureRequest>('seller_feature_requests', { order: { column: 'created_at', ascending: false } })
            .then(res => setFeatureRequests(res.data || []));
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAllData]);

  // Seller functions
  const fetchSellerDetails = async (seller: SellerProfile) => {
    const [walletRes, productsRes, ordersRes, withdrawalsRes, profilesRes] = await Promise.all([
      fetchData('seller_wallets', { select: '*' }),
      fetchData('seller_products', { select: '*' }),
      fetchData('seller_orders', { order: { column: 'created_at', ascending: false } }),
      fetchData('seller_withdrawals', { order: { column: 'created_at', ascending: false } }),
      fetchData('profiles', { select: '*' }),
    ]);

    const wallet = (walletRes.data as any[])?.find((w: any) => w.seller_id === seller.id);
    const sellerProducts = (productsRes.data as any[])?.filter((p: any) => p.seller_id === seller.id) || [];
    const sellerOrders = (ordersRes.data as any[])?.filter((o: any) => o.seller_id === seller.id) || [];
    const sellerWithdrawals = (withdrawalsRes.data as any[])?.filter((w: any) => w.seller_id === seller.id) || [];
    const userProfile = (profilesRes.data as any[])?.find((p: any) => p.user_id === seller.user_id);

    setSelectedSeller({
      profile: seller,
      wallet: wallet || { balance: 0, pending_balance: 0 },
      products: sellerProducts,
      orders: sellerOrders,
      withdrawals: sellerWithdrawals,
      email: userProfile?.email
    });
    setSellerDialogOpen(true);
  };

  const toggleVerification = async (seller: SellerProfile) => {
    const result = await mutateData('seller_profiles', 'update', { is_verified: !seller.is_verified }, seller.id);
    if (result.success) {
      toast.success(`Seller ${!seller.is_verified ? 'verified' : 'unverified'}`);
      fetchAllData();
    } else {
      toast.error(result.error || 'Failed to update');
    }
  };

  const toggleActive = async (seller: SellerProfile) => {
    const result = await mutateData('seller_profiles', 'update', { is_active: !seller.is_active }, seller.id);
    if (result.success) {
      toast.success(`Seller ${!seller.is_active ? 'activated' : 'suspended'}`);
      fetchAllData();
    } else {
      toast.error(result.error || 'Failed to update');
    }
  };

  const toggleAutoApprove = async (seller: SellerProfile) => {
    const result = await mutateData('seller_profiles', 'update', { auto_approve_products: !seller.auto_approve_products }, seller.id);
    if (result.success) {
      toast.success(`Auto-approval ${!seller.auto_approve_products ? 'enabled' : 'disabled'} for ${seller.store_name}`);
      fetchAllData();
    } else {
      toast.error(result.error || 'Failed to update');
    }
  };

  const handleDeleteSeller = async () => {
    if (!sellerToDelete) return;
    
    const result = await mutateData('seller_profiles', 'delete', undefined, sellerToDelete);
    if (result.success) {
      toast.success('Seller deleted successfully');
      setDeleteDialogOpen(false);
      setSellerToDelete(null);
      fetchAllData();
    } else {
      toast.error(result.error || 'Failed to delete');
    }
  };

  // Product functions
  const toggleProductApproval = async (product: SellerProduct) => {
    const result = await mutateData('seller_products', 'update', { is_approved: !product.is_approved }, product.id);
    if (result.success) {
      toast.success(`Product ${!product.is_approved ? 'approved' : 'unapproved'}`);
      fetchAllData();
    } else {
      toast.error(result.error || 'Failed to update');
    }
  };

  // Withdrawal functions
  const handleProcessWithdrawal = async (status: 'completed' | 'rejected') => {
    if (!selectedWithdrawal) return;
    
    const result = await mutateData('seller_withdrawals', 'update', {
      status,
      admin_notes: adminNotes,
      processed_at: new Date().toISOString()
    }, selectedWithdrawal.id);

    if (result.success) {
      toast.success(`Withdrawal ${status}`);
      setProcessDialogOpen(false);
      setSelectedWithdrawal(null);
      setAdminNotes('');
      fetchAllData();
    } else {
      toast.error(result.error || 'Failed to process');
    }
  };

  // Feature request functions
  const handleUpdateFeatureRequest = async () => {
    if (!selectedFeature || !featureStatus) return;
    
    const result = await mutateData('seller_feature_requests', 'update', {
      status: featureStatus,
      admin_notes: featureNotes,
      updated_at: new Date().toISOString()
    }, selectedFeature.id);

    if (result.success) {
      toast.success('Feature request updated');
      setFeatureDialogOpen(false);
      setSelectedFeature(null);
      setFeatureNotes('');
      setFeatureStatus('');
      fetchAllData();
    } else {
      toast.error(result.error || 'Failed to update');
    }
  };

  const handleDeleteFeatureRequest = async (id: string) => {
    const result = await mutateData('seller_feature_requests', 'delete', undefined, id);
    if (result.success) {
      toast.success('Feature request deleted');
      fetchAllData();
    } else {
      toast.error(result.error || 'Failed to delete');
    }
  };

  // Auto-approval settings functions
  const saveAutoApprovalSettings = async () => {
    setSavingSettings(true);
    
    const result = await mutateData('auto_approval_settings', 'update', {
      auto_approve_all: autoApprovalSettings.auto_approve_all,
      auto_approve_verified_only: autoApprovalSettings.auto_approve_verified_only,
      updated_at: new Date().toISOString()
    }, 'global');

    if (result.success) {
      toast.success('Settings saved successfully');
    } else {
      toast.error(result.error || 'Failed to save settings');
    }
    
    setSavingSettings(false);
  };

  const bulkEnableAutoApprove = async (verifiedOnly: boolean) => {
    const sellersToUpdate = verifiedOnly 
      ? sellers.filter(s => s.is_verified && !s.auto_approve_products)
      : sellers.filter(s => !s.auto_approve_products);
    
    let successCount = 0;
    for (const seller of sellersToUpdate) {
      const result = await mutateData('seller_profiles', 'update', { auto_approve_products: true }, seller.id);
      if (result.success) successCount++;
    }
    
    toast.success(`Auto-approval enabled for ${successCount} sellers`);
    fetchAllData();
  };

  const bulkDisableAutoApprove = async () => {
    const sellersToUpdate = sellers.filter(s => s.auto_approve_products);
    
    let successCount = 0;
    for (const seller of sellersToUpdate) {
      const result = await mutateData('seller_profiles', 'update', { auto_approve_products: false }, seller.id);
      if (result.success) successCount++;
    }
    
    toast.success(`Auto-approval disabled for ${successCount} sellers`);
    fetchAllData();
  };

  // Filtering functions
  const filteredSellers = sellers.filter(s => {
    const matchesSearch = s.store_name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    switch (sellerTab) {
      case 'pending': return !s.is_verified;
      case 'verified': return s.is_verified && s.is_active;
      case 'suspended': return !s.is_active;
      case 'auto-approve': return s.auto_approve_products;
      default: return true;
    }
  });

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    switch (productTab) {
      case 'pending': return !p.is_approved;
      case 'approved': return p.is_approved;
      default: return true;
    }
  });

  const filteredWithdrawals = withdrawals.filter(w => {
    switch (withdrawalTab) {
      case 'pending': return w.status === 'pending';
      case 'completed': return w.status === 'completed';
      case 'rejected': return w.status === 'rejected';
      default: return true;
    }
  });

  const filteredFeatureRequests = featureRequests.filter(f => {
    const matchesSearch = f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    switch (featureTab) {
      case 'pending': return f.status === 'pending';
      case 'reviewing': return f.status === 'reviewing';
      case 'approved': return f.status === 'approved';
      case 'completed': return f.status === 'completed';
      case 'rejected': return f.status === 'rejected';
      default: return true;
    }
  });

  // Stats
  const stats = {
    totalSellers: sellers.length,
    verifiedSellers: sellers.filter(s => s.is_verified).length,
    pendingSellers: sellers.filter(s => !s.is_verified).length,
    suspendedSellers: sellers.filter(s => !s.is_active).length,
    autoApproveSellers: sellers.filter(s => s.auto_approve_products).length,
    totalProducts: products.length,
    pendingProducts: products.filter(p => !p.is_approved).length,
    approvedProducts: products.filter(p => p.is_approved).length,
    pendingWithdrawals: withdrawals.filter(w => w.status === 'pending').length,
    totalWithdrawalAmount: withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + Number(w.amount), 0),
    pendingFeatures: featureRequests.filter(f => f.status === 'pending').length,
    totalFeatures: featureRequests.length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-white border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Total Sellers</p>
                <p className="text-xl font-bold">{stats.totalSellers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Verified</p>
                <p className="text-xl font-bold">{stats.verifiedSellers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-xs text-muted-foreground">Pending Products</p>
                <p className="text-xl font-bold">{stats.pendingProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-xs text-muted-foreground">Pending Withdrawals</p>
                <p className="text-xl font-bold">${stats.totalWithdrawalAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-xs text-muted-foreground">Feature Requests</p>
                <p className="text-xl font-bold">{stats.pendingFeatures}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-600" />
              <div>
                <p className="text-xs text-muted-foreground">Auto-Approve</p>
                <p className="text-xl font-bold">{stats.autoApproveSellers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search sellers, products, feature requests..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white"
        />
      </div>

      {/* Main Tabs */}
      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as MainTab)}>
        <TabsList className="bg-muted">
          <TabsTrigger value="sellers" className="gap-2">
            <Users className="w-4 h-4" /> Sellers
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <Package className="w-4 h-4" /> Products
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="gap-2">
            <Wallet className="w-4 h-4" /> Withdrawals
            {stats.pendingWithdrawals > 0 && (
              <Badge variant="destructive" className="ml-1">{stats.pendingWithdrawals}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="feature-requests" className="gap-2">
            <Lightbulb className="w-4 h-4" /> Features
            {stats.pendingFeatures > 0 && (
              <Badge variant="secondary" className="ml-1">{stats.pendingFeatures}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-4 h-4" /> Settings
          </TabsTrigger>
        </TabsList>

        {/* Sellers Tab */}
        <TabsContent value="sellers" className="mt-6">
          <Card className="bg-white border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Seller Management</CardTitle>
                <Tabs value={sellerTab} onValueChange={setSellerTab}>
                  <TabsList className="bg-muted/50">
                    <TabsTrigger value="all">All ({sellers.length})</TabsTrigger>
                    <TabsTrigger value="pending">Pending ({stats.pendingSellers})</TabsTrigger>
                    <TabsTrigger value="verified">Verified ({stats.verifiedSellers})</TabsTrigger>
                    <TabsTrigger value="auto-approve">Auto-Approve ({stats.autoApproveSellers})</TabsTrigger>
                    <TabsTrigger value="suspended">Suspended ({stats.suspendedSellers})</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Auto-Approve</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSellers.map((seller) => (
                    <TableRow key={seller.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            {seller.store_logo_url ? (
                              <img src={seller.store_logo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <Store className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <span className="font-medium">{seller.store_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {seller.is_verified ? (
                            <Badge className="bg-green-100 text-green-700">Verified</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                          {!seller.is_active && (
                            <Badge variant="destructive">Suspended</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>${Number(seller.total_sales).toFixed(2)}</TableCell>
                      <TableCell>{seller.total_orders}</TableCell>
                      <TableCell>
                        <Switch
                          checked={seller.auto_approve_products}
                          onCheckedChange={() => toggleAutoApprove(seller)}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(seller.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => fetchSellerDetails(seller)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => toggleVerification(seller)}
                          >
                            {seller.is_verified ? (
                              <XCircle className="w-4 h-4 text-amber-600" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => toggleActive(seller)}
                          >
                            {seller.is_active ? (
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                            ) : (
                              <Shield className="w-4 h-4 text-green-600" />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setSellerToDelete(seller.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredSellers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No sellers found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="mt-6">
          <Card className="bg-white border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Product Approval</CardTitle>
                <Tabs value={productTab} onValueChange={setProductTab}>
                  <TabsList className="bg-muted/50">
                    <TabsTrigger value="all">All ({products.length})</TabsTrigger>
                    <TabsTrigger value="pending">Pending ({stats.pendingProducts})</TabsTrigger>
                    <TabsTrigger value="approved">Approved ({stats.approvedProducts})</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.description?.slice(0, 50)}...</p>
                        </div>
                      </TableCell>
                      <TableCell>${Number(product.price).toFixed(2)}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>
                        {product.is_approved ? (
                          <Badge className="bg-green-100 text-green-700">Approved</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(product.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={product.is_approved ? "outline" : "default"}
                          size="sm"
                          onClick={() => toggleProductApproval(product)}
                        >
                          {product.is_approved ? 'Unapprove' : 'Approve'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredProducts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No products found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Withdrawals Tab */}
        <TabsContent value="withdrawals" className="mt-6">
          <Card className="bg-white border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Withdrawal Requests</CardTitle>
                <Tabs value={withdrawalTab} onValueChange={setWithdrawalTab}>
                  <TabsList className="bg-muted/50">
                    <TabsTrigger value="pending">Pending ({stats.pendingWithdrawals})</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWithdrawals.map((withdrawal) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell className="font-medium">${Number(withdrawal.amount).toFixed(2)}</TableCell>
                      <TableCell>{withdrawal.payment_method}</TableCell>
                      <TableCell className="text-sm">{withdrawal.account_details}</TableCell>
                      <TableCell>
                        {withdrawal.status === 'pending' && <Badge variant="secondary">Pending</Badge>}
                        {withdrawal.status === 'completed' && <Badge className="bg-green-100 text-green-700">Completed</Badge>}
                        {withdrawal.status === 'rejected' && <Badge variant="destructive">Rejected</Badge>}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(withdrawal.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {withdrawal.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setProcessDialogOpen(true);
                            }}
                          >
                            Process
                          </Button>
                        )}
                        {withdrawal.admin_notes && (
                          <span className="text-xs text-muted-foreground ml-2">{withdrawal.admin_notes}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredWithdrawals.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No withdrawals found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feature Requests Tab */}
        <TabsContent value="feature-requests" className="mt-6">
          <Card className="bg-white border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Seller Feature Requests</CardTitle>
                <Tabs value={featureTab} onValueChange={setFeatureTab}>
                  <TabsList className="bg-muted/50">
                    <TabsTrigger value="all">All ({featureRequests.length})</TabsTrigger>
                    <TabsTrigger value="pending">Pending ({stats.pendingFeatures})</TabsTrigger>
                    <TabsTrigger value="reviewing">Reviewing</TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredFeatureRequests.map((request) => (
                  <Card key={request.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={
                              request.priority === 'high' ? 'destructive' :
                              request.priority === 'medium' ? 'secondary' : 'outline'
                            }>
                              {request.priority}
                            </Badge>
                            <Badge variant={
                              request.status === 'pending' ? 'secondary' :
                              request.status === 'reviewing' ? 'outline' :
                              request.status === 'approved' ? 'default' :
                              request.status === 'completed' ? 'default' : 'destructive'
                            } className={
                              request.status === 'approved' || request.status === 'completed' 
                                ? 'bg-green-100 text-green-700' : ''
                            }>
                              {request.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(request.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="font-semibold mb-1">{request.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{request.description}</p>
                          {request.admin_notes && (
                            <div className="bg-muted p-2 rounded text-sm">
                              <span className="font-medium">Admin Notes:</span> {request.admin_notes}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedFeature(request);
                              setFeatureStatus(request.status);
                              setFeatureNotes(request.admin_notes || '');
                              setFeatureDialogOpen(true);
                            }}
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteFeatureRequest(request.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredFeatureRequests.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No feature requests found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <div className="grid gap-6">
            {/* Global Auto-Approval Settings */}
            <Card className="bg-white border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Global Auto-Approval Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base font-medium">Auto-approve ALL seller products</Label>
                    <p className="text-sm text-muted-foreground">
                      When enabled, all new products from any seller will be automatically approved
                    </p>
                  </div>
                  <Switch
                    checked={autoApprovalSettings.auto_approve_all}
                    onCheckedChange={(checked) => 
                      setAutoApprovalSettings(prev => ({ ...prev, auto_approve_all: checked, auto_approve_verified_only: checked ? false : prev.auto_approve_verified_only }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base font-medium">Auto-approve verified sellers only</Label>
                    <p className="text-sm text-muted-foreground">
                      Only products from verified sellers will be automatically approved
                    </p>
                  </div>
                  <Switch
                    checked={autoApprovalSettings.auto_approve_verified_only}
                    disabled={autoApprovalSettings.auto_approve_all}
                    onCheckedChange={(checked) => 
                      setAutoApprovalSettings(prev => ({ ...prev, auto_approve_verified_only: checked }))
                    }
                  />
                </div>

                <Button onClick={saveAutoApprovalSettings} disabled={savingSettings}>
                  {savingSettings && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Global Settings
                </Button>
              </CardContent>
            </Card>

            {/* Bulk Actions */}
            <Card className="bg-white border">
              <CardHeader>
                <CardTitle className="text-lg">Bulk Auto-Approval Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <Button variant="outline" onClick={() => bulkEnableAutoApprove(false)}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Enable for ALL Sellers
                  </Button>
                  <Button variant="outline" onClick={() => bulkEnableAutoApprove(true)}>
                    <Shield className="w-4 h-4 mr-2" />
                    Enable for Verified Only
                  </Button>
                  <Button variant="destructive" onClick={bulkDisableAutoApprove}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Disable for All
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Per-Seller Auto-Approval */}
            <Card className="bg-white border">
              <CardHeader>
                <CardTitle className="text-lg">Per-Seller Auto-Approval</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {sellers.map((seller) => (
                      <div key={seller.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            {seller.store_logo_url ? (
                              <img src={seller.store_logo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <Store className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{seller.store_name}</p>
                            <div className="flex gap-1">
                              {seller.is_verified && (
                                <Badge className="bg-green-100 text-green-700 text-xs">Verified</Badge>
                              )}
                              {!seller.is_active && (
                                <Badge variant="destructive" className="text-xs">Suspended</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Switch
                          checked={seller.auto_approve_products}
                          onCheckedChange={() => toggleAutoApprove(seller)}
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Seller Details Dialog */}
      <Dialog open={sellerDialogOpen} onOpenChange={setSellerDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              {selectedSeller?.profile.store_name}
            </DialogTitle>
          </DialogHeader>
          {selectedSeller && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedSeller.email || 'N/A'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Wallet Balance</p>
                    <p className="font-medium">${Number(selectedSeller.wallet?.balance || 0).toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Total Products</p>
                    <p className="font-medium">{selectedSeller.products.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="font-medium">{selectedSeller.orders.length}</p>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Recent Orders</h4>
                <div className="space-y-2">
                  {selectedSeller.orders.slice(0, 5).map((order: any) => (
                    <div key={order.id} className="flex justify-between p-2 bg-muted rounded">
                      <span className="text-sm">${Number(order.amount).toFixed(2)}</span>
                      <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                    </div>
                  ))}
                  {selectedSeller.orders.length === 0 && (
                    <p className="text-sm text-muted-foreground">No orders yet</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Seller?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the seller and all their products, orders, and wallet data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSeller} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Process Withdrawal Dialog */}
      <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Withdrawal</DialogTitle>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-lg font-bold">${Number(selectedWithdrawal.amount).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">{selectedWithdrawal.payment_method}</p>
                <p className="text-sm">{selectedWithdrawal.account_details}</p>
              </div>
              <div>
                <Label>Admin Notes (Optional)</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this withdrawal..."
                />
              </div>
              <DialogFooter>
                <Button variant="destructive" onClick={() => handleProcessWithdrawal('rejected')}>
                  Reject
                </Button>
                <Button onClick={() => handleProcessWithdrawal('completed')}>
                  Approve & Complete
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Feature Request Review Dialog */}
      <Dialog open={featureDialogOpen} onOpenChange={setFeatureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Feature Request</DialogTitle>
          </DialogHeader>
          {selectedFeature && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">{selectedFeature.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{selectedFeature.description}</p>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={featureStatus} onValueChange={setFeatureStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Admin Notes</Label>
                <Textarea
                  value={featureNotes}
                  onChange={(e) => setFeatureNotes(e.target.value)}
                  placeholder="Add notes or response..."
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setFeatureDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateFeatureRequest}>
                  Update Request
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnifiedResellersManagement;
