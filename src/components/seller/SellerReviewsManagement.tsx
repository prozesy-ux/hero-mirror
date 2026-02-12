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

      if (!error && data) {
        setReviews(data as any);
      }
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
    
    if (error) {
      toast.error('Failed to submit response');
    } else {
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
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-6 text-center">
          <div className="text-4xl font-bold text-slate-900">{avgRating.toFixed(1)}</div>
          <div className="flex justify-center gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className={`h-4 w-4 ${i <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
            ))}
          </div>
          <p className="text-sm text-slate-500 mt-1">{reviews.length} reviews</p>
        </div>
        <div className="bg-white border rounded-lg p-6 col-span-2">
          <h3 className="text-sm font-medium text-slate-700 mb-3">Rating Distribution</h3>
          {ratingDist.map(d => (
            <div key={d.star} className="flex items-center gap-2 mb-1.5">
              <span className="text-xs text-slate-500 w-8">{d.star}★</span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${d.pct}%` }} />
              </div>
              <span className="text-xs text-slate-500 w-8">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-slate-900">All Reviews ({reviews.length})</h3>
        </div>
        {reviews.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Star className="h-10 w-10 mx-auto mb-2 text-slate-200" />
            <p>No reviews yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {reviews.map(review => (
              <div key={review.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                        ))}
                      </div>
                      {review.is_verified_purchase && (
                        <span className="text-xs bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">Verified</span>
                      )}
                    </div>
                    {review.title && <p className="text-sm font-medium text-slate-800 mt-1">{review.title}</p>}
                    {review.content && <p className="text-sm text-slate-600 mt-1">{review.content}</p>}
                    <p className="text-xs text-slate-400 mt-2">
                      {review.product?.name} · {format(new Date(review.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>

                {/* Seller Response */}
                {review.seller_response ? (
                  <div className="mt-3 ml-4 p-3 bg-slate-50 rounded-lg border-l-2 border-emerald-400">
                    <p className="text-xs font-medium text-emerald-700 mb-1">Your Response</p>
                    <p className="text-sm text-slate-700">{review.seller_response}</p>
                    <p className="text-xs text-slate-400 mt-1">{format(new Date(review.seller_responded_at!), 'MMM d, yyyy')}</p>
                  </div>
                ) : respondingTo === review.id ? (
                  <div className="mt-3 ml-4 space-y-2">
                    <Textarea
                      value={responseText}
                      onChange={e => setResponseText(e.target.value)}
                      placeholder="Write your response..."
                      className="text-sm"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleRespond(review.id)} disabled={submitting} className="bg-emerald-500 hover:bg-emerald-600">
                        {submitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
                        Send
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setRespondingTo(null); setResponseText(''); }}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="ghost" className="mt-2 ml-4 text-slate-500" onClick={() => setRespondingTo(review.id)}>
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
