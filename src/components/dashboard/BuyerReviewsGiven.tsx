import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Star, Edit2, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface Review {
  id: string;
  product_id: string;
  rating: number;
  title: string | null;
  content: string | null;
  created_at: string;
  product?: { name: string; icon_url: string | null };
}

const BuyerReviewsGiven = () => {
  const { user } = useAuthContext();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('product_reviews')
        .select('id, product_id, rating, title, content, created_at, product:seller_products(name, icon_url)')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setReviews(data as any);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">My Reviews ({reviews.length})</h2>
      <div className="bg-white border rounded-lg divide-y">
        {reviews.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Star className="h-10 w-10 mx-auto mb-2 text-slate-200" />
            <p>You haven't written any reviews yet</p>
          </div>
        ) : reviews.map(r => (
          <div key={r.id} className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                ))}
              </div>
              <span className="text-xs text-slate-400">{format(new Date(r.created_at), 'MMM d, yyyy')}</span>
            </div>
            <p className="text-sm font-medium text-slate-800">{r.product?.name || 'Product'}</p>
            {r.title && <p className="text-sm text-slate-700 mt-1">{r.title}</p>}
            {r.content && <p className="text-xs text-slate-500 mt-1">{r.content}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BuyerReviewsGiven;
