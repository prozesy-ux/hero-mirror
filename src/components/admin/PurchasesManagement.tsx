import { useAdminDataContext } from '@/contexts/AdminDataContext';
import { DollarSign, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

const PurchasesManagement = () => {
  const { purchases, profiles, isLoading } = useAdminDataContext();

  const enrichedPurchases = useMemo(() => {
    const profilesMap = new Map(profiles.map((p: any) => [p.user_id, p]));
    return purchases.map((p: any) => ({
      ...p,
      user_email: profilesMap.get(p.user_id)?.email || 'Unknown',
      user_name: profilesMap.get(p.user_id)?.full_name || null
    }));
  }, [purchases, profiles]);

  const totalRevenue = useMemo(() => {
    return enrichedPurchases
      .filter((p: any) => p.payment_status === 'completed')
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  }, [enrichedPurchases]);

  return (
    <div>
      {/* Stats */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <DollarSign size={24} className="text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold text-white">
                {isLoading ? <Skeleton className="h-9 w-24 bg-white/10" /> : `$${totalRevenue.toFixed(2)}`}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <TrendingUp size={24} className="text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Purchases</p>
              <p className="text-3xl font-bold text-white">
                {isLoading ? <Skeleton className="h-9 w-16 bg-white/10" /> : purchases.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">User</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Amount</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Status</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-white/5">
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32 bg-white/10" />
                      <Skeleton className="h-3 w-48 bg-white/10" />
                    </div>
                  </td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-16 bg-white/10" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-20 bg-white/10 rounded-full" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-32 bg-white/10" /></td>
                </tr>
              ))
            ) : (
              enrichedPurchases.map((purchase: any) => (
                <tr key={purchase.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium">
                        {purchase.user_name || 'Unknown'}
                      </p>
                      <p className="text-gray-500 text-sm">{purchase.user_email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white font-medium">
                    ${Number(purchase.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      purchase.payment_status === 'completed'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {purchase.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {new Date(purchase.purchased_at).toLocaleDateString()} {new Date(purchase.purchased_at).toLocaleTimeString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!isLoading && purchases.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No purchases yet
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchasesManagement;
