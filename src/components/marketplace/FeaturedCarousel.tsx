import { Sparkles, Store } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  iconUrl: string | null;
  sellerName: string | null;
  sellerAvatar?: string | null;
  storeSlug: string | null;
  isVerified: boolean;
  soldCount?: number;
  rating?: number;
  reviewCount?: number;
  type: 'ai' | 'seller';
}

interface FeaturedCarouselProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  title?: string;
}

const FeaturedCarousel = ({
  products,
  onProductClick,
  title = "Featured products",
}: FeaturedCarouselProps) => {
  if (products.length === 0) return null;

  // Show exactly 4 products
  const displayProducts = products.slice(0, 4);

  return (
    <section className="py-6">
      {/* Black gradient container */}
      <div className="bg-gradient-to-br from-black via-gray-900 to-black rounded-2xl p-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>

        {/* 4-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => onProductClick(product)}
              className="group w-full text-left bg-white rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1"
            >
              {/* Product Image */}
              <div className="relative overflow-hidden bg-gray-100">
                <AspectRatio ratio={4/3}>
                  {product.iconUrl ? (
                    <img
                      src={product.iconUrl}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
                      <Store className="w-10 h-10 text-black/10" />
                    </div>
                  )}
                </AspectRatio>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-sm font-semibold text-black line-clamp-2 mb-1 min-h-[2.5rem]">
                  {product.name}
                </h3>
                {product.sellerName && (
                  <p className="text-xs text-black/50 mb-2">by {product.sellerName}</p>
                )}
                <span className="text-base font-bold text-black">${product.price.toFixed(0)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCarousel;
