import { Check, Star, ArrowRight, Briefcase, ShoppingCart, GraduationCap, DollarSign, Megaphone, Rocket, Search, TrendingUp, Users, PenTool } from 'lucide-react';

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

// ChatGPT SVG Icon
const ChatGPTIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.0993 3.8558L12.6 8.3829l2.02-1.1638a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
  </svg>
);

const ChatGPTPromptsSection = () => {
  return (
    <section className="py-12 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-8">
          <ChatGPTIcon />
          <h2 className="text-xl md:text-2xl font-bold text-black">ChatGPT Mega-Prompts &gt;</h2>
        </div>

        {/* Products Grid - 5 columns on xl */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
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

export default ChatGPTPromptsSection;
