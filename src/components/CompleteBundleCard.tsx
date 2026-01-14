import { Star, ArrowRight, MessageSquare, Image, Sparkles, Zap, Bot, Terminal } from 'lucide-react';

const CompleteBundleCard = () => {
  return (
    <section className="py-12 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-3xl p-8 md:p-10 relative overflow-hidden flex flex-col lg:flex-row gap-8">
          {/* Left Side - Content */}
          <div className="flex-1">
            {/* AI Tool Icons */}
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center">
                <Terminal className="w-4 h-4 text-green-400" />
              </div>
              <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center">
                <Image className="w-4 h-4 text-white" />
              </div>
              <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-black text-white text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1">
                <span className="font-medium">Made for</span>
                <span className="font-bold">Notion</span>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-1 leading-tight">
              The Complete
            </h2>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-yellow-400 px-3 py-0.5 rounded-lg">AI Bundle</span>
            </h2>
            
            <p className="text-gray-400 uppercase text-xs tracking-wider mb-4 font-medium">UNLOCKS ALL PRODUCTS</p>

            <p className="text-gray-600 mb-6 text-sm leading-relaxed max-w-lg">
              The Essential Toolkit for Businesses - Mastering Copywriting, Marketing, No-Code Automation, Business Development & Brand Visuals In One Click.
            </p>

            <p className="text-xs text-gray-400 mb-4">Loved by Business Owners</p>

            {/* CTA Button */}
            <button className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3.5 px-8 rounded-xl flex items-center gap-2 transition-colors text-sm mb-6">
              Get Lifetime Access
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Rating */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-base font-bold text-black">4.9</span>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-gray-400 text-sm">(1k)</span>
              {/* Avatar group */}
              <div className="flex -space-x-2">
                <div className="w-7 h-7 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full border-2 border-white" />
                <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full border-2 border-white" />
                <div className="w-7 h-7 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full border-2 border-white" />
              </div>
            </div>
          </div>

          {/* Right Side - Product Preview Card */}
          <div className="lg:w-80 flex-shrink-0">
            {/* Decorative cloud */}
            <div className="absolute top-4 right-4 hidden lg:block opacity-20">
              <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
                <ellipse cx="40" cy="40" rx="35" ry="20" fill="currentColor" className="text-gray-300"/>
                <ellipse cx="25" cy="35" rx="20" ry="15" fill="currentColor" className="text-gray-300"/>
                <ellipse cx="55" cy="35" rx="20" ry="15" fill="currentColor" className="text-gray-300"/>
              </svg>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-lg">
              {/* Browser dots */}
              <div className="flex items-center gap-1.5 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <div className="flex-1 bg-gray-100 rounded-full h-5 mx-2 flex items-center px-2">
                  <span className="text-[9px] text-gray-400">prompthero.com</span>
                </div>
              </div>

              {/* App Icons */}
              <div className="flex gap-1 mb-3">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg" />
                ))}
              </div>

              <h4 className="text-sm font-bold text-black mb-3">The Complete AI Bundle + Lifetime Updates</h4>

              {/* ChatGPT Section */}
              <div className="mb-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-3.5 h-3.5 bg-green-500 rounded" />
                  <span className="text-xs font-semibold text-black">ChatGPT Mega-Prompts:</span>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-2 py-1.5 flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-400 rounded" />
                  <span className="text-[10px] text-black">ChatGPT Mega-Prompt Bundle [2K+ Prompts]</span>
                  <span className="text-[8px] bg-red-500 text-white px-1 rounded font-bold ml-auto">NEW!</span>
                </div>
              </div>

              {/* Midjourney Section */}
              <div className="mb-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-3.5 h-3.5 bg-purple-500 rounded" />
                  <span className="text-xs font-semibold text-black">Midjourney Prompts:</span>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-300 rounded" />
                  <span className="text-[10px] text-gray-600">Midjourney Prompt Bundle [10K+ Prompts]</span>
                </div>
              </div>

              {/* Add-ons Section */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-3.5 h-3.5 bg-blue-500 rounded" />
                  <span className="text-xs font-semibold text-black">Add-ons:</span>
                </div>
                <div className="space-y-1">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 flex items-center gap-1">
                    <div className="w-2.5 h-2.5 bg-gray-300 rounded" />
                    <span className="text-[9px] text-gray-600">Custom GPTs Toolkit</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 flex items-center gap-1">
                    <div className="w-2.5 h-2.5 bg-gray-300 rounded" />
                    <span className="text-[9px] text-gray-600">ChatGPT Custom Instructions Pack</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 flex items-center gap-1">
                    <div className="w-2.5 h-2.5 bg-gray-300 rounded" />
                    <span className="text-[9px] text-gray-600">5000+ Top AI Tools Directory</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative Lightning */}
          <div className="absolute -right-4 top-1/4 hidden xl:block">
            <Zap className="w-20 h-20 text-black fill-black" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompleteBundleCard;
