import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'YouTuber • 500K Subscribers',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    content: 'These prompts saved me hours every week! My video scripts are now 10x better and my engagement has doubled.',
    rating: 5,
  },
  {
    name: 'Michael Chen',
    role: 'Digital Marketer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    content: 'Best investment I\'ve made for my agency. The ad copy prompts alone have generated millions in revenue for our clients.',
    rating: 5,
  },
  {
    name: 'Emily Rodriguez',
    role: 'TikTok Creator • 1M Followers',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    content: 'I went viral 3 times in one month using these hook templates. Absolutely game-changing for short-form content!',
    rating: 5,
  },
  {
    name: 'David Park',
    role: 'AI Artist',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    content: 'The Midjourney prompts are insanely detailed. I\'ve created artwork that\'s been featured in major galleries.',
    rating: 5,
  },
  {
    name: 'Lisa Thompson',
    role: 'Content Strategist',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
    content: 'From blog posts to social media, these prompts cover everything. My content calendar is always full now.',
    rating: 5,
  },
  {
    name: 'James Wilson',
    role: 'Startup Founder',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    content: 'Used the copywriting prompts for our entire launch. We hit $100K in the first month. Worth every penny!',
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-20 px-4 bg-black overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-white/10 text-white text-xs font-semibold rounded-full mb-4 uppercase tracking-wider">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Loved by 50,000+ Creators
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            See what our community has to say about their results
          </p>
        </div>

        {/* Scrolling testimonials */}
        <div className="relative">
          <div className="flex gap-6 animate-scroll">
            {[...testimonials, ...testimonials].map((testimonial, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-80 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-white">{testimonial.name}</h4>
                    <p className="text-gray-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>

                <div className="flex gap-1 mb-3">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>

                <p className="text-gray-300 text-sm leading-relaxed">"{testimonial.content}"</p>
              </div>
            ))}
          </div>

          {/* Gradient overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black to-transparent pointer-events-none" />
        </div>
      </div>

      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};

export default TestimonialsSection;
