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
  | 'custom_text'
  | 'countdown_timer'
  | 'pricing_table'
  | 'image_slider'
  | 'flip_box'
  | 'icon_box_grid'
  | 'progress_bar'
  | 'tabs'
  | 'accordion'
  | 'before_after'
  | 'marquee'
  | 'logo_grid'
  | 'map'
  | 'contact_form'
  | 'newsletter'
  | 'team'
  | 'timeline'
  | 'animated_counter'
  | 'alert_banner'
  | 'blockquote'
  | 'video_playlist';

export interface SectionStyles {
  padding: { top: string; bottom: string; left: string; right: string };
  margin: { top: string; bottom: string };
  borderRadius: string;
  border: { width: string; color: string; style: string };
  boxShadow: string;
  backgroundGradient: { enabled: boolean; from: string; to: string; direction: string };
  backgroundImage: { url: string; overlay: string; overlayOpacity: number };
  backgroundVideo: string;
  animation: 'none' | 'fade-in' | 'slide-up' | 'slide-left' | 'slide-right' | 'zoom-in' | 'bounce' | 'flip';
  fullWidth: boolean;
  responsiveVisibility: { desktop: boolean; tablet: boolean; mobile: boolean };
  customClass: string;
  sectionId: string;
}

export const DEFAULT_SECTION_STYLES: SectionStyles = {
  padding: { top: '48', bottom: '48', left: '24', right: '24' },
  margin: { top: '0', bottom: '0' },
  borderRadius: '0',
  border: { width: '0', color: '#e5e7eb', style: 'solid' },
  boxShadow: 'none',
  backgroundGradient: { enabled: false, from: '#ffffff', to: '#f3f4f6', direction: '180deg' },
  backgroundImage: { url: '', overlay: '#000000', overlayOpacity: 0 },
  backgroundVideo: '',
  animation: 'none',
  fullWidth: true,
  responsiveVisibility: { desktop: true, tablet: true, mobile: true },
  customClass: '',
  sectionId: '',
};

export interface StoreSection {
  id: string;
  type: SectionType;
  order: number;
  visible: boolean;
  settings: Record<string, any>;
  styles?: SectionStyles;
}

