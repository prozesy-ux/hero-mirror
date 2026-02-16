import { StoreSection, GlobalStyles } from './types';
import { 
  Star, Shield, Zap, Clock, ChevronDown, ChevronUp, 
  Play, ExternalLink, Instagram, Twitter, Youtube, Music 
} from 'lucide-react';
import { useState } from 'react';

interface Props {
  section: StoreSection;
  globalStyles: GlobalStyles;
  products?: any[];
  categories?: any[];
  isPreview?: boolean;
}

const SectionWrapper = ({ children, section, globalStyles }: { children: React.ReactNode; section: StoreSection; globalStyles: GlobalStyles }) => {
  const bgColor = section.settings.bgColor || globalStyles.backgroundColor;
  const textColor = section.settings.textColor || globalStyles.textColor;
  return (
    <div style={{ backgroundColor: bgColor, color: textColor, fontFamily: globalStyles.fontFamily }} className="w-full">
      {children}
    </div>
  );
};

// Hero Section
const HeroRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  const align = s.textAlign === 'left' ? 'text-left items-start' : s.textAlign === 'right' ? 'text-right items-end' : 'text-center items-center';
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div 
        className={`relative flex flex-col justify-center ${align} px-8 py-20 md:py-32 min-h-[300px]`}
        style={s.bgImage ? { backgroundImage: `url(${s.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      >
        {s.bgImage && <div className="absolute inset-0 bg-black/40" />}
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-3xl md:text-5xl font-bold mb-4" style={{ color: s.textColor || globalStyles.textColor }}>{s.heading}</h1>
          {s.subheading && <p className="text-lg md:text-xl opacity-80 mb-8">{s.subheading}</p>}
          {s.ctaText && (
            <a href={s.ctaLink || '#'} className="inline-block px-8 py-3 rounded-lg font-semibold transition-transform hover:scale-105" style={{ backgroundColor: globalStyles.primaryColor, color: s.bgColor || '#fff' }}>
              {s.ctaText}
            </a>
          )}
        </div>
      </div>
    </SectionWrapper>
  );
};

// Product Grid
const ProductGridRenderer = ({ section, globalStyles, products = [] }: Props) => {
  const s = section.settings;
  const cols = s.columns || 3;
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="px-6 py-12 max-w-6xl mx-auto" id="products">
        <h2 className="text-2xl font-bold mb-8">{s.title}</h2>
        <div className={`grid gap-4 grid-cols-1 sm:grid-cols-2 ${cols >= 3 ? 'lg:grid-cols-3' : ''} ${cols >= 4 ? 'xl:grid-cols-4' : ''}`}>
          {products.length > 0 ? products.slice(0, 12).map(p => (
            <div key={p.id} className="rounded-xl border p-4 hover:shadow-lg transition-shadow" style={{ borderColor: globalStyles.primaryColor + '20', backgroundColor: globalStyles.backgroundColor }}>
              {p.icon_url && <img src={p.icon_url} alt={p.name} className="w-full h-40 object-cover rounded-lg mb-3" />}
              <h3 className="font-semibold text-sm mb-1">{p.name}</h3>
              <p className="font-bold" style={{ color: globalStyles.primaryColor }}>${p.price}</p>
            </div>
          )) : (
            Array.from({ length: cols * 2 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-dashed p-4 h-48 flex items-center justify-center opacity-30">
                <span className="text-sm">Product {i + 1}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </SectionWrapper>
  );
};

// Featured Products
const FeaturedRenderer = ({ section, globalStyles, products = [] }: Props) => {
  const s = section.settings;
  const featuredProducts = s.productIds?.length > 0 
    ? products.filter(p => s.productIds.includes(p.id))
    : products.slice(0, s.columns || 3);
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="px-6 py-12 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-8">{s.title}</h2>
        <div className={`grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-${s.columns || 3}`}>
          {featuredProducts.length > 0 ? featuredProducts.map(p => (
            <div key={p.id} className="rounded-xl border p-4 hover:shadow-lg transition-shadow" style={{ borderColor: globalStyles.primaryColor + '30' }}>
              {p.icon_url && <img src={p.icon_url} alt={p.name} className="w-full h-48 object-cover rounded-lg mb-3" />}
              <h3 className="font-semibold mb-1">{p.name}</h3>
              <p className="font-bold" style={{ color: globalStyles.primaryColor }}>${p.price}</p>
            </div>
          )) : (
            Array.from({ length: s.columns || 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-dashed p-6 h-56 flex items-center justify-center opacity-30">
                <span>Featured {i + 1}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </SectionWrapper>
  );
};

// About
const AboutRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  const imgLeft = s.imagePosition === 'left';
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="px-6 py-12 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-8">{s.title}</h2>
        <div className={`flex flex-col md:flex-row gap-8 ${imgLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
          {s.imageUrl && (
            <div className="md:w-1/3">
              <img src={s.imageUrl} alt="About" className="rounded-xl w-full h-64 object-cover" />
            </div>
          )}
          <div className={s.imageUrl ? 'md:w-2/3' : 'w-full'}>
            <p className="text-base leading-relaxed whitespace-pre-wrap">{s.text}</p>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};

// FAQ
const FAQRenderer = ({ section, globalStyles }: Props) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const s = section.settings;
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="px-6 py-12 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center">{s.title}</h2>
        <div className="space-y-3">
          {(s.items || []).map((item: any, i: number) => (
            <div key={i} className="border rounded-lg overflow-hidden" style={{ borderColor: globalStyles.primaryColor + '20' }}>
              <button className="w-full flex items-center justify-between p-4 text-left font-medium" onClick={() => setOpenIndex(openIndex === i ? null : i)}>
                {item.question}
                {openIndex === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openIndex === i && <div className="px-4 pb-4 opacity-80 text-sm">{item.answer}</div>}
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};

// Video
const VideoRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  const getEmbedUrl = (url: string) => {
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    return url;
  };
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="px-6 py-12 max-w-4xl mx-auto">
        {s.title && <h2 className="text-2xl font-bold mb-8 text-center">{s.title}</h2>}
        {s.videoUrl ? (
          <div className="aspect-video rounded-xl overflow-hidden">
            <iframe src={getEmbedUrl(s.videoUrl)} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope" />
          </div>
        ) : (
          <div className="aspect-video rounded-xl border border-dashed flex items-center justify-center opacity-30">
            <Play className="w-12 h-12" />
          </div>
        )}
      </div>
    </SectionWrapper>
  );
};

// Gallery
const GalleryRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="px-6 py-12 max-w-6xl mx-auto">
        {s.title && <h2 className="text-2xl font-bold mb-8">{s.title}</h2>}
        <div className={`grid gap-3 grid-cols-2 md:grid-cols-${s.columns || 3}`}>
          {(s.images || []).length > 0 ? s.images.map((img: string, i: number) => (
            <img key={i} src={img} alt={`Gallery ${i + 1}`} className="rounded-lg w-full h-48 object-cover" />
          )) : (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-dashed h-48 flex items-center justify-center opacity-30">
                🖼️
              </div>
            ))
          )}
        </div>
      </div>
    </SectionWrapper>
  );
};

