import { GlobalStyles, StoreSection } from './types';

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  globalStyles: GlobalStyles;
  sections: StoreSection[];
}

const makeId = () => `sec_${Math.random().toString(36).slice(2, 9)}`;

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'minimal-white',
    name: 'Minimal White',
    description: 'Clean, modern, and minimal',
    thumbnail: '⬜',
    globalStyles: { primaryColor: '#000000', secondaryColor: '#f5f5f5', backgroundColor: '#ffffff', textColor: '#111111', fontFamily: 'Inter' },
    sections: [
      { id: makeId(), type: 'hero', order: 0, visible: true, settings: { heading: 'Welcome', subheading: 'Quality products, curated for you', bgColor: '#ffffff', textColor: '#000000', ctaText: 'Browse', ctaLink: '#products', textAlign: 'center', bgImage: '' } },
      { id: makeId(), type: 'featured_products', order: 1, visible: true, settings: { title: 'Featured', productIds: [], columns: 3 } },
      { id: makeId(), type: 'product_grid', order: 2, visible: true, settings: { title: 'All Products', columns: 3, showFilters: true, sortBy: 'popular' } },
      { id: makeId(), type: 'about', order: 3, visible: true, settings: { title: 'About', text: 'We create high-quality digital products.', imageUrl: '', imagePosition: 'right' } },
    ],
  },
  {
    id: 'dark-elegant',
    name: 'Dark Elegant',
    description: 'Sleek dark theme with gold accents',
    thumbnail: '⬛',
    globalStyles: { primaryColor: '#D4AF37', secondaryColor: '#1a1a2e', backgroundColor: '#0f0f1a', textColor: '#f0e6d3', fontFamily: 'DM Sans' },
    sections: [
      { id: makeId(), type: 'hero', order: 0, visible: true, settings: { heading: 'Premium Collection', subheading: 'Exclusive digital products', bgColor: '#0f0f1a', textColor: '#D4AF37', ctaText: 'Explore', ctaLink: '#products', textAlign: 'center', bgImage: '' } },
      { id: makeId(), type: 'stats', order: 1, visible: true, settings: { items: [{ label: 'Products', value: '50+', icon: '📦' }, { label: 'Customers', value: '1K+', icon: '👥' }, { label: 'Rating', value: '4.9', icon: '⭐' }] } },
      { id: makeId(), type: 'featured_products', order: 2, visible: true, settings: { title: 'Best Sellers', productIds: [], columns: 3 } },
      { id: makeId(), type: 'testimonials', order: 3, visible: true, settings: { title: 'Reviews', items: [{ name: 'Customer', text: 'Amazing quality!', rating: 5 }] } },
      { id: makeId(), type: 'product_grid', order: 4, visible: true, settings: { title: 'Shop All', columns: 3, showFilters: true, sortBy: 'popular' } },
    ],
  },
  {
    id: 'bold-colorful',
    name: 'Bold & Colorful',
    description: 'Vibrant gradients and bold typography',
    thumbnail: '🌈',
    globalStyles: { primaryColor: '#FF6B6B', secondaryColor: '#4ECDC4', backgroundColor: '#ffffff', textColor: '#2C3E50', fontFamily: 'Raleway' },
    sections: [
      { id: makeId(), type: 'hero', order: 0, visible: true, settings: { heading: '🔥 Hot Products', subheading: 'Fresh drops every week', bgColor: '#FF6B6B', textColor: '#ffffff', ctaText: 'Shop Now', ctaLink: '#products', textAlign: 'center', bgImage: '' } },
      { id: makeId(), type: 'countdown_timer', order: 1, visible: true, settings: { title: '🔥 Flash Sale Ends In', endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), bgColor: '#2C3E50', textColor: '#ffffff', expireAction: 'hide', showDays: true, showHours: true, showMinutes: true, showSeconds: true } },
      { id: makeId(), type: 'category_showcase', order: 2, visible: true, settings: { title: 'Categories', columns: 3 } },
      { id: makeId(), type: 'product_grid', order: 3, visible: true, settings: { title: 'All Products', columns: 3, showFilters: true, sortBy: 'newest' } },
      { id: makeId(), type: 'newsletter', order: 4, visible: true, settings: { title: 'Don\'t Miss Out!', subtitle: 'Follow us for new drops', placeholder: 'Enter your email', buttonText: 'Subscribe', bgColor: '#4ECDC4', textColor: '#ffffff' } },
    ],
  },
  {
    id: 'gumroad-classic',
    name: 'Gumroad Classic',
    description: 'Clean Gumroad-inspired layout',
    thumbnail: '🟡',
    globalStyles: { primaryColor: '#FF90E8', secondaryColor: '#23A094', backgroundColor: '#ffffff', textColor: '#000000', fontFamily: 'Inter' },
    sections: [
      { id: makeId(), type: 'hero', order: 0, visible: true, settings: { heading: 'Creator Store', subheading: 'Digital products made with love', bgColor: '#FF90E8', textColor: '#000000', ctaText: 'Browse', ctaLink: '#products', textAlign: 'left', bgImage: '' } },
      { id: makeId(), type: 'product_grid', order: 1, visible: true, settings: { title: 'Products', columns: 3, showFilters: false, sortBy: 'popular' } },
      { id: makeId(), type: 'about', order: 2, visible: true, settings: { title: 'About the Creator', text: 'Building tools and resources for creators.', imageUrl: '', imagePosition: 'left' } },
      { id: makeId(), type: 'faq', order: 3, visible: true, settings: { title: 'FAQ', items: [{ question: 'How do I get my product?', answer: 'Instant delivery after purchase!' }] } },
    ],
  },
  {
    id: 'neon-glow',
    name: 'Neon Glow',
    description: 'Futuristic neon on dark background',
    thumbnail: '💜',
    globalStyles: { primaryColor: '#00ff88', secondaryColor: '#ff00ff', backgroundColor: '#0a0a0a', textColor: '#e0e0e0', fontFamily: 'DM Sans' },
    sections: [
      { id: makeId(), type: 'hero', order: 0, visible: true, settings: { heading: '✨ Digital Products', subheading: 'Level up your game', bgColor: '#0a0a0a', textColor: '#00ff88', ctaText: 'Enter', ctaLink: '#products', textAlign: 'center', bgImage: '' } },
      { id: makeId(), type: 'marquee', order: 1, visible: true, settings: { items: ['🔥 NEW DROPS', '⚡ INSTANT DELIVERY', '💎 PREMIUM QUALITY', '🌟 5-STAR RATED'], speed: 25, direction: 'left', pauseOnHover: true } },
      { id: makeId(), type: 'featured_products', order: 2, visible: true, settings: { title: '🔥 Hot Picks', productIds: [], columns: 3 } },
      { id: makeId(), type: 'trust_badges', order: 3, visible: true, settings: { badges: ['secure_checkout', 'instant_delivery', 'money_back'] } },
      { id: makeId(), type: 'product_grid', order: 4, visible: true, settings: { title: 'All Products', columns: 3, showFilters: true, sortBy: 'popular' } },
      { id: makeId(), type: 'social_links', order: 5, visible: true, settings: { links: [] } },
    ],
  },
  // ===== 5 NEW PRESETS =====
  {
    id: 'agency-pro',
    name: 'Agency Pro',
    description: 'Corporate blue, structured, professional',
    thumbnail: '🔵',
    globalStyles: { primaryColor: '#2563EB', secondaryColor: '#1E40AF', backgroundColor: '#ffffff', textColor: '#1E293B', fontFamily: 'Inter', headingFont: 'DM Sans' },
    sections: [
      { id: makeId(), type: 'hero', order: 0, visible: true, settings: { heading: 'Professional Solutions', subheading: 'Enterprise-grade digital products', bgColor: '#1E293B', textColor: '#ffffff', ctaText: 'Get Started', ctaLink: '#products', textAlign: 'center', bgImage: '' } },
      { id: makeId(), type: 'icon_box_grid', order: 1, visible: true, settings: { title: 'Why Choose Us', items: [{ icon: '🚀', title: 'Fast Delivery', description: 'Instant access after purchase' }, { icon: '🔒', title: 'Secure', description: 'Enterprise-grade security' }, { icon: '📊', title: 'Analytics', description: 'Track your progress' }, { icon: '💬', title: 'Support', description: '24/7 expert assistance' }], columns: 4, iconSize: 'large' } },
      { id: makeId(), type: 'pricing_table', order: 2, visible: true, settings: { title: 'Pricing Plans', plans: [{ name: 'Starter', price: '$19', period: '/mo', features: ['5 Projects', 'Basic Support', '1GB Storage'], recommended: false, ctaText: 'Start Free', ctaLink: '#' }, { name: 'Professional', price: '$49', period: '/mo', features: ['Unlimited Projects', 'Priority Support', '10GB Storage', 'API Access'], recommended: true, ctaText: 'Get Pro', ctaLink: '#', badge: 'Most Popular' }, { name: 'Enterprise', price: '$149', period: '/mo', features: ['Everything in Pro', 'Dedicated Manager', 'Custom Solutions', 'SLA'], recommended: false, ctaText: 'Contact Sales', ctaLink: '#' }] } },
      { id: makeId(), type: 'animated_counter', order: 3, visible: true, settings: { items: [{ value: 5000, suffix: '+', label: 'Clients', icon: '👥' }, { value: 99, suffix: '%', label: 'Uptime', icon: '⚡' }, { value: 150, suffix: '+', label: 'Countries', icon: '🌍' }], duration: 2000, columns: 3 } },
      { id: makeId(), type: 'product_grid', order: 4, visible: true, settings: { title: 'Our Products', columns: 3, showFilters: true, sortBy: 'popular' } },
      { id: makeId(), type: 'testimonials', order: 5, visible: true, settings: { title: 'Client Testimonials', items: [{ name: 'Sarah J.', text: 'Transformed our workflow completely.', rating: 5 }, { name: 'Mike R.', text: 'Best investment for our team.', rating: 5 }] } },
      { id: makeId(), type: 'cta', order: 6, visible: true, settings: { heading: 'Ready to Scale?', subheading: 'Join thousands of businesses', buttonText: 'Get Started', buttonLink: '#', bgColor: '#2563EB', textColor: '#ffffff' } },
    ],
  },
  {
    id: 'pastel-dream',
    name: 'Pastel Dream',
    description: 'Soft pastels, rounded, feminine',
    thumbnail: '🩷',
    globalStyles: { primaryColor: '#E879A0', secondaryColor: '#A78BFA', backgroundColor: '#FFF5F7', textColor: '#4A3445', fontFamily: 'Raleway', defaultBorderRadius: '16' },
    sections: [
      { id: makeId(), type: 'hero', order: 0, visible: true, settings: { heading: '✨ Dreamy Digital Products', subheading: 'Curated with love for creators', bgColor: '#FDDDE6', textColor: '#4A3445', ctaText: 'Explore', ctaLink: '#products', textAlign: 'center', bgImage: '' } },
      { id: makeId(), type: 'icon_box_grid', order: 1, visible: true, settings: { title: 'What We Offer', items: [{ icon: '🎨', title: 'Design Templates', description: 'Beautiful, ready-to-use' }, { icon: '📚', title: 'E-Books', description: 'Learn from experts' }, { icon: '🎬', title: 'Video Courses', description: 'Step-by-step guides' }], columns: 3, iconSize: 'large' } },
      { id: makeId(), type: 'featured_products', order: 2, visible: true, settings: { title: '💕 Favorites', productIds: [], columns: 3 } },
      { id: makeId(), type: 'blockquote', order: 3, visible: true, settings: { quote: 'Creativity is intelligence having fun.', author: 'Albert Einstein', authorTitle: '', variant: 'large', decorative: true } },
      { id: makeId(), type: 'product_grid', order: 4, visible: true, settings: { title: 'All Products', columns: 3, showFilters: true, sortBy: 'popular' } },
      { id: makeId(), type: 'newsletter', order: 5, visible: true, settings: { title: 'Stay in the Loop 💌', subtitle: 'New arrivals and exclusive offers', placeholder: 'your@email.com', buttonText: 'Subscribe', bgColor: '#E879A0', textColor: '#ffffff' } },
    ],
  },
  {
    id: 'cyber-punk',
    name: 'Cyber Punk',
    description: 'Neon pink + cyan on dark, glitch aesthetic',
    thumbnail: '🟣',
    globalStyles: { primaryColor: '#FF0080', secondaryColor: '#00FFFF', backgroundColor: '#0D0D0D', textColor: '#E0E0E0', fontFamily: 'DM Sans' },
    sections: [
      { id: makeId(), type: 'alert_banner', order: 0, visible: true, settings: { message: '⚡ SYSTEM ONLINE — NEW DROPS LOADING...', type: 'promo', dismissible: false, bgColor: '#FF0080', textColor: '#ffffff', linkText: '', linkUrl: '' } },
      { id: makeId(), type: 'hero', order: 1, visible: true, settings: { heading: 'ENTER THE MATRIX', subheading: 'Next-gen digital products', bgColor: '#0D0D0D', textColor: '#00FFFF', ctaText: '[ ACCESS ]', ctaLink: '#products', textAlign: 'center', bgImage: '' } },
      { id: makeId(), type: 'marquee', order: 2, visible: true, settings: { items: ['🔥 CYBER DEALS', '⚡ INSTANT ACCESS', '💎 PREMIUM GRADE', '🌐 WORLDWIDE'], speed: 20, direction: 'left', pauseOnHover: true } },
      { id: makeId(), type: 'progress_bar', order: 3, visible: true, settings: { title: 'SYSTEM STATUS', items: [{ label: 'Server Load', value: 42, color: '#00FFFF' }, { label: 'Downloads', value: 87, color: '#FF0080' }, { label: 'Satisfaction', value: 99, color: '#00FF88' }], animated: true, showPercentage: true } },
      { id: makeId(), type: 'product_grid', order: 4, visible: true, settings: { title: 'PRODUCT DATABASE', columns: 3, showFilters: true, sortBy: 'newest' } },
      { id: makeId(), type: 'countdown_timer', order: 5, visible: true, settings: { title: 'NEXT DROP IN', endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), bgColor: '#1A0A2E', textColor: '#00FFFF', expireAction: 'show_zeros', showDays: true, showHours: true, showMinutes: true, showSeconds: true } },
    ],
  },
  {
    id: 'nature-organic',
    name: 'Nature Organic',
    description: 'Earth tones, warm, organic shapes',
    thumbnail: '🌿',
    globalStyles: { primaryColor: '#4D7C0F', secondaryColor: '#A3785C', backgroundColor: '#FEFDF5', textColor: '#3C2F1E', fontFamily: 'Raleway', defaultBorderRadius: '12' },
    sections: [
      { id: makeId(), type: 'hero', order: 0, visible: true, settings: { heading: 'Natural & Handcrafted', subheading: 'Sustainable digital goods for mindful creators', bgColor: '#E8E4D9', textColor: '#3C2F1E', ctaText: 'Explore', ctaLink: '#products', textAlign: 'center', bgImage: '' } },
      { id: makeId(), type: 'icon_box_grid', order: 1, visible: true, settings: { title: 'Our Values', items: [{ icon: '🌱', title: 'Sustainable', description: 'Eco-friendly practices' }, { icon: '🤝', title: 'Fair Trade', description: 'Supporting communities' }, { icon: '♻️', title: 'Zero Waste', description: 'Minimal footprint' }], columns: 3, iconSize: 'large' } },
      { id: makeId(), type: 'featured_products', order: 2, visible: true, settings: { title: '🌿 Handpicked', productIds: [], columns: 3 } },
      { id: makeId(), type: 'timeline', order: 3, visible: true, settings: { title: 'Our Journey', items: [{ year: '2020', title: 'Seeds Planted', description: 'Started with a vision for sustainable digital products' }, { year: '2022', title: 'Community Growth', description: 'Reached 1000 mindful creators' }, { year: '2024', title: 'Flourishing', description: 'Expanding our impact globally' }], variant: 'alternating' } },
      { id: makeId(), type: 'product_grid', order: 4, visible: true, settings: { title: 'All Products', columns: 3, showFilters: true, sortBy: 'popular' } },
      { id: makeId(), type: 'trust_badges', order: 5, visible: true, settings: { badges: ['secure_checkout', 'instant_delivery', 'money_back', 'support_24_7'] } },
    ],
  },
  {
    id: 'retro-vintage',
    name: 'Retro Vintage',
    description: 'Cream/brown, serif fonts, classic feel',
    thumbnail: '📜',
    globalStyles: { primaryColor: '#8B4513', secondaryColor: '#D2691E', backgroundColor: '#FDF8F0', textColor: '#3E2723', fontFamily: 'DM Sans', headingFont: 'Raleway' },
    sections: [
      { id: makeId(), type: 'hero', order: 0, visible: true, settings: { heading: 'Classic Collection', subheading: 'Timeless digital products with character', bgColor: '#3E2723', textColor: '#FDF8F0', ctaText: 'Discover', ctaLink: '#products', textAlign: 'center', bgImage: '' } },
      { id: makeId(), type: 'divider', order: 1, visible: true, settings: { height: 30, style: 'line' } },
      { id: makeId(), type: 'blockquote', order: 2, visible: true, settings: { quote: 'Quality is not an act, it is a habit.', author: 'Aristotle', authorTitle: 'Philosopher', variant: 'large', decorative: true } },
      { id: makeId(), type: 'featured_products', order: 3, visible: true, settings: { title: '✦ Editor\'s Choice', productIds: [], columns: 3 } },
      { id: makeId(), type: 'team', order: 4, visible: true, settings: { title: 'The Artisans', members: [{ name: 'James W.', role: 'Founder & Curator', image: '', socials: {} }, { name: 'Emma R.', role: 'Lead Designer', image: '', socials: {} }], columns: 2, variant: 'card' } },
      { id: makeId(), type: 'product_grid', order: 5, visible: true, settings: { title: 'Full Catalog', columns: 3, showFilters: true, sortBy: 'popular' } },
      { id: makeId(), type: 'newsletter', order: 6, visible: true, settings: { title: 'Join Our Chronicle', subtitle: 'Receive curated picks weekly', placeholder: 'Enter your email', buttonText: 'Subscribe', bgColor: '#8B4513', textColor: '#FDF8F0' } },
    ],
  },
];