export interface GlobalStyles {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  headingFont?: string;
  baseFontSize?: string;
  linkColor?: string;
  linkHoverColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  buttonRadius?: string;
  buttonPadding?: string;
  buttonHoverEffect?: 'none' | 'darken' | 'lighten' | 'scale' | 'shadow';
  gradientPrimary?: { enabled: boolean; from: string; to: string };
  defaultBorderRadius?: string;
  defaultShadow?: string;
  customCSS?: string;
  favicon?: string;
  backgroundPattern?: 'none' | 'dots' | 'grid' | 'noise' | 'diagonal';
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

export const SECTION_LABELS: Record<SectionType, { label: string; icon: string; description: string; category: string }> = {
  hero: { label: 'Hero Banner', icon: '🖼️', description: 'Full-width banner with heading and CTA', category: 'Layout' },
  featured_products: { label: 'Featured Products', icon: '⭐', description: 'Showcase selected products', category: 'Commerce' },
  product_grid: { label: 'Product Grid', icon: '📦', description: 'All products with filters', category: 'Commerce' },
  about: { label: 'About / Bio', icon: '👤', description: 'About the seller with image', category: 'Content' },
  faq: { label: 'FAQ', icon: '❓', description: 'Expandable questions and answers', category: 'Content' },
  video: { label: 'Video Embed', icon: '🎬', description: 'YouTube or custom video', category: 'Media' },
  gallery: { label: 'Image Gallery', icon: '🖼️', description: 'Multi-image showcase', category: 'Media' },
  testimonials: { label: 'Testimonials', icon: '💬', description: 'Customer reviews showcase', category: 'Social Proof' },
  cta: { label: 'Call to Action', icon: '📢', description: 'Email capture or CTA button', category: 'Conversion' },
  stats: { label: 'Stats Counter', icon: '📊', description: 'Animated statistics', category: 'Social Proof' },
  social_links: { label: 'Social Links', icon: '🔗', description: 'Social media links bar', category: 'Content' },
  category_showcase: { label: 'Categories', icon: '🏷️', description: 'Browse by category', category: 'Commerce' },
  trust_badges: { label: 'Trust Badges', icon: '🛡️', description: 'Security & trust indicators', category: 'Social Proof' },
  divider: { label: 'Divider / Spacer', icon: '➖', description: 'Visual separator', category: 'Layout' },
  custom_text: { label: 'Custom Text', icon: '📝', description: 'Free-form rich text block', category: 'Content' },
  countdown_timer: { label: 'Countdown Timer', icon: '⏰', description: 'Urgency timer with end date', category: 'Conversion' },
  pricing_table: { label: 'Pricing Table', icon: '💰', description: 'Side-by-side plan comparison', category: 'Commerce' },
  image_slider: { label: 'Image Slider', icon: '🎠', description: 'Auto-sliding image carousel', category: 'Media' },
  flip_box: { label: 'Flip Box', icon: '🔄', description: 'Card that flips on hover', category: 'Interactive' },
  icon_box_grid: { label: 'Icon Box Grid', icon: '⬜', description: 'Grid of icon+title+description cards', category: 'Content' },
  progress_bar: { label: 'Progress Bar', icon: '📈', description: 'Animated progress bars', category: 'Content' },
  tabs: { label: 'Tabs Section', icon: '📑', description: 'Tabbed content panels', category: 'Content' },
  accordion: { label: 'Accordion', icon: '🪗', description: 'Collapsible content blocks', category: 'Content' },
  before_after: { label: 'Before/After', icon: '↔️', description: 'Drag slider comparing images', category: 'Interactive' },
  marquee: { label: 'Marquee / Ticker', icon: '📜', description: 'Auto-scrolling text or logos', category: 'Content' },
  logo_grid: { label: 'Logo Grid', icon: '🏢', description: 'Partner/client logos', category: 'Social Proof' },
  map: { label: 'Map / Location', icon: '📍', description: 'Embedded map with pin', category: 'Content' },
  contact_form: { label: 'Contact Form', icon: '✉️', description: 'Name, email, message form', category: 'Conversion' },
  newsletter: { label: 'Newsletter Signup', icon: '📧', description: 'Email input for list building', category: 'Conversion' },
  team: { label: 'Team / Staff', icon: '👥', description: 'Team member cards', category: 'Content' },
  timeline: { label: 'Timeline', icon: '📅', description: 'Milestones and history', category: 'Content' },
  animated_counter: { label: 'Animated Counter', icon: '🔢', description: 'Numbers that count up on scroll', category: 'Social Proof' },
  alert_banner: { label: 'Alert / Banner', icon: '🔔', description: 'Dismissible announcement bar', category: 'Conversion' },
  blockquote: { label: 'Blockquote', icon: '💭', description: 'Styled quote with author', category: 'Content' },
  video_playlist: { label: 'Video Playlist', icon: '📺', description: 'Multiple videos with navigation', category: 'Media' },
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
  countdown_timer: { title: 'Limited Time Offer!', endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), expireAction: 'hide', bgColor: '#ef4444', textColor: '#ffffff', showDays: true, showHours: true, showMinutes: true, showSeconds: true },
  pricing_table: { title: 'Choose Your Plan', plans: [
    { name: 'Basic', price: '$9', period: '/mo', features: ['Feature 1', 'Feature 2'], recommended: false, ctaText: 'Get Started', ctaLink: '#' },
    { name: 'Pro', price: '$29', period: '/mo', features: ['Feature 1', 'Feature 2', 'Feature 3', 'Priority Support'], recommended: true, ctaText: 'Get Pro', ctaLink: '#', badge: 'Popular' },
    { name: 'Enterprise', price: '$99', period: '/mo', features: ['Everything in Pro', 'Custom Solutions', 'Dedicated Support'], recommended: false, ctaText: 'Contact Us', ctaLink: '#' },
  ] },
  image_slider: { images: [], autoplay: true, interval: 4000, showDots: true, showArrows: true, height: 400 },
  flip_box: { items: [
    { frontTitle: 'Feature', frontIcon: '🚀', frontBg: '#3b82f6', backTitle: 'Details', backText: 'Learn more about this amazing feature', backCtaText: 'Learn More', backCtaLink: '#' },
    { frontTitle: 'Quality', frontIcon: '✨', frontBg: '#8b5cf6', backTitle: 'Premium', backText: 'We deliver premium quality products', backCtaText: 'See More', backCtaLink: '#' },
    { frontTitle: 'Support', frontIcon: '💬', frontBg: '#10b981', backTitle: '24/7 Help', backText: 'Round the clock assistance', backCtaText: 'Contact', backCtaLink: '#' },
  ], columns: 3 },
  icon_box_grid: { title: 'Our Features', items: [
    { icon: '🚀', title: 'Fast Delivery', description: 'Get your products instantly' },
    { icon: '🔒', title: 'Secure Payment', description: 'Your data is safe with us' },
    { icon: '⭐', title: 'Top Quality', description: 'Only the best products' },
    { icon: '💬', title: '24/7 Support', description: 'Always here to help' },
  ], columns: 4, iconSize: 'large' },
  progress_bar: { title: 'Our Skills', items: [
    { label: 'Design', value: 95, color: '#3b82f6' },
    { label: 'Development', value: 88, color: '#10b981' },
    { label: 'Marketing', value: 76, color: '#f59e0b' },
  ], animated: true, showPercentage: true },
  tabs: { items: [
    { label: 'Tab 1', title: 'First Section', content: 'Content for the first tab goes here.' },
    { label: 'Tab 2', title: 'Second Section', content: 'Content for the second tab goes here.' },
    { label: 'Tab 3', title: 'Third Section', content: 'Content for the third tab goes here.' },
  ], orientation: 'horizontal', variant: 'default' },
  accordion: { title: 'More Information', items: [
    { title: 'Section 1', content: 'Content for section 1.' },
    { title: 'Section 2', content: 'Content for section 2.' },
  ], allowMultiple: false, variant: 'bordered' },
  before_after: { title: 'Before & After', beforeImage: '', afterImage: '', beforeLabel: 'Before', afterLabel: 'After', orientation: 'horizontal' },
  marquee: { items: ['🎉 Special Offer!', '🔥 Limited Time Deal', '⭐ New Products Available', '💰 Free Shipping'], speed: 30, direction: 'left', pauseOnHover: true, variant: 'text' },
  logo_grid: { title: 'Trusted By', logos: [], columns: 4, grayscale: true, showLinks: false },
  map: { title: 'Find Us', address: '', embedUrl: '', height: 400, zoom: 15 },
  contact_form: { title: 'Contact Us', subtitle: 'We\'d love to hear from you', fields: ['name', 'email', 'message'], submitText: 'Send Message', successMessage: 'Thank you! We\'ll get back to you soon.' },
  newsletter: { title: 'Stay Updated', subtitle: 'Subscribe to our newsletter', placeholder: 'Enter your email', buttonText: 'Subscribe', bgColor: '#000000', textColor: '#ffffff' },
  team: { title: 'Meet Our Team', members: [
    { name: 'John Doe', role: 'Founder', image: '', socials: { twitter: '', linkedin: '' } },
    { name: 'Jane Smith', role: 'Designer', image: '', socials: { twitter: '', linkedin: '' } },
  ], columns: 3, variant: 'card' },
  timeline: { title: 'Our Journey', items: [
    { year: '2020', title: 'Founded', description: 'We started our journey' },
    { year: '2022', title: 'Growth', description: 'Reached 1000 customers' },
    { year: '2024', title: 'Today', description: 'Continuing to innovate' },
  ], variant: 'alternating' },
  animated_counter: { items: [
    { value: 1500, suffix: '+', label: 'Happy Customers', icon: '😊' },
    { value: 5000, suffix: '+', label: 'Products Sold', icon: '📦' },
    { value: 99, suffix: '%', label: 'Satisfaction', icon: '⭐' },
    { value: 24, suffix: '/7', label: 'Support', icon: '💬' },
  ], duration: 2000, columns: 4 },
  alert_banner: { message: '🎉 Special Offer: Get 20% off with code SAVE20!', type: 'promo', dismissible: true, bgColor: '#fef3c7', textColor: '#92400e', linkText: 'Shop Now', linkUrl: '#products' },
  blockquote: { quote: 'The best investment you can make is in yourself.', author: 'Warren Buffett', authorTitle: 'Investor', variant: 'large', decorative: true },
  video_playlist: { title: 'Video Gallery', videos: [
    { title: 'Introduction', url: '', thumbnail: '' },
    { title: 'Tutorial', url: '', thumbnail: '' },
  ], layout: 'sidebar', autoplay: false },
};

