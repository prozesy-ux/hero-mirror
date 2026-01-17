import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Search, 
  ArrowDownToLine, 
  CheckCircle, 
  XCircle,
  Clock,
  Loader2,
  DollarSign
} from 'lucide-react';

interface Withdrawal {
  id: string;
  seller_id: string;
  amount: number;
  payment_method: string;
  account_details: string;
  status: string;
  admin_notes: string | null;
  processed_at: string | null;
  created_at: string;
  seller?: {
    store_name: string;
    user_id: string;
  };
}

const SellerWithdrawalsAdmin = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from('seller_withdrawals')
        .select(`
          *,
          seller:seller_profiles(store_name, user_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast.error('Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (action: 'approved' | 'rejected') => {
    if (!selectedWithdrawal) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('seller_withdrawals')
        .update({
          status: action,
          admin_notes: adminNotes.trim() || null,
          processed_at: new Date().toISOString()
        })
        .eq('id', selectedWithdrawal.id);

      if (error) throw error;

      // If rejected, refund the balance
      if (action === 'rejected') {
        const { data: wallet } = await supabase
          .from('seller_wallets')
          .select('balance')
          .eq('seller_id', selectedWithdrawal.seller_id)
          .single();

        if (wallet) {
          await supabase
            .from('seller_wallets')
            .update({
              balance: wallet.balance + selectedWithdrawal.amount
            })
            .eq('seller_id', selectedWithdrawal.seller_id);
        }
      }

      toast.success(`Withdrawal ${action}`);
      setSelectedWithdrawal(null);
      setAdminNotes('');
      fetchWithdrawals();
    } catch (error: any) {
      toast.error(error.message || 'Failed to process withdrawal');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredWithdrawals = withdrawals.filter(w => {
    const matchesSearch = w.seller?.store_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.payment_method.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && w.status === activeTab;
  });

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;
  const pendingTotal = withdrawals
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + Number(w.amount), 0);

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
        <h1 className="text-2xl font-bold text-foreground">Seller Withdrawals</h1>
        <p className="text-muted-foreground">Process withdrawal requests from sellers</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pending Requests</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">${pendingTotal.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Pending Amount</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <ArrowDownToLine className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{withdrawals.length}</p>
              <p className="text-sm text-muted-foreground">Total Requests</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search withdrawals..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            Pending
            {pendingCount > 0 && (
              <Badge className="bg-yellow-500">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredWithdrawals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ArrowDownToLine className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No withdrawals found</p>
              </CardContent>
            </Card>
          ) : (
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
                        <p className="font-medium">{withdrawal.seller?.store_name}</p>
                      </TableCell>
                      <TableCell className="font-bold">
                        ${Number(withdrawal.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>{withdrawal.payment_method}</TableCell>
                      <TableCell>
                        {format(new Date(withdrawal.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                      <TableCell>
                        {withdrawal.status === 'pending' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedWithdrawal(withdrawal)}
                          >
                            Process
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedWithdrawal(withdrawal)}
                          >
                            View
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Process Dialog */}
      <Dialog open={!!selectedWithdrawal} onOpenChange={(open) => !open && setSelectedWithdrawal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedWithdrawal?.status === 'pending' ? 'Process Withdrawal' : 'Withdrawal Details'}
            </DialogTitle>
            <DialogDescription>
              {selectedWithdrawal?.seller?.store_name}
            </DialogDescription>
          </DialogHeader>

          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-accent/50 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold">${Number(selectedWithdrawal.amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method</span>
                  <span>{selectedWithdrawal.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Requested</span>
                  <span>{format(new Date(selectedWithdrawal.created_at), 'PPp')}</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Account Details</p>
                <pre className="p-3 rounded-lg bg-accent/50 text-sm whitespace-pre-wrap">
                  {selectedWithdrawal.account_details}
                </pre>
              </div>

              {selectedWithdrawal.status === 'pending' ? (
                <>
                  <div>
                    <p className="text-sm font-medium mb-2">Admin Notes (optional)</p>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add any notes..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleProcess('rejected')}
                      disabled={processing}
                      className="flex-1 text-destructive"
                    >
                      {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleProcess('approved')}
                      disabled={processing}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                    >
                      {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status</span>
                    {getStatusBadge(selectedWithdrawal.status)}
                  </div>
                  {selectedWithdrawal.processed_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Processed</span>
                      <span>{format(new Date(selectedWithdrawal.processed_at), 'PPp')}</span>
                    </div>
                  )}
                  {selectedWithdrawal.admin_notes && (
                    <div>
                      <p className="text-sm font-medium mb-2">Admin Notes</p>
                      <p className="text-sm text-muted-foreground">{selectedWithdrawal.admin_notes}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerWithdrawalsAdmin;