// Testimonials
const TestimonialsRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="px-6 py-12 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center">{s.title}</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(s.items || []).map((item: any, i: number) => (
            <div key={i} className="rounded-xl p-6 border" style={{ borderColor: globalStyles.primaryColor + '20' }}>
              <div className="flex gap-1 mb-3">
                {Array.from({ length: item.rating || 5 }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm mb-4 opacity-80 italic">"{item.text}"</p>
              <p className="font-semibold text-sm">— {item.name}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};

// CTA
const CTARenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  return (
    <div className="w-full px-6 py-16 text-center" style={{ backgroundColor: s.bgColor || globalStyles.primaryColor, color: s.textColor || '#ffffff' }}>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">{s.heading}</h2>
        {s.subheading && <p className="text-lg opacity-80 mb-8">{s.subheading}</p>}
        {s.buttonText && (
          <a href={s.buttonLink || '#'} className="inline-block px-8 py-3 rounded-lg font-semibold transition-transform hover:scale-105" style={{ backgroundColor: s.textColor || '#fff', color: s.bgColor || globalStyles.primaryColor }}>
            {s.buttonText}
          </a>
        )}
      </div>
    </div>
  );
};

// Stats
const StatsRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="px-6 py-12 max-w-4xl mx-auto">
        <div className={`grid gap-8 grid-cols-2 md:grid-cols-${Math.min((s.items || []).length, 4)}`}>
          {(s.items || []).map((item: any, i: number) => (
            <div key={i} className="text-center">
              <div className="text-3xl mb-2">{item.icon}</div>
              <div className="text-3xl font-bold mb-1" style={{ color: globalStyles.primaryColor }}>{item.value}</div>
              <div className="text-sm opacity-70">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};

// Social Links
const SocialLinksRenderer = ({ section, globalStyles }: Props) => {
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="px-6 py-8 flex justify-center gap-6">
        <Instagram className="w-6 h-6 opacity-60 hover:opacity-100 cursor-pointer transition-opacity" />
        <Twitter className="w-6 h-6 opacity-60 hover:opacity-100 cursor-pointer transition-opacity" />
        <Youtube className="w-6 h-6 opacity-60 hover:opacity-100 cursor-pointer transition-opacity" />
        <Music className="w-6 h-6 opacity-60 hover:opacity-100 cursor-pointer transition-opacity" />
      </div>
    </SectionWrapper>
  );
};

// Category Showcase
const CategoryRenderer = ({ section, globalStyles, categories = [] }: Props) => {
  const s = section.settings;
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="px-6 py-12 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-8">{s.title}</h2>
        <div className={`grid gap-4 grid-cols-2 md:grid-cols-${s.columns || 3}`}>
          {categories.length > 0 ? categories.map(c => (
            <div key={c.id} className="rounded-xl border p-6 text-center hover:shadow-md transition-shadow cursor-pointer" style={{ borderColor: globalStyles.primaryColor + '20' }}>
              <div className="text-2xl mb-2">{c.icon || '📁'}</div>
              <h3 className="font-semibold">{c.name}</h3>
            </div>
          )) : (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-dashed p-6 text-center opacity-30">Category {i + 1}</div>
            ))
          )}
        </div>
      </div>
    </SectionWrapper>
  );
};

