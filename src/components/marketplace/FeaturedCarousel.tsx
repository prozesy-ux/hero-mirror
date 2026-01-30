import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import FeaturedBannerCard from './FeaturedBannerCard';

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
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

const FeaturedCarousel = ({
  products,
  onProductClick,
  title = "Featured products",
  autoPlay = true,
  autoPlayInterval = 5000,
}: FeaturedCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // For banner cards, show 1 at a time on mobile, 2 on desktop
  const getVisibleCards = () => {
    if (typeof window === 'undefined') return 2;
    if (window.innerWidth < 768) return 1;
    return 2;
  };

  const [visibleCards, setVisibleCards] = useState(getVisibleCards);

  useEffect(() => {
    const handleResize = () => setVisibleCards(getVisibleCards());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    if (!autoPlay || isHovered || products.length <= visibleCards) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const maxIndex = Math.max(0, products.length - visibleCards);
        return prev >= maxIndex ? 0 : prev + 1;
      });
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, isHovered, products.length, visibleCards]);

  const maxIndex = Math.max(0, products.length - visibleCards);
  
  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  if (products.length === 0) return null;

  const totalPages = Math.ceil(products.length / visibleCards);
  const currentPage = Math.floor(currentIndex / visibleCards) + 1;

  return (
    <section className="py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-black">{title}</h2>
        
        {/* Pagination & Controls */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-black/50">
            {currentPage}/{totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-1.5 rounded-full border border-black/10 hover:border-black/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-black" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex >= maxIndex}
              className="p-1.5 rounded-full border border-black/10 hover:border-black/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-black" />
            </button>
          </div>
        </div>
      </div>

      {/* Carousel - Banner style cards */}
      <div 
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="overflow-hidden"
      >
        <div 
          className="flex gap-4 transition-transform duration-500 ease-out"
          style={{ 
            transform: `translateX(-${currentIndex * (100 / visibleCards)}%)`,
          }}
        >
          {products.map((product) => (
            <div 
              key={product.id} 
              className="flex-shrink-0"
              style={{ width: `calc(${100 / visibleCards}% - ${((visibleCards - 1) * 16) / visibleCards}px)` }}
            >
              <FeaturedBannerCard
                id={product.id}
                name={product.name}
                description={product.description}
                price={product.price}
                iconUrl={product.iconUrl}
                sellerName={product.sellerName}
                sellerAvatar={product.sellerAvatar}
                isVerified={product.isVerified}
                rating={product.rating}
                reviewCount={product.reviewCount || product.soldCount}
                onClick={() => onProductClick(product)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Dots (mobile only) */}
      <div className="flex justify-center gap-1.5 mt-4 md:hidden">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i * visibleCards)}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              currentPage - 1 === i ? 'bg-black' : 'bg-black/20'
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default FeaturedCarousel;
