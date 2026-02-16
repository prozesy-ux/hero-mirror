export type SectionType =
  | 'hero'
  | 'featured_products'
  | 'product_grid'
  | 'about'
  | 'faq'
  | 'video'
  | 'gallery'
  | 'testimonials'
  | 'cta'
  | 'stats'
  | 'social_links'
  | 'category_showcase'
  | 'trust_badges'
  | 'divider'
  | 'custom_text';

export interface StoreSection {
  id: string;
  type: SectionType;
  order: number;
  visible: boolean;
  settings: Record<string, any>;
}

export interface GlobalStyles {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
}

export interface StoreDesign {
  id: string;
  seller_id: string;
  is_active: boolean;
  theme_preset: string;
  global_styles: GlobalStyles;
  sections: StoreSection[];
  created_at: string;
  updated_at: string;
}

export const SECTION_LABELS: Record<SectionType, { label: string; icon: string; description: string }> = {
  hero: { label: 'Hero Banner', icon: '🖼️', description: 'Full-width banner with heading and CTA' },
  featured_products: { label: 'Featured Products', icon: '⭐', description: 'Showcase selected products' },
  product_grid: { label: 'Product Grid', icon: '📦', description: 'All products with filters' },
  about: { label: 'About / Bio', icon: '👤', description: 'About the seller with image' },
  faq: { label: 'FAQ', icon: '❓', description: 'Expandable questions and answers' },
  video: { label: 'Video Embed', icon: '🎬', description: 'YouTube or custom video' },
  gallery: { label: 'Image Gallery', icon: '🖼️', description: 'Multi-image showcase' },
  testimonials: { label: 'Testimonials', icon: '💬', description: 'Customer reviews showcase' },
  cta: { label: 'Call to Action', icon: '📢', description: 'Email capture or CTA button' },
  stats: { label: 'Stats Counter', icon: '📊', description: 'Animated statistics' },
  social_links: { label: 'Social Links', icon: '🔗', description: 'Social media links bar' },
  category_showcase: { label: 'Categories', icon: '🏷️', description: 'Browse by category' },
  trust_badges: { label: 'Trust Badges', icon: '🛡️', description: 'Security & trust indicators' },
  divider: { label: 'Divider / Spacer', icon: '➖', description: 'Visual separator' },
  custom_text: { label: 'Custom Text', icon: '📝', description: 'Free-form rich text block' },
};

export const DEFAULT_SECTION_SETTINGS: Record<SectionType, Record<string, any>> = {
  hero: { heading: 'Welcome to Our Store', subheading: 'Discover amazing products', bgColor: '#000000', textColor: '#ffffff', ctaText: 'Shop Now', ctaLink: '#products', textAlign: 'center', bgImage: '' },
  featured_products: { title: 'Featured Products', productIds: [], columns: 3 },
  product_grid: { title: 'All Products', columns: 3, showFilters: true, sortBy: 'popular' },
  about: { title: 'About Us', text: 'Tell your story here...', imageUrl: '', imagePosition: 'right' },
  faq: { title: 'FAQ', items: [{ question: 'How does delivery work?', answer: 'After purchase, you will receive your product instantly.' }] },
  video: { title: 'Watch', videoUrl: '', autoplay: false },
  gallery: { title: 'Gallery', images: [], columns: 3 },
  testimonials: { title: 'What Customers Say', items: [{ name: 'Happy Customer', text: 'Great products!', rating: 5 }] },
  cta: { heading: 'Ready to Get Started?', subheading: 'Join thousands of happy customers', buttonText: 'Shop Now', buttonLink: '#products', bgColor: '#000000', textColor: '#ffffff' },
  stats: { items: [{ label: 'Happy Customers', value: '500+', icon: '😊' }, { label: 'Products Sold', value: '1000+', icon: '📦' }] },
  social_links: { links: [] },
  category_showcase: { title: 'Browse Categories', columns: 3 },
  trust_badges: { badges: ['secure_checkout', 'instant_delivery', 'money_back', 'support_24_7'] },
  divider: { height: 40, style: 'line' },
  custom_text: { content: '<p>Your custom content here</p>', textAlign: 'left' },
};
