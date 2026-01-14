import { useRef } from 'react';
import { Gift } from 'lucide-react';
import madeForNotion from '@/assets/made-for-notion.avif';
import chatgptLogo from '@/assets/chatgpt-logo.avif';
import geminiLogo from '@/assets/gemini-logo.avif';
import checkIcon from '@/assets/check-icon.svg';
import btnArrow from '@/assets/btn-arrow.svg';
import starsIcon from '@/assets/stars.svg';

const products = [
  {
    title: "Perplexity",
    titleBold: "Mastery Guide",
    icon: chatgptLogo,
    features: [
      "Perplexity Prompts & Research Engineering",
      "Research Prompt Templates",
      "Research Engineering Mini-Course"
    ],
    price: "FREE",
    rating: 4.8,
    reviews: "1K+",
    isNew: true,
  },
  {
    title: "ChatGPT Images",
    titleBold: "Mastery Guide",
    icon: chatgptLogo,
    features: [
      "ChatGPT Images Prompt Engineering Guide",
      "20+ JSON Image Templates",
      "Image Prompting Mini-Course"
    ],
    price: "FREE",
    rating: 4.9,
    reviews: "2K+",
    isNew: true,
  },
  {
    title: "Veo",
    titleBold: "Mastery Guide",
    icon: geminiLogo,
    features: [
      "Veo Prompt Engineering Guide",
      "50+ Veo JSON Prompts",
      "Veo Mini-Course"
    ],
    price: "FREE",
    rating: 5.0,
    reviews: "2K+",
    isNew: false,
  },
  {
    title: "Gemini",
    titleBold: "Mastery Guide",
    icon: geminiLogo,
    features: [
      "Gemini Prompt Engineering Guide",
      "Veo 3 Guide + Prompts",
      "Gemini Prompt Engineering Mini-Course"
    ],
    price: "FREE",
    rating: 5.0,
    reviews: "2K+",
    isNew: false,
  },
  {
    title: "Grok",
    titleBold: "Mastery Guide",
    icon: chatgptLogo,
    features: [
      "Grok Prompt Engineering Guide",
      "10+ Grok AI Prompts",
      "Grok Prompt Engineering Mini-Course"
    ],
    price: "FREE",
    rating: 4.9,
    reviews: "1K+",
    isNew: true,
  },
  {
    title: "AI Agents",
    titleBold: "Mastery Guide",
    icon: chatgptLogo,
    features: [
      "AI Agents Mini-Course",
      "How-to Guide & Tips",
      "Automate Your Business with AI Agents!"
    ],
    price: "FREE",
    rating: 5.0,
    reviews: "320",
    isNew: true,
  },
  {
    title: "Prompt Engineering",
    titleBold: "Guide",
    icon: chatgptLogo,
    features: [
      "25 Key Prompt Engineering Principles",
      "Essential AI Tool Selection",
      "Prompt Engineering Mini-Course"
    ],
    price: "FREE",
    rating: 4.9,
    reviews: "115",
    isNew: false,
  },
  {
    title: "Claude",
    titleBold: "Mastery Guide",
    icon: chatgptLogo,
    features: [
      "Claude Prompt Engineering Guide",
      "10+ Claude Mega-Prompts",
      "Claude Prompt Engineering Mini-Course"
    ],
    price: "FREE",
    rating: 4.9,
    reviews: "213",
    isNew: false,
  },
];

const FreeProductsSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section className="py-12 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-2">
          <Gift className="w-8 h-8 text-black" />
          <h2 className="text-2xl md:text-3xl font-bold text-black tracking-tight">
            Free Products <span className="font-normal text-gray-400">&gt;</span>
          </h2>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gray-300 mb-6" />

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
              <div className="mb-4">
                <span className="text-xl font-bold text-green-600">{product.price}</span>
              </div>

              {/* CTA Button */}
              <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm">
                Get Free Access
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

export default FreeProductsSection;