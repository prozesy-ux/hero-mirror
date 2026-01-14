import { Check, Star, ArrowRight, Gift, Search, Image, Video, Sparkles, Bot, BookOpen, Layers } from 'lucide-react';

const products = [
  {
    title: "Perplexity Mastery Guide",
    icon: Search,
    iconBg: "bg-gradient-to-br from-cyan-500 to-blue-500",
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
    title: "ChatGPT Images Mastery Guide",
    icon: Image,
    iconBg: "bg-gradient-to-br from-green-500 to-emerald-500",
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
    title: "Veo Mastery Guide",
    icon: Video,
    iconBg: "bg-gradient-to-br from-purple-500 to-pink-500",
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
    title: "Gemini Mastery Guide",
    icon: Sparkles,
    iconBg: "bg-gradient-to-br from-blue-500 to-indigo-500",
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
    title: "Grok Mastery Guide",
    icon: Bot,
    iconBg: "bg-gradient-to-br from-slate-600 to-slate-800",
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
    title: "AI Agents Mastery Guide",
    icon: Layers,
    iconBg: "bg-gradient-to-br from-orange-500 to-red-500",
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
    title: "Prompt Engineering Guide",
    icon: BookOpen,
    iconBg: "bg-gradient-to-br from-amber-500 to-yellow-500",
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
    title: "Claude Mastery Guide",
    icon: Bot,
    iconBg: "bg-gradient-to-br from-orange-400 to-orange-600",
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
    <section className="py-12 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-8">
          <Gift className="w-6 h-6 text-black" />
          <h2 className="text-xl md:text-2xl font-bold text-black">Free Products &gt;</h2>
        </div>

        {/* Products Grid - 4 columns on lg */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map((product, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative group flex flex-col"
            >
              {/* NEW Badge */}
              {product.isNew && (
                <div className="absolute top-3 right-3 bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  NEW!
                </div>
              )}

              {/* Icon */}
              <div className={`w-12 h-12 ${product.iconBg} rounded-xl flex items-center justify-center mb-3`}>
                <product.icon className="w-6 h-6 text-white" />
              </div>

              {/* Notion Badge */}
              <div className="bg-black text-white text-[10px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 w-fit mb-3">
                <span className="font-medium">Made for</span>
                <span className="font-bold">Notion</span>
              </div>

              {/* Title */}
              <h3 className="text-base font-bold text-black mb-3 leading-tight">{product.title}</h3>

              {/* Delivery Note */}
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">DELIVERED VIA NOTION</p>

              {/* Features */}
              <ul className="space-y-1.5 mb-4 flex-grow">
                {product.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                    <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Price */}
              <div className="mb-3">
                <span className="text-xl font-bold text-green-600">{product.price}</span>
              </div>

              {/* CTA Button */}
              <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm">
                Get Free Access
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Rating */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-black">({product.rating})</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-gray-500">({product.reviews})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FreeProductsSection;
