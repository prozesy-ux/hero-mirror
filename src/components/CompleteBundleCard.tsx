import { Star, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import madeForNotion from '@/assets/made-for-notion.avif';
import chatgptLogo from '@/assets/chatgpt-logo.avif';
import midjourneyLogo from '@/assets/midjourney-logo.avif';
import geminiLogo from '@/assets/gemini-logo.avif';
import flashIcon from '@/assets/flash-icon.avif';
import chatgptIcon from '@/assets/chatgpt-icon.svg';
import starsIcon from '@/assets/stars.svg';

const CompleteBundleCard = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();

  const handleGetBundle = () => {
    if (isAuthenticated) {
      navigate('/dashboard/prompts');
    } else {
      localStorage.setItem('pendingBundlePrompts', 'true');
      navigate('/signin');
    }
  };

  return (
    <section className="py-8 md:py-12 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 relative overflow-hidden flex flex-col lg:flex-row gap-6">
          {/* Left Side - Content */}
          <div className="flex-1">
            {/* AI Tool Icons */}
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center p-1.5">
                <img src={chatgptIcon} alt="ChatGPT" className="w-full h-full invert" />
              </div>
              <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center p-1">
                <img src={chatgptLogo} alt="ChatGPT" className="w-full h-full rounded" />
              </div>
              <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center p-1">
                <img src={midjourneyLogo} alt="Midjourney" className="w-full h-full rounded" />
              </div>
              <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center p-1">
                <img src={geminiLogo} alt="Gemini" className="w-full h-full rounded" />
              </div>
              <img src={madeForNotion} alt="Made for Notion" className="h-6" />
            </div>

            {/* Title */}
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-black mb-0 leading-tight">
              The Complete
            </h2>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3">
              <span className="bg-yellow-400 px-3 py-0.5 rounded-lg">AI Bundle</span>
            </h2>
            
            <p className="text-gray-400 uppercase text-[10px] tracking-wider mb-3 font-medium">UNLOCKS ALL PRODUCTS</p>

            <p className="text-gray-600 mb-5 text-sm leading-relaxed max-w-lg">
              The Essential Toolkit for Businesses - Mastering Copywriting, Marketing, No-Code Automation, Business Development & Brand Visuals In One Click.
            </p>

            <p className="text-[10px] text-gray-400 mb-3">Loved by Business Owners</p>

            {/* CTA Button */}
            <button 
              onClick={handleGetBundle}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-colors text-sm mb-4"
            >
              Get Lifetime Access
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Rating */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-black">4.9</span>
              <img src={starsIcon} alt="Stars" className="h-4" />
              <span className="text-gray-400 text-xs">(1k)</span>
              {/* Avatar group */}
              <div className="flex -space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full border-2 border-white" />
                <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full border-2 border-white" />
                <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full border-2 border-white" />
              </div>
            </div>
          </div>

          {/* Right Side - Product Preview Card */}
          <div className="lg:w-72 flex-shrink-0 relative">
            {/* Decorative cloud */}
            <div className="absolute -top-4 -right-4 opacity-20">
              <svg width="60" height="45" viewBox="0 0 80 60" fill="none">
                <ellipse cx="40" cy="40" rx="35" ry="20" fill="currentColor" className="text-gray-300"/>
                <ellipse cx="25" cy="35" rx="20" ry="15" fill="currentColor" className="text-gray-300"/>
                <ellipse cx="55" cy="35" rx="20" ry="15" fill="currentColor" className="text-gray-300"/>
              </svg>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg">
              {/* Browser dots */}
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <div className="flex-1 bg-gray-100 rounded-full h-4 mx-2 flex items-center px-2">
                  <span className="text-[8px] text-gray-400">prompthero.com</span>
                </div>
              </div>

              {/* App Icons */}
              <div className="flex gap-1 mb-2">
                <img src={chatgptLogo} alt="ChatGPT" className="w-6 h-6 rounded" />
                <img src={midjourneyLogo} alt="Midjourney" className="w-6 h-6 rounded" />
                <img src={geminiLogo} alt="Gemini" className="w-6 h-6 rounded" />
              </div>

              <h4 className="text-xs font-bold text-black mb-2">The Complete AI Bundle + Lifetime Updates</h4>

              {/* ChatGPT Section */}
              <div className="mb-2">
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-3 h-3 bg-green-500 rounded" />
                  <span className="text-[10px] font-semibold text-black">ChatGPT Mega-Prompts:</span>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-2 py-1 flex items-center gap-1">
                  <div className="w-2.5 h-2.5 bg-yellow-400 rounded" />
                  <span className="text-[9px] text-black">ChatGPT Mega-Prompt Bundle [2K+ Prompts]</span>
                  <span className="text-[7px] bg-red-500 text-white px-1 rounded font-bold ml-auto">NEW!</span>
                </div>
              </div>

              {/* Midjourney Section */}
              <div className="mb-2">
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-3 h-3 bg-purple-500 rounded" />
                  <span className="text-[10px] font-semibold text-black">Midjourney Prompts:</span>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 flex items-center gap-1">
                  <div className="w-2.5 h-2.5 bg-gray-300 rounded" />
                  <span className="text-[9px] text-gray-600">Midjourney Prompt Bundle [10K+ Prompts]</span>
                </div>
              </div>

              {/* Add-ons Section */}
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-3 h-3 bg-blue-500 rounded" />
                  <span className="text-[10px] font-semibold text-black">Add-ons:</span>
                </div>
                <div className="space-y-0.5">
                  <div className="bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-300 rounded" />
                    <span className="text-[8px] text-gray-600">Custom GPTs Toolkit</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-300 rounded" />
                    <span className="text-[8px] text-gray-600">ChatGPT Custom Instructions Pack</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-300 rounded" />
                    <span className="text-[8px] text-gray-600">5000+ Top AI Tools Directory</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative Lightning */}
          <div className="absolute -right-6 top-1/4 hidden xl:block">
            <img src={flashIcon} alt="Flash" className="w-16 h-16" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompleteBundleCard;
