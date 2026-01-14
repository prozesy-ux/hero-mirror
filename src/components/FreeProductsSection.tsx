import { Star, ArrowRight, Gift } from 'lucide-react';
import madeForNotion from '@/assets/made-for-notion.avif';
import chatgptLogo from '@/assets/chatgpt-logo.avif';
import midjourneyLogo from '@/assets/midjourney-logo.avif';
import geminiLogo from '@/assets/gemini-logo.avif';
import checkIcon from '@/assets/check-icon.svg';
import btnArrow from '@/assets/btn-arrow.svg';
import starsIcon from '@/assets/stars.svg';

const products = [
  {
    title: "Perplexity",
    titleBold: "Mastery Guide",
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
    features: [
      "Veo Prompt Engineering Guide",
      "50+ Veo JSON Prompts",
      "Veo Mini-Course"
    ],
    price: "FREE",
    rating: 5.0,
    reviews: "2K+",
    isNew: true,
  },
  {
    title: "Gemini",
    titleBold: "Mastery Guide",
    features: [
      "Gemini Prompt Engineering Guide",
      "Veo 3 Guide + Prompts",
      "Gemini Prompt Engineering Mini-Course"
    ],
    price: "FREE",
    rating: 5.0,
    reviews: "2K+",
    isNew: true,
  },
  {
    title: "Grok",
    titleBold: "Mastery Guide",
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
    features: [
      "25 Key Prompt Engineering Principles",
      "Essential AI Tool Selection",
      "Prompt Engineering Mini-Course"
    ],
    price: "FREE",
    rating: 4.9,
    reviews: "115",
    isNew: true,
  },
  {
    title: "Claude",
    titleBold: "Mastery Guide",
    features: [
      "Claude Prompt Engineering Guide",
      "10+ Claude Mega-Prompts",
      "Claude Prompt Engineering Mini-Course"
    ],
    price: "FREE",
    rating: 4.9,
    reviews: "213",
    isNew: true,
  },
];

const FreeProductsSection = () => {
  return (
    <section className="py-8 md:py-12 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6">
          <Gift className="w-7 h-7 text-black" />
          <h2 className="text-xl md:text-2xl font-bold text-black tracking-tight">Free Products <span className="font-normal">&gt;</span></h2>
        </div>

        {/* Products Grid - 4 columns on lg */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((product, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative group flex flex-col"
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
              <h3 className="text-sm font-medium text-black mb-2 leading-tight">
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
              <div className="mb-2">
                <span className="text-lg font-bold text-green-600">{product.price}</span>
              </div>

              {/* CTA Button */}
              <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-xs">
                Get Free Access
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

export default FreeProductsSection;
