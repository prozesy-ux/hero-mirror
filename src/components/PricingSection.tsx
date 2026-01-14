import { Check, Zap, Clock, Shield, Download, Infinity } from 'lucide-react';
import { useCountdown } from '@/hooks/useCountdown';

const features = [
  { icon: Zap, text: '300+ AI Tool Prompts' },
  { icon: Download, text: '1000+ Social Media Prompts' },
  { icon: Infinity, text: 'Lifetime Access & Updates' },
  { icon: Shield, text: 'Premium Support' },
  { icon: Check, text: 'Exclusive Video Templates' },
  { icon: Check, text: 'New Prompts Added Weekly' },
];

const PricingSection = () => {
  // Set target date to 3 days from now
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 3);
  
  const { days, hours, minutes, seconds } = useCountdown(targetDate);

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-yellow-400/20 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-red-400/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">

        {/* Countdown Timer */}
        <div className="flex justify-center gap-4 mb-12">
          {[
            { value: days, label: 'Days' },
            { value: hours, label: 'Hours' },
            { value: minutes, label: 'Mins' },
            { value: seconds, label: 'Secs' },
          ].map((item, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-black text-white rounded-xl flex items-center justify-center text-2xl md:text-3xl font-bold shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                <span className="relative z-10">{String(item.value).padStart(2, '0')}</span>
              </div>
              <span className="text-xs text-gray-500 mt-2 block font-medium">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Pricing Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden relative">
          {/* Discount Badge */}
          <div className="absolute -top-1 -right-1 z-20">
            <div className="relative">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-2 font-bold text-sm rounded-bl-2xl rounded-tr-2xl shadow-lg animate-pulse">
                SAVE $10
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 blur-lg opacity-50" />
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div className="text-center mb-8">
              <span className="inline-block px-4 py-1 bg-black text-white text-xs font-bold rounded-full mb-4 uppercase tracking-wider">
                Lifetime Access
              </span>
              
              <div className="flex items-center justify-center gap-4 mb-2">
                <span className="text-2xl text-gray-400 line-through">$300</span>
                <span className="text-6xl md:text-7xl font-bold text-black">$290</span>
              </div>
              
              <p className="text-gray-500">One-time payment • No monthly fees</p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <button className="w-full py-4 bg-black text-white font-bold text-lg rounded-2xl hover:bg-gray-800 transition-all duration-300 relative overflow-hidden group">
              <span className="relative z-10 flex items-center justify-center gap-2">
                Get Instant Access
                <Zap className="w-5 h-5 group-hover:animate-pulse" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>

            <p className="text-center text-gray-400 text-sm mt-4">
              🔒 Secure checkout • Instant download • 30-day guarantee
            </p>
          </div>

          {/* Bottom Banner */}
          <div className="bg-black py-4 px-8 flex items-center justify-center gap-4 text-white text-sm">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              Trusted by 50,000+ creators
            </span>
            <span className="hidden md:block">•</span>
            <span className="hidden md:flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              Updated weekly
            </span>
          </div>
        </div>

      </div>
    </section>
  );
};

export default PricingSection;
