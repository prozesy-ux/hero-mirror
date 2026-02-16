import { StoreSection, GlobalStyles, SectionStyles, DEFAULT_SECTION_STYLES } from './types';
import { 
  Star, Shield, Zap, Clock, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Play, ExternalLink, Instagram, Twitter, Youtube, Music, MapPin, Send, X,
  Quote, AlertCircle, Info, CheckCircle, AlertTriangle
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';

interface Props {
  section: StoreSection;
  globalStyles: GlobalStyles;
  products?: any[];
  categories?: any[];
  isPreview?: boolean;
}

// Animation on scroll wrapper
const AnimatedWrapper = ({ children, animation }: { children: React.ReactNode; animation: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (animation === 'none') { setVisible(true); return; }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [animation]);

  const animClass = visible ? {
    'fade-in': 'opacity-100 translate-y-0',
    'slide-up': 'opacity-100 translate-y-0',
    'slide-left': 'opacity-100 translate-x-0',
    'slide-right': 'opacity-100 translate-x-0',
    'zoom-in': 'opacity-100 scale-100',
    'bounce': 'opacity-100 animate-bounce',
    'flip': 'opacity-100 rotate-y-0',
  }[animation] || '' : {
    'fade-in': 'opacity-0 translate-y-4',
    'slide-up': 'opacity-0 translate-y-8',
    'slide-left': 'opacity-0 -translate-x-8',
    'slide-right': 'opacity-0 translate-x-8',
    'zoom-in': 'opacity-0 scale-90',
    'bounce': 'opacity-0',
    'flip': 'opacity-0',
  }[animation] || '';

  return <div ref={ref} className={`transition-all duration-700 ease-out ${animClass}`}>{children}</div>;
};

const SectionWrapper = ({ children, section, globalStyles }: { children: React.ReactNode; section: StoreSection; globalStyles: GlobalStyles }) => {
  const s = section.styles || DEFAULT_SECTION_STYLES;
  const bgColor = section.settings.bgColor || globalStyles.backgroundColor;
  const textColor = section.settings.textColor || globalStyles.textColor;

  const style: React.CSSProperties = {
    backgroundColor: s.backgroundGradient?.enabled ? undefined : bgColor,
    background: s.backgroundGradient?.enabled ? `linear-gradient(${s.backgroundGradient.direction}, ${s.backgroundGradient.from}, ${s.backgroundGradient.to})` : undefined,
    color: textColor,
    fontFamily: globalStyles.fontFamily,
    paddingTop: `${s.padding?.top || 48}px`,
    paddingBottom: `${s.padding?.bottom || 48}px`,
    paddingLeft: `${s.padding?.left || 24}px`,
    paddingRight: `${s.padding?.right || 24}px`,
    marginTop: `${s.margin?.top || 0}px`,
    marginBottom: `${s.margin?.bottom || 0}px`,
    borderRadius: `${s.borderRadius || 0}px`,
    borderWidth: s.border?.width !== '0' ? `${s.border?.width}px` : undefined,
    borderColor: s.border?.color,
    borderStyle: s.border?.style as any,
    boxShadow: s.boxShadow !== 'none' ? s.boxShadow : undefined,
  };

  const responsiveClass = [
    s.responsiveVisibility?.desktop === false ? 'lg:hidden' : '',
    s.responsiveVisibility?.tablet === false ? 'md:hidden' : '',
    s.responsiveVisibility?.mobile === false ? 'max-md:hidden' : '',
  ].filter(Boolean).join(' ');

  return (
    <AnimatedWrapper animation={s.animation || 'none'}>
      <div style={style} className={`w-full ${s.fullWidth === false ? 'max-w-6xl mx-auto' : ''} ${responsiveClass} ${s.customClass || ''}`} id={s.sectionId || undefined}>
        {s.backgroundImage?.url && (
          <div className="absolute inset-0" style={{ backgroundImage: `url(${s.backgroundImage.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="absolute inset-0" style={{ backgroundColor: s.backgroundImage.overlay, opacity: s.backgroundImage.overlayOpacity / 100 }} />
          </div>
        )}
        <div className="relative z-10">{children}</div>
      </div>
    </AnimatedWrapper>
  );
};

// ===== EXISTING RENDERERS =====

const HeroRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  const align = s.textAlign === 'left' ? 'text-left items-start' : s.textAlign === 'right' ? 'text-right items-end' : 'text-center items-center';
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className={`relative flex flex-col justify-center ${align} py-12 md:py-24 min-h-[300px]`}
        style={s.bgImage ? { backgroundImage: `url(${s.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
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

const ProductGridRenderer = ({ section, globalStyles, products = [] }: Props) => {
  const s = section.settings;
  const cols = s.columns || 3;
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="max-w-6xl mx-auto" id="products">
        <h2 className="text-2xl font-bold mb-8">{s.title}</h2>
        <div className={`grid gap-4 grid-cols-1 sm:grid-cols-2 ${cols >= 3 ? 'lg:grid-cols-3' : ''} ${cols >= 4 ? 'xl:grid-cols-4' : ''}`}>
          {products.length > 0 ? products.slice(0, 12).map(p => (
            <div key={p.id} className="rounded-xl border p-4 hover:shadow-lg transition-shadow" style={{ borderColor: globalStyles.primaryColor + '20', backgroundColor: globalStyles.backgroundColor }}>
              {p.icon_url && <img src={p.icon_url} alt={p.name} className="w-full h-40 object-cover rounded-lg mb-3" />}
              <h3 className="font-semibold text-sm mb-1">{p.name}</h3>
              <p className="font-bold" style={{ color: globalStyles.primaryColor }}>${p.price}</p>
            </div>
          )) : Array.from({ length: cols * 2 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-dashed p-4 h-48 flex items-center justify-center opacity-30"><span className="text-sm">Product {i + 1}</span></div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};

const FeaturedRenderer = ({ section, globalStyles, products = [] }: Props) => {
  const s = section.settings;
  const featuredProducts = s.productIds?.length > 0 ? products.filter(p => s.productIds.includes(p.id)) : products.slice(0, s.columns || 3);
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-8">{s.title}</h2>
        <div className={`grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-${s.columns || 3}`}>
          {featuredProducts.length > 0 ? featuredProducts.map(p => (
            <div key={p.id} className="rounded-xl border p-4 hover:shadow-lg transition-shadow" style={{ borderColor: globalStyles.primaryColor + '30' }}>
              {p.icon_url && <img src={p.icon_url} alt={p.name} className="w-full h-48 object-cover rounded-lg mb-3" />}
              <h3 className="font-semibold mb-1">{p.name}</h3>
              <p className="font-bold" style={{ color: globalStyles.primaryColor }}>${p.price}</p>
            </div>
          )) : Array.from({ length: s.columns || 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-dashed p-6 h-56 flex items-center justify-center opacity-30"><span>Featured {i + 1}</span></div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};

const AboutRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  const imgLeft = s.imagePosition === 'left';
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-8">{s.title}</h2>
        <div className={`flex flex-col md:flex-row gap-8 ${imgLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
          {s.imageUrl && <div className="md:w-1/3"><img src={s.imageUrl} alt="About" className="rounded-xl w-full h-64 object-cover" /></div>}
          <div className={s.imageUrl ? 'md:w-2/3' : 'w-full'}><p className="text-base leading-relaxed whitespace-pre-wrap">{s.text}</p></div>
        </div>
      </div>
    </SectionWrapper>
  );
};

const FAQRenderer = ({ section, globalStyles }: Props) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const s = section.settings;
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="max-w-3xl mx-auto">
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

const VideoRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  const getEmbedUrl = (url: string) => {
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    return url;
  };
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="max-w-4xl mx-auto">
        {s.title && <h2 className="text-2xl font-bold mb-8 text-center">{s.title}</h2>}
        {s.videoUrl ? (
          <div className="aspect-video rounded-xl overflow-hidden"><iframe src={getEmbedUrl(s.videoUrl)} className="w-full h-full" allowFullScreen /></div>
        ) : (
          <div className="aspect-video rounded-xl border border-dashed flex items-center justify-center opacity-30"><Play className="w-12 h-12" /></div>
        )}
      </div>
    </SectionWrapper>
  );
};

const GalleryRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="max-w-6xl mx-auto">
        {s.title && <h2 className="text-2xl font-bold mb-8">{s.title}</h2>}
        <div className={`grid gap-3 grid-cols-2 md:grid-cols-${s.columns || 3}`}>
          {(s.images || []).length > 0 ? s.images.map((img: string, i: number) => (
            <img key={i} src={img} alt={`Gallery ${i + 1}`} className="rounded-lg w-full h-48 object-cover" />
          )) : Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-dashed h-48 flex items-center justify-center opacity-30">🖼️</div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};

const TestimonialsRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center">{s.title}</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(s.items || []).map((item: any, i: number) => (
            <div key={i} className="rounded-xl p-6 border" style={{ borderColor: globalStyles.primaryColor + '20' }}>
              <div className="flex gap-1 mb-3">{Array.from({ length: item.rating || 5 }).map((_, j) => <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}</div>
              <p className="text-sm mb-4 opacity-80 italic">"{item.text}"</p>
              <p className="font-semibold text-sm">— {item.name}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};

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

const StatsRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="max-w-4xl mx-auto">
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

const SocialLinksRenderer = ({ section, globalStyles }: Props) => (
  <SectionWrapper section={section} globalStyles={globalStyles}>
    <div className="flex justify-center gap-6">
      <Instagram className="w-6 h-6 opacity-60 hover:opacity-100 cursor-pointer transition-opacity" />
      <Twitter className="w-6 h-6 opacity-60 hover:opacity-100 cursor-pointer transition-opacity" />
      <Youtube className="w-6 h-6 opacity-60 hover:opacity-100 cursor-pointer transition-opacity" />
      <Music className="w-6 h-6 opacity-60 hover:opacity-100 cursor-pointer transition-opacity" />
    </div>
  </SectionWrapper>
);

const CategoryRenderer = ({ section, globalStyles, categories = [] }: Props) => {
  const s = section.settings;
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-8">{s.title}</h2>
        <div className={`grid gap-4 grid-cols-2 md:grid-cols-${s.columns || 3}`}>
          {categories.length > 0 ? categories.map(c => (
            <div key={c.id} className="rounded-xl border p-6 text-center hover:shadow-md transition-shadow cursor-pointer" style={{ borderColor: globalStyles.primaryColor + '20' }}>
              <div className="text-2xl mb-2">{c.icon || '📁'}</div><h3 className="font-semibold">{c.name}</h3>
            </div>
          )) : Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-dashed p-6 text-center opacity-30">Category {i + 1}</div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};

const TrustBadgesRenderer = ({ section, globalStyles }: Props) => {
  const badgeMap: Record<string, { icon: typeof Shield; label: string }> = {
    secure_checkout: { icon: Shield, label: 'Secure Checkout' },
    instant_delivery: { icon: Zap, label: 'Instant Delivery' },
    money_back: { icon: Star, label: 'Money Back Guarantee' },
    support_24_7: { icon: Clock, label: '24/7 Support' },
  };
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap justify-center gap-8">
          {((section.settings.badges || []) as string[]).map(b => {
            const badge = badgeMap[b]; if (!badge) return null; const Icon = badge.icon;
            return <div key={b} className="flex items-center gap-2 text-sm opacity-70"><Icon className="w-5 h-5" style={{ color: globalStyles.primaryColor }} /><span>{badge.label}</span></div>;
          })}
        </div>
      </div>
    </SectionWrapper>
  );
};

const DividerRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  return (
    <div style={{ backgroundColor: globalStyles.backgroundColor }}>
      {s.style === 'line' ? (
        <div className="max-w-6xl mx-auto px-6" style={{ paddingTop: s.height / 2, paddingBottom: s.height / 2 }}><hr style={{ borderColor: globalStyles.textColor + '15' }} /></div>
      ) : <div style={{ height: s.height }} />}
    </div>
  );
};

const CustomTextRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="max-w-4xl mx-auto" style={{ textAlign: s.textAlign || 'left' }}>
        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: s.content || '' }} />
      </div>
    </SectionWrapper>
  );
};

// ===== NEW 20 RENDERERS =====

const CountdownTimerRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    const calc = () => {
      const end = new Date(s.endDate).getTime();
      const diff = end - Date.now();
      if (diff <= 0) { setExpired(true); return; }
      setTimeLeft({ days: Math.floor(diff / 86400000), hours: Math.floor((diff % 86400000) / 3600000), minutes: Math.floor((diff % 3600000) / 60000), seconds: Math.floor((diff % 60000) / 1000) });
    };
    calc();
    const iv = setInterval(calc, 1000);
    return () => clearInterval(iv);
  }, [s.endDate]);
  if (expired && s.expireAction === 'hide') return null;
  return (
    <div className="w-full py-10 text-center" style={{ backgroundColor: s.bgColor || '#ef4444', color: s.textColor || '#fff' }}>
      <h2 className="text-2xl font-bold mb-6">{s.title}</h2>
      <div className="flex justify-center gap-4 md:gap-8">
        {s.showDays !== false && <div className="flex flex-col items-center"><span className="text-4xl md:text-6xl font-bold">{String(timeLeft.days).padStart(2, '0')}</span><span className="text-xs uppercase tracking-wider mt-1 opacity-80">Days</span></div>}
        {s.showHours !== false && <div className="flex flex-col items-center"><span className="text-4xl md:text-6xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</span><span className="text-xs uppercase tracking-wider mt-1 opacity-80">Hours</span></div>}
        {s.showMinutes !== false && <div className="flex flex-col items-center"><span className="text-4xl md:text-6xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</span><span className="text-xs uppercase tracking-wider mt-1 opacity-80">Minutes</span></div>}
        {s.showSeconds !== false && <div className="flex flex-col items-center"><span className="text-4xl md:text-6xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</span><span className="text-xs uppercase tracking-wider mt-1 opacity-80">Seconds</span></div>}
      </div>
    </div>
  );
};

const PricingTableRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center">{s.title}</h2>
        <div className={`grid gap-6 grid-cols-1 md:grid-cols-${(s.plans || []).length}`}>
          {(s.plans || []).map((plan: any, i: number) => (
            <div key={i} className={`rounded-2xl p-6 border-2 relative ${plan.recommended ? 'scale-105 shadow-xl' : ''}`} style={{ borderColor: plan.recommended ? globalStyles.primaryColor : globalStyles.textColor + '15' }}>
              {plan.badge && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: globalStyles.primaryColor }}>{plan.badge}</div>}
              <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
              <div className="mb-4"><span className="text-3xl font-bold" style={{ color: globalStyles.primaryColor }}>{plan.price}</span><span className="text-sm opacity-60">{plan.period}</span></div>
              <ul className="space-y-2 mb-6">{(plan.features || []).map((f: string, j: number) => <li key={j} className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 shrink-0" style={{ color: globalStyles.primaryColor }} />{f}</li>)}</ul>
              <a href={plan.ctaLink || '#'} className="block w-full py-2.5 rounded-lg text-center font-semibold text-sm transition-transform hover:scale-105" style={{ backgroundColor: plan.recommended ? globalStyles.primaryColor : 'transparent', color: plan.recommended ? '#fff' : globalStyles.textColor, border: plan.recommended ? 'none' : `1px solid ${globalStyles.textColor}30` }}>{plan.ctaText}</a>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};

const ImageSliderRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  const images = s.images || [];
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (!s.autoplay || images.length <= 1) return;
    const iv = setInterval(() => setCurrent(p => (p + 1) % images.length), s.interval || 4000);
    return () => clearInterval(iv);
  }, [s.autoplay, images.length, s.interval]);
  if (images.length === 0) return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="max-w-5xl mx-auto h-[300px] border border-dashed rounded-xl flex items-center justify-center opacity-30">Add images to slider</div>
    </SectionWrapper>
  );
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="max-w-5xl mx-auto relative overflow-hidden rounded-xl" style={{ height: s.height || 400 }}>
        <img src={images[current]} alt="" className="w-full h-full object-cover transition-opacity duration-500" />
        {s.showArrows && images.length > 1 && <>
          <button onClick={() => setCurrent(p => (p - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={() => setCurrent(p => (p + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70"><ChevronRight className="w-5 h-5" /></button>
        </>}
        {s.showDots && images.length > 1 && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">{images.map((_: any, i: number) => <button key={i} onClick={() => setCurrent(i)} className={`w-2.5 h-2.5 rounded-full ${i === current ? 'bg-white' : 'bg-white/50'}`} />)}</div>}
      </div>
    </SectionWrapper>
  );
};

const FlipBoxRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className={`max-w-6xl mx-auto grid gap-6 grid-cols-1 md:grid-cols-${s.columns || 3}`}>
        {(s.items || []).map((item: any, i: number) => (
          <div key={i} className="group perspective-1000 h-64">
            <div className="relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
              <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center [backface-visibility:hidden]" style={{ backgroundColor: item.frontBg || globalStyles.primaryColor }}>
                <span className="text-4xl mb-3">{item.frontIcon}</span>
                <h3 className="text-lg font-bold text-white">{item.frontTitle}</h3>
              </div>
              <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]" style={{ backgroundColor: globalStyles.backgroundColor, border: `2px solid ${globalStyles.primaryColor}30` }}>
                <h3 className="text-lg font-bold mb-2">{item.backTitle}</h3>
                <p className="text-sm opacity-70 text-center mb-4">{item.backText}</p>
                {item.backCtaText && <a href={item.backCtaLink || '#'} className="px-4 py-1.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: globalStyles.primaryColor, color: '#fff' }}>{item.backCtaText}</a>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
};

const IconBoxGridRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="max-w-6xl mx-auto">
        {s.title && <h2 className="text-2xl font-bold mb-8 text-center">{s.title}</h2>}
        <div className={`grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-${s.columns || 4}`}>
          {(s.items || []).map((item: any, i: number) => (
            <div key={i} className="text-center p-6 rounded-xl border hover:shadow-lg transition-shadow" style={{ borderColor: globalStyles.primaryColor + '15' }}>
              <div className={`mb-3 ${s.iconSize === 'large' ? 'text-4xl' : 'text-2xl'}`}>{item.icon}</div>
              <h3 className="font-bold mb-1">{item.title}</h3>
              <p className="text-sm opacity-70">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};

const ProgressBarRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="max-w-3xl mx-auto" ref={ref}>
        {s.title && <h2 className="text-2xl font-bold mb-8">{s.title}</h2>}
        <div className="space-y-5">
          {(s.items || []).map((item: any, i: number) => (
            <div key={i}>
              <div className="flex justify-between mb-1.5"><span className="text-sm font-medium">{item.label}</span>{s.showPercentage && <span className="text-sm font-bold" style={{ color: item.color }}>{item.value}%</span>}</div>
              <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: globalStyles.textColor + '10' }}>
                <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: inView ? `${item.value}%` : '0%', backgroundColor: item.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};

const TabsRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  const [activeTab, setActiveTab] = useState(0);
  const items = s.items || [];
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="max-w-4xl mx-auto">
        <div className={`flex gap-1 mb-6 ${s.orientation === 'vertical' ? 'flex-col max-w-[200px]' : 'flex-row border-b'}`} style={{ borderColor: globalStyles.textColor + '15' }}>
          {items.map((item: any, i: number) => (
            <button key={i} onClick={() => setActiveTab(i)} className={`px-4 py-2 text-sm font-medium transition-all ${activeTab === i ? 'border-b-2' : 'opacity-60 hover:opacity-100'}`} style={activeTab === i ? { borderColor: globalStyles.primaryColor, color: globalStyles.primaryColor } : {}}>
              {item.label}
            </button>
          ))}
        </div>
        {items[activeTab] && <div className="p-4"><h3 className="text-lg font-bold mb-2">{items[activeTab].title}</h3><p className="opacity-80">{items[activeTab].content}</p></div>}
      </div>
    </SectionWrapper>
  );
};

const AccordionRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  const [openItems, setOpenItems] = useState<number[]>([]);
  const toggle = (i: number) => {
    if (s.allowMultiple) { setOpenItems(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]); }
    else { setOpenItems(prev => prev.includes(i) ? [] : [i]); }
  };
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="max-w-3xl mx-auto">
        {s.title && <h2 className="text-2xl font-bold mb-8">{s.title}</h2>}
        <div className="space-y-2">
          {(s.items || []).map((item: any, i: number) => (
            <div key={i} className="border rounded-lg overflow-hidden" style={{ borderColor: globalStyles.primaryColor + '20' }}>
              <button onClick={() => toggle(i)} className="w-full flex items-center justify-between p-4 text-left font-medium hover:bg-black/5 transition-colors">
                {item.title}
                {openItems.includes(i) ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
              </button>
              {openItems.includes(i) && <div className="px-4 pb-4 text-sm opacity-80">{item.content}</div>}
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};

const BeforeAfterRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const handleMove = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
  }, []);
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="max-w-4xl mx-auto">
        {s.title && <h2 className="text-2xl font-bold mb-8 text-center">{s.title}</h2>}
        <div ref={containerRef} className="relative h-[400px] rounded-xl overflow-hidden cursor-col-resize select-none" onMouseMove={e => e.buttons === 1 && handleMove(e.clientX)} onTouchMove={e => handleMove(e.touches[0].clientX)}>
          {s.afterImage ? <img src={s.afterImage} alt="After" className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 bg-gray-200 flex items-center justify-center opacity-30">After Image</div>}
          <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
            {s.beforeImage ? <img src={s.beforeImage} alt="Before" className="absolute inset-0 w-full h-full object-cover" style={{ minWidth: containerRef.current?.offsetWidth }} /> : <div className="absolute inset-0 bg-gray-300 flex items-center justify-center opacity-30">Before Image</div>}
          </div>
          <div className="absolute top-0 bottom-0 w-1 bg-white shadow-lg" style={{ left: `${position}%` }}>
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center"><span className="text-xs">↔</span></div>
          </div>
          <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded">{s.beforeLabel}</div>
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">{s.afterLabel}</div>
        </div>
      </div>
    </SectionWrapper>
  );
};

const MarqueeRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  const items = s.items || [];
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="overflow-hidden whitespace-nowrap" style={{ ['--marquee-speed' as any]: `${s.speed || 30}s` }}>
        <div className={`inline-flex gap-8 animate-[marquee_var(--marquee-speed)_linear_infinite] ${s.pauseOnHover ? 'hover:[animation-play-state:paused]' : ''}`} style={{ animationDirection: s.direction === 'right' ? 'reverse' : 'normal' }}>
          {[...items, ...items].map((item: string, i: number) => (
            <span key={i} className="text-lg font-semibold px-4">{item}</span>
          ))}
        </div>
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </SectionWrapper>
  );
};

const LogoGridRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="max-w-5xl mx-auto">
        {s.title && <h2 className="text-2xl font-bold mb-8 text-center">{s.title}</h2>}
        <div className={`grid gap-8 grid-cols-2 md:grid-cols-${s.columns || 4} items-center`}>
          {(s.logos || []).length > 0 ? (s.logos || []).map((logo: any, i: number) => (
            <div key={i} className="flex items-center justify-center p-4"><img src={typeof logo === 'string' ? logo : logo.url} alt="" className={`max-h-12 object-contain ${s.grayscale ? 'grayscale hover:grayscale-0 transition-all' : ''}`} /></div>
          )) : Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 border border-dashed rounded-lg flex items-center justify-center opacity-30 text-sm">Logo {i + 1}</div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};

const MapRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="max-w-5xl mx-auto">
        {s.title && <h2 className="text-2xl font-bold mb-6">{s.title}</h2>}
        {s.embedUrl ? (
          <div className="rounded-xl overflow-hidden" style={{ height: s.height || 400 }}><iframe src={s.embedUrl} className="w-full h-full border-0" allowFullScreen loading="lazy" /></div>
        ) : (
          <div className="rounded-xl border border-dashed flex items-center justify-center opacity-30" style={{ height: s.height || 400 }}><MapPin className="w-8 h-8 mr-2" />Add Google Maps embed URL</div>
        )}
      </div>
    </SectionWrapper>
  );
};

const ContactFormRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  const [submitted, setSubmitted] = useState(false);
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="max-w-xl mx-auto">
        <h2 className="text-2xl font-bold mb-2 text-center">{s.title}</h2>
        {s.subtitle && <p className="text-center opacity-70 mb-8">{s.subtitle}</p>}
        {submitted ? <div className="text-center py-8"><CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: globalStyles.primaryColor }} /><p className="font-medium">{s.successMessage}</p></div> : (
          <div className="space-y-4">
            {(s.fields || []).includes('name') && <input type="text" placeholder="Your Name" className="w-full px-4 py-3 rounded-lg border text-sm" style={{ borderColor: globalStyles.textColor + '20' }} />}
            {(s.fields || []).includes('email') && <input type="email" placeholder="Your Email" className="w-full px-4 py-3 rounded-lg border text-sm" style={{ borderColor: globalStyles.textColor + '20' }} />}
            {(s.fields || []).includes('message') && <textarea placeholder="Your Message" rows={4} className="w-full px-4 py-3 rounded-lg border text-sm resize-none" style={{ borderColor: globalStyles.textColor + '20' }} />}
            <button onClick={() => setSubmitted(true)} className="w-full py-3 rounded-lg font-semibold text-sm transition-transform hover:scale-[1.02]" style={{ backgroundColor: globalStyles.primaryColor, color: '#fff' }}>{s.submitText}</button>
          </div>
        )}
      </div>
    </SectionWrapper>
  );
};

const NewsletterRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  return (
    <div className="w-full py-16 text-center" style={{ backgroundColor: s.bgColor || '#000', color: s.textColor || '#fff' }}>
      <div className="max-w-xl mx-auto px-6">
        <h2 className="text-2xl font-bold mb-2">{s.title}</h2>
        {s.subtitle && <p className="opacity-80 mb-6">{s.subtitle}</p>}
        <div className="flex gap-2 max-w-md mx-auto">
          <input type="email" placeholder={s.placeholder || 'Enter your email'} className="flex-1 px-4 py-3 rounded-lg text-sm text-black" />
          <button className="px-6 py-3 rounded-lg font-semibold text-sm whitespace-nowrap" style={{ backgroundColor: globalStyles.primaryColor, color: '#fff' }}>{s.buttonText}</button>
        </div>
      </div>
    </div>
  );
};

const TeamRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center">{s.title}</h2>
        <div className={`grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-${s.columns || 3}`}>
          {(s.members || []).map((m: any, i: number) => (
            <div key={i} className="text-center p-6 rounded-xl border hover:shadow-lg transition-shadow" style={{ borderColor: globalStyles.primaryColor + '15' }}>
              {m.image ? <img src={m.image} alt={m.name} className="w-20 h-20 rounded-full object-cover mx-auto mb-4" /> : <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl" style={{ backgroundColor: globalStyles.primaryColor + '15' }}>👤</div>}
              <h3 className="font-bold">{m.name}</h3>
              <p className="text-sm opacity-60">{m.role}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};

const TimelineRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center">{s.title}</h2>
        <div className="relative">
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5" style={{ backgroundColor: globalStyles.primaryColor + '30' }} />
          {(s.items || []).map((item: any, i: number) => (
            <div key={i} className={`relative flex items-start gap-4 mb-8 ${s.variant === 'alternating' && i % 2 !== 0 ? 'md:flex-row-reverse md:text-right' : ''}`}>
              <div className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white" style={{ backgroundColor: globalStyles.primaryColor }}>{i + 1}</div>
              <div className="flex-1 p-4 rounded-xl border" style={{ borderColor: globalStyles.primaryColor + '20' }}>
                <div className="text-xs font-bold mb-1" style={{ color: globalStyles.primaryColor }}>{item.year}</div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm opacity-70">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};

const AnimatedCounterRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  const [inView, setInView] = useState(false);
  const [counts, setCounts] = useState<number[]>((s.items || []).map(() => 0));
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (!inView) return;
    const items = s.items || [];
    const duration = s.duration || 2000;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCounts(items.map((it: any) => Math.round(it.value * eased)));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [inView]);
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className={`max-w-5xl mx-auto grid gap-8 grid-cols-2 md:grid-cols-${s.columns || 4}`} ref={ref}>
        {(s.items || []).map((item: any, i: number) => (
          <div key={i} className="text-center">
            <div className="text-3xl mb-2">{item.icon}</div>
            <div className="text-4xl font-bold mb-1" style={{ color: globalStyles.primaryColor }}>{counts[i] || 0}{item.suffix}</div>
            <div className="text-sm opacity-70">{item.label}</div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
};

const AlertBannerRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  const typeIcons: Record<string, any> = { info: Info, warning: AlertTriangle, success: CheckCircle, promo: AlertCircle };
  const Icon = typeIcons[s.type] || AlertCircle;
  return (
    <div className="w-full py-3 px-6 flex items-center justify-center gap-3" style={{ backgroundColor: s.bgColor || '#fef3c7', color: s.textColor || '#92400e' }}>
      <Icon className="w-4 h-4 shrink-0" />
      <span className="text-sm font-medium">{s.message}</span>
      {s.linkText && <a href={s.linkUrl || '#'} className="text-sm font-bold underline ml-1">{s.linkText}</a>}
      {s.dismissible && <button onClick={() => setDismissed(true)} className="ml-2 opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>}
    </div>
  );
};

const BlockquoteRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="max-w-3xl mx-auto text-center">
        {s.decorative && <Quote className="w-12 h-12 mx-auto mb-4 opacity-20" style={{ color: globalStyles.primaryColor }} />}
        <blockquote className={`${s.variant === 'large' ? 'text-2xl md:text-3xl' : 'text-lg'} font-medium italic leading-relaxed mb-6`}>"{s.quote}"</blockquote>
        <div>
          <span className="font-bold">— {s.author}</span>
          {s.authorTitle && <span className="text-sm opacity-60 ml-2">{s.authorTitle}</span>}
        </div>
      </div>
    </SectionWrapper>
  );
};

const VideoPlaylistRenderer = ({ section, globalStyles }: Props) => {
  const s = section.settings;
  const [activeIndex, setActiveIndex] = useState(0);
  const videos = s.videos || [];
  const getEmbedUrl = (url: string) => {
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    return url;
  };
  return (
    <SectionWrapper section={section} globalStyles={globalStyles}>
      <div className="max-w-5xl mx-auto">
        {s.title && <h2 className="text-2xl font-bold mb-6">{s.title}</h2>}
        <div className={`flex gap-4 ${s.layout === 'sidebar' ? 'flex-col md:flex-row' : 'flex-col'}`}>
          <div className={`${s.layout === 'sidebar' ? 'md:flex-1' : 'w-full'}`}>
            {videos[activeIndex]?.url ? (
              <div className="aspect-video rounded-xl overflow-hidden"><iframe src={getEmbedUrl(videos[activeIndex].url)} className="w-full h-full" allowFullScreen /></div>
            ) : (
              <div className="aspect-video rounded-xl border border-dashed flex items-center justify-center opacity-30"><Play className="w-12 h-12" /></div>
            )}
          </div>
          <div className={`${s.layout === 'sidebar' ? 'md:w-72' : 'w-full'} space-y-2 max-h-80 overflow-y-auto`}>
            {videos.map((v: any, i: number) => (
              <button key={i} onClick={() => setActiveIndex(i)} className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all ${i === activeIndex ? 'bg-black/10' : 'hover:bg-black/5'}`}>
                <div className="w-16 h-10 rounded bg-gray-200 flex items-center justify-center shrink-0">{v.thumbnail ? <img src={v.thumbnail} alt="" className="w-full h-full object-cover rounded" /> : <Play className="w-4 h-4 opacity-40" />}</div>
                <span className="text-sm font-medium truncate">{v.title}</span>
              </button>
            ))}
          </div>
        </div>
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
    // New 20
    countdown_timer: CountdownTimerRenderer,
    pricing_table: PricingTableRenderer,
    image_slider: ImageSliderRenderer,
    flip_box: FlipBoxRenderer,
    icon_box_grid: IconBoxGridRenderer,
    progress_bar: ProgressBarRenderer,
    tabs: TabsRenderer,
    accordion: AccordionRenderer,
    before_after: BeforeAfterRenderer,
    marquee: MarqueeRenderer,
    logo_grid: LogoGridRenderer,
    map: MapRenderer,
    contact_form: ContactFormRenderer,
    newsletter: NewsletterRenderer,
    team: TeamRenderer,
    timeline: TimelineRenderer,
    animated_counter: AnimatedCounterRenderer,
    alert_banner: AlertBannerRenderer,
    blockquote: BlockquoteRenderer,
    video_playlist: VideoPlaylistRenderer,
  };

  const Renderer = renderers[props.section.type];
  if (!Renderer) return null;
  return <Renderer {...props} />;
};

export default StoreBuilderSectionRenderer;
