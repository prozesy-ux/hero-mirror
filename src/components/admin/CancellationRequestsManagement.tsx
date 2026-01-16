import { useState, useEffect } from 'react';
import { Loader2, XCircle, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminData } from '@/hooks/useAdminData';
import { toast } from 'sonner';

interface CancellationRequest {
  id: string;
  user_id: string;
  reason: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
  user_email?: string;
  user_name?: string;
}

interface Profile {
  user_id: string;
  email: string;
  full_name: string | null;
}

const CancellationRequestsManagement = () => {
  const { fetchData } = useAdminData();
  const [requests, setRequests] = useState<CancellationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchRequests();
    subscribeToRequests();
  }, []);

  const fetchRequests = async () => {
    const [requestsRes, profilesRes] = await Promise.all([
      fetchData<CancellationRequest>('cancellation_requests', {
        order: { column: 'created_at', ascending: false }
      }),
      fetchData<Profile>('profiles')
    ]);

    if (!requestsRes.error && requestsRes.data) {
      const profileMap = new Map((profilesRes.data || []).map(p => [p.user_id, p]));

      const enrichedRequests = requestsRes.data.map(req => ({
        ...req,
        user_email: profileMap.get(req.user_id)?.email || 'Unknown',
        user_name: profileMap.get(req.user_id)?.full_name || 'Unknown'
      }));

      setRequests(enrichedRequests as CancellationRequest[]);
    }
    setLoading(false);
  };

  const subscribeToRequests = () => {
    const channel = supabase
      .channel('cancellation-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cancellation_requests'
        },
        () => {
          fetchRequests();
          toast.info('New cancellation request!');
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
      .from('cancellation_requests')
      .update({
        status: action,
        admin_notes: adminNotes[requestId] || null,
        processed_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) {
      toast.error(`Failed to ${action} cancellation`);
    } else {
      if (action === 'approved') {
        await supabase
          .from('profiles')
          .update({ is_pro: false })
          .eq('user_id', request.user_id);
      }

      toast.success(`Cancellation ${action} successfully`);
      fetchRequests();
    }

    setProcessing(null);
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {pendingCount > 0 && (
        <div className="flex items-center justify-end mb-6">
          <span className="flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full">
            <AlertTriangle className="w-4 h-4" />
            {pendingCount} Pending
          </span>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
          <XCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Cancellation Requests</h3>
          <p className="text-gray-400">Plan cancellation requests will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className={`bg-white/5 border rounded-xl p-5 ${
                request.status === 'pending' ? 'border-yellow-500/30' : 'border-white/10'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white">{request.user_email}</h3>
                  <p className="text-gray-400 text-sm">{request.user_name}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(request.created_at).toLocaleString()}
                  </p>
                </div>

                <div>
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
                      Approve Cancellation
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

export default CancellationRequestsManagement;
