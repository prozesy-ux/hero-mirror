import { 
  Folder, 
  BookOpen, 
  GraduationCap, 
  Users, 
  Layout, 
  Code, 
  Music, 
  Video, 
  Palette, 
  Camera, 
  Package,
  type LucideIcon
} from 'lucide-react';

export interface ProductType {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const PRODUCT_TYPES: ProductType[] = [
  {
    id: 'digital',
    label: 'Digital Product',
    description: 'Any downloadable files',
    icon: Folder,
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-300',
  },
  {
    id: 'ebook',
    label: 'E-book',
    description: 'PDF, ePub, Mobi formats',
    icon: BookOpen,
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
  },
  {
    id: 'course',
    label: 'Course',
    description: 'Lessons & tutorials',
    icon: GraduationCap,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
  },
  {
    id: 'membership',
    label: 'Membership',
    description: 'Subscription access',
    icon: Users,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
  },
  {
    id: 'template',
    label: 'Template',
    description: 'Design/code templates',
    icon: Layout,
    color: 'text-pink-700',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-300',
  },
  {
    id: 'software',
    label: 'Software',
    description: 'Apps, plugins, scripts',
    icon: Code,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-300',
  },
  {
    id: 'audio',
    label: 'Audio',
    description: 'Music, podcasts, samples',
    icon: Music,
    color: 'text-rose-700',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-300',
  },
  {
    id: 'video',
    label: 'Video',
    description: 'Video content',
    icon: Video,
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
  },
  {
    id: 'art',
    label: 'Art',
    description: 'Digital art, graphics',
    icon: Palette,
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-300',
  },
  {
    id: 'photo',
    label: 'Photo',
    description: 'Photo packs, presets',
    icon: Camera,
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-300',
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Miscellaneous',
    icon: Package,
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-300',
  },
];

export function getProductType(typeId: string | null | undefined): ProductType {
  return PRODUCT_TYPES.find(t => t.id === typeId) || PRODUCT_TYPES[0];
}

export function getProductTypeIcon(typeId: string | null | undefined): LucideIcon {
  return getProductType(typeId).icon;
}
