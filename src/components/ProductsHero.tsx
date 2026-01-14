import { Zap } from 'lucide-react';

const ProductsHero = () => {
  return (
    <section className="py-20 px-4 bg-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto text-center relative">
        {/* Decorative God Character - Left */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 hidden lg:block">
          <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-6xl">
            🧔
          </div>
        </div>

        {/* Decorative Lightning - Right */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden lg:block">
          <Zap className="w-24 h-24 text-black fill-black" />
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4 leading-tight">
          The Biggest Collection
          <br />
          of <span className="bg-yellow-400 px-4 py-1 rounded-lg inline-block">AI Resources</span>
        </h1>
        <p className="text-gray-500 text-lg font-medium">by PromptHero</p>
      </div>
    </section>
  );
};

export default ProductsHero;
