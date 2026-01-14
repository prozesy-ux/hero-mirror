import { useRef, useState, useEffect } from 'react';
import madeForNotion from '@/assets/made-for-notion.avif';
import chatgptLogo from '@/assets/chatgpt-logo.avif';
import checkIcon from '@/assets/check-icon.svg';
import btnArrow from '@/assets/btn-arrow.svg';
import starsIcon from '@/assets/stars.svg';
import chatgptIcon from '@/assets/chatgpt-icon.svg';
import businessIcon from '@/assets/business-icon.png';
import educationIcon from '@/assets/education-icon.svg';
import financeIcon from '@/assets/finance-icon.avif';
import productivityIcon from '@/assets/productivity-icon.webp';
import seoIcon from '@/assets/seo-icon.avif';
import chatgptBundleIcon from '@/assets/chatgpt-bundle-icon.avif';
import marketingIcon from '@/assets/marketing-icon.png';

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
    rating: 4.8,
    reviews: 257,
    isNew: false,
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
    rating: 4.8,
    reviews: 230,
    isNew: false,
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
    rating: 5.0,
    reviews: 177,
    isNew: true,
  },
];

const ChatGPTPromptsSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section className="py-12 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-2">
          <img src={chatgptIcon} alt="ChatGPT" className="w-8 h-8" />
          <h2 className="text-2xl md:text-3xl font-bold text-black tracking-tight">
            ChatGPT Mega-Prompts <span className="font-normal text-gray-400">&gt;</span>
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

              {/* Lifetime Access Badge */}
              <div className="mb-4">
                <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Lifetime Access
                </span>
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

      {/* Custom scrollbar styles */}
      <style>{`
        div::-webkit-scrollbar {
          height: 8px;
        }
        div::-webkit-scrollbar-track {
          background: #e5e7eb;
          border-radius: 4px;
        }
        div::-webkit-scrollbar-thumb {
          background: #9ca3af;
          border-radius: 4px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
    </section>
  );
};

export default ChatGPTPromptsSection;