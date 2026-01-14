import { Instagram, Youtube, Twitter, Linkedin, Facebook } from 'lucide-react';

const platforms = [
  { 
    name: 'YouTube', 
    icon: Youtube, 
    prompts: 250,
    color: 'bg-red-500',
    categories: ['Video Scripts', 'Thumbnails', 'SEO Titles', 'Descriptions']
  },
  { 
    name: 'TikTok', 
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
      </svg>
    ),
    prompts: 200,
    color: 'bg-black',
    categories: ['Viral Hooks', 'Trending Audio', 'Captions', 'Hashtags']
  },
  { 
    name: 'Instagram', 
    icon: Instagram, 
    prompts: 180,
    color: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400',
    categories: ['Reels Scripts', 'Carousel Ideas', 'Bio Templates', 'Story Prompts']
  },
  { 
    name: 'Twitter/X', 
    icon: Twitter, 
    prompts: 150,
    color: 'bg-black',
    categories: ['Thread Ideas', 'Viral Tweets', 'Engagement Hooks', 'Reply Templates']
  },
  { 
    name: 'LinkedIn', 
    icon: Linkedin, 
    prompts: 120,
    color: 'bg-blue-600',
    categories: ['Post Templates', 'Headlines', 'Article Intros', 'Connection Messages']
  },
  { 
    name: 'Facebook', 
    icon: Facebook, 
    prompts: 100,
    color: 'bg-blue-500',
    categories: ['Ad Copy', 'Group Posts', 'Event Descriptions', 'Page Content']
  },
];

const SocialMediaSection = () => {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-semibold rounded-full mb-4 uppercase tracking-wider">
            1000+ Social Prompts
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
            Dominate Every Social Platform
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Ready-to-use prompts for viral content, engagement, and growth on all major platforms
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {platforms.map((platform, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-xl cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 ${platform.color} rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300`}>
                  <platform.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-black text-lg">{platform.name}</h3>
                  <span className="text-sm text-gray-500">{platform.prompts}+ prompts</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {platform.categories.map((cat, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full group-hover:bg-gray-200 transition-colors"
                  >
                    {cat}
                  </span>
                ))}
              </div>

              <button className="mt-4 w-full py-2 text-sm font-medium text-gray-600 hover:text-black transition-colors flex items-center justify-center gap-2 group-hover:gap-3">
                Explore Prompts <span>→</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialMediaSection;
