import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { RotateCcw, Clock, Check, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface RefundRequest {
  id: string;
  order_id: string;
  reason: string;
  status: string;
  amount: number;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
};

const BuyerRefundRequests = () => {
  const { user } = useAuthContext();
  const { formatAmountOnly } = useCurrency();
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('refund_requests' as any)
        .select('*')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setRefunds(data as any);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Refund Requests ({refunds.length})</h2>
      <div className="bg-white border rounded-lg divide-y">
        {refunds.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <RotateCcw className="h-10 w-10 mx-auto mb-2 text-slate-200" />
            <p>No refund requests</p>
          </div>
        ) : refunds.map(r => (
          <div key={r.id} className="p-4 flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
              {r.status === 'pending' ? <Clock className="h-4 w-4 text-amber-500" /> :
               r.status === 'approved' ? <Check className="h-4 w-4 text-emerald-500" /> :
               <X className="h-4 w-4 text-red-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-800">Order #{r.order_id.slice(0, 8)}</p>
              <p className="text-xs text-slate-500 mt-0.5">{r.reason}</p>
              <p className="text-xs text-slate-400 mt-0.5">{format(new Date(r.created_at), 'MMM d, yyyy')}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">{formatAmountOnly(r.amount)}</p>
              <span className={`text-xs px-2 py-0.5 rounded ${statusColors[r.status] || 'bg-slate-50 text-slate-600'}`}>{r.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BuyerRefundRequests;
