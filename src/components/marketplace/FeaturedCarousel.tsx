import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import GumroadProductCard from './GumroadProductCard';

interface Product {
  id: string;
  name: string;
  price: number;
  iconUrl: string | null;
  sellerName: string | null;
  sellerAvatar?: string | null;
  storeSlug: string | null;
  isVerified: boolean;
  soldCount?: number;
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
  
  // Calculate visible cards based on screen size
  const getVisibleCards = () => {
    if (typeof window === 'undefined') return 4;
    if (window.innerWidth < 640) return 1.5;
    if (window.innerWidth < 768) return 2.5;
    if (window.innerWidth < 1024) return 3;
    return 4;
  };

  const [visibleCards, setVisibleCards] = useState(getVisibleCards);

  useEffect(() => {
    const handleResize = () => setVisibleCards(getVisibleCards());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    if (!autoPlay || isHovered || products.length <= Math.floor(visibleCards)) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const maxIndex = Math.max(0, products.length - Math.floor(visibleCards));
        return prev >= maxIndex ? 0 : prev + 1;
      });
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, isHovered, products.length, visibleCards]);

  const maxIndex = Math.max(0, products.length - Math.floor(visibleCards));
  
  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  if (products.length === 0) return null;

  return (
    <section className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-black">{title}</h2>
        
        {/* Pagination & Controls */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-black/50">
            {currentIndex + 1}/{Math.ceil(products.length / Math.floor(visibleCards))}
          </span>
          <div className="flex gap-1">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-2 rounded-full border-2 border-black/10 hover:border-black/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-black" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex >= maxIndex}
              className="p-2 rounded-full border-2 border-black/10 hover:border-black/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-black" />
            </button>
          </div>
        </div>
      </div>

      {/* Carousel */}
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
              <GumroadProductCard
                id={product.id}
                name={product.name}
                price={product.price}
                iconUrl={product.iconUrl}
                sellerName={product.sellerName}
                sellerAvatar={product.sellerAvatar}
                storeSlug={product.storeSlug}
                isVerified={product.isVerified}
                soldCount={product.soldCount}
                type={product.type}
                onClick={() => onProductClick(product)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Dots (mobile only) */}
      <div className="flex justify-center gap-1.5 mt-4 md:hidden">
        {Array.from({ length: Math.ceil(products.length / Math.floor(visibleCards)) }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i * Math.floor(visibleCards))}
            className={`w-2 h-2 rounded-full transition-colors ${
              Math.floor(currentIndex / Math.floor(visibleCards)) === i
                ? 'bg-black'
                : 'bg-black/20'
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default FeaturedCarousel;
