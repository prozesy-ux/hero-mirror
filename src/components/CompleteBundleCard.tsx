import { Check, Star, ArrowRight, MessageSquare, Image, Sparkles, Zap, Bot } from 'lucide-react';

const CompleteBundleCard = () => {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-3xl p-8 md:p-12 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-4 right-4 md:top-8 md:right-8">
            <Zap className="w-12 h-12 text-yellow-400 fill-yellow-400" />
          </div>
          
          {/* AI Tool Icons */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <Image className="w-5 h-5 text-white" />
            </div>
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-black text-white text-xs px-3 py-1 rounded-full">
              Made for Notion
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-2">
            The Complete
            <br />
            <span className="bg-yellow-400 px-2">AI Bundle</span>
          </h2>
          
          <p className="text-gray-500 uppercase text-sm tracking-wider mb-6">UNLOCKS ALL PRODUCTS</p>

          <p className="text-gray-600 mb-8 max-w-xl">
            The Essential Toolkit for Businesses - Mastering Copywriting, Marketing, No-Code Automation, Business Development & Brand Visuals In One Click.
          </p>

          <p className="text-sm text-gray-500 mb-4">Loved by Business Owners</p>

          {/* CTA Button */}
          <button className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-4 px-8 rounded-lg flex items-center gap-2 transition-colors mb-6">
            Get Lifetime Access
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Rating */}
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-black">4.9</span>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-gray-500">(1k)</span>
            {/* Avatar group placeholder */}
            <div className="flex -space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full border-2 border-white" />
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full border-2 border-white" />
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full border-2 border-white" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompleteBundleCard;
