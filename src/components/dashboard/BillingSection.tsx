import { useState, useEffect } from 'react';
import { CreditCard, Check, Sparkles, Crown, Zap, XCircle, RefreshCcw, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Purchase {
  id: string;
  amount: number;
  payment_status: string;
  purchased_at: string;
}

interface RefundRequest {
  id: string;
  status: string;
  amount: number;
  created_at: string;
}

interface CancellationRequest {
  id: string;
  status: string;
  created_at: string;
}

const BillingSection = () => {
  const { user, isPro } = useAuthContext();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [cancellationRequest, setCancellationRequest] = useState<CancellationRequest | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
      subscribeToUpdates();
    }
  }, [user]);

  const fetchData = async () => {
    // Fetch purchases
    const { data: purchasesData } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', user?.id)
      .order('purchased_at', { ascending: false });
    
    setPurchases(purchasesData || []);

    // Fetch refund requests
    const { data: refundsData } = await supabase
      .from('refund_requests')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    setRefundRequests(refundsData || []);

    // Fetch cancellation request
    const { data: cancellationData } = await supabase
      .from('cancellation_requests')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    setCancellationRequest(cancellationData);
  };

  const subscribeToUpdates = () => {
    const channel = supabase
      .channel('billing-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'refund_requests', filter: `user_id=eq.${user?.id}` }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cancellation_requests', filter: `user_id=eq.${user?.id}` }, fetchData)
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const handleUpgrade = async () => {
    if (!user) return;
    
    setProcessingPayment(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: user.id,
        amount: 19.00,
        payment_status: 'completed'
      });

    if (purchaseError) {
      toast.error('Failed to process payment');
      setProcessingPayment(false);
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ is_pro: true })
      .eq('user_id', user.id);

    setProcessingPayment(false);

    if (profileError) {
      toast.error('Failed to activate Pro status');
    } else {
      toast.success('🎉 Welcome to Pro! All prompts are now unlocked!');
      fetchData();
      window.location.reload();
    }
  };

  const handleCancelPlan = async () => {
    if (!user) return;
    
    setSubmitting(true);
    
    const { error } = await supabase
      .from('cancellation_requests')
      .insert({
        user_id: user.id,
        reason: cancelReason || null
      });

    setSubmitting(false);
    setShowCancelModal(false);
    setCancelReason('');

    if (error) {
      toast.error('Failed to submit cancellation request');
    } else {
      toast.success('Cancellation request submitted. We\'ll process it shortly.');
      fetchData();
    }
  };

  const handleRefundRequest = async (purchaseId: string, amount: number) => {
    if (!user) return;
    
    setSubmitting(true);
    
    const { error } = await supabase
      .from('refund_requests')
      .insert({
        user_id: user.id,
        purchase_id: purchaseId,
        purchase_type: 'pro_plan',
        amount: amount,
        reason: refundReason || null
      });

    setSubmitting(false);
    setShowRefundModal(null);
    setRefundReason('');

    if (error) {
      toast.error('Failed to submit refund request');
    } else {
      toast.success('Refund request submitted. We\'ll review it within 24-48 hours.');
      fetchData();
    }
  };

  const getRefundStatus = (purchaseId: string) => {
    return refundRequests.find(r => r.id === purchaseId);
  };

  const hasPendingCancellation = cancellationRequest?.status === 'pending';

  const proFeatures = [
    '10,000+ Premium AI Prompts',
    'Unlimited Access Forever',
    'All ChatGPT Mega-Prompts',
    'All Midjourney Prompts',
    'All Claude Prompts',
    'New Prompts Added Monthly',
    'Priority Support',
    'Commercial License'
  ];

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold text-white mb-6">Billing & Subscription</h2>

      {/* Current Plan */}
      <div className="bg-gray-800 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${isPro ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gray-700'}`}>
              {isPro ? <Crown size={24} className="text-white" /> : <CreditCard size={24} className="text-gray-400" />}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">
                {isPro ? 'Pro Plan' : 'Free Plan'}
              </h3>
              <p className="text-gray-400">
                {isPro ? 'Lifetime access to all prompts' : 'Limited access to free prompts only'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isPro && (
              <>
                <span className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-full">
                  Active
                </span>
                {!hasPendingCancellation && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm"
                  >
                    Cancel Plan
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {hasPendingCancellation && (
          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-3">
            <AlertTriangle className="text-yellow-400 shrink-0" size={20} />
            <div>
              <p className="text-yellow-400 font-medium">Cancellation Pending</p>
              <p className="text-gray-400 text-sm">Your cancellation request is being processed.</p>
            </div>
          </div>
        )}
      </div>

      {/* Upgrade Card (if not Pro) */}
      {!isPro && (
        <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl p-8 mb-6 border border-purple-500/30">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-yellow-400" size={24} />
            <h3 className="text-2xl font-bold text-white">Upgrade to Pro</h3>
          </div>

          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-gray-400 line-through text-xl">$499</span>
            <span className="text-5xl font-bold text-white">$19</span>
            <span className="text-gray-400">one-time payment</span>
          </div>

          <div className="grid md:grid-cols-2 gap-3 mb-8">
            {proFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check size={18} className="text-green-400" />
                <span className="text-gray-300">{feature}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleUpgrade}
            disabled={processingPayment}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50"
          >
            {processingPayment ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Processing...
              </>
            ) : (
              <>
                <Zap size={20} />
                Upgrade Now for $19
              </>
            )}
          </button>

          <p className="text-center text-gray-500 text-sm mt-4">
            🔒 Secure payment • 30-day money-back guarantee
          </p>
        </div>
      )}

      {/* Purchase History */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Purchase History</h3>
        
        {purchases.length === 0 ? (
          <p className="text-gray-400">No purchases yet</p>
        ) : (
          <div className="space-y-3">
            {purchases.map((purchase) => {
              const refundStatus = refundRequests.find(r => r.amount === purchase.amount);
              const canRequestRefund = purchase.payment_status === 'completed' && !refundStatus;

              return (
                <div
                  key={purchase.id}
                  className="flex items-center justify-between py-4 border-b border-gray-700 last:border-0 flex-wrap gap-3"
                >
                  <div>
                    <p className="text-white font-medium">Pro Plan - Lifetime Access</p>
                    <p className="text-gray-500 text-sm">
                      {new Date(purchase.purchased_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-white font-medium">${purchase.amount.toFixed(2)}</p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        purchase.payment_status === 'completed'
                          ? 'bg-green-900/50 text-green-400'
                          : 'bg-yellow-900/50 text-yellow-400'
                      }`}>
                        {purchase.payment_status}
                      </span>
                    </div>
                    {refundStatus ? (
                      <span className={`text-xs px-3 py-1.5 rounded-full ${
                        refundStatus.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : refundStatus.status === 'approved'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        Refund {refundStatus.status}
                      </span>
                    ) : canRequestRefund && (
                      <button
                        onClick={() => setShowRefundModal(purchase.id)}
                        className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        <RefreshCcw size={14} />
                        Request Refund
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Plan Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <XCircle className="text-red-400" size={24} />
              <h3 className="text-xl font-semibold text-white">Cancel Pro Plan</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Are you sure you want to cancel your Pro plan? You'll lose access to all premium prompts.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 mb-4"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
              >
                Keep Plan
              </button>
              <button
                onClick={handleCancelPlan}
                disabled={submitting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="animate-spin" size={18} /> : null}
                Cancel Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Request Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <RefreshCcw className="text-purple-400" size={24} />
              <h3 className="text-xl font-semibold text-white">Request Refund</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Please tell us why you'd like a refund. We'll review your request within 24-48 hours.
            </p>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Reason for refund request"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 mb-4"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRefundModal(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const purchase = purchases.find(p => p.id === showRefundModal);
                  if (purchase) handleRefundRequest(purchase.id, purchase.amount);
                }}
                disabled={submitting}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="animate-spin" size={18} /> : null}
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingSection;
