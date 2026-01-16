import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Wallet, Search, DollarSign, ArrowUpRight, RefreshCcw, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface WalletWithUser {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
  user_email?: string;
}

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  payment_gateway: string;
  status: string;
  description: string;
  created_at: string;
  user_email?: string;
  transaction_id?: string;
}

const WalletManagement = () => {
  const [wallets, setWallets] = useState<WalletWithUser[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'wallets' | 'transactions' | 'pending'>('wallets');

  useEffect(() => {
    fetchData();
    subscribeToUpdates();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const { data: walletsData } = await supabase
      .from('user_wallets')
      .select('*')
      .order('updated_at', { ascending: false });

    if (walletsData) {
      const userIds = walletsData.map(w => w.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email')
        .in('user_id', userIds);

      const walletsWithEmail = walletsData.map(wallet => ({
        ...wallet,
        user_email: profiles?.find(p => p.user_id === wallet.user_id)?.email || 'Unknown'
      }));
      setWallets(walletsWithEmail);
    }

    const { data: txData } = await supabase
      .from('wallet_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (txData) {
      const userIds = [...new Set(txData.map(t => t.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email')
        .in('user_id', userIds);

      const txWithEmail = txData.map(tx => ({
        ...tx,
        user_email: profiles?.find(p => p.user_id === tx.user_id)?.email || 'Unknown'
      }));
      setTransactions(txWithEmail);
    }

    setLoading(false);
  };

  const subscribeToUpdates = () => {
    const channel = supabase
      .channel('admin-wallet-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_wallets' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_transactions' }, fetchData)
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const updateTransactionStatus = async (id: string, status: string) => {
    const tx = transactions.find(t => t.id === id);
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
        .single();

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
        fetchData();
        return;
      }

      toast.success(`Transaction approved! $${tx.amount} credited to wallet.`);
    } else {
      toast.success(`Transaction marked as ${status}`);
    }
    
    fetchData();
  };

  const filteredWallets = wallets.filter(w =>
    w.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = transactions.filter(t =>
    t.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.payment_gateway?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingTransactions = transactions.filter(t => t.status === 'pending');
  const filteredPendingTransactions = pendingTransactions.filter(t =>
    t.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.payment_gateway?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBalance = wallets.reduce((sum, w) => sum + parseFloat(String(w.balance)), 0);
  const totalTopups = transactions.filter(t => t.type === 'topup' && t.status === 'completed')
    .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0);
  const pendingAmount = pendingTransactions.reduce((sum, t) => sum + parseFloat(String(t.amount)), 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#09090b] border border-[#1a1a1a] rounded-xl p-4 hover:bg-[#0f0f11] transition-all">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/5 rounded-lg">
              <DollarSign className="text-green-400" size={20} />
            </div>
            <div>
              <p className="text-zinc-500 text-sm font-medium">Total Balance</p>
              <p className="text-2xl font-bold text-white">${totalBalance.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#09090b] border border-[#1a1a1a] rounded-xl p-4 hover:bg-[#0f0f11] transition-all">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/5 rounded-lg">
              <ArrowUpRight className="text-purple-400" size={20} />
            </div>
            <div>
              <p className="text-zinc-500 text-sm font-medium">Total Top-ups</p>
              <p className="text-2xl font-bold text-white">${totalTopups.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#09090b] border border-[#1a1a1a] rounded-xl p-4 hover:bg-[#0f0f11] transition-all">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/5 rounded-lg">
              <RefreshCcw className="text-yellow-400" size={20} />
            </div>
            <div>
              <p className="text-zinc-500 text-sm font-medium">Pending Payments</p>
              <p className="text-2xl font-bold text-white">{pendingTransactions.length} (${pendingAmount.toFixed(2)})</p>
            </div>
          </div>
        </div>
        <div className="bg-[#09090b] border border-[#1a1a1a] rounded-xl p-4 hover:bg-[#0f0f11] transition-all">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/5 rounded-lg">
              <User className="text-blue-400" size={20} />
            </div>
            <div>
              <p className="text-zinc-500 text-sm font-medium">Active Wallets</p>
              <p className="text-2xl font-bold text-white">{wallets.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#1a1a1a] pb-2">
        <button
          onClick={() => setActiveTab('wallets')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'wallets' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'
          }`}
        >
          Wallets
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'transactions' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'
          }`}
        >
          All Transactions
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'pending' ? 'bg-yellow-500 text-black' : 'text-zinc-500 hover:text-white'
          }`}
        >
          Pending Payments
          {pendingTransactions.length > 0 && (
            <span className="bg-yellow-400 text-black text-xs px-2 py-0.5 rounded-full">
              {pendingTransactions.length}
            </span>
          )}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
        <Input
          placeholder="Search by email or gateway..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-[#050506] border-[#1a1a1a] text-white placeholder-zinc-600"
        />
      </div>

      {/* Wallets Table */}
      {activeTab === 'wallets' && (
        <div className="bg-[#09090b] border border-[#1a1a1a] rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[#1a1a1a] bg-[#0d0d0f] hover:bg-[#0d0d0f]">
                <TableHead className="text-zinc-500">User</TableHead>
                <TableHead className="text-zinc-500">Balance</TableHead>
                <TableHead className="text-zinc-500">Created</TableHead>
                <TableHead className="text-zinc-500">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-zinc-500 py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredWallets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-zinc-500 py-8">
                    No wallets found
                  </TableCell>
                </TableRow>
              ) : (
                filteredWallets.map((wallet) => (
                  <TableRow key={wallet.id} className="border-[#1a1a1a] hover:bg-[#0f0f11] transition-all">
                    <TableCell className="text-white">{wallet.user_email}</TableCell>
                    <TableCell className="text-green-400 font-semibold">
                      ${parseFloat(String(wallet.balance)).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-zinc-500">
                      {new Date(wallet.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-zinc-500">
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
        <div className="bg-[#09090b] border border-[#1a1a1a] rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[#1a1a1a] bg-[#0d0d0f] hover:bg-[#0d0d0f]">
                <TableHead className="text-zinc-500">User</TableHead>
                <TableHead className="text-zinc-500">Type</TableHead>
                <TableHead className="text-zinc-500">Amount</TableHead>
                <TableHead className="text-zinc-500">Gateway</TableHead>
                <TableHead className="text-zinc-500">Transaction ID</TableHead>
                <TableHead className="text-zinc-500">Status</TableHead>
                <TableHead className="text-zinc-500">Date</TableHead>
                <TableHead className="text-zinc-500">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-zinc-500 py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-zinc-500 py-8">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((tx) => (
                  <TableRow key={tx.id} className="border-[#1a1a1a] hover:bg-[#0f0f11] transition-all">
                    <TableCell className="text-white">{tx.user_email}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        tx.type === 'topup' ? 'bg-green-500/10 text-green-400' :
                        tx.type === 'purchase' ? 'bg-red-500/10 text-red-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {tx.type}
                      </span>
                    </TableCell>
                    <TableCell className={tx.type === 'topup' ? 'text-green-400' : 'text-red-400'}>
                      {tx.type === 'topup' ? '+' : '-'}${parseFloat(String(tx.amount)).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-zinc-500 uppercase">{tx.payment_gateway || '-'}</TableCell>
                    <TableCell className="text-zinc-400 font-mono text-xs">{tx.transaction_id || '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        tx.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                        tx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {tx.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-zinc-500">
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
        <div className="bg-[#09090b] border border-[#1a1a1a] rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[#1a1a1a] bg-[#0d0d0f] hover:bg-[#0d0d0f]">
                <TableHead className="text-zinc-500">User</TableHead>
                <TableHead className="text-zinc-500">Amount</TableHead>
                <TableHead className="text-zinc-500">Gateway</TableHead>
                <TableHead className="text-zinc-500">Transaction ID</TableHead>
                <TableHead className="text-zinc-500">Date</TableHead>
                <TableHead className="text-zinc-500">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-zinc-500 py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredPendingTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-zinc-500 py-8">
                    No pending payments
                  </TableCell>
                </TableRow>
              ) : (
                filteredPendingTransactions.map((tx) => (
                  <TableRow key={tx.id} className="border-[#1a1a1a] hover:bg-[#0f0f11] transition-all">
                    <TableCell className="text-white">{tx.user_email}</TableCell>
                    <TableCell className="text-green-400 font-semibold">
                      +${parseFloat(String(tx.amount)).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-zinc-500 uppercase">{tx.payment_gateway}</TableCell>
                    <TableCell className="text-yellow-400 font-mono text-sm">{tx.transaction_id || 'Not provided'}</TableCell>
                    <TableCell className="text-zinc-500">
                      {new Date(tx.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateTransactionStatus(tx.id, 'completed')}
                          className="px-3 py-1.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg text-sm transition-all"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateTransactionStatus(tx.id, 'failed')}
                          className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm transition-all"
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