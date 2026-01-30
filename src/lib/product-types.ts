import { 
  BookOpen, 
  Camera, 
  Key, 
  Download, 
  GraduationCap, 
  Layout, 
  Image, 
  Music, 
  Video, 
  Briefcase, 
  Package,
  LucideIcon
} from 'lucide-react';

export interface ProductTypeConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  description: string;
  metadataFields: string[];
}

export const PRODUCT_TYPES: Record<string, ProductTypeConfig> = {
  ebook: {
    id: 'ebook',
    label: 'eBook / PDF',
    icon: BookOpen,
    color: 'violet',
    bgClass: 'bg-violet-50',
    textClass: 'text-violet-600',
    borderClass: 'border-violet-500',
    description: 'Digital books, guides, PDFs',
    metadataFields: ['page_count', 'format', 'language']
  },
  road_selfie: {
    id: 'road_selfie',
    label: 'Road Selfie Pack',
    icon: Camera,
    color: 'pink',
    bgClass: 'bg-pink-50',
    textClass: 'text-pink-600',
    borderClass: 'border-pink-500',
    description: 'Photo packs, selfie collections',
    metadataFields: ['pack_size', 'locations', 'resolution']
  },
  digital_account: {
    id: 'digital_account',
    label: 'Digital Account',
    icon: Key,
    color: 'emerald',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-600',
    borderClass: 'border-emerald-500',
    description: 'AI accounts, subscriptions, logins',
    metadataFields: ['subscription_type', 'validity', 'warranty_days']
  },
  software: {
    id: 'software',
    label: 'Software / App',
    icon: Download,
    color: 'blue',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-600',
    borderClass: 'border-blue-500',
    description: 'Desktop apps, tools, plugins',
    metadataFields: ['version', 'platforms', 'requirements']
  },
  course: {
    id: 'course',
    label: 'Online Course',
    icon: GraduationCap,
    color: 'amber',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-600',
    borderClass: 'border-amber-500',
    description: 'Video courses, tutorials, workshops',
    metadataFields: ['duration_hours', 'lessons', 'level']
  },
  template: {
    id: 'template',
    label: 'Template / Theme',
    icon: Layout,
    color: 'cyan',
    bgClass: 'bg-cyan-50',
    textClass: 'text-cyan-600',
    borderClass: 'border-cyan-500',
    description: 'Website templates, UI kits, themes',
    metadataFields: ['format', 'compatibility', 'demo_url']
  },
  graphics: {
    id: 'graphics',
    label: 'Graphics / Design',
    icon: Image,
    color: 'rose',
    bgClass: 'bg-rose-50',
    textClass: 'text-rose-600',
    borderClass: 'border-rose-500',
    description: 'Stock photos, illustrations, icons',
    metadataFields: ['dimensions', 'file_types', 'license']
  },
  audio: {
    id: 'audio',
    label: 'Audio / Music',
    icon: Music,
    color: 'purple',
    bgClass: 'bg-purple-50',
    textClass: 'text-purple-600',
    borderClass: 'border-purple-500',
    description: 'Music, sound effects, podcasts',
    metadataFields: ['duration_seconds', 'format', 'bpm']
  },
  video: {
    id: 'video',
    label: 'Video Content',
    icon: Video,
    color: 'red',
    bgClass: 'bg-red-50',
    textClass: 'text-red-600',
    borderClass: 'border-red-500',
    description: 'Stock video, footage, animations',
    metadataFields: ['duration_seconds', 'resolution', 'fps']
  },
  service: {
    id: 'service',
    label: 'Digital Service',
    icon: Briefcase,
    color: 'indigo',
    bgClass: 'bg-indigo-50',
    textClass: 'text-indigo-600',
    borderClass: 'border-indigo-500',
    description: 'Consulting, design work, freelance',
    metadataFields: ['delivery_days', 'revisions', 'includes']
  },
  other: {
    id: 'other',
    label: 'Other Digital',
    icon: Package,
    color: 'slate',
    bgClass: 'bg-slate-50',
    textClass: 'text-slate-600',
    borderClass: 'border-slate-500',
    description: 'Other digital products',
    metadataFields: []
  }
} as const;

export type ProductType = keyof typeof PRODUCT_TYPES;

export const getProductTypeConfig = (type: string | null | undefined): ProductTypeConfig => {
  return PRODUCT_TYPES[type || 'other'] || PRODUCT_TYPES.other;
};

export const getProductTypeIcon = (type: string | null | undefined): LucideIcon => {
  return getProductTypeConfig(type).icon;
};

export const getProductTypeLabel = (type: string | null | undefined): string => {
  return getProductTypeConfig(type).label;
};
