import { cn } from '@/lib/utils';

interface IconProps {
  className?: string;
}

// Digital Product - Yellow gift box with pink ribbon
export const DigitalProductIcon = ({ className }: IconProps) => (
  <svg className={cn("w-12 h-12", className)} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="18" width="36" height="24" rx="3" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2"/>
    <rect x="4" y="12" width="40" height="8" rx="2" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2"/>
    <rect x="20" y="8" width="8" height="34" fill="#FBCFE8" stroke="#EC4899" strokeWidth="2"/>
    <path d="M24 6L28 10H20L24 6Z" fill="#EC4899"/>
    <path d="M20 8C20 8 16 4 12 8" stroke="#EC4899" strokeWidth="2" strokeLinecap="round"/>
    <path d="M28 8C28 8 32 4 36 8" stroke="#EC4899" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Course - Teal graduation cap with pink tassel
export const CourseIcon = ({ className }: IconProps) => (
  <svg className={cn("w-12 h-12", className)} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 8L4 18L24 28L44 18L24 8Z" fill="#CCFBF1" stroke="#14B8A6" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M12 22V34L24 40L36 34V22" fill="#CCFBF1" stroke="#14B8A6" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M44 18V30" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="44" cy="32" r="2" fill="#EC4899"/>
    <path d="M44 34V40" stroke="#EC4899" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="44" cy="42" r="2" fill="#EC4899"/>
  </svg>
);

// E-book - Yellow cover with teal spine
export const EbookIcon = ({ className }: IconProps) => (
  <svg className={cn("w-12 h-12", className)} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 8H36C37.1 8 38 8.9 38 10V42C38 43.1 37.1 44 36 44H8V8Z" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2"/>
    <path d="M8 8H12V44H8C6.9 44 6 43.1 6 42V10C6 8.9 6.9 8 8 8Z" fill="#14B8A6" stroke="#14B8A6" strokeWidth="2"/>
    <path d="M16 16H30" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
    <path d="M16 22H26" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
    <path d="M16 28H28" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
    <rect x="38" y="16" width="4" height="20" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1"/>
  </svg>
);

// Membership - Teal card with pink border
export const MembershipIcon = ({ className }: IconProps) => (
  <svg className={cn("w-12 h-12", className)} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="12" width="40" height="28" rx="4" fill="#CCFBF1" stroke="#14B8A6" strokeWidth="2"/>
    <rect x="6" y="14" width="36" height="24" rx="2" stroke="#EC4899" strokeWidth="2" strokeDasharray="4 2"/>
    <circle cx="16" cy="26" r="6" fill="#14B8A6"/>
    <path d="M16 23V26L18 28" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="26" y="22" width="12" height="2" rx="1" fill="#14B8A6"/>
    <rect x="26" y="28" width="8" height="2" rx="1" fill="#14B8A6"/>
  </svg>
);

// Bundle - Pink box with yellow content
export const BundleIcon = ({ className }: IconProps) => (
  <svg className={cn("w-12 h-12", className)} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="20" width="24" height="20" rx="2" fill="#FBCFE8" stroke="#EC4899" strokeWidth="2"/>
    <rect x="16" y="12" width="24" height="20" rx="2" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2"/>
    <rect x="24" y="4" width="20" height="20" rx="2" fill="#CCFBF1" stroke="#14B8A6" strokeWidth="2"/>
    <path d="M30 14H38" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round"/>
    <path d="M34 10V18" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Commission - Yellow hand with pink accent
export const CommissionIcon = ({ className }: IconProps) => (
  <svg className={cn("w-12 h-12", className)} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 28C12 28 16 24 24 24C32 24 36 28 36 28V40C36 42 34 44 32 44H16C14 44 12 42 12 40V28Z" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2"/>
    <circle cx="18" cy="36" r="2" fill="#F59E0B"/>
    <circle cx="24" cy="36" r="2" fill="#F59E0B"/>
    <circle cx="30" cy="36" r="2" fill="#F59E0B"/>
    <path d="M24 4V14" stroke="#EC4899" strokeWidth="3" strokeLinecap="round"/>
    <path d="M20 10L24 14L28 10" stroke="#EC4899" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="24" cy="19" r="4" fill="#FBCFE8" stroke="#EC4899" strokeWidth="2"/>
  </svg>
);

// Call - Pink phone with teal accent
export const CallIcon = ({ className }: IconProps) => (
  <svg className={cn("w-12 h-12", className)} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 8C12 8 8 10 8 18C8 26 14 34 22 40C30 46 38 44 40 40L36 32L30 34C30 34 24 30 20 26C16 22 14 18 14 18L16 12L12 8Z" fill="#FBCFE8" stroke="#EC4899" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M28 8C28 8 36 8 40 16" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round"/>
    <path d="M28 14C28 14 32 14 34 18" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="34" cy="10" r="2" fill="#14B8A6"/>
  </svg>
);

// Coffee - Teal cup with steam
export const CoffeeIcon = ({ className }: IconProps) => (
  <svg className={cn("w-12 h-12", className)} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 18H32V38C32 41 29 44 26 44H14C11 44 8 41 8 38V18Z" fill="#CCFBF1" stroke="#14B8A6" strokeWidth="2"/>
    <path d="M32 22H36C38 22 40 24 40 26V30C40 32 38 34 36 34H32" stroke="#14B8A6" strokeWidth="2"/>
    <path d="M14 6C14 6 12 8 14 10C16 12 14 14 14 14" stroke="#EC4899" strokeWidth="2" strokeLinecap="round"/>
    <path d="M20 4C20 4 18 6 20 8C22 10 20 12 20 12" stroke="#EC4899" strokeWidth="2" strokeLinecap="round"/>
    <path d="M26 6C26 6 24 8 26 10C28 12 26 14 26 14" stroke="#EC4899" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Software - Blue code brackets
export const SoftwareIcon = ({ className }: IconProps) => (
  <svg className={cn("w-12 h-12", className)} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="8" width="36" height="28" rx="4" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="2"/>
    <rect x="6" y="36" width="36" height="8" rx="2" fill="#BFDBFE" stroke="#3B82F6" strokeWidth="2"/>
    <path d="M18 18L12 24L18 30" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M30 18L36 24L30 30" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M26 16L22 32" stroke="#EC4899" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Template - Grid layout icon
export const TemplateIcon = ({ className }: IconProps) => (
  <svg className={cn("w-12 h-12", className)} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="6" width="36" height="36" rx="4" fill="#F3E8FF" stroke="#A855F7" strokeWidth="2"/>
    <rect x="10" y="10" width="12" height="8" rx="1" fill="#A855F7"/>
    <rect x="26" y="10" width="12" height="8" rx="1" fill="#E9D5FF"/>
    <rect x="10" y="22" width="28" height="6" rx="1" fill="#E9D5FF"/>
    <rect x="10" y="32" width="8" height="6" rx="1" fill="#E9D5FF"/>
    <rect x="22" y="32" width="8" height="6" rx="1" fill="#E9D5FF"/>
    <rect x="34" y="32" width="4" height="6" rx="1" fill="#A855F7"/>
  </svg>
);

// Graphics/Design - Colorful palette
export const GraphicsIcon = ({ className }: IconProps) => (
  <svg className={cn("w-12 h-12", className)} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="18" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2"/>
    <circle cx="24" cy="14" r="5" fill="#EF4444"/>
    <circle cx="14" cy="26" r="5" fill="#3B82F6"/>
    <circle cx="24" cy="34" r="5" fill="#22C55E"/>
    <circle cx="34" cy="26" r="5" fill="#EC4899"/>
    <circle cx="24" cy="24" r="4" fill="white" stroke="#F59E0B" strokeWidth="1"/>
  </svg>
);

// Audio - Waveform icon
export const AudioIcon = ({ className }: IconProps) => (
  <svg className={cn("w-12 h-12", className)} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="18" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2"/>
    <rect x="12" y="20" width="3" height="8" rx="1.5" fill="#EF4444"/>
    <rect x="18" y="14" width="3" height="20" rx="1.5" fill="#EF4444"/>
    <rect x="24" y="18" width="3" height="12" rx="1.5" fill="#EF4444"/>
    <rect x="30" y="12" width="3" height="24" rx="1.5" fill="#EF4444"/>
    <rect x="36" y="20" width="3" height="8" rx="1.5" fill="#EF4444"/>
  </svg>
);

// Video - Play button icon
export const VideoIcon = ({ className }: IconProps) => (
  <svg className={cn("w-12 h-12", className)} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="10" width="36" height="28" rx="4" fill="#DCFCE7" stroke="#22C55E" strokeWidth="2"/>
    <path d="M20 18V30L32 24L20 18Z" fill="#22C55E"/>
    <rect x="6" y="10" width="36" height="6" fill="#22C55E"/>
    <circle cx="12" cy="13" r="1.5" fill="white"/>
    <circle cx="18" cy="13" r="1.5" fill="white"/>
    <circle cx="24" cy="13" r="1.5" fill="white"/>
  </svg>
);

// Service - Handshake icon  
export const ServiceIcon = ({ className }: IconProps) => (
  <svg className={cn("w-12 h-12", className)} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 20L16 14L24 20L32 14L40 20" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 24C12 24 18 30 24 30C30 30 36 24 36 24" fill="#CCFBF1"/>
    <path d="M12 24C12 24 18 30 24 30C30 30 36 24 36 24" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="16" cy="36" r="4" fill="#FBCFE8" stroke="#EC4899" strokeWidth="2"/>
    <circle cx="32" cy="36" r="4" fill="#FBCFE8" stroke="#EC4899" strokeWidth="2"/>
    <path d="M20 36H28" stroke="#EC4899" strokeWidth="2"/>
  </svg>
);

// Product type configuration
export const PRODUCT_TYPES = [
  {
    id: 'digital_product',
    name: 'Digital product',
    description: 'Any set of files to download or stream.',
    Icon: DigitalProductIcon,
    color: 'bg-amber-50 border-amber-200',
    bgColor: '#ff90e8',
  },
  {
    id: 'course',
    name: 'Course or tutorial',
    description: 'Sell a single lesson or teach a whole cohort of students.',
    Icon: CourseIcon,
    color: 'bg-teal-50 border-teal-200',
    bgColor: '#32cd99',
  },
  {
    id: 'ebook',
    name: 'E-book',
    description: 'Offer a book or comic in PDF, ePub, and Mobi formats.',
    Icon: EbookIcon,
    color: 'bg-amber-50 border-amber-200',
    bgColor: '#ffcc00',
  },
  {
    id: 'membership',
    name: 'Membership',
    description: 'Start a membership business around your fans.',
    Icon: MembershipIcon,
    color: 'bg-teal-50 border-teal-200',
    bgColor: '#f0ff00',
  },
  {
    id: 'bundle',
    name: 'Bundle',
    description: 'Sell two or more existing products for a new price.',
    Icon: BundleIcon,
    color: 'bg-pink-50 border-pink-200',
    bgColor: '#ff90e8',
  },
  {
    id: 'software',
    name: 'Software',
    description: 'Apps, plugins, or standalone tools.',
    Icon: SoftwareIcon,
    color: 'bg-blue-50 border-blue-200',
    bgColor: '#90c8ff',
  },
  {
    id: 'template',
    name: 'Template',
    description: 'Design templates, presets, or themes.',
    Icon: TemplateIcon,
    color: 'bg-purple-50 border-purple-200',
    bgColor: '#c4b5fd',
  },
  {
    id: 'graphics',
    name: 'Graphics',
    description: 'Icons, illustrations, or design assets.',
    Icon: GraphicsIcon,
    color: 'bg-amber-50 border-amber-200',
    bgColor: '#ffcc00',
  },
  {
    id: 'audio',
    name: 'Audio',
    description: 'Music, sound effects, or podcasts.',
    Icon: AudioIcon,
    color: 'bg-red-50 border-red-200',
    bgColor: '#fca5a5',
  },
  {
    id: 'video',
    name: 'Video',
    description: 'Video files or streaming content.',
    Icon: VideoIcon,
    color: 'bg-green-50 border-green-200',
    bgColor: '#86efac',
  },
  {
    id: 'service',
    name: 'Service',
    description: 'Custom work or consultations.',
    Icon: ServiceIcon,
    color: 'bg-teal-50 border-teal-200',
    bgColor: '#32cd99',
  },
  {
    id: 'commission',
    name: 'Commission',
    description: 'Sell custom services with 50% deposit upfront, 50% upon completion.',
    Icon: CommissionIcon,
    color: 'bg-amber-50 border-amber-200',
    bgColor: '#ffcc00',
  },
  {
    id: 'call',
    name: 'Call',
    description: 'Offer scheduled calls with your customers.',
    Icon: CallIcon,
    color: 'bg-pink-50 border-pink-200',
    bgColor: '#ff90e8',
  },
  {
    id: 'coffee',
    name: 'Coffee',
    description: 'Boost your support and accept tips from customers.',
    Icon: CoffeeIcon,
    color: 'bg-teal-50 border-teal-200',
    bgColor: '#32cd99',
  },
] as const;

export type ProductTypeId = typeof PRODUCT_TYPES[number]['id'];

export const getProductTypeById = (id: string) => {
  return PRODUCT_TYPES.find(type => type.id === id) || PRODUCT_TYPES[0];
};
