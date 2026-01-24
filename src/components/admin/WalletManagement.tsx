import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminDataContext } from '@/contexts/AdminDataContext';
import { useAdminMutate } from '@/hooks/useAdminMutate';
import { useAdminData } from '@/hooks/useAdminData';
import { toast } from 'sonner';
import { Wallet, Search, DollarSign, ArrowUpRight, RefreshCw, User, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const WalletManagement = () => {
  const { wallets, transactions, profiles, isLoading, refreshTable } = useAdminDataContext();
  const { mutateData } = useAdminMutate();
  const { fetchData } = useAdminData();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'wallets' | 'transactions' | 'pending'>('wallets');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel('admin-wallet-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_wallets' }, () => refreshTable('user_wallets'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_transactions' }, () => refreshTable('wallet_transactions'))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refreshTable]);

  const enrichedData = useMemo(() => {
    const profileMap = new Map(profiles.map((p: any) => [p.user_id, p.email]));
    
    const walletsWithEmail = wallets.map((wallet: any) => ({
      ...wallet,
      user_email: profileMap.get(wallet.user_id) || 'Unknown'
    }));

    const txWithEmail = transactions.map((tx: any) => ({
      ...tx,
      user_email: profileMap.get(tx.user_id) || 'Unknown'
    }));

    return { walletsWithEmail, txWithEmail };
  }, [wallets, transactions, profiles]);

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

  const totalBalance = enrichedData.walletsWithEmail.reduce((sum: number, w: any) => sum + parseFloat(String(w.balance)), 0);
  const totalTopups = enrichedData.txWithEmail.filter((t: any) => t.type === 'topup' && t.status === 'completed')
    .reduce((sum: number, t: any) => sum + parseFloat(String(t.amount)), 0);
  const pendingAmount = pendingTransactions.reduce((sum: number, t: any) => sum + parseFloat(String(t.amount)), 0);

  const handleRefresh = () => {
    refreshTable('user_wallets');
    refreshTable('wallet_transactions');
    toast.success('Refreshed wallet data');
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Total Balance</p>
              <p className="text-3xl font-bold text-white mt-1">
                {isLoading ? <Skeleton className="h-9 w-20 bg-white/10" /> : `$${totalBalance.toFixed(2)}`}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
              <DollarSign className="h-7 w-7 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-violet-500/20 to-violet-600/10 border border-violet-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Total Top-ups</p>
              <p className="text-3xl font-bold text-white mt-1">
                {isLoading ? <Skeleton className="h-9 w-20 bg-white/10" /> : `$${totalTopups.toFixed(2)}`}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-violet-500/20 flex items-center justify-center">
              <ArrowUpRight className="h-7 w-7 text-violet-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Pending Payments</p>
              <p className="text-2xl font-bold text-white mt-1">
                {isLoading ? <Skeleton className="h-8 w-24 bg-white/10" /> : `${pendingTransactions.length} ($${pendingAmount.toFixed(2)})`}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center">
              <Clock className="h-7 w-7 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Active Wallets</p>
              <p className="text-3xl font-bold text-white mt-1">
                {isLoading ? <Skeleton className="h-9 w-12 bg-white/10" /> : wallets.length}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center">
              <Wallet className="h-7 w-7 text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Refresh */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by email or gateway..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500 focus:border-violet-500 rounded-xl h-11"
          />
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          disabled={isLoading}
          className="bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl h-11"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-800 p-1.5 rounded-xl w-full sm:w-auto">
          <TabsTrigger 
            value="wallets" 
            className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 rounded-lg px-4 py-2"
          >
            <Wallet className="h-4 w-4 mr-2" />
            Wallets
          </TabsTrigger>
          <TabsTrigger 
            value="transactions" 
            className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 rounded-lg px-4 py-2"
          >
            All Transactions
          </TabsTrigger>
          <TabsTrigger 
            value="pending" 
            className="data-[state=active]:bg-amber-600 data-[state=active]:text-white text-slate-400 rounded-lg px-4 py-2"
          >
            <Clock className="h-4 w-4 mr-2" />
            Pending
            {pendingTransactions.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-500 text-white rounded-md">
                {pendingTransactions.length}
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

        {/* Pending Payments Table */}
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
                      No pending payments
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
      </Tabs>
    </div>
  );
};

export default WalletManagement;
