import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import madeForNotion from '@/assets/made-for-notion.avif';
import chatgptLogo from '@/assets/chatgpt-logo.avif';
import midjourneyLogo from '@/assets/midjourney-logo.avif';
import geminiLogo from '@/assets/gemini-logo.avif';
import checkIcon from '@/assets/check-icon.svg';
import btnArrow from '@/assets/btn-arrow.svg';
import starsIcon from '@/assets/stars.svg';
import chatgptIcon from '@/assets/chatgpt-icon.svg';
import businessIcon from '@/assets/business-icon.png';
import marketingIcon from '@/assets/marketing-icon.png';
import educationIcon from '@/assets/education-icon.svg';
import financeIcon from '@/assets/finance-icon.avif';
import productivityIcon from '@/assets/productivity-icon.webp';
import seoIcon from '@/assets/seo-icon.avif';
import chatgptBundleIcon from '@/assets/chatgpt-bundle-icon.avif';

const products = [
  {
    title: "ChatGPT Mega-Prompt",
    titleBold: "Bundle",
    icon: chatgptBundleIcon,
    features: [
      "10K+ AI Prompts",
      "All Premium Prompts In One",
      "Biggest Collection of AI Prompts for ChatGPT, Claude, Grok, & Gemini AI"
    ],
    originalPrice: 150,
    price: 97,
    rating: 4.8,
    reviews: 257,
    isNew: true,
  },
  {
    title: "Mega-Prompts for",
    titleBold: "Business",
    icon: businessIcon,
    features: [
      "200+ mega-prompts for business",
      "How-to guides & tips",
      "Streamline your business tasks"
    ],
    originalPrice: 67,
    price: 37,
    rating: 4.8,
    reviews: 230,
    isNew: true,
  },
  {
    title: "Mega-Prompts for",
    titleBold: "E-Commerce",
    icon: businessIcon,
    features: [
      "200+ AI prompts for e-commerce",
      "How-to guides & tips",
      "Cut costs by 40%"
    ],
    originalPrice: 67,
    price: 37,
    rating: 4.9,
    reviews: 115,
    isNew: true,
  },
  {
    title: "Mega-Prompts for",
    titleBold: "Education",
    icon: educationIcon,
    features: [
      "200+ mega-prompts for education",
      "How-to guides & tips",
      "Automate all your academic tasks"
    ],
    originalPrice: 67,
    price: 37,
    rating: 4.8,
    reviews: 217,
    isNew: true,
  },
  {
    title: "AI Prompts for",
    titleBold: "Finance",
    icon: financeIcon,
    features: [
      "200+ AI prompts for finance",
      "How-to guides & tips",
      "Reduce financial stress"
    ],
    originalPrice: 67,
    price: 37,
    rating: 4.9,
    reviews: 159,
    isNew: true,
  },
  {
    title: "Mega-Prompts for",
    titleBold: "Marketing",
    icon: marketingIcon,
    features: [
      "200+ AI prompts for marketing",
      "How-to guides & tips",
      "Supercharge your marketing"
    ],
    originalPrice: 67,
    price: 37,
    rating: 4.9,
    reviews: 459,
    isNew: true,
  },
  {
    title: "Mega-Prompts for",
    titleBold: "Productivity",
    icon: productivityIcon,
    features: [
      "200+ AI prompts for productivity",
      "How-to guides & tips",
      "10X your productivity"
    ],
    originalPrice: 67,
    price: 37,
    rating: 4.8,
    reviews: 175,
    isNew: true,
  },
  {
    title: "Mega-Prompts for",
    titleBold: "SEO",
    icon: seoIcon,
    features: [
      "200+ mega-prompts for SEO",
      "How-to guides & tips",
      "Boost & automate your SEO"
    ],
    originalPrice: 67,
    price: 37,
    rating: 4.9,
    reviews: 105,
    isNew: true,
  },
  {
    title: "Mega-Prompts for",
    titleBold: "Sales",
    icon: businessIcon,
    features: [
      "200+ AI prompts for sales",
      "How-to guides & tips",
      "Streamline your sales funnel"
    ],
    originalPrice: 67,
    price: 37,
    rating: 4.9,
    reviews: 157,
    isNew: true,
  },
  {
    title: "Mega-Prompts for",
    titleBold: "Solopreneurs",
    icon: businessIcon,
    features: [
      "200+ AI prompts for solopreneurs",
      "How-to guides & tips",
      "Unlock your one-person business"
    ],
    originalPrice: 67,
    price: 37,
    rating: 5.0,
    reviews: 177,
    isNew: true,
  },
];

const ChatGPTPromptsSection = () => {
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
          <img src={chatgptIcon} alt="ChatGPT" className="w-7 h-7" />
          <h2 className="text-xl md:text-2xl font-bold text-black tracking-tight">
            ChatGPT Mega-Prompts <span className="font-normal text-gray-400">&gt;</span>
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
                  <img src={product.icon} alt="Product" className="w-6 h-6 rounded object-contain" />
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

export default ChatGPTPromptsSection;