import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminDataContext } from '@/contexts/AdminDataContext';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  AlertTriangle,
  Loader2,
  User,
  Trash2,
  RotateCcw,
  FileX,
  ClipboardList
} from 'lucide-react';

interface RequestBase {
  id: string;
  user_id: string;
  status: string;
  reason?: string | null;
  admin_notes?: string | null;
  created_at?: string;
  requested_at?: string;
  processed_at?: string | null;
  user_email?: string;
  user_name?: string;
}

interface RefundRequest extends RequestBase {
  type: 'refund';
  amount: number;
  purchase_type: string;
}

interface CancellationRequest extends RequestBase {
  type: 'cancellation';
}

interface DeletionRequest extends RequestBase {
  type: 'deletion';
}

type UnifiedRequest = RefundRequest | CancellationRequest | DeletionRequest;

const UserRequestsManagement = () => {
  const { refundRequests, cancellationRequests, deletionRequests, profiles, isLoading, refreshTable } = useAdminDataContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [processing, setProcessing] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<UnifiedRequest | null>(null);

  // Real-time subscriptions
  useEffect(() => {
    const channels = [
      supabase.channel('refund-requests-unified')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'refund_requests' }, () => {
          refreshTable('refund_requests');
          toast.info('Refund request updated');
        }),
      supabase.channel('cancellation-requests-unified')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cancellation_requests' }, () => {
          refreshTable('cancellation_requests');
          toast.info('Cancellation request updated');
        }),
      supabase.channel('deletion-requests-unified')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'account_deletion_requests' }, () => {
          refreshTable('account_deletion_requests');
          toast.info('Deletion request updated');
        })
    ];

    channels.forEach(ch => ch.subscribe());

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [refreshTable]);

  // Enrich and unify all requests
  const unifiedRequests = useMemo(() => {
    const profileMap = new Map(profiles.map((p: any) => [p.user_id, p]));

    const enrichedRefunds: RefundRequest[] = refundRequests.map((req: any) => ({
      ...req,
      type: 'refund' as const,
      user_email: profileMap.get(req.user_id)?.email || 'Unknown',
      user_name: profileMap.get(req.user_id)?.full_name || 'Unknown'
    }));

    const enrichedCancellations: CancellationRequest[] = cancellationRequests.map((req: any) => ({
      ...req,
      type: 'cancellation' as const,
      user_email: profileMap.get(req.user_id)?.email || 'Unknown',
      user_name: profileMap.get(req.user_id)?.full_name || 'Unknown'
    }));

    const enrichedDeletions: DeletionRequest[] = deletionRequests.map((req: any) => ({
      ...req,
      type: 'deletion' as const,
      created_at: req.requested_at,
      user_email: profileMap.get(req.user_id)?.email || 'Unknown',
      user_name: profileMap.get(req.user_id)?.full_name || 'Unknown'
    }));

    return [...enrichedRefunds, ...enrichedCancellations, ...enrichedDeletions].sort(
      (a, b) => new Date(b.created_at || b.requested_at || '').getTime() - new Date(a.created_at || a.requested_at || '').getTime()
    );
  }, [refundRequests, cancellationRequests, deletionRequests, profiles]);

  // Stats
  const stats = useMemo(() => {
    const pending = unifiedRequests.filter(r => r.status === 'pending').length;
    const approved = unifiedRequests.filter(r => r.status === 'approved').length;
    const rejected = unifiedRequests.filter(r => r.status === 'rejected').length;
    const totalRefunded = unifiedRequests
      .filter((r): r is RefundRequest => r.type === 'refund' && r.status === 'approved')
      .reduce((sum, r) => sum + r.amount, 0);
    return { total: unifiedRequests.length, pending, approved, rejected, totalRefunded };
  }, [unifiedRequests]);

  // Tab counts
  const tabCounts = useMemo(() => ({
    refunds: unifiedRequests.filter(r => r.type === 'refund').length,
    refundsPending: unifiedRequests.filter(r => r.type === 'refund' && r.status === 'pending').length,
    cancellations: unifiedRequests.filter(r => r.type === 'cancellation').length,
    cancellationsPending: unifiedRequests.filter(r => r.type === 'cancellation' && r.status === 'pending').length,
    deletions: unifiedRequests.filter(r => r.type === 'deletion').length,
    deletionsPending: unifiedRequests.filter(r => r.type === 'deletion' && r.status === 'pending').length,
  }), [unifiedRequests]);

  // Filter requests
  const filteredRequests = useMemo(() => {
    let filtered = unifiedRequests;

    if (activeTab !== 'all') {
      if (activeTab === 'refunds') filtered = filtered.filter(r => r.type === 'refund');
      else if (activeTab === 'cancellations') filtered = filtered.filter(r => r.type === 'cancellation');
      else if (activeTab === 'deletions') filtered = filtered.filter(r => r.type === 'deletion');
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.user_email?.toLowerCase().includes(query) ||
        r.user_name?.toLowerCase().includes(query) ||
        r.reason?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [unifiedRequests, activeTab, searchQuery]);

  const handleRefreshAll = () => {
    refreshTable('refund_requests');
    refreshTable('cancellation_requests');
    refreshTable('account_deletion_requests');
    toast.success('Refreshed all requests');
  };

  const handleProcess = async (request: UnifiedRequest, action: 'approved' | 'rejected') => {
    setProcessing(request.id);

    let tableName = '';
    if (request.type === 'refund') tableName = 'refund_requests';
    else if (request.type === 'cancellation') tableName = 'cancellation_requests';
    else if (request.type === 'deletion') tableName = 'account_deletion_requests';

    const { error } = await supabase
      .from(tableName as any)
      .update({
        status: action,
        admin_notes: adminNotes[request.id] || null,
        processed_at: new Date().toISOString()
      })
      .eq('id', request.id);

    if (error) {
      toast.error(`Failed to ${action} request`);
    } else {
      // Handle post-approval actions
      if (action === 'approved') {
        if (request.type === 'refund' && (request as RefundRequest).purchase_type === 'pro_plan') {
          await supabase.from('profiles').update({ is_pro: false }).eq('user_id', request.user_id);
        } else if (request.type === 'cancellation') {
          await supabase.from('profiles').update({ is_pro: false }).eq('user_id', request.user_id);
        }
      }

      toast.success(`Request ${action} successfully`);
      refreshTable(tableName === 'account_deletion_requests' ? 'account_deletion_requests' : tableName as any);
    }

    setProcessing(null);
    setShowApproveDialog(false);
    setShowRejectDialog(false);
    setSelectedRequest(null);
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'refund':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium">
            <DollarSign className="w-3 h-3" />
            Refund
          </span>
        );
      case 'cancellation':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium">
            <RotateCcw className="w-3 h-3" />
            Cancellation
          </span>
        );
      case 'deletion':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium">
            <Trash2 className="w-3 h-3" />
            Deletion
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return <span className="text-slate-400 text-xs">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Total Requests</p>
              <p className="text-3xl font-bold text-white mt-1">
                {isLoading ? <Skeleton className="h-9 w-16 bg-white/10" /> : stats.total}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
              <ClipboardList className="h-7 w-7 text-emerald-400" />
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
              <AlertTriangle className="h-7 w-7 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-violet-500/20 to-violet-600/10 border border-violet-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Approved</p>
              <p className="text-3xl font-bold text-white mt-1">
                {isLoading ? <Skeleton className="h-9 w-16 bg-white/10" /> : stats.approved}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-violet-500/20 flex items-center justify-center">
              <CheckCircle className="h-7 w-7 text-violet-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-500/20 to-rose-600/10 border border-rose-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Total Refunded</p>
              <p className="text-3xl font-bold text-white mt-1">
                {isLoading ? <Skeleton className="h-9 w-20 bg-white/10" /> : `$${stats.totalRefunded.toFixed(2)}`}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 flex items-center justify-center">
              <DollarSign className="h-7 w-7 text-rose-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Refresh */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by email, name, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500 focus:border-violet-500 rounded-xl h-11"
          />
        </div>
        <Button
          onClick={handleRefreshAll}
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
            <ClipboardList className="h-4 w-4 mr-2" />
            All
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-slate-700 rounded-md">{stats.total}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="refunds" 
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-400 rounded-lg px-4 py-2"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Refunds
            {tabCounts.refundsPending > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-500 text-white rounded-md">{tabCounts.refundsPending}</span>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="cancellations" 
            className="data-[state=active]:bg-amber-600 data-[state=active]:text-white text-slate-400 rounded-lg px-4 py-2"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Cancellations
            {tabCounts.cancellationsPending > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-500 text-white rounded-md">{tabCounts.cancellationsPending}</span>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="deletions" 
            className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-slate-400 rounded-lg px-4 py-2"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Deletions
            {tabCounts.deletionsPending > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-500 text-white rounded-md">{tabCounts.deletionsPending}</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-40 bg-slate-700" />
                      <Skeleton className="h-4 w-32 bg-slate-700" />
                      <Skeleton className="h-3 w-24 bg-slate-700" />
                    </div>
                    <Skeleton className="h-8 w-20 bg-slate-700" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
              <FileX className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Requests Found</h3>
              <p className="text-slate-400">
                {searchQuery ? 'Try adjusting your search query' : 'User requests will appear here'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <div
                  key={`${request.type}-${request.id}`}
                  className={`bg-slate-900/50 border rounded-2xl p-5 transition-all ${
                    request.status === 'pending' 
                      ? 'border-amber-500/30 hover:border-amber-500/50' 
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {getTypeBadge(request.type)}
                        {getStatusBadge(request.status)}
                        {request.type === 'refund' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-700/50 text-slate-300 text-xs font-medium">
                            <DollarSign className="w-3 h-3" />
                            ${(request as RefundRequest).amount}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                          <User className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{request.user_email}</p>
                          <p className="text-slate-500 text-xs">{request.user_name}</p>
                        </div>
                      </div>

                      {request.reason && (
                        <div className="p-3 bg-slate-800/50 rounded-xl mb-3">
                          <p className="text-sm text-slate-300">
                            <span className="text-slate-500">Reason: </span>
                            {request.reason}
                          </p>
                        </div>
                      )}

                      <p className="text-slate-500 text-xs">
                        {new Date(request.created_at || request.requested_at || '').toLocaleString()}
                      </p>
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex flex-col gap-3 lg:min-w-[280px]">
                        <Input
                          type="text"
                          value={adminNotes[request.id] || ''}
                          onChange={(e) => setAdminNotes(prev => ({ ...prev, [request.id]: e.target.value }))}
                          placeholder="Admin notes (optional)"
                          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500 rounded-xl text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowApproveDialog(true);
                            }}
                            disabled={processing === request.id}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                          >
                            {processing === request.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowRejectDialog(true);
                            }}
                            disabled={processing === request.id}
                            variant="outline"
                            className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-xl"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {request.admin_notes && request.status !== 'pending' && (
                    <div className="p-3 bg-slate-800/50 rounded-xl mt-4">
                      <p className="text-sm text-slate-400">
                        <span className="text-slate-500">Admin Notes: </span>
                        {request.admin_notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-emerald-400">
              Approve {selectedRequest?.type} request?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will approve the request for{' '}
              <span className="text-white font-medium">{selectedRequest?.user_email}</span>.
              {selectedRequest?.type === 'refund' && (
                <> A refund of ${(selectedRequest as RefundRequest).amount} will be processed.</>
              )}
              {selectedRequest?.type === 'cancellation' && (
                <> The user's pro subscription will be cancelled.</>
              )}
              {selectedRequest?.type === 'deletion' && (
                <> The user's account will be marked for deletion.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 text-slate-300 hover:bg-slate-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedRequest && handleProcess(selectedRequest, 'approved')}
              disabled={processing === selectedRequest?.id}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {processing === selectedRequest?.id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Approve'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">
              Reject {selectedRequest?.type} request?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will reject the request for{' '}
              <span className="text-white font-medium">{selectedRequest?.user_email}</span>.
              The user will be notified of this decision.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 text-slate-300 hover:bg-slate-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedRequest && handleProcess(selectedRequest, 'rejected')}
              disabled={processing === selectedRequest?.id}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {processing === selectedRequest?.id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Reject'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserRequestsManagement;
