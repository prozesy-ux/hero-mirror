import { Check, Star, ArrowRight, Puzzle, Zap, Settings, FolderOpen } from 'lucide-react';

const products = [
  {
    title: "n8n Automations Bundle",
    icon: Zap,
    iconBg: "bg-gradient-to-br from-orange-500 to-red-500",
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
    title: "Custom GPTs Toolkit",
    icon: Settings,
    iconBg: "bg-gradient-to-br from-green-500 to-emerald-500",
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
    title: "ChatGPT Custom Instructions Pack",
    icon: Puzzle,
    iconBg: "bg-gradient-to-br from-blue-500 to-indigo-500",
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
    title: "5000+ Top AI Tools Directory",
    icon: FolderOpen,
    iconBg: "bg-gradient-to-br from-purple-500 to-violet-500",
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
  return (
    <section className="py-12 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-8">
          <Puzzle className="w-6 h-6 text-black" />
          <h2 className="text-xl md:text-2xl font-bold text-black">Add-ons &gt;</h2>
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
              <div className="flex items-center gap-2 mb-3">
                <span className="text-gray-400 line-through text-sm">${product.originalPrice}</span>
                <span className="text-xl font-bold text-black">${product.price}</span>
              </div>

              {/* CTA Button */}
              <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm">
                Learn More
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

export default AddonsSection;
