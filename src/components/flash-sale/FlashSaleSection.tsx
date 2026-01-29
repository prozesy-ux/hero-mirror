import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ChevronRight } from 'lucide-react';
import FlashSaleCard from './FlashSaleCard';
import { Skeleton } from '@/components/ui/skeleton';

interface FlashSale {
  id: string;
  product_id: string;
  discount_percentage: number;
  original_price: number;
  sale_price: number;
  starts_at: string;
  ends_at: string;
  max_quantity: number | null;
  sold_quantity: number;
  is_active: boolean;
  seller_id: string;
  product: {
    id: string;
    name: string;
    icon_url: string | null;
    price: number;
    seller_id: string;
  } | null;
  seller: {
    id: string;
    store_name: string;
    store_slug: string;
    store_logo_url: string | null;
    is_verified: boolean;
  } | null;
}

interface FlashSaleSectionProps {
  className?: string;
}

const FlashSaleSection = ({ className }: FlashSaleSectionProps) => {
  const navigate = useNavigate();
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlashSales = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bff-flash-sales`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setFlashSales(data.flashSales || []);
        }
      } catch (error) {
        console.error('[FlashSaleSection] Error fetching flash sales:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFlashSales();
  }, []);

  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-56 flex-shrink-0 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (flashSales.length === 0) {
    return null;
  }

  const handleView = (sale: FlashSale) => {
    if (sale.seller?.store_slug) {
      navigate(`/store/${sale.seller.store_slug}`);
    }
  };

  const handleBuy = (sale: FlashSale) => {
    if (sale.seller?.store_slug) {
      navigate(`/store/${sale.seller.store_slug}`);
    }
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <Zap className="h-4 w-4 text-white fill-white" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Flash Deals</h2>
        </div>
        <button className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 transition-colors">
          <span>View All</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Horizontal Scroll */}
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 hide-scrollbar snap-x snap-mandatory">
        {flashSales.map((sale) => (
          sale.product && (
            <div key={sale.id} className="flex-shrink-0 w-56 snap-start">
              <FlashSaleCard
                flashSale={sale}
                product={{
                  id: sale.product.id,
                  name: sale.product.name,
                  icon_url: sale.product.icon_url,
                  seller_id: sale.product.seller_id,
                }}
                storeName={sale.seller?.store_name}
                onView={() => handleView(sale)}
                onBuy={() => handleBuy(sale)}
              />
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default FlashSaleSection;
