import { useState, useEffect } from 'react';
import { Award, ChevronRight, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { trackProductClick } from '@/lib/analytics-tracker';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/optimized-image';

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
  className?: string;
}

export function TopRatedSection({ onProductClick, className }: TopRatedSectionProps) {
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
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-6 w-28" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 w-36 flex-shrink-0 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className={cn("bg-white border border-black/10 rounded-2xl p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-black" />
          <h3 className="text-lg font-bold text-black">Top Rated</h3>
          <span className="text-xs px-2 py-0.5 bg-black text-white rounded-full font-medium">★ 4.5+</span>
        </div>
        <Button variant="ghost" size="sm" className="text-black/50 hover:text-black text-xs h-7">
          View All <ChevronRight className="h-3 w-3 ml-0.5" />
        </Button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {products.map((product) => (
          <Card
            key={product.id}
            className="flex-shrink-0 w-36 cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 bg-white border border-black/10 hover:border-black/20"
            onClick={() => {
              trackProductClick(product.id);
              onProductClick(product);
            }}
          >
            <CardContent className="p-3">
              <div className="relative mb-2">
                <OptimizedImage
                  src={product.icon_url}
                  alt={product.name}
                  className="w-full h-24 rounded-md"
                  aspectRatio="auto"
                  fallbackIcon={<ShoppingCart className="h-8 w-8 text-black/30" />}
                />
                <span className="absolute top-2 right-2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                  ★ {product.avg_rating}
                </span>
              </div>
              <h4 className="font-medium text-sm truncate">{product.name}</h4>
              {product.seller_name && (
                <p className="text-xs text-muted-foreground truncate">{product.seller_name}</p>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-black">${product.price.toFixed(2)}</span>
                <span className="text-xs text-black/50">
                  {product.review_count} reviews
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
