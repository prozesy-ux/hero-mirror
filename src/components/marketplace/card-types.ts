export interface CardSettings {
  style: 'classic' | 'minimal' | 'bold' | 'gumroad' | 'neon' | 'glass' | 'brutalist' | 'elegant' | 'playful' | 'professional';
  buttonText: string;
  buttonColor: string;
  buttonTextColor: string;
  accentColor: string;
  borderRadius: 'sharp' | 'rounded' | 'pill';
  showRating: boolean;
  showSellerName: boolean;
  showBadge: boolean;
}

export const DEFAULT_CARD_SETTINGS: CardSettings = {
  style: 'classic',
  buttonText: 'Buy',
  buttonColor: '#10b981',
  buttonTextColor: '#ffffff',
  accentColor: '#000000',
  borderRadius: 'rounded',
  showRating: true,
  showSellerName: true,
  showBadge: true,
};

export interface CardProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  icon_url: string | null;
  category_id: string | null;
  tags: string[] | null;
  sold_count: number | null;
  chat_allowed: boolean | null;
  seller_id: string;
  product_type?: string | null;
  product_metadata?: Record<string, any> | null;
  rating?: number;
  review_count?: number;
  lesson_count?: number;
  page_count?: number;
  duration?: string | null;
  file_type?: string | null;
  platform?: string | null;
  bundle_items?: number;
  member_count?: number;
  response_time?: string | null;
  delivery_time?: string | null;
}

export interface CardLayoutProps {
  product: CardProduct;
  settings: CardSettings;
  sellerName?: string;
  sellerAvatar?: string | null;
  onClick: () => void;
  onBuy?: () => void;
  onChat?: () => void;
  purchasing?: boolean;
  isLoggedIn?: boolean;
  hasEnoughBalance?: boolean;
}

export function mergeCardSettings(
  storeDefaults: Partial<CardSettings>,
  productOverrides?: Partial<CardSettings> | null
): CardSettings {
  return {
    ...DEFAULT_CARD_SETTINGS,
    ...storeDefaults,
    ...(productOverrides || {}),
  };
}

export function getBorderRadiusClass(br: CardSettings['borderRadius']): string {
  switch (br) {
    case 'sharp': return 'rounded-none';
    case 'pill': return 'rounded-3xl';
    default: return 'rounded-xl';
  }
}
