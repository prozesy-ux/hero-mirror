import { Play, Megaphone, PenTool, Video, Sparkles, Palette } from 'lucide-react';

const audiences = [
  {
    title: 'YouTubers',
    icon: Play,
    description: 'Create viral videos that get millions of views',
    features: ['Video Script Templates', 'Thumbnail Concepts', 'SEO Title Generator', 'Description Templates'],
    gradient: 'from-red-500 to-red-600',
    popular: true,
  },
  {
    title: 'Content Creators',
    icon: PenTool,
    description: 'Never run out of content ideas again',
    features: ['Blog Post Outlines', 'Caption Templates', 'Hashtag Strategies', 'Content Calendars'],
    gradient: 'from-purple-500 to-violet-600',
    popular: false,
  },
  {
    title: 'Marketers',
    icon: Megaphone,
    description: 'Convert more leads with AI-powered copy',
    features: ['Ad Copy Templates', 'Email Sequences', 'Landing Page Copy', 'Sales Funnels'],
    gradient: 'from-blue-500 to-cyan-600',
    popular: true,
  },
  {
    title: 'TikTokers',
    icon: Video,
    description: 'Go viral with trending hooks and scripts',
    features: ['Viral Hook Templates', 'Trending Audio Ideas', 'Duet Concepts', 'Challenge Scripts'],
    gradient: 'from-pink-500 to-rose-600',
    popular: true,
  },
  {
    title: 'AI Video Creators',
    icon: Sparkles,
    description: 'Master Sora, Runway, and more',
    features: ['Sora Prompts', 'Runway Templates', 'Pika Labs Scripts', 'Video-to-Video Guides'],
    gradient: 'from-amber-500 to-orange-600',
    popular: false,
  },
  {
    title: 'Designers',
    icon: Palette,
    description: 'Create stunning visuals with AI',
    features: ['Midjourney Styles', 'DALL-E Techniques', 'Brand Asset Prompts', 'Logo Concepts'],
    gradient: 'from-green-500 to-emerald-600',
    popular: false,
  },
];

const AudienceNiches = () => {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-black text-white text-xs font-semibold rounded-full mb-4 uppercase tracking-wider">
            Built For You
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
            Prompts for Every Creator Type
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Whether you're a YouTuber, marketer, or TikToker — we've got the perfect prompts for your needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {audiences.map((audience, index) => (
            <div
              key={index}
              className="group relative bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 cursor-pointer overflow-hidden"
            >
              {audience.popular && (
                <div className="absolute top-4 right-4 px-2 py-1 bg-black text-white text-xs font-bold rounded-full animate-pulse">
                  POPULAR
                </div>
              )}

              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${audience.gradient} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                <audience.icon className="w-7 h-7 text-white" />
              </div>

              <h3 className="font-bold text-black text-xl mb-2">{audience.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{audience.description}</p>

              <div className="space-y-2">
                {audience.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
                    <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${audience.gradient}`} />
                    {feature}
                  </div>
                ))}
              </div>

              <button className={`mt-6 w-full py-3 rounded-xl bg-gradient-to-r ${audience.gradient} text-white font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0`}>
                Explore Prompts
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AudienceNiches;
