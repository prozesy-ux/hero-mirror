import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, TrendingUp } from 'lucide-react';

interface Purchase {
  id: string;
  user_id: string;
  amount: number;
  payment_status: string;
  purchased_at: string;
  user_email?: string;
  user_name?: string;
}

const PurchasesManagement = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    const { data: purchasesData } = await supabase
      .from('purchases')
      .select('*')
      .order('purchased_at', { ascending: false });

    const { data: profilesData } = await supabase.from('profiles').select('user_id, email, full_name');
    
    const profilesMap = new Map((profilesData || []).map(p => [p.user_id, p]));
    
    const enrichedPurchases = (purchasesData || []).map(p => ({
      ...p,
      user_email: profilesMap.get(p.user_id)?.email || 'Unknown',
      user_name: profilesMap.get(p.user_id)?.full_name || null
    }));
    
    setPurchases(enrichedPurchases);
    
    const revenue = enrichedPurchases
      .filter(p => p.payment_status === 'completed')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    setTotalRevenue(revenue);
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-white animate-spin" />
      </div>
    );
  }

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
              <p className="text-3xl font-bold text-white">${totalRevenue.toFixed(2)}</p>
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
              <p className="text-3xl font-bold text-white">{purchases.length}</p>
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
            {purchases.map((purchase) => (
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
            ))}
          </tbody>
        </table>

        {purchases.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No purchases yet
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchasesManagement;
