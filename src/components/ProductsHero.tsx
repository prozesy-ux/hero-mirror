import godMascot from '@/assets/god-mascot.avif';
import flashIcon from '@/assets/flash-icon.avif';

const ProductsHero = () => {
  return (
    <section className="py-16 md:py-20 px-4 bg-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto text-center relative">
        {/* Decorative God Character - Left */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 hidden lg:block">
          <img src={godMascot} alt="Mascot" className="w-28 h-28 object-contain" />
        </div>

        {/* Decorative Lightning - Right */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden lg:block">
          <img src={flashIcon} alt="Flash" className="w-20 h-20 object-contain" />
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4 leading-tight">
          The Biggest Collection
          <br />
          of <span className="bg-yellow-400 px-4 py-1 rounded-lg inline-block">AI Resources</span>
        </h1>
        <p className="text-gray-500 text-lg font-medium">by Uptoza</p>
      </div>
    </section>
  );
};

export default ProductsHero;
