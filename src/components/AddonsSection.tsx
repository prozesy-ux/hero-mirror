import { useRef, useState, useEffect } from 'react';
import { Puzzle, ChevronLeft, ChevronRight } from 'lucide-react';
import madeForNotion from '@/assets/made-for-notion.avif';
import chatgptLogo from '@/assets/chatgpt-logo.avif';
import midjourneyLogo from '@/assets/midjourney-logo.avif';
import geminiLogo from '@/assets/gemini-logo.avif';
import checkIcon from '@/assets/check-icon.svg';
import btnArrow from '@/assets/btn-arrow.svg';
import starsIcon from '@/assets/stars.svg';

const products = [
  {
    title: "n8n Automations",
    titleBold: "Bundle",
    features: [
      "10+ Pre-Built Automations in n8n",
      "Video Tutorials for Every Workflow",
      "Operations, Marketing, Sales Automated"
    ],
    originalPrice: 700,
    price: 150,
    rating: 5.0,
    reviews: 127,
    isNew: true,
  },
  {
    title: "Custom GPTs",
    titleBold: "Toolkit",
    features: [
      "100+ Mega-Instructions to Copy & Paste",
      "How-to Guides & Tips",
      "Automate your Marketing & Business"
    ],
    originalPrice: 120,
    price: 67,
    rating: 4.7,
    reviews: 100,
    isNew: true,
  },
  {
    title: "ChatGPT Custom",
    titleBold: "Instructions Pack",
    features: [
      "12 Commands for ChatGPT",
      "Extend Your ChatGPT's Functionality",
      "Create Quizzes, Save Prompts & More!"
    ],
    originalPrice: 70,
    price: 27,
    rating: 4.7,
    reviews: 48,
    isNew: true,
  },
  {
    title: "5000+ Top AI Tools",
    titleBold: "Directory",
    features: [
      "5000+ Top AI Tools filtered",
      "50 Categories",
      "Boost Income, Automate Writing & More!"
    ],
    originalPrice: 40,
    price: 17,
    rating: 4.8,
    reviews: 103,
    isNew: true,
  },
];

const AddonsSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScrollButtons);
      return () => ref.removeEventListener('scroll', checkScrollButtons);
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const cardWidth = 240;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -cardWidth : cardWidth,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="py-10 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6">
          <Puzzle className="w-7 h-7 text-black" />
          <h2 className="text-xl md:text-2xl font-bold text-black tracking-tight">
            Add-ons <span className="font-normal text-gray-400">&gt;</span>
          </h2>
        </div>

        {/* Slider Container */}
        <div className="relative group">
          {/* Left Arrow */}
          {canScrollLeft && (
            <button 
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
          )}

          {/* Right Arrow */}
          {canScrollRight && (
            <button 
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          )}

          {/* Cards Container */}
          <div 
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((product, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative flex flex-col flex-shrink-0 w-[240px] h-[380px]"
              >
                {/* Top Row: AI Logos */}
                <div className="flex items-center gap-1.5 mb-3">
                  <img src={chatgptLogo} alt="ChatGPT" className="w-6 h-6 rounded" />
                  <img src={midjourneyLogo} alt="Midjourney" className="w-6 h-6 rounded" />
                  <img src={geminiLogo} alt="Gemini" className="w-6 h-6 rounded" />
                </div>

                {/* NEW Badge */}
                {product.isNew && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    NEW!
                  </div>
                )}

                {/* Notion Badge */}
                <img src={madeForNotion} alt="Made for Notion" className="h-5 w-auto mb-3" />

                {/* Title */}
                <h3 className="text-sm text-black mb-1 leading-tight">
                  {product.title} <span className="font-bold">{product.titleBold}</span>
                </h3>

                {/* Delivery Note */}
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-3">DELIVERED VIA NOTION</p>

                {/* Features */}
                <ul className="space-y-1.5 mb-4 flex-grow">
                  {product.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                      <img src={checkIcon} alt="Check" className="w-4 h-4 flex-shrink-0" />
                      <span className="leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Price */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-gray-400 line-through text-sm">${product.originalPrice}.00</span>
                  <span className="text-lg font-bold text-black">${product.price}.00</span>
                </div>

                {/* CTA Button */}
                <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm">
                  Learn More
                  <img src={btnArrow} alt="Arrow" className="w-4 h-4" />
                </button>

                {/* Rating */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-black">({product.rating})</span>
                    <img src={starsIcon} alt="Stars" className="h-4" />
                  </div>
                  <span className="text-xs text-gray-500">({product.reviews})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AddonsSection;