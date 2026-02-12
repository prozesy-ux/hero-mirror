import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Clock, ShoppingBag, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface ViewedProduct {
  id: string;
  product_id: string;
  viewed_at: string;
  product?: { name: string; price: number; icon_url: string | null; seller_id: string };
}

const BuyerRecentlyViewed = () => {
  const { user } = useAuthContext();
  const [products, setProducts] = useState<ViewedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('recently_viewed')
        .select('id, product_id, viewed_at, product:seller_products(name, price, icon_url, seller_id)')
        .eq('user_id', user.id)
        .order('viewed_at', { ascending: false })
        .limit(50);
      if (data) setProducts(data as any);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Recently Viewed ({products.length})</h2>
      <div className="bg-white border rounded-lg divide-y">
        {products.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Clock className="h-10 w-10 mx-auto mb-2 text-slate-200" />
            <p>You haven't viewed any products yet</p>
          </div>
        ) : products.map(item => (
          <Link
            key={item.id}
            to={`/dashboard/marketplace`}
            className="p-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-start gap-3">
              {item.product?.icon_url ? (
                <img src={item.product.icon_url} alt={item.product.name} className="h-12 w-12 rounded object-cover" />
              ) : (
                <div className="h-12 w-12 rounded bg-slate-100 flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-slate-300" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">{item.product?.name || 'Product'}</p>
                <p className="text-xs text-slate-400 mt-1">Viewed {format(new Date(item.viewed_at), 'MMM d, yyyy h:mm a')}</p>
              </div>
              {item.product?.price && <div className="text-sm font-semibold text-slate-900">${item.product.price}</div>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BuyerRecentlyViewed;
