import { useState, useMemo } from 'react';
import { useAdminDataContext } from '@/contexts/AdminDataContext';
import { DollarSign, TrendingUp, Search, RefreshCw, CheckCircle, Clock, ShoppingBag } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const PurchasesManagement = () => {
  const { purchases, profiles, isLoading, refreshTable } = useAdminDataContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const enrichedPurchases = useMemo(() => {
    const profilesMap = new Map(profiles.map((p: any) => [p.user_id, p]));
    return purchases.map((p: any) => ({
      ...p,
      user_email: profilesMap.get(p.user_id)?.email || 'Unknown',
      user_name: profilesMap.get(p.user_id)?.full_name || null
    }));
  }, [purchases, profiles]);

  const stats = useMemo(() => {
    const completed = enrichedPurchases.filter((p: any) => p.payment_status === 'completed');
    const pending = enrichedPurchases.filter((p: any) => p.payment_status === 'pending');
    const totalRevenue = completed.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    return { 
      total: enrichedPurchases.length, 
      completed: completed.length, 
      pending: pending.length, 
      totalRevenue 
    };
  }, [enrichedPurchases]);

  const filteredPurchases = useMemo(() => {
    let filtered = enrichedPurchases;

    if (activeTab === 'completed') {
      filtered = filtered.filter((p: any) => p.payment_status === 'completed');
    } else if (activeTab === 'pending') {
      filtered = filtered.filter((p: any) => p.payment_status === 'pending');
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p: any) =>
        p.user_email?.toLowerCase().includes(query) ||
        p.user_name?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [enrichedPurchases, activeTab, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Total Revenue</p>
              <p className="text-3xl font-bold text-white mt-1">
                {isLoading ? <Skeleton className="h-9 w-24 bg-white/10" /> : `$${stats.totalRevenue.toFixed(2)}`}
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
              <p className="text-sm text-slate-400 font-medium">Total Purchases</p>
              <p className="text-3xl font-bold text-white mt-1">
                {isLoading ? <Skeleton className="h-9 w-16 bg-white/10" /> : stats.total}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-violet-500/20 flex items-center justify-center">
              <ShoppingBag className="h-7 w-7 text-violet-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Completed</p>
              <p className="text-3xl font-bold text-white mt-1">
                {isLoading ? <Skeleton className="h-9 w-16 bg-white/10" /> : stats.completed}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center">
              <CheckCircle className="h-7 w-7 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Pending</p>
              <p className="text-3xl font-bold text-white mt-1">
                {isLoading ? <Skeleton className="h-9 w-16 bg-white/10" /> : stats.pending}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center">
              <Clock className="h-7 w-7 text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Refresh */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500 focus:border-violet-500 rounded-xl h-11"
          />
        </div>
        <Button
          onClick={() => refreshTable('purchases')}
          variant="outline"
          disabled={isLoading}
          className="bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl h-11"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-800 p-1.5 rounded-xl w-full sm:w-auto">
          <TabsTrigger 
            value="all" 
            className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 rounded-lg px-4 py-2"
          >
            All
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-slate-700 rounded-md">{stats.total}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="completed" 
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-400 rounded-lg px-4 py-2"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Completed
          </TabsTrigger>
          <TabsTrigger 
            value="pending" 
            className="data-[state=active]:bg-amber-600 data-[state=active]:text-white text-slate-400 rounded-lg px-4 py-2"
          >
            <Clock className="h-4 w-4 mr-2" />
            Pending
            {stats.pending > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-500 text-white rounded-md">{stats.pending}</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {/* Purchases Table */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">User</th>
                  <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">Amount</th>
                  <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">Status</th>
                  <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-slate-800">
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32 bg-slate-700" />
                          <Skeleton className="h-3 w-48 bg-slate-700" />
                        </div>
                      </td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-16 bg-slate-700" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-20 bg-slate-700 rounded-full" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-32 bg-slate-700" /></td>
                    </tr>
                  ))
                ) : filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-slate-400">
                      No purchases found
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((purchase: any) => (
                    <tr key={purchase.id} className="border-t border-slate-800 hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium">
                            {purchase.user_name || 'Unknown'}
                          </p>
                          <p className="text-slate-500 text-sm">{purchase.user_email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white font-medium">
                        ${Number(purchase.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full ${
                          purchase.payment_status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {purchase.payment_status === 'completed' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {purchase.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(purchase.purchased_at).toLocaleDateString()} {new Date(purchase.purchased_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PurchasesManagement;
