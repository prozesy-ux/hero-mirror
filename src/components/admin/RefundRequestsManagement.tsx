import { useState, useEffect, useMemo } from 'react';
import { Loader2, RefreshCcw, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminDataContext } from '@/contexts/AdminDataContext';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const RefundRequestsManagement = () => {
  const { refundRequests, profiles, isLoading, refreshTable } = useAdminDataContext();
  const [processing, setProcessing] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    const channel = supabase
      .channel('refund-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'refund_requests' }, () => {
        refreshTable('refund_requests');
        toast.info('New refund request!');
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refreshTable]);

  const enrichedRequests = useMemo(() => {
    const profileMap = new Map(profiles.map((p: any) => [p.user_id, p]));
    return refundRequests.map((req: any) => ({
      ...req,
      user_email: profileMap.get(req.user_id)?.email || 'Unknown',
      user_name: profileMap.get(req.user_id)?.full_name || 'Unknown'
    }));
  }, [refundRequests, profiles]);

  const stats = useMemo(() => {
    const pending = enrichedRequests.filter((r: any) => r.status === 'pending').length;
    const approved = enrichedRequests.filter((r: any) => r.status === 'approved').length;
    const rejected = enrichedRequests.filter((r: any) => r.status === 'rejected').length;
    const totalRefunded = enrichedRequests
      .filter((r: any) => r.status === 'approved')
      .reduce((sum: number, r: any) => sum + r.amount, 0);
    return { total: enrichedRequests.length, pending, approved, rejected, totalRefunded };
  }, [enrichedRequests]);

  const handleProcess = async (requestId: string, action: 'approved' | 'rejected') => {
    setProcessing(requestId);

    const request = enrichedRequests.find((r: any) => r.id === requestId);
    if (!request) return;

    const { error } = await supabase
      .from('refund_requests')
      .update({
        status: action,
        admin_notes: adminNotes[requestId] || null,
        processed_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) {
      toast.error(`Failed to ${action} refund`);
    } else {
      if (action === 'approved' && request.purchase_type === 'pro_plan') {
        await supabase
          .from('profiles')
          .update({ is_pro: false })
          .eq('user_id', request.user_id);
      }

      toast.success(`Refund ${action} successfully`);
      refreshTable('refund_requests');
    }

    setProcessing(null);
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Total Requests</div>
          <div className="text-2xl font-bold text-white">
            {isLoading ? <Skeleton className="h-8 w-12 bg-white/10" /> : stats.total}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Pending</div>
          <div className="text-2xl font-bold text-yellow-400">
            {isLoading ? <Skeleton className="h-8 w-12 bg-white/10" /> : stats.pending}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Approved</div>
          <div className="text-2xl font-bold text-green-400">
            {isLoading ? <Skeleton className="h-8 w-12 bg-white/10" /> : stats.approved}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Rejected</div>
          <div className="text-2xl font-bold text-red-400">
            {isLoading ? <Skeleton className="h-8 w-12 bg-white/10" /> : stats.rejected}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Total Refunded</div>
          <div className="text-2xl font-bold text-purple-400">
            {isLoading ? <Skeleton className="h-8 w-20 bg-white/10" /> : `$${stats.totalRefunded.toFixed(2)}`}
          </div>
        </div>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40 bg-white/10" />
                  <Skeleton className="h-4 w-32 bg-white/10" />
                  <Skeleton className="h-3 w-24 bg-white/10" />
                </div>
                <Skeleton className="h-8 w-20 bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      ) : enrichedRequests.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
          <RefreshCcw className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Refund Requests</h3>
          <p className="text-gray-400">Refund requests will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {enrichedRequests.map((request: any) => (
            <div
              key={request.id}
              className={`bg-white/5 border rounded-xl p-5 ${
                request.status === 'pending' ? 'border-yellow-500/30' : 'border-white/10'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">{request.user_email}</h3>
                    <span className="text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded capitalize">
                      {request.purchase_type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">{request.user_name}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(request.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-lg font-bold text-white">
                      <DollarSign className="w-4 h-4" />
                      {request.amount}
                    </div>
                  </div>
                  {request.status === 'pending' ? (
                    <span className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm">
                      <Clock className="w-4 h-4" />
                      Pending
                    </span>
                  ) : request.status === 'approved' ? (
                    <span className="flex items-center gap-1 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Approved
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm">
                      <XCircle className="w-4 h-4" />
                      Rejected
                    </span>
                  )}
                </div>
              </div>

              {request.reason && (
                <div className="p-3 bg-white/5 rounded-xl mb-4">
                  <p className="text-sm text-gray-300">
                    <span className="text-gray-500">Reason: </span>
                    {request.reason}
                  </p>
                </div>
              )}

              {request.status === 'pending' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={adminNotes[request.id] || ''}
                    onChange={(e) => setAdminNotes(prev => ({ ...prev, [request.id]: e.target.value }))}
                    placeholder="Admin notes (optional)"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleProcess(request.id, 'approved')}
                      disabled={processing === request.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {processing === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Approve Refund
                    </button>
                    <button
                      onClick={() => handleProcess(request.id, 'rejected')}
                      disabled={processing === request.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {processing === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {request.admin_notes && request.status !== 'pending' && (
                <div className="p-3 bg-white/5 rounded-xl mt-3">
                  <p className="text-sm text-gray-400">
                    <span className="text-gray-500">Admin Notes: </span>
                    {request.admin_notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RefundRequestsManagement;
