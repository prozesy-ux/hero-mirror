import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { Heart, Trash2, ShoppingCart, Package, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface WishlistItem {
  id: string;
  product_id: string;
  product_type: string;
  created_at: string;
  product?: {
    id: string;
    slug?: string;
    name: string;
    price: number;
    icon_url: string | null;
    is_available: boolean;
    seller?: {
      store_name: string;
      store_slug: string;
    };
  };
}

const BuyerWishlist = () => {
  const { formatAmountOnly } = useCurrency();
  const { user } = useAuthContext();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchWishlist();
  }, [user]);

  const fetchWishlist = async () => {
    // Fetch wishlist items
    const { data: wishlistData, error } = await supabase
      .from('buyer_wishlist')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching wishlist:', error);
      setLoading(false);
      return;
    }

    // Fetch product details for each item
    const items: WishlistItem[] = [];
    for (const item of wishlistData || []) {
      if (item.product_type === 'seller') {
        const { data: product } = await supabase
          .from('seller_products')
          .select('id, slug, name, price, icon_url, is_available, seller:seller_profiles(store_name, store_slug)')
          .eq('id', item.product_id)
          .maybeSingle();

        items.push({
          ...item,
          product: product ? {
            ...product,
            seller: product.seller as any
          } : undefined
        });
      }
    }

    setWishlist(items);
    setLoading(false);
  };

  const removeFromWishlist = async (id: string) => {
    setRemoving(id);
    const { error } = await supabase
      .from('buyer_wishlist')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to remove from wishlist');
    } else {
      setWishlist(prev => prev.filter(item => item.id !== id));
      toast.success('Removed from wishlist');
    }
    setRemoving(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wishlist Items */}
      {wishlist.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-100">
          <Heart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Your wishlist is empty</h3>
          <p className="text-slate-500 mb-6">Save products you're interested in to buy later</p>
          <Link to="/dashboard/ai-accounts">
            <Button className="bg-violet-600 hover:bg-violet-700">
              Browse Products
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlist.map((item) => (
            <div 
              key={item.id} 
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow"
            >
              {/* Product Image */}
              <div className="relative aspect-[4/3] bg-slate-100">
                {item.product?.icon_url ? (
                  <img 
                    src={item.product.icon_url} 
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-slate-300" />
                  </div>
                )}
                
                {/* Remove Button */}
                <button
                  onClick={() => removeFromWishlist(item.id)}
                  disabled={removing === item.id}
                  className="absolute top-3 right-3 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                >
                  {removing === item.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  ) : (
                    <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                  )}
                </button>

                {/* Availability Badge */}
                {item.product && !item.product.is_available && (
                  <div className="absolute bottom-0 left-0 right-0 bg-slate-900/80 text-white text-center py-2 text-sm">
                    Currently Unavailable
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="font-semibold text-slate-800 mb-1 truncate">
                  {item.product?.name || 'Product Unavailable'}
                </h3>
                
                {item.product?.seller && (
                  <p className="text-xs text-slate-500 mb-3">
                    by {item.product.seller.store_name}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-emerald-600">
                    {formatAmountOnly(item.product?.price || 0)}
                  </span>

                  <div className="flex gap-2">
                    {item.product?.seller?.store_slug && (
                      <Link 
                        to={`/store/${item.product.seller.store_slug}/product/${item.product.slug || item.product.id}`}
                        className="inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BuyerWishlist;
