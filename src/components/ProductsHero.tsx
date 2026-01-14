import { Zap } from 'lucide-react';

const ProductsHero = () => {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4">
          The Biggest Collection
          <br />
          of <span className="bg-yellow-400 px-3 py-1 rounded-lg">AI Resources</span>
        </h1>
        <p className="text-gray-600 text-lg">by PromptHero</p>
      </div>
    </section>
  );
};

export default ProductsHero;
