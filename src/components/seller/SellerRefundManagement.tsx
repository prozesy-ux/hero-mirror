import { useState, useEffect } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { RotateCcw, Check, X, Loader2, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface RefundRequest {
  id: string;
  order_id: string;
  buyer_id: string;
  seller_id: string;
  reason: string;
  status: string;
  amount: number;
  admin_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  order?: { product?: { name: string } };
}

const SellerRefundManagement = () => {
  const { profile } = useSellerContext();
  const { formatAmountOnly } = useCurrency();
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    const fetchRefunds = async () => {
      const { data } = await supabase
        .from('refund_requests' as any)
        .select('*')
        .eq('seller_id', profile.id)
        .order('created_at', { ascending: false });
      if (data) setRefunds(data as any);
      setLoading(false);
    };
    fetchRefunds();
  }, [profile?.id]);

  const pendingCount = refunds.filter(r => r.status === 'pending').length;
  const totalRefunded = refunds.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.amount, 0);

  if (loading) {
    return (
      <div className="bg-[#F3EAE0] min-h-screen p-8 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const statCards = [
    { title: 'Total Requests', value: refunds.length, icon: RotateCcw, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { title: 'Pending', value: pendingCount, icon: Clock, iconBg: 'bg-amber-100', iconColor: 'text-amber-600', valueColor: 'text-amber-600' },
    { title: 'Total Refunded', value: formatAmountOnly(totalRefunded), icon: AlertCircle, iconBg: 'bg-red-100', iconColor: 'text-red-600', valueColor: 'text-red-600' },
  ];

  return (
    <div className="bg-[#F3EAE0] min-h-screen p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1F2937]">Refund Management</h2>
        <p className="text-sm text-[#6B7280]">Track and manage refund requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full ${card.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                <span className="text-sm text-[#6B7280]">{card.title}</span>
              </div>
              <div className={`text-3xl font-bold ${card.valueColor || 'text-[#1F2937]'}`}>{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Refunds List */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-[#1F2937]">Refund Requests</h3>
        </div>
        {refunds.length === 0 ? (
          <div className="p-12 text-center">
            <RotateCcw className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-400">No refund requests</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {refunds.map(r => (
              <div key={r.id} className="p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  r.status === 'pending' ? 'bg-amber-100' : r.status === 'approved' ? 'bg-emerald-100' : 'bg-red-100'
                }`}>
                  {r.status === 'pending' ? <Clock className="h-5 w-5 text-amber-600" /> :
                   r.status === 'approved' ? <Check className="h-5 w-5 text-emerald-600" /> :
                   <X className="h-5 w-5 text-red-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1F2937] truncate">{(r as any).order?.product?.name || 'Order #' + r.order_id.slice(0, 8)}</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">{r.reason}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{format(new Date(r.created_at), 'MMM d, yyyy')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#1F2937]">{formatAmountOnly(r.amount)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    r.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    r.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerRefundManagement;
