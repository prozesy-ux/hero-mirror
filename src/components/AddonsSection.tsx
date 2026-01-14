import { useRef } from 'react';
import { Puzzle } from 'lucide-react';
import madeForNotion from '@/assets/made-for-notion.avif';
import chatgptLogo from '@/assets/chatgpt-logo.avif';
import checkIcon from '@/assets/check-icon.svg';
import btnArrow from '@/assets/btn-arrow.svg';
import starsIcon from '@/assets/stars.svg';

const products = [
  {
    title: "n8n Automations",
    titleBold: "Bundle",
    icon: chatgptLogo,
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
    icon: chatgptLogo,
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
    icon: chatgptLogo,
    features: [
      "12 Commands for ChatGPT",
      "Extend Your ChatGPT's Functionality",
      "Create Quizzes, Save Prompts & More!"
    ],
    originalPrice: 70,
    price: 27,
    rating: 4.7,
    reviews: 48,
    isNew: false,
  },
  {
    title: "5000+ Top AI Tools",
    titleBold: "Directory",
    icon: chatgptLogo,
    features: [
      "5000+ Top AI Tools filtered",
      "50 Categories",
      "Boost Income, Automate Writing & More!"
    ],
    originalPrice: 40,
    price: 17,
    rating: 4.8,
    reviews: 103,
    isNew: false,
  },
];

const AddonsSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section className="py-12 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-2">
          <Puzzle className="w-8 h-8 text-black" />
          <h2 className="text-2xl md:text-3xl font-bold text-black tracking-tight">
            Add-ons <span className="font-normal text-gray-400">&gt;</span>
          </h2>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gray-200 mb-6" />

        {/* Cards Container with visible scrollbar */}
        <div 
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-4 scroll-smooth"
          style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: '#9ca3af #e5e7eb'
          }}
        >
          {products.map((product, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative flex flex-col flex-shrink-0"
              style={{ width: 'calc((100% - 60px) / 3.5)', minWidth: '280px' }}
            >
              {/* Top Row: Logos in single row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <img src={chatgptLogo} alt="ChatGPT" className="w-8 h-8 rounded-lg" />
                  <img src={product.icon} alt="Product" className="w-8 h-8 rounded-lg object-contain" />
                  {product.isNew && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded">
                      NEW!
                    </span>
                  )}
                </div>
                <img src={madeForNotion} alt="Made for Notion" className="h-6 w-auto" />
              </div>

              {/* Title with black box on last word */}
              <h3 className="text-lg text-black mb-1 leading-tight">
                {product.title}{' '}
                <span className="bg-black text-white px-2 py-0.5 font-bold inline-block">
                  {product.titleBold}
                </span>
              </h3>

              {/* Delivery Note */}
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-4">DELIVERED VIA NOTION</p>

              {/* Features */}
              <ul className="space-y-2 mb-4 flex-grow">
                {product.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <img src={checkIcon} alt="Check" className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="leading-tight">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Price */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-gray-400 line-through text-base">${product.originalPrice}.00</span>
                <span className="text-xl font-bold text-amber-500">${product.price}.00</span>
              </div>

              {/* CTA Button */}
              <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm">
                Learn More
                <img src={btnArrow} alt="Arrow" className="w-4 h-4" />
              </button>

              {/* Rating */}
              <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-gray-100">
                <span className="text-sm font-medium text-gray-600">({product.rating})</span>
                <img src={starsIcon} alt="Stars" className="h-4" />
                <span className="text-sm text-gray-400">({product.reviews})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AddonsSection;