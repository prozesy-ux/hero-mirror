import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminDataContext } from '@/contexts/AdminDataContext';
import { toast } from 'sonner';
import { Wallet, Search, DollarSign, ArrowUpRight, RefreshCcw, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'wallets' | 'transactions' | 'pending'>('wallets');

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

    const { error } = await supabase
      .from('wallet_transactions')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update transaction');
      return;
    }

    if (status === 'completed' && tx.type === 'topup') {
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('balance')
        .eq('user_id', tx.user_id)
        .maybeSingle();

      const currentBalance = wallet?.balance || 0;
      const newBalance = currentBalance + tx.amount;

      const { error: walletError } = await supabase
        .from('user_wallets')
        .upsert({
          user_id: tx.user_id,
          balance: newBalance,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (walletError) {
        toast.error('Transaction approved but failed to credit wallet');
        refreshTable('wallet_transactions');
        return;
      }

      toast.success(`Transaction approved! $${tx.amount} credited to wallet.`);
    } else {
      toast.success(`Transaction marked as ${status}`);
    }
    
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

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <DollarSign className="text-green-400" size={20} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Balance</p>
              <p className="text-2xl font-bold text-white">
                {isLoading ? <Skeleton className="h-8 w-20 bg-white/10" /> : `$${totalBalance.toFixed(2)}`}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <ArrowUpRight className="text-purple-400" size={20} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Top-ups</p>
              <p className="text-2xl font-bold text-white">
                {isLoading ? <Skeleton className="h-8 w-20 bg-white/10" /> : `$${totalTopups.toFixed(2)}`}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <RefreshCcw className="text-yellow-400" size={20} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Pending Payments</p>
              <p className="text-2xl font-bold text-white">
                {isLoading ? <Skeleton className="h-8 w-24 bg-white/10" /> : `${pendingTransactions.length} ($${pendingAmount.toFixed(2)})`}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <User className="text-blue-400" size={20} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Active Wallets</p>
              <p className="text-2xl font-bold text-white">
                {isLoading ? <Skeleton className="h-8 w-12 bg-white/10" /> : wallets.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('wallets')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'wallets' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Wallets
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'transactions' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          All Transactions
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'pending' ? 'bg-yellow-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Pending Payments
          {pendingTransactions.length > 0 && (
            <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
              {pendingTransactions.length}
            </span>
          )}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <Input
          placeholder="Search by email or gateway..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white/5 border-white/10"
        />
      </div>

      {/* Wallets Table */}
      {activeTab === 'wallets' && (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-gray-400">User</TableHead>
                <TableHead className="text-gray-400">Balance</TableHead>
                <TableHead className="text-gray-400">Created</TableHead>
                <TableHead className="text-gray-400">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-white/10">
                    <TableCell><Skeleton className="h-4 w-40 bg-white/10" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20 bg-white/10" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 bg-white/10" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 bg-white/10" /></TableCell>
                  </TableRow>
                ))
              ) : filteredWallets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-400 py-8">
                    No wallets found
                  </TableCell>
                </TableRow>
              ) : (
                filteredWallets.map((wallet: any) => (
                  <TableRow key={wallet.id} className="border-white/10">
                    <TableCell className="text-white">{wallet.user_email}</TableCell>
                    <TableCell className="text-green-400 font-semibold">
                      ${parseFloat(String(wallet.balance)).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {new Date(wallet.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {new Date(wallet.updated_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Transactions Table */}
      {activeTab === 'transactions' && (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-gray-400">User</TableHead>
                <TableHead className="text-gray-400">Type</TableHead>
                <TableHead className="text-gray-400">Amount</TableHead>
                <TableHead className="text-gray-400">Gateway</TableHead>
                <TableHead className="text-gray-400">Transaction ID</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Date</TableHead>
                <TableHead className="text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-white/10">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-16 bg-white/10" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((tx: any) => (
                  <TableRow key={tx.id} className="border-white/10">
                    <TableCell className="text-white">{tx.user_email}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        tx.type === 'topup' ? 'bg-green-500/20 text-green-400' :
                        tx.type === 'purchase' ? 'bg-red-500/20 text-red-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {tx.type}
                      </span>
                    </TableCell>
                    <TableCell className={tx.type === 'topup' ? 'text-green-400' : 'text-red-400'}>
                      {tx.type === 'topup' ? '+' : '-'}${parseFloat(String(tx.amount)).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-gray-400 uppercase">{tx.payment_gateway || '-'}</TableCell>
                    <TableCell className="text-gray-300 font-mono text-xs">{tx.transaction_id || '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        tx.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {tx.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {tx.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateTransactionStatus(tx.id, 'completed')}
                            className="text-green-400 hover:text-green-300 text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateTransactionStatus(tx.id, 'failed')}
                            className="text-red-400 hover:text-red-300 text-sm"
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
      )}

      {/* Pending Payments Table */}
      {activeTab === 'pending' && (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-gray-400">User</TableHead>
                <TableHead className="text-gray-400">Amount</TableHead>
                <TableHead className="text-gray-400">Gateway</TableHead>
                <TableHead className="text-gray-400">Transaction ID</TableHead>
                <TableHead className="text-gray-400">Date</TableHead>
                <TableHead className="text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i} className="border-white/10">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-16 bg-white/10" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredPendingTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                    No pending payments
                  </TableCell>
                </TableRow>
              ) : (
                filteredPendingTransactions.map((tx: any) => (
                  <TableRow key={tx.id} className="border-white/10">
                    <TableCell className="text-white">{tx.user_email}</TableCell>
                    <TableCell className="text-green-400 font-semibold">
                      +${parseFloat(String(tx.amount)).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-gray-400 uppercase">{tx.payment_gateway}</TableCell>
                    <TableCell className="text-yellow-400 font-mono text-sm">{tx.transaction_id || 'Not provided'}</TableCell>
                    <TableCell className="text-gray-400">
                      {new Date(tx.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateTransactionStatus(tx.id, 'completed')}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateTransactionStatus(tx.id, 'failed')}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default WalletManagement;
