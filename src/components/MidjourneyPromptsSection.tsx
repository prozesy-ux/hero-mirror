import { Check, Star, ArrowRight, Building, Palette, Megaphone, Camera, Globe } from 'lucide-react';

const products = [
  {
    title: "Midjourney Prompt Bundle",
    iconBg: "bg-gradient-to-br from-purple-500 to-pink-500",
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
    title: "Midjourney for Architecture",
    icon: Building,
    iconBg: "bg-gradient-to-br from-slate-500 to-slate-700",
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
    title: "Midjourney for Art & Design",
    icon: Palette,
    iconBg: "bg-gradient-to-br from-rose-500 to-orange-500",
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
    title: "Midjourney for Marketing",
    icon: Megaphone,
    iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500",
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
    title: "Midjourney for Photography",
    icon: Camera,
    iconBg: "bg-gradient-to-br from-amber-500 to-yellow-500",
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
    title: "Midjourney for Web Design",
    icon: Globe,
    iconBg: "bg-gradient-to-br from-green-500 to-teal-500",
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

// Midjourney boat icon
const MidjourneyIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M12 2L4 6v12l8 4 8-4V6l-8-4zm0 2.18l5.5 2.75L12 9.68 6.5 6.93 12 4.18zM5.5 8.06l5.5 2.75v7.13L5.5 15.19V8.06zm7 9.88V10.8l5.5-2.75v7.13L12.5 17.94z"/>
  </svg>
);

const MidjourneyPromptsSection = () => {
  return (
    <section className="py-12 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-8">
          <MidjourneyIcon />
          <h2 className="text-xl md:text-2xl font-bold text-black">Midjourney Prompts &gt;</h2>
        </div>

        {/* Products Grid - 6 columns on xl */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
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
                {product.icon ? (
                  <product.icon className="w-6 h-6 text-white" />
                ) : (
                  <MidjourneyIcon />
                )}
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
                <span className="text-gray-400 line-through text-sm">${product.originalPrice}.00</span>
                <span className="text-xl font-bold text-black">${product.price}.00</span>
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

export default MidjourneyPromptsSection;
