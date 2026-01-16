import { useState, useEffect } from 'react';
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
import { useAdminApi } from '@/hooks/useAdminApi';

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

interface Profile {
  user_id: string;
  email: string;
}

const WalletManagement = () => {
  const [wallets, setWallets] = useState<WalletWithUser[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'wallets' | 'transactions' | 'pending'>('wallets');
  const { fetchData, updateData } = useAdminApi();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    
    const [walletsResult, txResult] = await Promise.all([
      fetchData<WalletWithUser>('user_wallets', {
        select: '*',
        order: { column: 'updated_at', ascending: false }
      }),
      fetchData<Transaction>('wallet_transactions', {
        select: '*',
        order: { column: 'created_at', ascending: false },
        limit: 100
      })
    ]);

    const walletsData = walletsResult.data || [];
    const txData = txResult.data || [];

    // Get all user IDs
    const allUserIds = [...new Set([
      ...walletsData.map(w => w.user_id),
      ...txData.map(t => t.user_id)
    ])];

    // Fetch profiles
    const { data: profiles } = await fetchData<Profile>('profiles', {
      select: 'user_id, email'
    });

    const profileMap = new Map((profiles || []).map(p => [p.user_id, p.email]));

    // Enrich data with emails
    const walletsWithEmail = walletsData.map(wallet => ({
      ...wallet,
      user_email: profileMap.get(wallet.user_id) || 'Unknown'
    }));
    setWallets(walletsWithEmail);

    const txWithEmail = txData.map(tx => ({
      ...tx,
      user_email: profileMap.get(tx.user_id) || 'Unknown'
    }));
    setTransactions(txWithEmail);

    setLoading(false);
  };

  const updateTransactionStatus = async (id: string, status: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) {
      toast.error('Transaction not found');
      return;
    }

    const { error } = await updateData('wallet_transactions', id, { status });

    if (error) {
      toast.error('Failed to update transaction');
      return;
    }

    // If approving a topup, credit the user's wallet
    if (status === 'completed' && tx.type === 'topup') {
      const wallet = wallets.find(w => w.user_id === tx.user_id);
      const currentBalance = wallet?.balance || 0;
      const newBalance = currentBalance + tx.amount;

      const { error: walletError } = await updateData('user_wallets', null, {
        balance: newBalance,
        updated_at: new Date().toISOString()
      }, { eq: { user_id: tx.user_id } });

      if (walletError) {
        toast.error('Transaction approved but failed to credit wallet');
        fetchAllData();
        return;
      }

      toast.success(`Transaction approved! $${tx.amount} credited to wallet.`);
    } else {
      toast.success(`Transaction marked as ${status}`);
    }
    
    fetchAllData();
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
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4 hover:border-[#3f3f46] transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <DollarSign className="text-green-400" size={20} />
            </div>
            <div>
              <p className="text-zinc-400 text-sm font-medium">Total Balance</p>
              <p className="text-2xl font-bold text-white">${totalBalance.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4 hover:border-[#3f3f46] transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <ArrowUpRight className="text-purple-400" size={20} />
            </div>
            <div>
              <p className="text-zinc-400 text-sm font-medium">Total Top-ups</p>
              <p className="text-2xl font-bold text-white">${totalTopups.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4 hover:border-[#3f3f46] transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <RefreshCcw className="text-yellow-400" size={20} />
            </div>
            <div>
              <p className="text-zinc-400 text-sm font-medium">Pending Payments</p>
              <p className="text-2xl font-bold text-white">{pendingTransactions.length} (${pendingAmount.toFixed(2)})</p>
            </div>
          </div>
        </div>
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4 hover:border-[#3f3f46] transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <User className="text-blue-400" size={20} />
            </div>
            <div>
              <p className="text-zinc-400 text-sm font-medium">Active Wallets</p>
              <p className="text-2xl font-bold text-white">{wallets.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#27272a] pb-2">
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
          className="pl-10 bg-[#0c0c0e] border-[#27272a] text-white"
        />
      </div>

      {/* Wallets Table */}
      {activeTab === 'wallets' && (
        <div className="bg-[#111113] border border-[#27272a] rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[#27272a] bg-[#18181b]">
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
                  <TableRow key={wallet.id} className="border-[#27272a]">
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
        <div className="bg-[#111113] border border-[#27272a] rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[#27272a] bg-[#18181b]">
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((tx) => (
                  <TableRow key={tx.id} className="border-[#27272a]">
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
        <div className="bg-[#111113] border border-[#27272a] rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[#27272a] bg-[#18181b]">
                <TableHead className="text-gray-400">User</TableHead>
                <TableHead className="text-gray-400">Amount</TableHead>
                <TableHead className="text-gray-400">Gateway</TableHead>
                <TableHead className="text-gray-400">Transaction ID</TableHead>
                <TableHead className="text-gray-400">Date</TableHead>
                <TableHead className="text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredPendingTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                    No pending payments
                  </TableCell>
                </TableRow>
              ) : (
                filteredPendingTransactions.map((tx) => (
                  <TableRow key={tx.id} className="border-[#27272a]">
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
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm transition-all"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateTransactionStatus(tx.id, 'failed')}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm transition-all"
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
