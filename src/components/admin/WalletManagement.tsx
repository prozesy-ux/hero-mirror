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
}

const WalletManagement = () => {
  const [wallets, setWallets] = useState<WalletWithUser[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'wallets' | 'transactions'>('wallets');

  useEffect(() => {
    fetchData();
    subscribeToUpdates();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch wallets with user profiles
    const { data: walletsData } = await supabase
      .from('user_wallets')
      .select('*')
      .order('updated_at', { ascending: false });

    // Fetch user emails for wallets
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

    // Fetch transactions
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
    const { error } = await supabase
      .from('wallet_transactions')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update transaction');
    } else {
      toast.success(`Transaction marked as ${status}`);
      fetchData();
    }
  };

  const filteredWallets = wallets.filter(w =>
    w.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = transactions.filter(t =>
    t.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.payment_gateway?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBalance = wallets.reduce((sum, w) => sum + parseFloat(String(w.balance)), 0);
  const totalTopups = transactions.filter(t => t.type === 'topup' && t.status === 'completed')
    .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <DollarSign className="text-green-400" size={20} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Balance</p>
              <p className="text-2xl font-bold text-white">${totalBalance.toFixed(2)}</p>
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
              <p className="text-2xl font-bold text-white">${totalTopups.toFixed(2)}</p>
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
              <p className="text-2xl font-bold text-white">{wallets.length}</p>
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
          Transactions
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-400 py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredWallets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-400 py-8">
                    No wallets found
                  </TableCell>
                </TableRow>
              ) : (
                filteredWallets.map((wallet) => (
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
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Date</TableHead>
                <TableHead className="text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((tx) => (
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
                    <TableCell className="text-gray-400 uppercase">{tx.payment_gateway}</TableCell>
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
    </div>
  );
};

export default WalletManagement;
