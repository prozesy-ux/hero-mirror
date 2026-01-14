import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import madeForNotion from '@/assets/made-for-notion.avif';
import chatgptLogo from '@/assets/chatgpt-logo.avif';
import midjourneyLogo from '@/assets/midjourney-logo.avif';
import geminiLogo from '@/assets/gemini-logo.avif';
import checkIcon from '@/assets/check-icon.svg';
import btnArrow from '@/assets/btn-arrow.svg';
import starsIcon from '@/assets/stars.svg';

const products = [
  {
    title: "Midjourney Prompt",
    titleBold: "Bundle",
    features: [
      "10000+ Midjourney AI Prompts",
      "How-to Guides, Tips & Tricks",
      "Create Custom Logos, Banners & More!"
    ],
    originalPrice: 120,
    price: 67,
    rating: 4.8,
    reviews: 89,
    isNew: true,
  },
  {
    title: "Midjourney for",
    titleBold: "Architecture",
    features: [
      "2000+ Midjourney Prompts",
      "Prompt Templates, Tips & Tricks",
      "Innovate in Architecture!"
    ],
    originalPrice: 67,
    price: 27,
    rating: 4.7,
    reviews: 110,
    isNew: true,
  },
  {
    title: "Midjourney for",
    titleBold: "Art & Design",
    features: [
      "2000+ Midjourney Prompts",
      "Prompt Templates, Tips & Tricks",
      "Inspire Your Creativity!"
    ],
    originalPrice: 67,
    price: 27,
    rating: 4.8,
    reviews: 137,
    isNew: true,
  },
  {
    title: "Midjourney for",
    titleBold: "Marketing",
    features: [
      "2000+ Midjourney Prompts",
      "Prompt Templates, Tips & Tricks",
      "Automate Visual Content Creation!"
    ],
    originalPrice: 67,
    price: 27,
    rating: 4.9,
    reviews: 49,
    isNew: true,
  },
  {
    title: "Midjourney for",
    titleBold: "Photography",
    features: [
      "2000+ Midjourney Prompts",
      "Prompt Templates, Tips & Tricks",
      "Create Stunning Photographs!"
    ],
    originalPrice: 67,
    price: 27,
    rating: 4.5,
    reviews: 67,
    isNew: true,
  },
  {
    title: "Midjourney for",
    titleBold: "Web Design",
    features: [
      "1500+ Midjourney Prompts",
      "Prompt Templates, Tips & Tricks",
      "Automate Web Design Mock-Ups!"
    ],
    originalPrice: 67,
    price: 27,
    rating: 4.7,
    reviews: 70,
    isNew: true,
  },
];

const MidjourneyPromptsSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 280;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="py-8 md:py-12 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src={midjourneyLogo} alt="Midjourney" className="w-7 h-7 rounded" />
            <h2 className="text-xl md:text-2xl font-bold text-black tracking-tight">
              Midjourney Prompts <span className="font-normal">&gt;</span>
            </h2>
          </div>
          {/* Scroll buttons */}
          <div className="hidden md:flex items-center gap-2">
            <button 
              onClick={() => scroll('left')}
              className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 border border-gray-200 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button 
              onClick={() => scroll('right')}
              className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 border border-gray-200 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Horizontal Scroll Container */}
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative group flex flex-col flex-shrink-0 w-[260px]"
            >
              {/* AI Logos Row */}
              <div className="flex items-center gap-1 mb-3">
                <img src={chatgptLogo} alt="ChatGPT" className="w-5 h-5 rounded" />
                <img src={midjourneyLogo} alt="Midjourney" className="w-5 h-5 rounded" />
                <img src={geminiLogo} alt="Gemini" className="w-5 h-5 rounded" />
              </div>

              {/* NEW Badge */}
              {product.isNew && (
                <div className="absolute top-3 right-3 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                  NEW!
                </div>
              )}

              {/* Notion Badge */}
              <img src={madeForNotion} alt="Made for Notion" className="h-5 w-auto mb-3" />

              {/* Title */}
              <h3 className="text-sm text-black mb-2 leading-tight">
                {product.title} <span className="font-bold">{product.titleBold}</span>
              </h3>

              {/* Delivery Note */}
              <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-2">DELIVERED VIA NOTION</p>

              {/* Features */}
              <ul className="space-y-1 mb-3 flex-grow">
                {product.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-600">
                    <img src={checkIcon} alt="Check" className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Price */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-gray-400 line-through text-xs">${product.originalPrice}.00</span>
                <span className="text-lg font-bold text-black">${product.price}.00</span>
              </div>

              {/* CTA Button */}
              <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-xs">
                Learn More
                <img src={btnArrow} alt="Arrow" className="w-3 h-3" />
              </button>

              {/* Rating */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-semibold text-black">({product.rating})</span>
                  <img src={starsIcon} alt="Stars" className="h-3" />
                </div>
                <span className="text-[10px] text-gray-500">({product.reviews})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MidjourneyPromptsSection;
