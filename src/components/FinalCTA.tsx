import { Zap, ArrowRight } from 'lucide-react';
import { useCountdown } from '@/hooks/useCountdown';

const FinalCTA = () => {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 3);
  
  const { hours, minutes, seconds } = useCountdown(targetDate);

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-bold rounded-full mb-6 animate-pulse">
          <Zap className="w-4 h-4" />
          OFFER EXPIRES IN {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>

        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
          Start Creating<br />
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Mind-Blowing Content
          </span><br />
          Today
        </h2>

        <p className="text-gray-400 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
          Join 50,000+ creators who are already using our premium prompts to save time and create better content.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button className="group px-8 py-4 bg-white text-black font-bold text-lg rounded-full hover:bg-gray-100 transition-all duration-300 flex items-center gap-2">
            Get Lifetime Access - $290
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <span className="text-gray-500 text-sm">
            <span className="line-through">$300</span> • Save $10 Today
          </span>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-6 text-gray-400 text-sm">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full" />
            Instant Download
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full" />
            Lifetime Updates
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full" />
            30-Day Guarantee
          </span>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
