import { useState, useEffect } from 'react';
import { Star, ChevronRight, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { trackProductClick } from '@/lib/analytics-tracker';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/optimized-image';
import ProductHoverCard from '@/components/marketplace/ProductHoverCard';

interface TopRatedProduct {
  id: string;
  name: string;
  slug: string | null;
  price: number;
  icon_url: string | null;
  avg_rating: number;
  review_count: number;
  seller_name?: string;
  store_slug?: string;
}

interface TopRatedSectionProps {
  onProductClick: (product: TopRatedProduct) => void;
  onBuy?: (product: TopRatedProduct) => void;
  onChat?: (product: TopRatedProduct) => void;
  isAuthenticated?: boolean;
  className?: string;
}

export function TopRatedSection({ onProductClick, onBuy, onChat, isAuthenticated = false, className }: TopRatedSectionProps) {
  const [products, setProducts] = useState<TopRatedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopRatedProducts();
  }, []);

  const fetchTopRatedProducts = async () => {
    try {
      // Get products with highest average ratings (min 2 reviews)
      const { data: reviewData } = await supabase
        .from('product_reviews')
        .select('product_id, rating')
        .order('created_at', { ascending: false });

      // Calculate average ratings per product
      const productRatings: Record<string, { total: number; count: number }> = {};
      
      reviewData?.forEach((review: any) => {
        if (!productRatings[review.product_id]) {
          productRatings[review.product_id] = { total: 0, count: 0 };
        }
        productRatings[review.product_id].total += review.rating;
        productRatings[review.product_id].count++;
      });

      // Filter products with at least 2 reviews and calculate average
      const topRatedIds = Object.entries(productRatings)
        .filter(([_, data]) => data.count >= 2)
        .map(([id, data]) => ({
          id,
          avg: data.total / data.count,
          count: data.count,
        }))
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 10);

      if (topRatedIds.length === 0) {
        // Fall back to featured products if no ratings
        const { data: featured } = await supabase
          .from('seller_products')
          .select('id, name, slug, price, icon_url, seller_profiles(store_name, store_slug)')
          .eq('is_available', true)
          .eq('is_approved', true)
          .order('created_at', { ascending: false })
          .limit(10);

        setProducts(
          (featured || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            icon_url: p.icon_url,
            avg_rating: 4.5,
            review_count: 0,
            seller_name: p.seller_profiles?.store_name,
            store_slug: p.seller_profiles?.store_slug,
          }))
        );
        setLoading(false);
        return;
      }

      // Fetch product details for top rated
      const { data: productData } = await supabase
        .from('seller_products')
        .select('id, name, slug, price, icon_url, seller_profiles(store_name, store_slug)')
        .eq('is_available', true)
        .eq('is_approved', true)
        .in('id', topRatedIds.map(p => p.id));

      const topRatedProducts: TopRatedProduct[] = topRatedIds
        .map((rating) => {
          const product = productData?.find((p: any) => p.id === rating.id);
          if (!product) return null;
          return {
            id: product.id,
            name: product.name,
            slug: (product as any).slug,
            price: product.price,
            icon_url: product.icon_url,
            avg_rating: Math.round(rating.avg * 10) / 10,
            review_count: rating.count,
            seller_name: (product as any).seller_profiles?.store_name,
            store_slug: (product as any).seller_profiles?.store_slug,
          };
        })
        .filter(Boolean) as TopRatedProduct[];

      setProducts(topRatedProducts);
    } catch (error) {
      console.error('Error fetching top rated products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={cn("border border-black/10 rounded-xl p-4 bg-white", className)}>
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[180px] w-[130px] flex-shrink-0 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className={cn("border border-black/10 rounded-xl p-4 bg-white", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          <h3 className="text-base font-bold text-black">Top Rated</h3>
          <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-medium">
            4.5+ stars
          </span>
        </div>
        <Button variant="link" className="text-blue-500 hover:text-blue-600 text-sm p-0 h-auto">
          View All <ChevronRight className="h-4 w-4 ml-0.5" />
        </Button>
      </div>

      {/* Horizontal Scrolling Cards */}
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {products.map((product) => (
          <ProductHoverCard
            key={product.id}
            product={{
              id: product.id,
              name: product.name,
              price: product.price,
              iconUrl: product.icon_url,
              sellerName: product.seller_name || null,
              storeSlug: product.store_slug || null,
              isVerified: false,
              soldCount: 0,
              type: 'seller',
            }}
            onBuy={() => onBuy?.(product)}
            onChat={() => onChat?.(product)}
            isAuthenticated={isAuthenticated}
          >
            <Card
              className="flex-shrink-0 w-[130px] cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 bg-white border border-black/10 hover:border-black/20"
              onClick={() => {
                trackProductClick(product.id);
                onProductClick(product);
              }}
            >
              <CardContent className="p-2.5">
                {/* Image with Rating Badge */}
                <div className="relative mb-2">
                  <OptimizedImage
                    src={product.icon_url}
                    alt={product.name}
                    className="w-full aspect-square rounded-md"
                    aspectRatio="square"
                    fallbackIcon={<ShoppingCart className="h-8 w-8 text-muted-foreground" />}
                  />
                  {/* Rating Badge - Top Left */}
                  <div className="absolute top-1.5 left-1.5 bg-white/90 border border-black/10 text-black text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 font-medium">
                    <Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
                    {product.avg_rating}
                  </div>
                </div>
                
                {/* Title */}
                <h4 className="font-medium text-xs text-black truncate">{product.name}</h4>
                
                {/* Seller Name */}
                {product.seller_name && (
                  <p className="text-[10px] text-black/50 truncate mt-0.5">{product.seller_name}</p>
                )}
                
                {/* Price and Review Count Row */}
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-sm text-emerald-500">${product.price.toFixed(2)}</span>
                  <span className="text-[10px] text-black/50">
                    {product.review_count} reviews
                  </span>
                </div>
              </CardContent>
            </Card>
          </ProductHoverCard>
        ))}
      </div>
    </div>
  );
}
