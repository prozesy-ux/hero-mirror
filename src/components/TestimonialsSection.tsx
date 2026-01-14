import { Star } from 'lucide-react';

const testimonials = [
  {
    name: "Joshua Vandercar",
    handle: "@UaMV",
    avatar: "JV",
    platform: "twitter",
    quote: "With these prompts I've not felt the need to check out any other tool lately. Game-changing for my content workflow!",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    name: "Marco N.",
    role: "Content Creator",
    avatar: "MN",
    platform: "g2",
    quote: "Having a lot of AI prompts close to hand. I don't need to be back and forth switching between tools. Saving me time on content creation!",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    name: "Jacob Sweeney",
    role: "YouTuber",
    avatar: "JS",
    platform: "trustpilot",
    quote: "I thought the price was very reasonable being you get access to so many prompt templates. Best investment for my channel.",
    gradient: "from-green-500 to-emerald-500"
  },
  {
    name: "Mike S.",
    role: "Freelancer",
    avatar: "MS",
    platform: "g2",
    quote: "I am a content creator so I need to work with both text and images. These prompts help me create complex campaigns in record time. I am honestly stunned.",
    gradient: "from-orange-500 to-red-500"
  },
  {
    name: "Jamie Smith",
    role: "Digital Marketer",
    avatar: "JS",
    platform: "trustpilot",
    quote: "This is the best of all worlds. Being able to access all of the major AI prompts. Create and collate custom templates easily.",
    gradient: "from-violet-500 to-purple-500"
  },
  {
    name: "Clint G.",
    role: "Marketing Manager",
    avatar: "CG",
    platform: "g2",
    quote: "The prompt library has access to multiple AI tools. You can set up separate workspaces and folders. Really liking this service for sure.",
    gradient: "from-pink-500 to-rose-500"
  },
  {
    name: "Cevon",
    role: "Content Strategist",
    avatar: "CE",
    platform: "twitter",
    quote: "This prompt library is DA BOMB. Seriously. Opened up whole new worlds for me. Simple to use. Imminently useful. Built for us creators!",
    gradient: "from-cyan-500 to-blue-500"
  },
  {
    name: "Gregory M.",
    role: "Agency Owner",
    avatar: "GM",
    platform: "g2",
    quote: "I use these prompts many times a day, they have become essential to me. Text prompts, image prompts - everything you can imagine!",
    gradient: "from-amber-500 to-orange-500"
  },
  {
    name: "Greg Goshorn",
    role: "Entrepreneur",
    avatar: "GG",
    platform: "trustpilot",
    quote: "An amazing tool for taking control of AI with tons of needed features like personas, saving prompts, and more…",
    gradient: "from-teal-500 to-green-500"
  },
  {
    name: "Clement",
    role: "Business Owner",
    avatar: "CL",
    platform: "trustpilot",
    quote: "These prompts have been super helpful with my business generally. The quality is outstanding!",
    gradient: "from-indigo-500 to-violet-500"
  },
  {
    name: "Steven Aaron",
    role: "Tech Consultant",
    avatar: "SA",
    platform: "g2",
    quote: "Complete variety of the latest AI prompts at your fingertips. It has constantly improved ever since I've been a user, making it an easy choice.",
    gradient: "from-rose-500 to-pink-500"
  },
  {
    name: "Donna Cravotta",
    role: "PR Strategist",
    avatar: "DC",
    platform: "twitter",
    quote: "I LOVE these prompts. I use them for so many things! One of our members calls it her Bestie. Her writing has improved 100%!",
    gradient: "from-emerald-500 to-teal-500"
  },
];

const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case 'twitter':
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      );
    case 'g2':
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 17.954c-1.627 1.627-3.794 2.524-6.106 2.524-2.312 0-4.479-.897-6.106-2.524C4.055 16.327 3.158 14.16 3.158 11.848c0-2.312.897-4.479 2.524-6.106C7.309 4.115 9.476 3.218 11.788 3.218c2.312 0 4.479.897 6.106 2.524 1.627 1.627 2.524 3.794 2.524 6.106 0 2.312-.897 4.479-2.524 6.106z"/>
        </svg>
      );
    case 'trustpilot':
      return (
        <Star className="w-4 h-4 fill-current" />
      );
    default:
      return null;
  }
};

const TestimonialsSection = () => {
  const scrollingTestimonials = [...testimonials, ...testimonials];

  return (
    <section className="py-20 px-4 bg-[#0a0a0f] overflow-hidden">
      <div className="max-w-6xl mx-auto mb-12 text-center">
        <span className="inline-block px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Reviews
        </span>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
          People Just Like You Love Our Prompts
        </h2>
        <div className="flex items-center justify-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          ))}
          <span className="ml-2 text-white font-semibold">5.0</span>
        </div>
        <p className="text-gray-400">
          Join 50,000+ creators who trust our prompts
        </p>
      </div>

      {/* Scrolling testimonials - Row 1 */}
      <div className="relative mb-6">
        <div className="flex animate-scroll-left gap-6">
          {scrollingTestimonials.slice(0, 12).map((testimonial, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-[350px] bg-[#12121a] border border-gray-800/50 rounded-2xl p-6 hover:border-gray-700/50 transition-colors"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-bold text-sm`}>
                  {testimonial.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-white font-semibold">{testimonial.name}</h4>
                    <span className="text-gray-500">
                      {getPlatformIcon(testimonial.platform)}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm">
                    {testimonial.handle || testimonial.role}
                  </p>
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                {testimonial.quote}
              </p>
            </div>
          ))}
        </div>
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#0a0a0f] to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#0a0a0f] to-transparent pointer-events-none z-10" />
      </div>

      {/* Scrolling testimonials - Row 2 (reverse direction) */}
      <div className="relative">
        <div className="flex animate-scroll-right gap-6">
          {scrollingTestimonials.slice(6, 18).map((testimonial, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-[350px] bg-[#12121a] border border-gray-800/50 rounded-2xl p-6 hover:border-gray-700/50 transition-colors"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-bold text-sm`}>
                  {testimonial.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-white font-semibold">{testimonial.name}</h4>
                    <span className="text-gray-500">
                      {getPlatformIcon(testimonial.platform)}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm">
                    {testimonial.handle || testimonial.role}
                  </p>
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                {testimonial.quote}
              </p>
            </div>
          ))}
        </div>
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#0a0a0f] to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#0a0a0f] to-transparent pointer-events-none z-10" />
      </div>

      <style>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @keyframes scroll-right {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0);
          }
        }
        .animate-scroll-left {
          animation: scroll-left 40s linear infinite;
        }
        .animate-scroll-right {
          animation: scroll-right 40s linear infinite;
        }
        .animate-scroll-left:hover,
        .animate-scroll-right:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};

export default TestimonialsSection;