// =====================
// Section Templates
// =====================

export interface SectionTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  section: Omit<StoreSection, 'id' | 'order'>;
}

export const SECTION_TEMPLATES: SectionTemplate[] = [
  {
    id: 'tpl_sales_hero',
    name: 'Sales Hero',
    description: 'Dark bg, bold heading, countdown CTA',
    category: 'Conversion',
    thumbnail: '🔥',
    section: {
      type: 'hero',
      visible: true,
      settings: { heading: '🔥 Flash Sale — 50% OFF Everything', subheading: 'Limited time only. Don\'t miss out!', bgColor: '#0f172a', textColor: '#ffffff', ctaText: 'Grab the Deal', ctaLink: '#products', textAlign: 'center', bgImage: '' },
      styles: { ...DEFAULT_SECTION_STYLES, padding: { top: '80', bottom: '80', left: '24', right: '24' } },
    },
  },
  {
    id: 'tpl_product_showcase',
    name: 'Product Showcase 3-Col',
    description: 'Featured products with clean grid',
    category: 'Commerce',
    thumbnail: '🛍️',
    section: {
      type: 'featured_products',
      visible: true,
      settings: { title: '🌟 Best Sellers', productIds: [], columns: 3 },
      styles: { ...DEFAULT_SECTION_STYLES, backgroundGradient: { enabled: true, from: '#f8fafc', to: '#e2e8f0', direction: '180deg' } },
    },
  },
  {
    id: 'tpl_trust_strip',
    name: 'Trust Strip',
    description: 'Badges + stats in one compact row',
    category: 'Social Proof',
    thumbnail: '🛡️',
    section: {
      type: 'stats',
      visible: true,
      settings: { items: [
        { label: 'Secure Checkout', value: '🔒', icon: '' },
        { label: 'Instant Delivery', value: '⚡', icon: '' },
        { label: 'Money Back', value: '💰', icon: '' },
        { label: '24/7 Support', value: '💬', icon: '' },
      ] },
      styles: { ...DEFAULT_SECTION_STYLES, padding: { top: '24', bottom: '24', left: '24', right: '24' }, backgroundGradient: { enabled: true, from: '#1e293b', to: '#0f172a', direction: '90deg' } },
    },
  },
  {
    id: 'tpl_video_testimonials',
    name: 'Video + Testimonials',
    description: 'Video embed with social proof',
    category: 'Social Proof',
    thumbnail: '🎥',
    section: {
      type: 'testimonials',
      visible: true,
      settings: { title: '⭐ What Our Customers Say', items: [
        { name: 'Sarah K.', text: 'Absolutely incredible products! Fast delivery and premium quality.', rating: 5 },
        { name: 'Mike R.', text: 'Best purchase I\'ve made this year. Highly recommend!', rating: 5 },
        { name: 'Emily L.', text: 'Outstanding customer service and beautiful products.', rating: 5 },
      ] },
      styles: DEFAULT_SECTION_STYLES,
    },
  },
  {
    id: 'tpl_pricing_comparison',
    name: 'Pricing Comparison',
    description: '3-tier pricing with popular badge',
    category: 'Commerce',
    thumbnail: '💎',
    section: {
      type: 'pricing_table',
      visible: true,
      settings: { title: 'Simple, Transparent Pricing', plans: [
        { name: 'Starter', price: '$9', period: '/mo', features: ['1 Product', 'Basic Support', 'Email Delivery'], recommended: false, ctaText: 'Start Free', ctaLink: '#' },
        { name: 'Professional', price: '$29', period: '/mo', features: ['Unlimited Products', 'Priority Support', 'Analytics Dashboard', 'Custom Domain'], recommended: true, ctaText: 'Go Pro', ctaLink: '#', badge: '⭐ Most Popular' },
        { name: 'Enterprise', price: '$99', period: '/mo', features: ['Everything in Pro', 'API Access', 'Dedicated Manager', 'Custom Integrations'], recommended: false, ctaText: 'Contact Sales', ctaLink: '#' },
      ] },
      styles: DEFAULT_SECTION_STYLES,
    },
  },
  {
    id: 'tpl_newsletter_dark',
    name: 'Newsletter Dark',
    description: 'Email capture with gradient bg',
    category: 'Conversion',
    thumbnail: '📧',
    section: {
      type: 'newsletter',
      visible: true,
      settings: { title: '📬 Join 10,000+ Subscribers', subtitle: 'Get exclusive deals, early access, and free resources delivered to your inbox.', placeholder: 'Your best email...', buttonText: 'Subscribe Free', bgColor: '#0f172a', textColor: '#ffffff' },
      styles: { ...DEFAULT_SECTION_STYLES, backgroundGradient: { enabled: true, from: '#1e1b4b', to: '#0f172a', direction: '135deg' }, padding: { top: '64', bottom: '64', left: '24', right: '24' } },
    },
  },
  {
    id: 'tpl_faq_minimal',
    name: 'FAQ Minimal',
    description: 'Clean accordion Q&A',
    category: 'Content',
    thumbnail: '❓',
    section: {
      type: 'faq',
      visible: true,
      settings: { title: 'Frequently Asked Questions', items: [
        { question: 'How do I access my purchase?', answer: 'After payment, you\'ll receive instant access via email and your dashboard.' },
        { question: 'Do you offer refunds?', answer: 'Yes, we offer a 30-day money-back guarantee on all products.' },
        { question: 'Can I upgrade my plan later?', answer: 'Absolutely! You can upgrade anytime and only pay the difference.' },
        { question: 'Is my payment secure?', answer: 'Yes, all payments are processed through secure, encrypted channels.' },
      ] },
      styles: DEFAULT_SECTION_STYLES,
    },
  },
  {
    id: 'tpl_team_grid',
    name: 'Team Grid',
    description: 'Photo cards with social links',
    category: 'Content',
    thumbnail: '👥',
    section: {
      type: 'team',
      visible: true,
      settings: { title: 'Meet the Team', members: [
        { name: 'Alex Johnson', role: 'CEO & Founder', image: '', socials: { twitter: '#', linkedin: '#' } },
        { name: 'Sarah Williams', role: 'Head of Design', image: '', socials: { twitter: '#', linkedin: '#' } },
        { name: 'Michael Chen', role: 'Lead Developer', image: '', socials: { twitter: '#', linkedin: '#' } },
      ], columns: 3, variant: 'card' },
      styles: DEFAULT_SECTION_STYLES,
    },
  },
  {
    id: 'tpl_countdown_urgency',
    name: 'Urgency Countdown',
    description: 'Red countdown with bold CTA',
    category: 'Conversion',
    thumbnail: '⏰',
    section: {
      type: 'countdown_timer',
      visible: true,
      settings: { title: '⚡ This Deal Expires Soon!', endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), expireAction: 'hide', bgColor: '#dc2626', textColor: '#ffffff', showDays: true, showHours: true, showMinutes: true, showSeconds: true },
      styles: { ...DEFAULT_SECTION_STYLES, padding: { top: '48', bottom: '48', left: '24', right: '24' } },
    },
  },
  {
    id: 'tpl_about_story',
    name: 'Brand Story',
    description: 'About section with image',
    category: 'Content',
    thumbnail: '📖',
    section: {
      type: 'about',
      visible: true,
      settings: { title: 'Our Story', text: 'We started with a simple mission: to create products that make a difference. Today, we serve thousands of customers worldwide with passion and dedication.', imageUrl: '', imagePosition: 'right' },
      styles: DEFAULT_SECTION_STYLES,
    },
  },
  {
    id: 'tpl_counter_impact',
    name: 'Impact Numbers',
    description: 'Animated counters showing achievements',
    category: 'Social Proof',
    thumbnail: '🔢',
    section: {
      type: 'animated_counter',
      visible: true,
      settings: { items: [
        { value: 50000, suffix: '+', label: 'Downloads', icon: '📥' },
        { value: 120, suffix: '+', label: 'Countries', icon: '🌍' },
        { value: 4.9, suffix: '⭐', label: 'Rating', icon: '' },
        { value: 99, suffix: '%', label: 'Uptime', icon: '✅' },
      ], duration: 2500, columns: 4 },
      styles: { ...DEFAULT_SECTION_STYLES, backgroundGradient: { enabled: true, from: '#0f172a', to: '#1e293b', direction: '180deg' } },
    },
  },
  {
    id: 'tpl_timeline_journey',
    name: 'Company Journey',
    description: 'Milestone timeline',
    category: 'Content',
    thumbnail: '📅',
    section: {
      type: 'timeline',
      visible: true,
      settings: { title: 'Our Journey', items: [
        { year: '2020', title: 'The Beginning', description: 'Started from a small apartment with big dreams' },
        { year: '2021', title: 'First 1000 Customers', description: 'Reached our first major milestone' },
        { year: '2022', title: 'International Launch', description: 'Expanded to 50+ countries worldwide' },
        { year: '2023', title: 'Award Winning', description: 'Recognized as industry leader' },
        { year: '2024', title: 'The Future', description: 'Continuing to innovate and grow' },
      ], variant: 'alternating' },
      styles: DEFAULT_SECTION_STYLES,
    },
  },
];

// Version history snapshot
export interface VersionSnapshot {
  id: string;
  name: string;
  timestamp: string;
  sections: StoreSection[];
  globalStyles: GlobalStyles;
  themePreset: string;
}
