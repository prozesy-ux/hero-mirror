import { Check, Star, ArrowRight, MessageSquare, Briefcase, ShoppingCart, GraduationCap, DollarSign, Megaphone, Rocket, Search, TrendingUp, Users, PenTool } from 'lucide-react';

const products = [
  {
    title: "Mega-Prompts for Business",
    icon: Briefcase,
    iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
    features: [
      "200+ AI prompts for business",
      "How-to guides & tips",
      "Cut costs by 40%"
    ],
    originalPrice: 67,
    price: 37,
    rating: 4.8,
    reviews: 230,
    isNew: true,
  },
  {
    title: "Mega-Prompts for E-Commerce",
    icon: ShoppingCart,
    iconBg: "bg-gradient-to-br from-green-500 to-green-600",
    features: [
      "200+ AI prompts for e-commerce",
      "How-to guides & tips",
      "Boost sales by 50%"
    ],
    originalPrice: 67,
    price: 37,
    rating: 4.9,
    reviews: 115,
    isNew: true,
  },
  {
    title: "Mega-Prompts for Education",
    icon: GraduationCap,
    iconBg: "bg-gradient-to-br from-purple-500 to-purple-600",
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
    title: "AI Prompts for Finance",
    icon: DollarSign,
    iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600",
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
    title: "Mega-Prompts for Marketing",
    icon: Megaphone,
    iconBg: "bg-gradient-to-br from-orange-500 to-orange-600",
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
    title: "Mega-Prompts for Productivity",
    icon: Rocket,
    iconBg: "bg-gradient-to-br from-pink-500 to-pink-600",
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
    title: "Mega-Prompts for SEO",
    icon: Search,
    iconBg: "bg-gradient-to-br from-cyan-500 to-cyan-600",
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
    title: "Mega-Prompts for Sales",
    icon: TrendingUp,
    iconBg: "bg-gradient-to-br from-red-500 to-red-600",
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
    title: "Mega-Prompts for Solopreneurs",
    icon: Users,
    iconBg: "bg-gradient-to-br from-violet-500 to-violet-600",
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
  {
    title: "Mega-Prompts for Writing",
    icon: PenTool,
    iconBg: "bg-gradient-to-br from-indigo-500 to-indigo-600",
    features: [
      "200+ AI prompts for writing",
      "How-to guides & tips",
      "Boost your writing in seconds"
    ],
    originalPrice: 67,
    price: 37,
    rating: 4.7,
    reviews: 250,
    isNew: true,
  },
];

const ChatGPTPromptsSection = () => {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-8">
          <MessageSquare className="w-6 h-6 text-black" />
          <h2 className="text-2xl font-bold text-black">ChatGPT Mega-Prompts &gt;</h2>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative group"
            >
              {/* NEW Badge */}
              {product.isNew && (
                <div className="absolute top-4 right-4 bg-black text-white text-xs font-bold px-2 py-1 rounded">
                  NEW!
                </div>
              )}

              {/* Icon */}
              <div className={`w-14 h-14 ${product.iconBg} rounded-xl flex items-center justify-center mb-4`}>
                <product.icon className="w-7 h-7 text-white" />
              </div>

              {/* Notion Badge */}
              <div className="bg-black text-white text-xs px-3 py-1 rounded-full inline-block mb-3">
                Made for Notion
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-black mb-4">{product.title}</h3>

              {/* Delivery Note */}
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">DELIVERED VIA NOTION</p>

              {/* Features */}
              <ul className="space-y-2 mb-4">
                {product.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Price */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-gray-400 line-through text-sm">${product.originalPrice}.00</span>
                <span className="text-2xl font-bold text-black">${product.price}.00</span>
              </div>

              {/* CTA Button */}
              <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                Learn More
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Rating */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-black">({product.rating})</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                <span className="text-sm text-gray-500">({product.reviews})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ChatGPTPromptsSection;
