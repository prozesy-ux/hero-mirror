import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminDataContext } from '@/contexts/AdminDataContext';
import { useAdminMutate } from '@/hooks/useAdminMutate';
import { useAdminData } from '@/hooks/useAdminData';
import { toast } from 'sonner';
import { Wallet, Search, DollarSign, ArrowUpRight, RefreshCw, CheckCircle, XCircle, Clock, ArrowDownLeft, Banknote } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_method: string;
  account_details: string;
  admin_notes?: string;
  created_at: string;
  processed_at?: string;
  user_email?: string;
  seller_email?: string;
}

const WalletManagement = () => {
  const { wallets, transactions, profiles, isLoading, refreshTable } = useAdminDataContext();
  const { mutateData } = useAdminMutate();
  const { fetchData } = useAdminData();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'wallets' | 'transactions' | 'pending' | 'withdrawals'>('wallets');
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Withdrawal states
  const [buyerWithdrawals, setBuyerWithdrawals] = useState<Withdrawal[]>([]);
  const [sellerWithdrawals, setSellerWithdrawals] = useState<Withdrawal[]>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(true);
  const [sellerProfiles, setSellerProfiles] = useState<any[]>([]);

  // Fetch withdrawals data
  const fetchWithdrawals = useCallback(async () => {
    setWithdrawalsLoading(true);
    try {
      const [buyerResult, sellerResult, sellerProfilesResult] = await Promise.all([
        fetchData('buyer_withdrawals', { order: { column: 'created_at', ascending: false } }),
        fetchData('seller_withdrawals', { order: { column: 'created_at', ascending: false } }),
        fetchData('seller_profiles', { select: 'id,user_id,store_name' })
      ]);

      if (buyerResult.data) setBuyerWithdrawals(buyerResult.data);
      if (sellerResult.data) setSellerWithdrawals(sellerResult.data);
      if (sellerProfilesResult.data) setSellerProfiles(sellerProfilesResult.data);
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
    } finally {
      setWithdrawalsLoading(false);
    }
  }, [fetchData]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-wallet-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_wallets' }, () => refreshTable('user_wallets'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_transactions' }, () => refreshTable('wallet_transactions'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'buyer_withdrawals' }, () => fetchWithdrawals())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seller_withdrawals' }, () => fetchWithdrawals())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refreshTable, fetchWithdrawals]);

  const enrichedData = useMemo(() => {
    const profileMap = new Map(profiles.map((p: any) => [p.user_id, p.email]));
    const sellerProfileMap = new Map(sellerProfiles.map((s: any) => [s.id, { user_id: s.user_id, store_name: s.store_name }]));
    
    const walletsWithEmail = wallets.map((wallet: any) => ({
      ...wallet,
      user_email: profileMap.get(wallet.user_id) || 'Unknown'
    }));

    const txWithEmail = transactions.map((tx: any) => ({
      ...tx,
      user_email: profileMap.get(tx.user_id) || 'Unknown'
    }));

    // Enrich buyer withdrawals with email
    const enrichedBuyerWithdrawals = buyerWithdrawals.map((wd: any) => ({
      ...wd,
      user_email: profileMap.get(wd.user_id) || 'Unknown'
    }));

    // Enrich seller withdrawals with email
    const enrichedSellerWithdrawals = sellerWithdrawals.map((wd: any) => {
      const sellerProfile = sellerProfileMap.get(wd.seller_id);
      const userEmail = sellerProfile ? profileMap.get(sellerProfile.user_id) : null;
      return {
        ...wd,
        seller_email: userEmail || 'Unknown',
        store_name: sellerProfile?.store_name || 'Unknown Store'
      };
    });

    return { walletsWithEmail, txWithEmail, enrichedBuyerWithdrawals, enrichedSellerWithdrawals };
  }, [wallets, transactions, profiles, buyerWithdrawals, sellerWithdrawals, sellerProfiles]);

  const updateTransactionStatus = async (id: string, status: string) => {
    const tx = enrichedData.txWithEmail.find((t: any) => t.id === id);
    if (!tx) {
      toast.error('Transaction not found');
      return;
    }

    setProcessingId(id);

    const result = await mutateData('wallet_transactions', 'update', { status }, id);

    if (!result.success) {
      toast.error('Failed to update transaction');
      setProcessingId(null);
      return;
    }

    if (status === 'completed' && tx.type === 'topup') {
      const walletResult = await fetchData('user_wallets', { 
        filters: [{ column: 'user_id', value: tx.user_id }] 
      });
      
      const currentBalance = walletResult.data?.[0]?.balance || 0;
      const newBalance = currentBalance + tx.amount;

      if (walletResult.data && walletResult.data.length > 0) {
        const walletUpdateResult = await mutateData(
          'user_wallets', 
          'update', 
          { balance: newBalance, updated_at: new Date().toISOString() },
          walletResult.data[0].id
        );

        if (!walletUpdateResult.success) {
          toast.error('Transaction approved but failed to credit wallet');
          refreshTable('wallet_transactions');
          setProcessingId(null);
          return;
        }
      } else {
        const walletInsertResult = await mutateData(
          'user_wallets',
          'insert',
          { user_id: tx.user_id, balance: newBalance }
        );

        if (!walletInsertResult.success) {
          toast.error('Transaction approved but failed to create wallet');
          refreshTable('wallet_transactions');
          setProcessingId(null);
          return;
        }
      }

      toast.success(`Transaction approved! $${tx.amount} credited to wallet.`);
    } else {
      toast.success(`Transaction marked as ${status}`);
    }
    
    setProcessingId(null);
    refreshTable('user_wallets');
    refreshTable('wallet_transactions');
  };

  // Process withdrawal (approve/reject)
  const processWithdrawal = async (
    type: 'buyer' | 'seller',
    id: string,
    status: 'completed' | 'rejected',
    notes?: string
  ) => {
    setProcessingId(id);
    const table = type === 'buyer' ? 'buyer_withdrawals' : 'seller_withdrawals';
    
    const updateData: any = {
      status,
      processed_at: new Date().toISOString()
    };
    if (notes) updateData.admin_notes = notes;

    const result = await mutateData(table, 'update', updateData, id);

    if (result.success) {
      toast.success(`Withdrawal ${status === 'completed' ? 'approved' : 'rejected'} successfully`);
      fetchWithdrawals();
    } else {
      toast.error(`Failed to ${status === 'completed' ? 'approve' : 'reject'} withdrawal`);
    }
    setProcessingId(null);
  };

  const filteredWallets = enrichedData.walletsWithEmail.filter((w: any) =>
    w.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = enrichedData.txWithEmail.filter((t: any) =>
    t.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.payment_gateway?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingTransactions = enrichedData.txWithEmail.filter((t: any) => t.status === 'pending');
  const filteredPendingTransactions = pendingTransactions.filter((t: any) =>
    t.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.payment_gateway?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter withdrawals
  const filteredBuyerWithdrawals = enrichedData.enrichedBuyerWithdrawals.filter((w: any) =>
    w.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.payment_method?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSellerWithdrawals = enrichedData.enrichedSellerWithdrawals.filter((w: any) =>
    w.seller_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.store_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.payment_method?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats calculations
  const totalBalance = enrichedData.walletsWithEmail.reduce((sum: number, w: any) => sum + parseFloat(String(w.balance)), 0);
  const totalTopups = enrichedData.txWithEmail.filter((t: any) => t.type === 'topup' && t.status === 'completed')
    .reduce((sum: number, t: any) => sum + parseFloat(String(t.amount)), 0);
  const pendingAmount = pendingTransactions.reduce((sum: number, t: any) => sum + parseFloat(String(t.amount)), 0);

  // Withdrawal stats
  const pendingBuyerWithdrawals = enrichedData.enrichedBuyerWithdrawals.filter((w: any) => w.status === 'pending');
  const pendingSellerWithdrawals = enrichedData.enrichedSellerWithdrawals.filter((w: any) => w.status === 'pending');
  const pendingBuyerAmount = pendingBuyerWithdrawals.reduce((sum: number, w: any) => sum + parseFloat(String(w.amount)), 0);
  const pendingSellerAmount = pendingSellerWithdrawals.reduce((sum: number, w: any) => sum + parseFloat(String(w.amount)), 0);
  const totalPendingWithdrawals = pendingBuyerWithdrawals.length + pendingSellerWithdrawals.length;

  const handleRefresh = () => {
    refreshTable('user_wallets');
    refreshTable('wallet_transactions');
    fetchWithdrawals();
    toast.success('Refreshed wallet data');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'completed':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Processing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Total Balance</p>
              <p className="text-2xl font-bold text-white mt-1">
                {isLoading ? <Skeleton className="h-8 w-20 bg-white/10" /> : `$${totalBalance.toFixed(2)}`}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-violet-500/20 to-violet-600/10 border border-violet-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Total Top-ups</p>
              <p className="text-2xl font-bold text-white mt-1">
                {isLoading ? <Skeleton className="h-8 w-20 bg-white/10" /> : `$${totalTopups.toFixed(2)}`}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-violet-500/20 flex items-center justify-center">
              <ArrowUpRight className="h-6 w-6 text-violet-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Pending Top-ups</p>
              <p className="text-xl font-bold text-white mt-1">
                {isLoading ? <Skeleton className="h-7 w-24 bg-white/10" /> : `${pendingTransactions.length} ($${pendingAmount.toFixed(2)})`}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Active Wallets</p>
              <p className="text-2xl font-bold text-white mt-1">
                {isLoading ? <Skeleton className="h-8 w-12 bg-white/10" /> : wallets.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Buyer W/D</p>
              <p className="text-xl font-bold text-white mt-1">
                {withdrawalsLoading ? <Skeleton className="h-7 w-20 bg-white/10" /> : `${pendingBuyerWithdrawals.length} ($${pendingBuyerAmount.toFixed(2)})`}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center">
              <ArrowDownLeft className="h-6 w-6 text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/10 border border-pink-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Seller W/D</p>
              <p className="text-xl font-bold text-white mt-1">
                {withdrawalsLoading ? <Skeleton className="h-7 w-20 bg-white/10" /> : `${pendingSellerWithdrawals.length} ($${pendingSellerAmount.toFixed(2)})`}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center">
              <Banknote className="h-6 w-6 text-pink-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Refresh */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by email, gateway, or method..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500 focus:border-violet-500 rounded-xl h-11"
          />
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          disabled={isLoading || withdrawalsLoading}
          className="bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl h-11"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${(isLoading || withdrawalsLoading) ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-800 p-1.5 rounded-xl w-full sm:w-auto flex-wrap">
          <TabsTrigger 
            value="wallets" 
            className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 rounded-lg px-3 py-2"
          >
            <Wallet className="h-4 w-4 mr-2" />
            Wallets
          </TabsTrigger>
          <TabsTrigger 
            value="transactions" 
            className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 rounded-lg px-3 py-2"
          >
            Transactions
          </TabsTrigger>
          <TabsTrigger 
            value="pending" 
            className="data-[state=active]:bg-amber-600 data-[state=active]:text-white text-slate-400 rounded-lg px-3 py-2"
          >
            <Clock className="h-4 w-4 mr-2" />
            Top-ups
            {pendingTransactions.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-500 text-white rounded-md">
                {pendingTransactions.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="withdrawals" 
            className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-slate-400 rounded-lg px-3 py-2"
          >
            <ArrowDownLeft className="h-4 w-4 mr-2" />
            Withdrawals
            {totalPendingWithdrawals > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-orange-500 text-white rounded-md">
                {totalPendingWithdrawals}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Wallets Table */}
        <TabsContent value="wallets" className="mt-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">User</TableHead>
                  <TableHead className="text-slate-400">Balance</TableHead>
                  <TableHead className="text-slate-400">Created</TableHead>
                  <TableHead className="text-slate-400">Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-slate-800">
                      <TableCell><Skeleton className="h-4 w-40 bg-slate-700" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20 bg-slate-700" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24 bg-slate-700" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24 bg-slate-700" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredWallets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-400 py-12">
                      No wallets found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWallets.map((wallet: any) => (
                    <TableRow key={wallet.id} className="border-slate-800 hover:bg-slate-800/30">
                      <TableCell className="text-white">{wallet.user_email}</TableCell>
                      <TableCell className="text-emerald-400 font-semibold">
                        ${parseFloat(String(wallet.balance)).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {new Date(wallet.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {new Date(wallet.updated_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Transactions Table */}
        <TabsContent value="transactions" className="mt-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">User</TableHead>
                  <TableHead className="text-slate-400">Type</TableHead>
                  <TableHead className="text-slate-400">Amount</TableHead>
                  <TableHead className="text-slate-400">Gateway</TableHead>
                  <TableHead className="text-slate-400">Transaction ID</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Date</TableHead>
                  <TableHead className="text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-slate-800">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-16 bg-slate-700" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-slate-400 py-12">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((tx: any) => (
                    <TableRow key={tx.id} className="border-slate-800 hover:bg-slate-800/30">
                      <TableCell className="text-white">{tx.user_email}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          tx.type === 'topup' ? 'bg-emerald-500/20 text-emerald-400' :
                          tx.type === 'purchase' ? 'bg-red-500/20 text-red-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {tx.type}
                        </span>
                      </TableCell>
                      <TableCell className={tx.type === 'topup' ? 'text-emerald-400' : 'text-red-400'}>
                        {tx.type === 'topup' ? '+' : '-'}${parseFloat(String(tx.amount)).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-slate-400 uppercase">{tx.payment_gateway || '-'}</TableCell>
                      <TableCell className="text-slate-300 font-mono text-xs">{tx.transaction_id || '-'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                          tx.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                          tx.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {tx.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                          {tx.status === 'pending' && <Clock className="w-3 h-3" />}
                          {tx.status === 'failed' && <XCircle className="w-3 h-3" />}
                          {tx.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {tx.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateTransactionStatus(tx.id, 'completed')}
                              disabled={processingId === tx.id}
                              className="text-emerald-400 hover:text-emerald-300 text-sm disabled:opacity-50"
                            >
                              {processingId === tx.id ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => updateTransactionStatus(tx.id, 'failed')}
                              disabled={processingId === tx.id}
                              className="text-red-400 hover:text-red-300 text-sm disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Pending Top-ups Table */}
        <TabsContent value="pending" className="mt-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">User</TableHead>
                  <TableHead className="text-slate-400">Amount</TableHead>
                  <TableHead className="text-slate-400">Gateway</TableHead>
                  <TableHead className="text-slate-400">Transaction ID</TableHead>
                  <TableHead className="text-slate-400">Date</TableHead>
                  <TableHead className="text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-slate-800">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-16 bg-slate-700" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredPendingTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-400 py-12">
                      No pending top-ups
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPendingTransactions.map((tx: any) => (
                    <TableRow key={tx.id} className="border-slate-800 hover:bg-slate-800/30">
                      <TableCell className="text-white">{tx.user_email}</TableCell>
                      <TableCell className="text-emerald-400 font-semibold">
                        ${parseFloat(String(tx.amount)).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-slate-400 uppercase">{tx.payment_gateway || '-'}</TableCell>
                      <TableCell className="text-slate-300 font-mono text-xs">{tx.transaction_id || '-'}</TableCell>
                      <TableCell className="text-slate-400">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => updateTransactionStatus(tx.id, 'completed')}
                            disabled={processingId === tx.id}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                          >
                            {processingId === tx.id ? 'Processing...' : 'Approve'}
                          </Button>
                          <Button
                            onClick={() => updateTransactionStatus(tx.id, 'failed')}
                            disabled={processingId === tx.id}
                            size="sm"
                            variant="outline"
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-lg"
                          >
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Withdrawals Tab - Combined Buyer & Seller */}
        <TabsContent value="withdrawals" className="mt-6 space-y-6">
          {/* Buyer Withdrawals Section */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ArrowDownLeft className="h-5 w-5 text-orange-400" />
              Buyer Withdrawals
              {pendingBuyerWithdrawals.length > 0 && (
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                  {pendingBuyerWithdrawals.length} pending
                </Badge>
              )}
            </h3>
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">User</TableHead>
                    <TableHead className="text-slate-400">Amount</TableHead>
                    <TableHead className="text-slate-400">Method</TableHead>
                    <TableHead className="text-slate-400">Account</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Date</TableHead>
                    <TableHead className="text-slate-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawalsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i} className="border-slate-800">
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-16 bg-slate-700" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filteredBuyerWithdrawals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-slate-400 py-12">
                        No buyer withdrawals found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBuyerWithdrawals.map((wd: any) => (
                      <TableRow key={wd.id} className="border-slate-800 hover:bg-slate-800/30">
                        <TableCell className="text-white">{wd.user_email}</TableCell>
                        <TableCell className="text-orange-400 font-semibold">
                          ${parseFloat(String(wd.amount)).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-slate-400 uppercase">{wd.payment_method}</TableCell>
                        <TableCell className="text-slate-300 text-xs max-w-[200px] truncate">
                          {wd.account_details}
                        </TableCell>
                        <TableCell>{getStatusBadge(wd.status)}</TableCell>
                        <TableCell className="text-slate-400">
                          {new Date(wd.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {wd.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                onClick={() => processWithdrawal('buyer', wd.id, 'completed')}
                                disabled={processingId === wd.id}
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                              >
                                {processingId === wd.id ? '...' : 'Approve'}
                              </Button>
                              <Button
                                onClick={() => processWithdrawal('buyer', wd.id, 'rejected')}
                                disabled={processingId === wd.id}
                                size="sm"
                                variant="outline"
                                className="border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-lg"
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                          {wd.status !== 'pending' && wd.processed_at && (
                            <span className="text-xs text-slate-500">
                              {new Date(wd.processed_at).toLocaleDateString()}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Seller Withdrawals Section */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Banknote className="h-5 w-5 text-pink-400" />
              Seller Withdrawals
              {pendingSellerWithdrawals.length > 0 && (
                <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30">
                  {pendingSellerWithdrawals.length} pending
                </Badge>
              )}
            </h3>
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">Seller</TableHead>
                    <TableHead className="text-slate-400">Store</TableHead>
                    <TableHead className="text-slate-400">Amount</TableHead>
                    <TableHead className="text-slate-400">Method</TableHead>
                    <TableHead className="text-slate-400">Account</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Date</TableHead>
                    <TableHead className="text-slate-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawalsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i} className="border-slate-800">
                        {Array.from({ length: 8 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-16 bg-slate-700" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filteredSellerWithdrawals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-slate-400 py-12">
                        No seller withdrawals found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSellerWithdrawals.map((wd: any) => (
                      <TableRow key={wd.id} className="border-slate-800 hover:bg-slate-800/30">
                        <TableCell className="text-white">{wd.seller_email}</TableCell>
                        <TableCell className="text-slate-300">{wd.store_name}</TableCell>
                        <TableCell className="text-pink-400 font-semibold">
                          ${parseFloat(String(wd.amount)).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-slate-400 uppercase">{wd.payment_method}</TableCell>
                        <TableCell className="text-slate-300 text-xs max-w-[200px] truncate">
                          {wd.account_details}
                        </TableCell>
                        <TableCell>{getStatusBadge(wd.status)}</TableCell>
                        <TableCell className="text-slate-400">
                          {new Date(wd.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {wd.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                onClick={() => processWithdrawal('seller', wd.id, 'completed')}
                                disabled={processingId === wd.id}
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                              >
                                {processingId === wd.id ? '...' : 'Approve'}
                              </Button>
                              <Button
                                onClick={() => processWithdrawal('seller', wd.id, 'rejected')}
                                disabled={processingId === wd.id}
                                size="sm"
                                variant="outline"
                                className="border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-lg"
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                          {wd.status !== 'pending' && wd.processed_at && (
                            <span className="text-xs text-slate-500">
                              {new Date(wd.processed_at).toLocaleDateString()}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WalletManagement;
