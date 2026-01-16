import { useState, useEffect } from 'react';
import { Loader2, RefreshCcw, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RefundRequest {
  id: string;
  user_id: string;
  purchase_id: string | null;
  purchase_type: string;
  amount: number;
  reason: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
  user_email?: string;
  user_name?: string;
}

const RefundRequestsManagement = () => {
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalRefunded: 0
  });

  useEffect(() => {
    fetchRequests();
    subscribeToRequests();
  }, []);

  const fetchRequests = async () => {
    const { data: requestsData, error } = await supabase
      .from('refund_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && requestsData) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email, full_name');

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const enrichedRequests = requestsData.map(req => ({
        ...req,
        user_email: profileMap.get(req.user_id)?.email || 'Unknown',
        user_name: profileMap.get(req.user_id)?.full_name || 'Unknown'
      }));

      setRequests(enrichedRequests as RefundRequest[]);

      const pending = enrichedRequests.filter(r => r.status === 'pending').length;
      const approved = enrichedRequests.filter(r => r.status === 'approved').length;
      const rejected = enrichedRequests.filter(r => r.status === 'rejected').length;
      const totalRefunded = enrichedRequests
        .filter(r => r.status === 'approved')
        .reduce((sum, r) => sum + r.amount, 0);

      setStats({
        total: enrichedRequests.length,
        pending,
        approved,
        rejected,
        totalRefunded
      });
    }
    setLoading(false);
  };

  const subscribeToRequests = () => {
    const channel = supabase
      .channel('refund-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'refund_requests'
        },
        () => {
          fetchRequests();
          toast.info('New refund request!');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleProcess = async (requestId: string, action: 'approved' | 'rejected') => {
    setProcessing(requestId);

    const request = requests.find(r => r.id === requestId);
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
      fetchRequests();
    }

    setProcessing(null);
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-[#09090b] border border-[#1a1a1a] rounded-xl p-4 hover:bg-[#0f0f11] transition-all">
          <div className="text-zinc-500 text-sm font-medium">Total Requests</div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-[#09090b] border border-[#1a1a1a] rounded-xl p-4 hover:bg-[#0f0f11] transition-all">
          <div className="text-zinc-500 text-sm font-medium">Pending</div>
          <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
        </div>
        <div className="bg-[#09090b] border border-[#1a1a1a] rounded-xl p-4 hover:bg-[#0f0f11] transition-all">
          <div className="text-zinc-500 text-sm font-medium">Approved</div>
          <div className="text-2xl font-bold text-green-400">{stats.approved}</div>
        </div>
        <div className="bg-[#09090b] border border-[#1a1a1a] rounded-xl p-4 hover:bg-[#0f0f11] transition-all">
          <div className="text-zinc-500 text-sm font-medium">Rejected</div>
          <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
        </div>
        <div className="bg-[#09090b] border border-[#1a1a1a] rounded-xl p-4 hover:bg-[#0f0f11] transition-all">
          <div className="text-zinc-500 text-sm font-medium">Total Refunded</div>
          <div className="text-2xl font-bold text-purple-400">${stats.totalRefunded.toFixed(2)}</div>
        </div>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="bg-[#09090b] border border-[#1a1a1a] rounded-xl p-12 text-center">
          <RefreshCcw className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Refund Requests</h3>
          <p className="text-zinc-500">Refund requests will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className={`bg-[#09090b] border rounded-xl p-5 ${
                request.status === 'pending' ? 'border-yellow-500/20' : 'border-[#1a1a1a]'
              } hover:bg-[#0f0f11] transition-all`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">{request.user_email}</h3>
                    <span className="text-xs bg-white/5 text-zinc-400 px-2 py-0.5 rounded capitalize">
                      {request.purchase_type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-zinc-500 text-sm">{request.user_name}</p>
                  <p className="text-zinc-600 text-xs mt-1">
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
                    <span className="flex items-center gap-1 bg-yellow-500/10 text-yellow-400 px-3 py-1 rounded-full text-sm">
                      <Clock className="w-4 h-4" />
                      Pending
                    </span>
                  ) : request.status === 'approved' ? (
                    <span className="flex items-center gap-1 bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Approved
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-sm">
                      <XCircle className="w-4 h-4" />
                      Rejected
                    </span>
                  )}
                </div>
              </div>

              {request.reason && (
                <div className="p-3 bg-[#0d0d0f] border border-[#1a1a1a] rounded-xl mb-4">
                  <p className="text-sm text-zinc-400">
                    <span className="text-zinc-600">Reason: </span>
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
                    className="w-full bg-[#050506] border border-[#1a1a1a] rounded-xl px-4 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-[#252528]"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleProcess(request.id, 'approved')}
                      disabled={processing === request.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 py-2 rounded-xl transition-all disabled:opacity-50"
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
                      className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-xl transition-all disabled:opacity-50"
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
                <div className="p-3 bg-[#0d0d0f] border border-[#1a1a1a] rounded-xl mt-3">
                  <p className="text-sm text-zinc-500">
                    <span className="text-zinc-600">Admin Notes: </span>
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