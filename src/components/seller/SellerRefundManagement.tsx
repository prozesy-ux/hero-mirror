import { useState, useEffect } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { RotateCcw, Check, X, Loader2, Clock } from 'lucide-react';
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

const statusColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
};

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
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-6">
          <p className="text-sm text-slate-500">Total Requests</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{refunds.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-6">
          <p className="text-sm text-slate-500">Pending</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white border rounded-lg p-6">
          <p className="text-sm text-slate-500">Total Refunded</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{formatAmountOnly(totalRefunded)}</p>
        </div>
      </div>

      {/* Refunds List */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-slate-900">Refund Requests</h3>
        </div>
        {refunds.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <RotateCcw className="h-10 w-10 mx-auto mb-2 text-slate-200" />
            <p>No refund requests</p>
          </div>
        ) : (
          <div className="divide-y">
            {refunds.map(r => (
              <div key={r.id} className="p-4 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  {r.status === 'pending' ? <Clock className="h-4 w-4 text-amber-500" /> :
                   r.status === 'approved' ? <Check className="h-4 w-4 text-emerald-500" /> :
                   <X className="h-4 w-4 text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{(r as any).order?.product?.name || 'Order #' + r.order_id.slice(0, 8)}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{r.reason}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{format(new Date(r.created_at), 'MMM d, yyyy')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800">{formatAmountOnly(r.amount)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded ${statusColors[r.status] || 'bg-slate-50 text-slate-600'}`}>
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
