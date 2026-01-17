import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Search, 
  Store, 
  Eye, 
  CheckCircle, 
  XCircle,
  Loader2,
  Users,
  Package,
  ShoppingCart,
  Wallet,
  TrendingUp
} from 'lucide-react';

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

interface SellerDetails {
  profile: SellerProfile;
  wallet: { balance: number; pending_balance: number } | null;
  products: any[];
  orders: any[];
  withdrawals: any[];
  userEmail: string;
}

const ResellersManagement = () => {
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeller, setSelectedSeller] = useState<SellerDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      const { data, error } = await supabase
        .from('seller_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSellers(data || []);
    } catch (error) {
      console.error('Error fetching sellers:', error);
      toast.error('Failed to load sellers');
    } finally {
      setLoading(false);
    }
  };

  const fetchSellerDetails = async (seller: SellerProfile) => {
    setDetailsLoading(true);
    try {
      // Fetch all related data in parallel
      const [walletRes, productsRes, ordersRes, withdrawalsRes, profileRes] = await Promise.all([
        supabase.from('seller_wallets').select('*').eq('seller_id', seller.id).single(),
        supabase.from('seller_products').select('*').eq('seller_id', seller.id).order('created_at', { ascending: false }),
        supabase.from('seller_orders').select('*').eq('seller_id', seller.id).order('created_at', { ascending: false }),
        supabase.from('seller_withdrawals').select('*').eq('seller_id', seller.id).order('created_at', { ascending: false }),
        supabase.from('profiles').select('email').eq('user_id', seller.user_id).single()
      ]);

      setSelectedSeller({
        profile: seller,
        wallet: walletRes.data,
        products: productsRes.data || [],
        orders: ordersRes.data || [],
        withdrawals: withdrawalsRes.data || [],
        userEmail: profileRes.data?.email || 'Unknown'
      });
    } catch (error) {
      console.error('Error fetching seller details:', error);
      toast.error('Failed to load seller details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const toggleVerification = async (sellerId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('seller_profiles')
        .update({ is_verified: !currentStatus })
        .eq('id', sellerId);

      if (error) throw error;

      // If verifying, also add seller role
      if (!currentStatus) {
        const seller = sellers.find(s => s.id === sellerId);
        if (seller) {
          await supabase.from('user_roles').upsert({
            user_id: seller.user_id,
            role: 'seller'
          }, { onConflict: 'user_id,role' });
        }
      }

      toast.success(`Seller ${!currentStatus ? 'verified' : 'unverified'}`);
      fetchSellers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update verification');
    }
  };

  const toggleActive = async (sellerId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('seller_profiles')
        .update({ is_active: !currentStatus })
        .eq('id', sellerId);

      if (error) throw error;
      toast.success(`Seller ${!currentStatus ? 'activated' : 'suspended'}`);
      fetchSellers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const filteredSellers = sellers.filter(seller => {
    const matchesSearch = seller.store_name.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'pending') return matchesSearch && !seller.is_verified;
    if (activeTab === 'verified') return matchesSearch && seller.is_verified;
    if (activeTab === 'suspended') return matchesSearch && !seller.is_active;
    return matchesSearch;
  });

  const pendingCount = sellers.filter(s => !s.is_verified).length;
  const verifiedCount = sellers.filter(s => s.is_verified).length;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Resellers Management</h1>
        <p className="text-muted-foreground">Manage sellers, verify applications, and view their data</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{sellers.length}</p>
              <p className="text-sm text-muted-foreground">Total Sellers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Store className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pending Approval</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{verifiedCount}</p>
              <p className="text-sm text-muted-foreground">Verified Sellers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                ${sellers.reduce((sum, s) => sum + Number(s.total_sales || 0), 0).toFixed(0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Sales</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search sellers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({sellers.length})</TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            Pending
            {pendingCount > 0 && (
              <Badge className="bg-yellow-500">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="verified">Verified ({verifiedCount})</TabsTrigger>
          <TabsTrigger value="suspended">Suspended</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredSellers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Store className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No sellers found</p>
              </CardContent>
            </Card>
          ) : (
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
                    <TableHead>Actions</TableHead>
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
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchSellerDetails(seller)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Seller Details Dialog */}
      <Dialog open={!!selectedSeller} onOpenChange={(open) => !open && setSelectedSeller(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Store className="h-5 w-5 text-emerald-500" />
              {selectedSeller?.profile.store_name}
            </DialogTitle>
            <DialogDescription>
              Full seller details and activity
            </DialogDescription>
          </DialogHeader>

          {detailsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-48" />
            </div>
          ) : selectedSeller && (
            <div className="space-y-6">
              {/* Stats Row */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="p-3 text-center">
                    <Wallet className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
                    <p className="text-lg font-bold">${selectedSeller.wallet?.balance?.toFixed(2) || '0.00'}</p>
                    <p className="text-xs text-muted-foreground">Balance</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <Package className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                    <p className="text-lg font-bold">{selectedSeller.products.length}</p>
                    <p className="text-xs text-muted-foreground">Products</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <ShoppingCart className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                    <p className="text-lg font-bold">{selectedSeller.orders.length}</p>
                    <p className="text-xs text-muted-foreground">Orders</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <TrendingUp className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                    <p className="text-lg font-bold">${Number(selectedSeller.profile.total_sales || 0).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Total Sales</p>
                  </CardContent>
                </Card>
              </div>

              {/* Profile Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Seller Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span>{selectedSeller.userEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Store Description</span>
                    <span>{selectedSeller.profile.store_description || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Commission Rate</span>
                    <span>{selectedSeller.profile.commission_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pending Balance</span>
                    <span>${selectedSeller.wallet?.pending_balance?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Joined</span>
                    <span>{format(new Date(selectedSeller.profile.created_at), 'PPP')}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedSeller.orders.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No orders yet</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedSeller.orders.slice(0, 10).map((order) => (
                        <div key={order.id} className="flex justify-between items-center p-2 rounded bg-accent/50 text-sm">
                          <span>${Number(order.amount).toFixed(2)}</span>
                          <Badge variant={order.status === 'completed' ? 'default' : 'outline'}>
                            {order.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Withdrawals */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Withdrawal History</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedSeller.withdrawals.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No withdrawals yet</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedSeller.withdrawals.map((w) => (
                        <div key={w.id} className="flex justify-between items-center p-2 rounded bg-accent/50 text-sm">
                          <div>
                            <span className="font-medium">${Number(w.amount).toFixed(2)}</span>
                            <span className="text-muted-foreground ml-2">via {w.payment_method}</span>
                          </div>
                          <Badge variant={w.status === 'approved' ? 'default' : 'outline'}>
                            {w.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResellersManagement;