// Trust Badges
const TrustBadgesRenderer = ({ section, globalStyles }: Props) => {
  const badgeMap: Record<string, { icon: typeof Shield; label: string }> = {
    secure_checkout: { icon: Shield, label: 'Secure Checkout' },
    instant_delivery: { icon: Zap, label: 'Instant Delivery' },
    money_back: { icon: Star, label: 'Money Back Guarantee' },
    support_24_7: { icon: Clock, label: '24/7 Support' },
  };
  const badges = (section.settings.badges || []) as string[];
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="px-6 py-8 max-w-4xl mx-auto">
        <div className="flex flex-wrap justify-center gap-8">
          {badges.map(b => {
            const badge = badgeMap[b];
            if (!badge) return null;
            const Icon = badge.icon;
            return (
              <div key={b} className="flex items-center gap-2 text-sm opacity-70">
                <Icon className="w-5 h-5" style={{ color: globalStyles.primaryColor }} />
                <span>{badge.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </SectionWrapper>
  );
};

// Divider
const DividerRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  return (
    <div style={{ backgroundColor: globalStyles.backgroundColor }}>
      {s.style === 'line' ? (
        <div className="max-w-6xl mx-auto px-6" style={{ paddingTop: s.height / 2, paddingBottom: s.height / 2 }}>
          <hr style={{ borderColor: globalStyles.textColor + '15' }} />
        </div>
      ) : (
        <div style={{ height: s.height }} />
      )}
    </div>
  );
};

// Custom Text
const CustomTextRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="px-6 py-12 max-w-4xl mx-auto" style={{ textAlign: s.textAlign || 'left' }}>
        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: s.content || '' }} />
      </div>
    </SectionWrapper>
  );
};

// Main renderer
const StoreBuilderSectionRenderer = (props: Props) => {
  if (!props.section.visible) return null;
  
  const renderers: Record<string, React.FC<Props>> = {
    hero: HeroRenderer,
    featured_products: FeaturedRenderer,
    product_grid: ProductGridRenderer,
    about: AboutRenderer,
    faq: FAQRenderer,
    video: VideoRenderer,
    gallery: GalleryRenderer,
    testimonials: TestimonialsRenderer,
    cta: CTARenderer,
    stats: StatsRenderer,
    social_links: SocialLinksRenderer,
    category_showcase: CategoryRenderer,
    trust_badges: TrustBadgesRenderer,
    divider: DividerRenderer,
    custom_text: CustomTextRenderer,
  };

  const Renderer = renderers[props.section.type];
  if (!Renderer) return null;
  return <Renderer {...props} />;
};

export default StoreBuilderSectionRenderer;
