export interface StylePreset {
  name: string;
  description: string;
  container: string;
  title: string;
  price: string;
  badge: string;
  hoverEffect: string;
  imageOverlay: string;
}

export const CARD_STYLE_PRESETS: Record<string, StylePreset> = {
  classic: {
    name: 'Classic',
    description: 'Clean white card, subtle border',
    container: 'bg-white border border-slate-200 shadow-sm',
    title: 'text-slate-900 font-semibold',
    price: 'font-bold',
    badge: 'bg-slate-100 text-slate-600',
    hoverEffect: 'hover:shadow-lg hover:border-slate-300 hover:-translate-y-0.5',
    imageOverlay: '',
  },
  minimal: {
    name: 'Minimal',
    description: 'No border, flat, ultra-clean',
    container: 'bg-white border-0 shadow-none',
    title: 'text-slate-800 font-medium',
    price: 'font-semibold',
    badge: 'bg-slate-50 text-slate-500',
    hoverEffect: 'hover:bg-slate-50',
    imageOverlay: '',
  },
  bold: {
    name: 'Bold',
    description: 'Thick border, large price, strong contrast',
    container: 'bg-white border-2 border-slate-900 shadow-md',
    title: 'text-slate-900 font-extrabold uppercase tracking-tight',
    price: 'font-black text-2xl',
    badge: 'bg-slate-900 text-white',
    hoverEffect: 'hover:shadow-xl hover:-translate-y-1',
    imageOverlay: '',
  },
  gumroad: {
    name: 'Gumroad',
    description: 'Pink accent, rounded, Gumroad-inspired',
    container: 'bg-white border border-black/10 shadow-sm',
    title: 'text-black font-medium',
    price: 'font-semibold text-black',
    badge: 'bg-pink-50 text-pink-600',
    hoverEffect: 'hover:shadow-lg hover:border-black/20 hover:-translate-y-0.5',
    imageOverlay: '',
  },
  neon: {
    name: 'Neon',
    description: 'Gradient border glow on hover, dark card',
    container: 'bg-slate-900 border border-slate-700 shadow-lg text-white',
    title: 'text-white font-semibold',
    price: 'font-bold text-emerald-400',
    badge: 'bg-slate-800 text-emerald-400',
    hoverEffect: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:border-emerald-500/50',
    imageOverlay: 'bg-gradient-to-t from-slate-900/60 to-transparent',
  },
  glass: {
    name: 'Glassmorphism',
    description: 'Frosted glass background, blur effect',
    container: 'bg-white/70 backdrop-blur-xl border border-white/30 shadow-lg',
    title: 'text-slate-900 font-semibold',
    price: 'font-bold',
    badge: 'bg-white/50 backdrop-blur-sm text-slate-700',
    hoverEffect: 'hover:bg-white/80 hover:shadow-xl hover:-translate-y-0.5',
    imageOverlay: '',
  },
  brutalist: {
    name: 'Neo-Brutalist',
    description: 'Hard shadow, thick black border, offset',
    container: 'bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
    title: 'text-black font-black',
    price: 'font-black',
    badge: 'bg-yellow-300 text-black font-bold',
    hoverEffect: 'hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5',
    imageOverlay: '',
  },
  elegant: {
    name: 'Elegant',
    description: 'Serif fonts, muted tones, luxury feel',
    container: 'bg-stone-50 border border-stone-200 shadow-sm',
    title: 'text-stone-800 font-serif font-semibold tracking-wide',
    price: 'font-serif font-semibold text-stone-700',
    badge: 'bg-stone-200 text-stone-600',
    hoverEffect: 'hover:shadow-md hover:border-stone-300',
    imageOverlay: '',
  },
  playful: {
    name: 'Playful',
    description: 'Rounded, pastel colors, bouncy hover',
    container: 'bg-gradient-to-br from-violet-50 to-pink-50 border border-violet-200 shadow-sm',
    title: 'text-violet-900 font-bold',
    price: 'font-extrabold text-violet-600',
    badge: 'bg-violet-100 text-violet-600',
    hoverEffect: 'hover:shadow-lg hover:-translate-y-1.5 hover:scale-[1.02] transition-all duration-300',
    imageOverlay: '',
  },
  professional: {
    name: 'Professional',
    description: 'Corporate, structured, grid-aligned',
    container: 'bg-white border border-slate-200 shadow-sm',
    title: 'text-slate-800 font-semibold text-sm',
    price: 'font-bold text-slate-900',
    badge: 'bg-blue-50 text-blue-700',
    hoverEffect: 'hover:shadow-md hover:border-blue-200',
    imageOverlay: '',
  },
};

export const STYLE_KEYS = Object.keys(CARD_STYLE_PRESETS) as Array<keyof typeof CARD_STYLE_PRESETS>;
