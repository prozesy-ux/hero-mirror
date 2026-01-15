import { Search } from "lucide-react";
import heroBackground from "@/assets/hero-background.webp";

const modelTags = [
  "ChatGPT Image",
  "Midjourney",
  "SeedEdit",
  "Seedream 4",
  "Nano Banana",
  "Veo",
  "FLUX",
  "Sora",
];

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-black text-white">
      {/* Background Image */}
      <img
        src={heroBackground}
        alt="Hero background"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      {/* Gradient Overlay */}
      <div className="hero-gradient-overlay absolute inset-0" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-4 py-24 text-center md:py-32">
        {/* Title */}
        <h1 className="mb-4 text-5xl font-bold tracking-tight text-white md:text-6xl lg:text-7xl">
          Uptoza
        </h1>

        {/* Subtitle */}
        <h2 className="mb-4 text-xl font-medium text-white/70 md:text-2xl">
          AI Marketplace
        </h2>

        {/* Description */}
        <p className="mb-10 max-w-2xl text-base leading-relaxed text-white/60 md:text-lg">
          Search millions of AI prompts for Midjourney, Stable Diffusion, Sora,
          and every leading generative model. Discover hand-picked inspiration
          from the Uptoza community.
        </p>

        {/* Search Bar */}
        <div className="mb-8 w-full max-w-xl">
          <div className="relative flex items-center overflow-hidden rounded-full bg-white shadow-2xl shadow-black/20">
            <Search className="ml-4 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for prompts, models, or inspiration..."
              className="flex-1 bg-transparent px-4 py-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
            <button className="mr-1.5 rounded-full bg-gray-100 px-6 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-200">
              Search
            </button>
          </div>
        </div>

        {/* Search by Model */}
        <div className="flex flex-col items-center gap-4">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">
            Search by model
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            {modelTags.map((tag) => (
              <a
                key={tag}
                href="#"
                className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/20"
              >
                {tag}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
