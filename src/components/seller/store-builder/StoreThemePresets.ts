import { GlobalStyles, StoreSection } from './types';

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  thumbnail: string; // emoji or gradient indicator
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
      { id: makeId(), type: 'category_showcase', order: 1, visible: true, settings: { title: 'Categories', columns: 3 } },
      { id: makeId(), type: 'product_grid', order: 2, visible: true, settings: { title: 'All Products', columns: 3, showFilters: true, sortBy: 'newest' } },
      { id: makeId(), type: 'cta', order: 3, visible: true, settings: { heading: 'Don\'t Miss Out!', subheading: 'Follow us for new drops', buttonText: 'Follow', buttonLink: '#', bgColor: '#4ECDC4', textColor: '#ffffff' } },
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
      { id: makeId(), type: 'featured_products', order: 1, visible: true, settings: { title: '🔥 Hot Picks', productIds: [], columns: 3 } },
      { id: makeId(), type: 'trust_badges', order: 2, visible: true, settings: { badges: ['secure_checkout', 'instant_delivery', 'money_back'] } },
      { id: makeId(), type: 'product_grid', order: 3, visible: true, settings: { title: 'All Products', columns: 3, showFilters: true, sortBy: 'popular' } },
      { id: makeId(), type: 'social_links', order: 4, visible: true, settings: { links: [] } },
    ],
  },
];
