import { useState, useEffect } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { Star, MessageSquare, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Review {
  id: string;
  buyer_id: string;
  product_id: string;
  rating: number;
  title: string | null;
  content: string | null;
  seller_response: string | null;
  seller_responded_at: string | null;
  is_verified_purchase: boolean | null;
  helpful_count: number | null;
  created_at: string;
  product?: { name: string; icon_url: string | null };
}

const SellerReviewsManagement = () => {
  const { products } = useSellerContext();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      const productIds = products.map(p => p.id);
      if (productIds.length === 0) { setLoading(false); return; }
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*, product:seller_products(name, icon_url)')
        .in('product_id', productIds)
        .order('created_at', { ascending: false });
      if (!error && data) setReviews(data as any);
      setLoading(false);
    };
    fetchReviews();
  }, [products]);

  const handleRespond = async (reviewId: string) => {
    if (!responseText.trim()) return;
    setSubmitting(true);
    const { error } = await supabase
      .from('product_reviews')
      .update({ seller_response: responseText.trim(), seller_responded_at: new Date().toISOString() })
      .eq('id', reviewId);
    if (error) { toast.error('Failed to submit response'); }
    else {
      toast.success('Response submitted!');
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, seller_response: responseText.trim(), seller_responded_at: new Date().toISOString() } : r));
      setRespondingTo(null);
      setResponseText('');
    }
    setSubmitting(false);
  };

  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length > 0 ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0,
  }));

  if (loading) {
    return (
      <div className="bg-[#f1f5f9] min-h-screen p-8 space-y-4" style={{ fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="bg-[#f1f5f9] min-h-screen p-8 space-y-6" style={{ fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div>
        <h2 className="text-2xl font-bold text-[#1F2937]">Reviews</h2>
        <p className="text-sm text-[#6B7280]">Manage customer reviews and respond</p>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
            <Star className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-3xl font-bold text-[#1F2937]">{avgRating.toFixed(1)}</div>
          <div className="flex justify-center gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className={`h-4 w-4 ${i <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
            ))}
          </div>
          <p className="text-sm text-[#6B7280] mt-1">{reviews.length} reviews</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6 col-span-2">
          <h3 className="text-sm font-semibold text-[#1F2937] mb-3">Rating Distribution</h3>
          {ratingDist.map(d => (
            <div key={d.star} className="flex items-center gap-2 mb-1.5">
              <span className="text-xs text-[#6B7280] w-8">{d.star}★</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${d.pct}%` }} />
              </div>
              <span className="text-xs text-[#6B7280] w-8">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-[#1F2937]">All Reviews ({reviews.length})</h3>
        </div>
        {reviews.length === 0 ? (
          <div className="p-12 text-center">
            <Star className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-400">No reviews yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reviews.map(review => (
              <div key={review.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                        ))}
                      </div>
                      {review.is_verified_purchase && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Verified</span>
                      )}
                    </div>
                    {review.title && <p className="text-sm font-medium text-[#1F2937] mt-1">{review.title}</p>}
                    {review.content && <p className="text-sm text-[#6B7280] mt-1">{review.content}</p>}
                    <p className="text-xs text-gray-400 mt-2">
                      {review.product?.name} · {format(new Date(review.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>

                {review.seller_response ? (
                  <div className="mt-3 ml-4 p-3 bg-gray-50 rounded-xl border-l-2 border-[#FF7F00]">
                    <p className="text-xs font-medium text-[#FF7F00] mb-1">Your Response</p>
                    <p className="text-sm text-[#6B7280]">{review.seller_response}</p>
                    <p className="text-xs text-gray-400 mt-1">{format(new Date(review.seller_responded_at!), 'MMM d, yyyy')}</p>
                  </div>
                ) : respondingTo === review.id ? (
                  <div className="mt-3 ml-4 space-y-2">
                    <Textarea value={responseText} onChange={e => setResponseText(e.target.value)} placeholder="Write your response..." className="text-sm rounded-xl border-gray-200" rows={3} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleRespond(review.id)} disabled={submitting} className="bg-[#FF7F00] hover:bg-[#e67200] text-white rounded-xl">
                        {submitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
                        Send
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setRespondingTo(null); setResponseText(''); }} className="rounded-xl border-gray-200">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="ghost" className="mt-2 ml-4 text-[#6B7280]" onClick={() => setRespondingTo(review.id)}>
                    <MessageSquare className="h-3 w-3 mr-1" /> Reply
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerReviewsManagement;
